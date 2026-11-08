// Soart notifier. Runs hourly on GitHub Actions.
// 1. Syncs each user's linked calendars (Google, iCloud, Outlook, Canvas .ics links).
// 2. Sends a daily briefing at the user's chosen hour, plus 24h / 3h alerts before assignments are due.
import admin from "firebase-admin";
import webpush from "web-push";
import { createHash } from "node:crypto";
import { fetchCalendar } from "./calendars.mjs";

const need = ["FIREBASE_SERVICE_ACCOUNT", "VAPID_PUBLIC", "VAPID_PRIVATE"];
const missing = need.filter(k => !process.env[k]);
if (missing.length) { console.error("Missing GitHub secrets: " + missing.join(", ") + ". See SETUP.md step 6."); process.exit(1); }

admin.initializeApp({ credential: admin.credential.cert(JSON.parse(process.env.FIREBASE_SERVICE_ACCOUNT)) });
const db = admin.firestore();
webpush.setVapidDetails(process.env.VAPID_CONTACT || "mailto:soart-notifier@users.noreply.github.com", process.env.VAPID_PUBLIC.trim(), process.env.VAPID_PRIVATE.trim());

const FORCE = process.env.FORCE_DIGEST === "true";

function localNow(tz) {
  const p = Object.fromEntries(new Intl.DateTimeFormat("en-CA", { timeZone: tz, year: "numeric", month: "2-digit", day: "2-digit", hour: "2-digit", minute: "2-digit", hourCycle: "h23" })
    .formatToParts(new Date()).map(x => [x.type, x.value]));
  return { date: `${p.year}-${p.month}-${p.day}`, hour: +p.hour, str: `${p.year}-${p.month}-${p.day}T${p.hour}:${p.minute}` };
}
const toMin = s => Date.parse(s.length === 10 ? s + "T00:00:00Z" : s.slice(0, 16) + ":00Z") / 60000;
const addDay = (d, n) => new Date(Date.parse(d + "T00:00:00Z") + n * 864e5).toISOString().slice(0, 10);
const fmtTime = s => { if (!s || s.length < 16) return ""; let [h, m] = s.slice(11, 16).split(":").map(Number); const ap = h >= 12 ? "pm" : "am"; h = h % 12 || 12; return h + (m ? ":" + String(m).padStart(2, "0") : "") + ap; };
const list = (arr, n = 3) => arr.slice(0, n).join(", ") + (arr.length > n ? ` +${arr.length - n} more` : "");
const hash = s => createHash("sha1").update(s).digest("hex").slice(0, 12);

async function syncCalendars(uid, settings, school, tz) {
  const cals = settings.calendars || [];
  const linkedRef = db.doc(`users/${uid}/hub/linked`);
  if (!cals.length) { const cur = await linkedRef.get(); if (cur.exists && (cur.data().events || []).length) await linkedRef.set({ events: [], updated: new Date().toISOString(), errors: [] }); return school; }
  const now = Date.now();
  const events = [], errors = [];
  let schoolChanged = false;
  const items = school.items || [], courses = school.courses || [];
  for (const cal of cals) {
    try {
      const evs = await fetchCalendar(cal.url, tz, new Date(now - 14 * 864e5), new Date(now + 150 * 864e5));
      if (cal.kind === "school") {
        for (const e of evs) {
          const m = e.title.match(/^(.*?)\s*\[([^\]]+)\]\s*$/);
          const title = (m ? m[1] : e.title).trim(), course = (m ? m[2] : cal.name).trim();
          const id = "cal-" + hash(cal.id + e.uid), due = e.date + "T" + (e.start || "23:59");
          if (!courses.includes(course)) { courses.push(course); schoolChanged = true; }
          const ex = items.find(a => a.id === id);
          if (ex) { if (ex.title !== title || ex.due !== due || ex.course !== course) { Object.assign(ex, { title, due, course }); schoolChanged = true; } }
          else if (toMin(due) >= now / 60000 - 2 * 1440) { items.push({ id, title, course, type: /quiz/i.test(title) ? "Quiz" : /exam|midterm|final/i.test(title) ? "Exam" : /read/i.test(title) ? "Reading" : /project/i.test(title) ? "Project" : /paper|essay/i.test(title) ? "Paper" : "Homework", due, done: false, source: cal.name }); schoolChanged = true; }
        }
      } else {
        evs.slice(0, 1500).forEach(e => events.push({ id: "cal-" + hash(cal.id + e.uid), cal: cal.name, title: e.title, date: e.date, start: e.start, end: e.end }));
      }
      console.log(`  ${cal.name}: ${evs.length} item(s)`);
    } catch (err) {
      errors.push(`${cal.name}: couldn't load the link`);
      console.error(`  ${cal.name} failed:`, err.message);
    }
  }
  await linkedRef.set({ events: events.slice(0, 2500), updated: new Date().toISOString(), errors });
  if (schoolChanged) { school = { ...school, items, courses }; await db.doc(`users/${uid}/hub/school`).set(school); }
  return school;
}

