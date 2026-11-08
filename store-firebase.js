// Soart — Firebase adapter: email login, Firestore sync (works offline), web push subscription.
import { initializeApp } from "https://www.gstatic.com/firebasejs/10.12.2/firebase-app.js";
import { getAuth, onAuthStateChanged, signInWithEmailAndPassword, createUserWithEmailAndPassword, sendPasswordResetEmail, signOut } from "https://www.gstatic.com/firebasejs/10.12.2/firebase-auth.js";
import { initializeFirestore, persistentLocalCache, persistentMultipleTabManager, doc, setDoc, getDoc, deleteDoc, onSnapshot } from "https://www.gstatic.com/firebasejs/10.12.2/firebase-firestore.js";
import { FIREBASE_CONFIG, VAPID_PUBLIC_KEY } from "./firebase-config.js";

const root = document.getElementById("root");
const esc = s => String(s ?? "").replace(/[&<>"']/g, c => ({"&":"&amp;","<":"&lt;",">":"&gt;",'"':"&quot;","'":"&#39;"}[c]));
const LOGO = `<svg viewBox="0 0 32 32" aria-hidden="true"><rect width="32" height="32" rx="7" fill="var(--ink)"/><path d="M8 21 16 12l8 9" fill="none" stroke="var(--bg)" stroke-width="2.6" stroke-linecap="round" stroke-linejoin="round"/><path d="M12 11.5 16 7l4 4.5" fill="none" stroke="var(--accent)" stroke-width="2.6" stroke-linecap="round" stroke-linejoin="round"/></svg>`;

if (!FIREBASE_CONFIG || !FIREBASE_CONFIG.apiKey || FIREBASE_CONFIG.apiKey.startsWith("PASTE")) {
  root.innerHTML = `<div class="auth"><div class="box"><div class="brand" style="flex-direction:column;gap:18px"><span class="crest" style="width:96px;height:96px"></span><span class="wordmark" style="font-size:40px">SOART</span></div>
    <div class="card"><h2>Almost there</h2><p class="muted" style="margin:0">Soart isn't connected to Firebase yet. Paste your Firebase config into <span class="num">firebase-config.js</span> (step 5 of SETUP.md), wait a minute, then reload.</p></div></div></div>`;
  throw new Error("Firebase config missing");
}

const app = initializeApp(FIREBASE_CONFIG);
const auth = getAuth(app);
const db = initializeFirestore(app, { localCache: persistentLocalCache({ tabManager: persistentMultipleTabManager() }) });

// Service worker: offline shell + push
let swReg = null;
if ("serviceWorker" in navigator) {
  navigator.serviceWorker.register("./sw.js").then(r => { swReg = r; }).catch(() => {});
}

const SECTIONS = ["tasks","inbox","school","events","fitness","money","lists","goals","settings","linked","grades","charts"];
const isIOS = /iPhone|iPad|iPod/.test(navigator.userAgent) || (navigator.platform === "MacIntel" && navigator.maxTouchPoints > 1);
const standalone = window.matchMedia("(display-mode: standalone)").matches || navigator.standalone === true;

function b64ToU8(b64) {
  const pad = "=".repeat((4 - b64.length % 4) % 4);
  const raw = atob((b64 + pad).replace(/-/g, "+").replace(/_/g, "/"));
  return Uint8Array.from(raw, c => c.charCodeAt(0));
}
async function endpointId(endpoint) {
  const h = await crypto.subtle.digest("SHA-256", new TextEncoder().encode(endpoint));
  return [...new Uint8Array(h)].slice(0, 16).map(b => b.toString(16).padStart(2, "0")).join("");
}

let unsubs = [];

// ---- Claude (Anthropic API) for drop-to-sort and charts ----
function parseJSON(text) {
  try { return JSON.parse(text); } catch (e) {}
  const fence = text.match(/```(?:json)?\s*([\s\S]*?)```/); if (fence) { try { return JSON.parse(fence[1]); } catch (e) {} }
  const s = text.search(/[\[{]/), e = Math.max(text.lastIndexOf("}"), text.lastIndexOf("]"));
  if (s >= 0 && e > s) { try { return JSON.parse(text.slice(s, e + 1)); } catch (err) {} }
  throw { message: "Claude's answer came back garbled. Try again." };
}
async function fileToBlock(file) {
  if (file.type === "application/pdf") {
    const b64 = await new Promise((res, rej) => { const r = new FileReader(); r.onload = () => res(String(r.result).split(",")[1]); r.onerror = rej; r.readAsDataURL(file); });
    return { type: "document", source: { type: "base64", media_type: "application/pdf", data: b64 } };
  }
  // Downscale large images (keeps cost and upload size down).
  const bmp = await createImageBitmap(file);
  const scale = Math.min(1, 1600 / Math.max(bmp.width, bmp.height));
  const cv = document.createElement("canvas"); cv.width = Math.round(bmp.width * scale); cv.height = Math.round(bmp.height * scale);
  cv.getContext("2d").drawImage(bmp, 0, 0, cv.width, cv.height);
  const data = cv.toDataURL("image/jpeg", 0.9).split(",")[1];
  return { type: "image", source: { type: "base64", media_type: "image/jpeg", data } };
}
function makeAI(user) {
  const ai = {
    key: "", pdf: true,
    ready() { return !!ai.key; },
    async load() { try { const s = await getDoc(doc(db, "users", user.uid, "meta", "ai")); ai.key = s.exists() ? (s.data().key || "") : ""; } catch (e) { ai.key = ""; } },
    async setKey(k) { await setDoc(doc(db, "users", user.uid, "meta", "ai"), { key: k }); ai.key = k; },
    async json(prompt, o = {}) {
      const content = [];
      for (const f of [...(o.images || []), ...(o.pdfs || [])].slice(0, 8)) content.push(await fileToBlock(f));
      content.push({ type: "text", text: prompt });
      let res;
      try {
        res = await fetch("https://api.anthropic.com/v1/messages", {
          method: "POST",
          headers: { "content-type": "application/json", "x-api-key": ai.key, "anthropic-version": "2023-06-01", "anthropic-dangerous-direct-browser-access": "true" },
          body: JSON.stringify({ model: o.quick ? "claude-haiku-5-5" : "claude-sonnet-5-5", max_tokens: 8000, messages: [{ role: "user", content }] })
        });
      } catch (e) { throw { message: "No connection to Claude. Try again when you're online." }; }
      const body = await res.json().catch(() => ({}));
      if (!res.ok) {
        const msg = (body.error && body.error.message) || "";
        throw { message: res.status === 401 ? "Your Anthropic API key was rejected. Check it in Settings."
          : /credit/i.test(msg) ? "Your Anthropic account is out of credit. Add some under Billing."
          : res.status === 429 || res.status === 529 ? "Claude is busy. Try again in a minute."
          : "Claude couldn't read that (" + res.status + "). Try a clearer screenshot." };
      }
      return parseJSON((body.content || []).filter(b => b.type === "text").map(b => b.text).join(""));
    }
  };
  return ai;
}
function makeStore(user) {
  const ai = makeAI(user);
  ai.load().then(() => window.Soart.refresh());
  const store = {
    ai,
    kind: "firebase",
    email: user.email,
    lsPrefix: "soar:" + user.uid + ":",
    write(key, data) {
      const p = setDoc(doc(db, "users", user.uid, "hub", key), data);
      // Firestore applies the write locally at once; don't hang the UI while offline.
      return Promise.race([p, new Promise(r => setTimeout(r, 3000))]);
    },
    connect(onData, onReady, onError) {
      unsubs.forEach(u => u()); unsubs = [];
      const pending = new Set(SECTIONS);
      const done = k => { if (pending.delete(k) && !pending.size) onReady(); };
      const t = setTimeout(() => { if (pending.size) { pending.clear(); onReady(); } }, 8000);
      SECTIONS.forEach(k => {
        unsubs.push(onSnapshot(doc(db, "users", user.uid, "hub", k), snap => {
          if (snap.exists()) onData(k, snap.data());
          done(k); if (!pending.size) clearTimeout(t);
        }, () => { done(k); onError(); }));
      });
    },
    async signOut() { unsubs.forEach(u => u()); unsubs = []; await signOut(auth); },
    download(name, text) {
      const a = document.createElement("a");
      a.href = URL.createObjectURL(new Blob([text], { type: "application/json" }));
      a.download = name; document.body.appendChild(a); a.click(); a.remove();
      setTimeout(() => URL.revokeObjectURL(a.href), 2000);
    },
    push: {
      async state() {
        if (!("serviceWorker" in navigator) || !("PushManager" in window) || !("Notification" in window)) return isIOS && !standalone ? "needs-install" : "unsupported";
        if (Notification.permission === "denied") return "denied";
        const reg = await navigator.serviceWorker.ready;
        const sub = await reg.pushManager.getSubscription();
        return sub ? "on" : "off";
      },
      async enable() {
        if (!VAPID_PUBLIC_KEY || VAPID_PUBLIC_KEY.startsWith("PASTE")) throw new Error("Add your notification key to firebase-config.js first (SETUP step 4).");
        const perm = await Notification.requestPermission();
        if (perm !== "granted") throw new Error("Notifications weren't allowed.");
        const reg = await navigator.serviceWorker.ready;
        let sub = await reg.pushManager.getSubscription();
        if (!sub) sub = await reg.pushManager.subscribe({ userVisibleOnly: true, applicationServerKey: b64ToU8(VAPID_PUBLIC_KEY) });
        const id = await endpointId(sub.endpoint);
        await setDoc(doc(db, "users", user.uid, "push", id), {
          sub: JSON.parse(JSON.stringify(sub)), device: (isIOS ? "iPhone" : navigator.userAgent.includes("Android") ? "Android" : "Computer"),
          tz: Intl.DateTimeFormat().resolvedOptions().timeZone, created: Date.now()
        });
      },
      async disable() {
        const reg = await navigator.serviceWorker.ready;
        const sub = await reg.pushManager.getSubscription();
        if (!sub) return;
        const id = await endpointId(sub.endpoint);
        await sub.unsubscribe();
        await deleteDoc(doc(db, "users", user.uid, "push", id));
      },
      async test() {
        const reg = await navigator.serviceWorker.ready;
        await reg.showNotification("Soart", { body: "Notifications are working on this device.", icon: "icons/icon-192.png", badge: "icons/badge-72.png", tag: "soart-test" });
      }
    }
  };
  return store;
}

function authScreen(mode = "in", msg = "") {
  root.innerHTML = `<div class="auth"><div class="box">
    <div class="brand" style="flex-direction:column;gap:18px"><span class="crest" style="width:96px;height:96px"></span><span class="wordmark" style="font-size:40px">SOART</span></div>
    <form class="card" id="authForm" style="gap:12px">
      <h2>${mode === "in" ? "Sign in" : mode === "up" ? "Create your account" : "Reset password"}</h2>
      <div class="field"><label for="em">Email</label><input id="em" type="email" name="email" autocomplete="email" required></div>
      ${mode !== "reset" ? `<div class="field"><label for="pw">Password</label><input id="pw" type="password" name="password" autocomplete="${mode === "up" ? "new-password" : "current-password"}" minlength="6" required></div>` : ""}
      ${msg ? `<div class="small" style="color:${msg.ok ? "var(--ok)" : "var(--bad)"}">${esc(msg.text || msg)}</div>` : ""}
      <button class="btn primary">${mode === "in" ? "Sign in" : mode === "up" ? "Create account" : "Send reset link"}</button>
    </form>
    <div class="row small" style="justify-content:space-between">
      ${mode === "in" ? `<a href="#" data-mode="up">Create an account</a><a href="#" data-mode="reset">Forgot password?</a>` : `<a href="#" data-mode="in">Back to sign in</a>`}
    </div></div></div>`;
  root.querySelectorAll("[data-mode]").forEach(a => a.onclick = e => { e.preventDefault(); authScreen(a.dataset.mode); });
  root.querySelector("#authForm").onsubmit = async e => {
    e.preventDefault();
    const f = new FormData(e.target), email = f.get("email"), pw = f.get("password");
    const btn = e.target.querySelector("button"); btn.disabled = true;
    try {
      if (mode === "in") await signInWithEmailAndPassword(auth, email, pw);
      else if (mode === "up") await createUserWithEmailAndPassword(auth, email, pw);
      else { await sendPasswordResetEmail(auth, email); authScreen("in", { ok: true, text: "Reset link sent. Check your email." }); }
    } catch (err) {
      const c = err.code || "";
      const text = c.includes("invalid-credential") || c.includes("wrong-password") || c.includes("user-not-found") ? "Email or password is wrong."
        : c.includes("email-already-in-use") ? "That email already has an account. Sign in instead."
        : c.includes("weak-password") ? "Use at least 6 characters."
        : c.includes("network") ? "No connection. Try again when you're online."
        : c.includes("operation-not-allowed") ? "Email sign-in isn't turned on in Firebase yet (SETUP step 3)."
        : "Something went wrong: " + c;
      authScreen(mode, text);
    }
  };
}

onAuthStateChanged(auth, user => {
  if (user) window.Soart.start(makeStore(user));
  else authScreen("in");
});