async function main() {
  const users = await db.collection("users").listDocuments();
  console.log(`${users.length} user(s).`);
  for (const userRef of users) {
    const uid = userRef.id;
    const get = async k => { const s = await db.doc(`users/${uid}/hub/${k}`).get(); return s.exists ? s.data() : {}; };
    const [settings, tasks, linkedNow, subsSnap] = await Promise.all([get("settings"), get("tasks"), get("linked"), userRef.collection("push").get()]);
    let school = await get("school");
    const subs = subsSnap.docs;
    const tz = settings.tz || (subs[0] && subs[0].data().tz) || "America/New_York";
    let linked = linkedNow;
    try { school = await syncCalendars(uid, settings, school, tz); linked = await get("linked"); } catch (e) { console.error("Calendar sync failed:", e.message); }
    if (!subs.length) continue;

    const metaRef = db.doc(`users/${uid}/meta/notify`);
    const meta = (await metaRef.get()).data() || {};
    const now = localNow(tz), nowMin = toMin(now.str), today = now.date, tomorrow = addDay(today, 1);
    const digestHour = Number.isInteger(settings.digestHour) ? settings.digestHour : 8;
    const openA = (school.items || []).filter(a => !a.done && a.due);
    const openT = (tasks.items || []).filter(t => !t.done);
    const msgs = [];
    const sent = meta.sent || {};

    if (FORCE || (now.hour >= digestHour && now.hour < 23 && meta.lastDigest !== today)) {
      const overdue = [...openA.filter(a => a.due.slice(0, 10) < today).map(a => a.title), ...openT.filter(t => t.due && t.due < today).map(t => t.title)];
      const dueToday = [...openA.filter(a => a.due.slice(0, 10) === today).map(a => `${a.title}${fmtTime(a.due) ? " " + fmtTime(a.due) : ""}`), ...openT.filter(t => t.due === today).map(t => t.title)];
      const dueTmrw = [...openA.filter(a => a.due.slice(0, 10) === tomorrow).map(a => a.title), ...openT.filter(t => t.due === tomorrow).map(t => t.title)];
      const top3 = openT.filter(t => t.today).map(t => t.title);
      const agenda = (linked.events || []).filter(e => e.date === today).map(e => (e.start ? fmtTime("0000-00-00T" + e.start) + " " : "") + e.title);
      const lines = [];
      if (overdue.length) lines.push(`Overdue: ${list(overdue)}`);
      if (dueToday.length) lines.push(`Due today: ${list(dueToday)}`);
      if (dueTmrw.length) lines.push(`Tomorrow: ${list(dueTmrw)}`);
      if (agenda.length) lines.push(`Schedule: ${list(agenda, 2)}`);
      if (top3.length) lines.push(`Top 3: ${list(top3)}`);
      if (!lines.length) lines.push("Nothing due today or tomorrow. Pick a goal and move it forward.");
      msgs.push({ title: overdue.length ? `Soart · ${overdue.length} overdue` : "Soart · Your day", body: lines.join("\n"), url: "./#today", tag: "digest" });
      meta.lastDigest = today;
    }

    if (settings.alerts !== false) {
      for (const a of openA) {
        if (a.due.length < 16) continue;
        const mins = toMin(a.due) - nowMin, s = sent[a.id] || [];
        if (mins > 0 && mins <= 180 && !s.includes("3h")) {
          const h = Math.max(1, Math.round(mins / 60));
          msgs.push({ title: `Due in ${h} hour${h > 1 ? "s" : ""}`, body: `${a.title} (${a.course}) at ${fmtTime(a.due)}`, url: "./#school", tag: "a3-" + a.id });
          sent[a.id] = [...s, "3h", "24h"];
        } else if (mins > 180 && mins <= 1440 && !s.includes("24h")) {
          msgs.push({ title: "Due within 24 hours", body: `${a.title} (${a.course}) · ${a.due.slice(0, 10) === today ? "today" : "tomorrow"} at ${fmtTime(a.due)}`, url: "./#school", tag: "a24-" + a.id });
          sent[a.id] = [...s, "24h"];
        }
      }
      const openIds = new Set(openA.map(a => a.id));
      Object.keys(sent).forEach(id => { if (!openIds.has(id)) delete sent[id]; });
    }

    for (const m of msgs) {
      for (const d of subs) {
        try { await webpush.sendNotification(d.data().sub, JSON.stringify(m), { TTL: 6 * 3600 }); }
        catch (err) {
          if (err.statusCode === 404 || err.statusCode === 410) { await d.ref.delete(); console.log("Removed expired device."); }
          else console.error("Push failed:", err.statusCode, err.body || err.message);
        }
      }
    }
    await metaRef.set({ lastDigest: meta.lastDigest || null, sent, lastRun: new Date().toISOString() });
    console.log(`User ${uid.slice(0, 6)}…: ${msgs.length} notification(s), ${subs.length} device(s), ${tz} ${now.str}`);
  }
}

main().then(() => process.exit(0)).catch(e => { console.error(e); process.exit(1); });
