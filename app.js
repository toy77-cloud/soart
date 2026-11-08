/* Soart — app logic. Storage-agnostic: call Soart.start(store) with an adapter (see store-firebase.js). */
(function(){
"use strict";
const $ = s => document.querySelector(s);
const esc = s => String(s ?? "").replace(/[&<>"']/g, c => ({"&":"&amp;","<":"&lt;",">":"&gt;",'"':"&quot;","'":"&#39;"}[c]));
const uid = () => Math.random().toString(36).slice(2,8) + Date.now().toString(36).slice(-4);
const pad = n => String(n).padStart(2,"0");
const ymd = d => d.getFullYear()+"-"+pad(d.getMonth()+1)+"-"+pad(d.getDate());
const today = () => ymd(new Date());
const parseD = s => { const [y,m,d] = s.slice(0,10).split("-").map(Number); return new Date(y,m-1,d); };
const addDays = (s,n) => { const d = parseD(s); d.setDate(d.getDate()+n); return ymd(d); };
const daysUntil = s => Math.round((parseD(s) - parseD(today()))/864e5);
const MON = ["Jan","Feb","Mar","Apr","May","Jun","Jul","Aug","Sep","Oct","Nov","Dec"];
const MONTHS = ["January","February","March","April","May","June","July","August","September","October","November","December"];
const DOW = ["Sun","Mon","Tue","Wed","Thu","Fri","Sat"];
const fmtD = s => { if(!s) return ""; const d = parseD(s); return DOW[d.getDay()]+" "+MON[d.getMonth()]+" "+d.getDate(); };
const fmtLong = s => { const d = parseD(s); return ["Sunday","Monday","Tuesday","Wednesday","Thursday","Friday","Saturday"][d.getDay()]+", "+MONTHS[d.getMonth()]+" "+d.getDate(); };
const fmtT = s => { if(!s || s.length < 16) return ""; let [h,m] = s.slice(11,16).split(":").map(Number); const ap = h>=12?"pm":"am"; h = h%12||12; return h+(m?":"+pad(m):"")+ap; };
const fmtHM = t => t ? fmtT("0000-00-00T"+t) : "";
const money = n => (n<0?"−":"")+"$"+Math.abs(n).toLocaleString("en-US",{minimumFractionDigits:2,maximumFractionDigits:2});
const e1rm = (w,r) => r<=1 ? w : w*(1+r/30);
const weekStart = s => { const d = parseD(s); d.setDate(d.getDate()-((d.getDay()+6)%7)); return ymd(d); };

const IC = {
  today:'<circle cx="12" cy="12" r="4"/><path d="M12 2v2M12 20v2M2 12h2M20 12h2M4.9 4.9l1.4 1.4M17.7 17.7l1.4 1.4M4.9 19.1l1.4-1.4M17.7 6.3l1.4-1.4"/>',
  tasks:'<path d="m3.5 7 2 2 3.5-4M3.5 17l2 2 3.5-4M13 7h8M13 17h8"/>',
  school:'<path d="M2 9l10-5 10 5-10 5L2 9Z"/><path d="M6 11v5c3.5 2.5 8.5 2.5 12 0v-5"/>',
  calendar:'<rect x="3" y="4.5" width="18" height="16.5" rx="2"/><path d="M3 9.5h18M8 2.5v4M16 2.5v4"/>',
  fitness:'<path d="M6.5 6.5v11M17.5 6.5v11M3 9.5v5M21 9.5v5M6.5 12h11"/>',
  money:'<path d="M3 7h18v12H3z"/><path d="M3 11h18"/><path d="M7 15h3"/>',
  lists:'<path d="M9 6h11M9 12h11M9 18h11"/><circle cx="4.5" cy="6" r="1"/><circle cx="4.5" cy="12" r="1"/><circle cx="4.5" cy="18" r="1"/>',
  goals:'<path d="M5 21V4"/><path d="M5 4h11l-2 4 2 4H5"/>',
  charts:'<path d="M4 20V4M4 20h16"/><path d="M7 15l4-4 3 3 5-6"/>',
  clip:'<path d="M20 11.5 12.5 19a5 5 0 0 1-7-7L13 4.5a3.3 3.3 0 0 1 4.7 4.7L10.3 16.6a1.7 1.7 0 0 1-2.4-2.4L14.5 7.6"/>',
  spark:'<path d="M12 3v4M12 17v4M3 12h4M17 12h4M6 6l2.5 2.5M15.5 15.5 18 18M6 18l2.5-2.5M15.5 8.5 18 6"/>',
  settings:'<circle cx="12" cy="12" r="3"/><path d="M19.4 15a1.7 1.7 0 0 0 .3 1.8l.1.1a2 2 0 1 1-2.8 2.8l-.1-.1a1.7 1.7 0 0 0-1.8-.3 1.7 1.7 0 0 0-1 1.5V21a2 2 0 1 1-4 0v-.1a1.7 1.7 0 0 0-1.1-1.5 1.7 1.7 0 0 0-1.8.3l-.1.1a2 2 0 1 1-2.8-2.8l.1-.1a1.7 1.7 0 0 0 .3-1.8 1.7 1.7 0 0 0-1.5-1H3a2 2 0 1 1 0-4h.1a1.7 1.7 0 0 0 1.5-1.1 1.7 1.7 0 0 0-.3-1.8l-.1-.1a2 2 0 1 1 2.8-2.8l.1.1a1.7 1.7 0 0 0 1.8.3H9a1.7 1.7 0 0 0 1-1.5V3a2 2 0 1 1 4 0v.1a1.7 1.7 0 0 0 1 1.5 1.7 1.7 0 0 0 1.8-.3l.1-.1a2 2 0 1 1 2.8 2.8l-.1.1a1.7 1.7 0 0 0-.3 1.8V9a1.7 1.7 0 0 0 1.5 1H21a2 2 0 1 1 0 4h-.1a1.7 1.7 0 0 0-1.5 1Z"/>',
  star:'<path d="m12 3 2.7 5.6 6.1.9-4.4 4.3 1 6.1L12 17l-5.4 2.9 1-6.1-4.4-4.3 6.1-.9L12 3Z"/>',
  starOn:'<path d="m12 3 2.7 5.6 6.1.9-4.4 4.3 1 6.1L12 17l-5.4 2.9 1-6.1-4.4-4.3 6.1-.9L12 3Z" fill="currentColor"/>',
  edit:'<path d="M4 20h4L19 9l-4-4L4 16v4Z"/><path d="m13.5 6.5 4 4"/>',
  x:'<path d="M6 6l12 12M18 6 6 18"/>',
  alert:'<path d="M12 3 2 20h20L12 3Z"/><path d="M12 10v4M12 17.5v.5"/>',
  left:'<path d="m15 6-6 6 6 6"/>', right:'<path d="m9 6 6 6-6 6"/>',
  arrow:'<path d="M5 12h14M13 6l6 6-6 6"/>',
  plus:'<path d="M12 5v14M5 12h14"/>',
  bolt:'<path d="M13 2 4 14h7l-1 8 9-12h-7l1-8Z"/>',
  bell:'<path d="M6 8a6 6 0 1 1 12 0c0 7 3 9 3 9H3s3-2 3-9"/><path d="M10.3 21a1.9 1.9 0 0 0 3.4 0"/>'
};
const i = (n, extra="") => `<svg class="i" viewBox="0 0 24 24" aria-hidden="true" ${extra}>${IC[n]}</svg>`;
const LOGO = `<svg viewBox="0 0 32 32" aria-hidden="true"><rect width="32" height="32" rx="7" fill="var(--ink)"/><path d="M8 21 16 12l8 9" fill="none" stroke="var(--bg)" stroke-width="2.6" stroke-linecap="round" stroke-linejoin="round"/><path d="M12 11.5 16 7l4 4.5" fill="none" stroke="var(--accent)" stroke-width="2.6" stroke-linecap="round" stroke-linejoin="round"/></svg>`;

function dueChip(dateStr, done){
  if(!dateStr) return "";
  if(done) return `<span class="chip">${fmtD(dateStr)}</span>`;
  const n = daysUntil(dateStr), tm = dateStr.length>10 ? " "+fmtT(dateStr) : "";
  if(n<0) return `<span class="chip bad">${-n}d overdue</span>`;
  if(n===0) return `<span class="chip bad">Today${tm}</span>`;
  if(n===1) return `<span class="chip warn">Tomorrow${tm}</span>`;
  if(n<=3) return `<span class="chip warn">In ${n} days</span>`;
  return `<span class="chip">${fmtD(dateStr)}</span>`;
}

/* ---------- state ---------- */
const AREAS = ["School","Research","BASIS","Career","Fitness","Life"];
const EXP_CATS = ["Food out","Groceries","Rent","Transport","School","Fun","Subscriptions","Gym","Clothes","Other"];
const INC_CATS = ["Paycheck","Radford research pay","Gift","Other income"];
const A_TYPES = ["Homework","Reading","Quiz","Exam","Project","Paper"];
const SECTIONS = {
  tasks:{items:[]}, inbox:{items:[]},
  school:{courses:["Accounting","Political Theory","IR Theory","Genetics"], items:[]},
  events:{items:[]}, fitness:{items:[], exercises:["Bench Press","Squat","Deadlift","Overhead Press","Pull-up","Barbell Row"]},
  money:{items:[], budgets:{}}, lists:{items:[]}, goals:{items:[]},
  settings:{digestHour:8, alerts:true, tz:"", calendars:[]},
  linked:{events:[], updated:null, errors:[]},
  grades:{terms:[]}, charts:{items:[]}
};
const clone = o => JSON.parse(JSON.stringify(o));
const S = clone(SECTIONS);
const ui = { view:"today", taskArea:"All", showDone:false, course:"All", calMonth:today().slice(0,7), calSel:today(),
  exercise:null, moneyMonth:today().slice(0,7), listId:null, modal:null, push:"unknown",
  timer:{left:25*60, run:false, mode:"Focus", h:null} };

let store = null, loaded = false, failed = false;
const dirty = new Set(), writing = new Set(), timers = {};

function lsKey(k){ return (store && store.lsPrefix || "soar:") + k; }
function lsGet(k){ try{ const v = localStorage.getItem(lsKey(k)); return v ? JSON.parse(v) : null; }catch(e){ return null; } }
function lsSet(k,v){ try{ localStorage.setItem(lsKey(k), JSON.stringify(v)); }catch(e){} }

function save(key){
  lsSet(key, S[key]);
  if(!store || !store.write) return;
  dirty.add(key); setSync();
  clearTimeout(timers[key]);
  timers[key] = setTimeout(()=>flush(key), 600);
}
async function flush(key){
  if(writing.has(key)){ timers[key] = setTimeout(()=>flush(key), 400); return; }
  writing.add(key); dirty.delete(key);
  try{ await store.write(key, clone(S[key])); failed = false; }
  catch(e){
    const code = e && e.code || "";
    if(/unavailable/.test(code)){ dirty.add(key); setTimeout(()=>flush(key), 1500 + Math.random()*1000); }
    else { failed = true; toast(/quota/.test(code) ? "Storage is full. Delete some old entries." : "Couldn't save to the cloud. Changes are kept on this device."); }
  }
  writing.delete(key); setSync();
}
function commit(key){ save(key); render(); }

function setSync(){
  const el = $("#sync"); if(!el) return;
  let cls="", txt="";
  if(!store || !store.write){ cls="warn"; txt="This device only"; }
  else if(!loaded){ txt="Connecting…"; }
  else if(dirty.size || writing.size){ txt="Saving…"; }
  else if(failed){ cls="warn"; txt="Sync failed"; }
  else { cls="ok"; txt="Synced"; }
  el.innerHTML = `<span class="dot ${cls}"></span>${txt}`;
}
function applyRemote(key, data){
  if(!SECTIONS[key] || !data || dirty.has(key) || writing.has(key)) return false;
  const next = Object.assign(clone(SECTIONS[key]), data);
  if(JSON.stringify(next) === JSON.stringify(S[key])) return false;
  S[key] = next; lsSet(key, S[key]); return true;
}

/* ---------- nav ---------- */
const VIEWS = [["today","Today"],["tasks","Tasks"],["school","School"],["calendar","Calendar"],["fitness","Fitness"],["money","Money"],["lists","Lists"],["goals","Goals"],["charts","Charts"]];
const ALLVIEWS = [...VIEWS, ["settings","Settings"]];
function navLink(k,l,b=""){ return `<a class="nav" href="#${k}" ${ui.view===k?'aria-current="page"':''}>${i(k)}<span>${l}</span>${b}</a>`; }
function renderRail(){
  const dueSoon = S.school.items.filter(a=>!a.done && daysUntil(a.due)<=1).length;
  const inboxN = S.inbox.items.length;
  $("#rail").innerHTML = `<div class="brand">${CREST(48)}</div>` + VIEWS.map(([k,l])=>{
    let b = "";
    if(k==="today" && inboxN) b = `<span class="badge">${inboxN}</span>`;
    if(k==="school" && dueSoon) b = `<span class="badge bad">${dueSoon}</span>`;
    return navLink(k,l,b);
  }).join("") + `<div class="rail-foot">${navLink("settings","Settings")}<div class="sync" id="sync"></div></div>`;
  const gear = $("#gear"); if(gear){ if(ui.view==="settings") gear.setAttribute("aria-current","page"); else gear.removeAttribute("aria-current"); }
  setSync();
}

/* ---------- derived ---------- */
function urgentList(){
  const out = [];
  S.school.items.filter(a=>!a.done).forEach(a=>out.push({kind:"a", id:a.id, title:a.title, sub:a.course+" · "+a.type, due:a.due}));
  S.tasks.items.filter(t=>!t.done && t.due).forEach(t=>out.push({kind:"t", id:t.id, title:t.title, sub:t.area, due:t.due, p:t.priority}));
  return out.sort((x,y)=> (x.due<y.due?-1:x.due>y.due?1:0));
}
function nextThing(){
  const u = urgentList();
  const hot = u.find(x=>daysUntil(x.due)<=0);
  if(hot) return Object.assign({why: daysUntil(hot.due)<0 ? "Overdue. Clear it first." : "Due today."}, hot);
  const top = S.tasks.items.find(t=>t.today && !t.done);
  if(top) return {kind:"t", id:top.id, title:top.title, sub:top.area, due:top.due, why:"First on your Top 3."};
  const soon = u.find(x=>daysUntil(x.due)<=2);
  if(soon) return Object.assign({why:"Due within two days."}, soon);
  if(u[0]) return Object.assign({why:"Your next deadline."}, u[0]);
  return null;
}
function itemsOn(day){
  const ev = [...S.events.items.filter(e=>e.date===day), ...(S.linked.events||[]).filter(e=>e.date===day).map(e=>Object.assign({linked:true}, e))].sort((a,b)=>(a.start||"").localeCompare(b.start||""));
  const as = S.school.items.filter(a=>a.due && a.due.slice(0,10)===day);
  const ts = S.tasks.items.filter(t=>t.due===day);
  const ws = [...new Set(S.fitness.items.filter(w=>w.date===day).map(w=>w.exercise))];
  return {ev, as, ts, ws};
}
const FOUNDED = "2026-11-08"; // Vol. I, No. 1
const ROMAN = n => { let s="", v=[[1000,"M"],[900,"CM"],[500,"D"],[400,"CD"],[100,"C"],[90,"XC"],[50,"L"],[40,"XL"],[10,"X"],[9,"IX"],[5,"V"],[4,"IV"],[1,"I"]]; v.forEach(([k,r])=>{ while(n>=k){ s+=r; n-=k; } }); return s; };
function issue(){
  const f = parseD(FOUNDED), t = parseD(today());
  if(t < f) return {vol:1, no:1};
  let y = t.getFullYear() - f.getFullYear();
  const anniv = new Date(f); anniv.setFullYear(f.getFullYear()+y);
  if(t < anniv){ y--; anniv.setFullYear(f.getFullYear()+y); }
  return {vol:y+1, no:Math.round((t-anniv)/864e5)+1};
}
const EXK = ["tasks","inbox","school","events","fitness","money","lists","goals"];
const hasExamples = () => EXK.some(k=>S[k].items.some(x=>x.ex));
const exTag = x => x && x.ex ? ' <span class="chip out">example</span>' : '';

/* ---------- views ---------- */
/* ---------- front page art: simple ink line drawings ---------- */
const ART = {
  hall:`<path d="M4 102H156"/>
    <rect x="12" y="54" width="46" height="48"/><rect x="102" y="54" width="46" height="48"/>
    <path d="M12 54v-5h5v5h5v-5h5v5h5v-5h5v5h5v-5h5v5h5v-5h6v5M102 54v-5h6v5h5v-5h5v5h5v-5h5v5h5v-5h5v5h5v-5h5v5"/>
    <path d="M19 64v12M27 64v12M35 64v12M43 64v12M51 64v12M19 84v12M27 84v12M35 84v12M43 84v12M51 84v12M109 64v12M117 64v12M125 64v12M133 64v12M141 64v12M109 84v12M117 84v12M125 84v12M133 84v12M141 84v12"/>
    <rect x="58" y="30" width="44" height="72"/>
    <path d="M58 30v-6h6v6h6v-6h6v6h6v-6h6v6h6v-6h6v6h4v-6"/>
    <rect x="54" y="20" width="7" height="82"/><rect x="99" y="20" width="7" height="82"/>
    <path d="M54 20l3.5-6 3.5 6M99 20l3.5-6 3.5 6"/>
    <path d="M70 102V66Q70 52 80 44Q90 52 90 66V102"/><path d="M76.5 102V58M83.5 102V58M70 74h20M70 88h20"/>
    <path d="M64 36h32" stroke-dasharray="2 3"/>
    <path d="M16 60h4M30 72h5M44 92h4M108 70h4M128 92h5M140 60h4M62 50h3M95 80h3" stroke-width=".9"/>`,
  statue:`<g transform="translate(55 4) scale(.5)" stroke-width="2.8">
    <path d="M38.5 12c0-7 4-11 9-11s9.5 4 9.5 11.5c0 6.5-3.5 12-9.5 12.5-5.5.4-9-6-9-13z"/>
    <path d="M38.8 10.4c.4-2 1.8-2.8 3-2.2.2-2 1.8-3.2 3.4-2.4.8-1.8 2.8-2.4 4.4-1.2 1.4-1.2 3.6-.8 4.4.8 1.6-.2 2.8 1.2 2.6 3" stroke-width="1.8"/>
    <path d="M42 8.4c.6 1 .4 2-.4 2.6M45.4 6c.8.8.8 2 0 2.8M49.8 4.6c.8.8.8 2 0 2.8M54.2 5.4c.6.8.4 2-.4 2.6" stroke-width="1.4"/>
    <path d="M43 12.4h3.4M50.4 12.4h3.4M48 13v6l-2 .8M45.6 21.2c1.4.6 3.2.6 4.6 0" stroke-width="1.8"/>
    <path d="M43 23.5l-1 6.5M52 23.5l1.4 6.5"/>
    <path d="M42 30c-5 2.4-10.6 3.2-14.4 6.6-3.6 3.4-5.2 7.6-5.4 13l-.8 12.4c-.4 3.6-.6 6.6-.4 9.6l1.6 18.4c.3 3.6 1.2 6.6 2.4 9.6"/>
    <path d="M25 99.6c-1.4 2.6-1.4 6 .6 8.6 1.6 1.6 3.8 1.2 4.6-1l.6-6.8"/>
    <path d="M31 48c-1 5-1.6 9.4-2 14.2l-.8 10c0 6 .8 12 1.4 18l.4 9.4"/>
    <path d="M53.4 30c5.4 1.8 11 2.6 15.6 5.6 3.6 2.6 6 6.4 6.8 11.6l1 12.6-.6 8.2"/>
    <path d="M67 48l1.8 12.4 2 9.6c3.4 2.6 7.6 5.8 11.4 9.2"/>
    <path d="M76.6 68.4c3.4 1.6 6.8 3.4 9.8 5.6"/>
    <path d="M86.4 74c-.6 2.4-2 4.6-4.2 5.6" stroke-width="2.2"/>
    <path d="M31 48c.8 8.4 1.8 16.4 2.2 24.4l-2.6 11.8"/>
    <path d="M67 48c-.8 8.8-1.8 17.4-2.4 25.6l1.4 16"/>
    <path d="M33.4 46.4c5 6.6 12.4 7.6 16.6 2M50 48.4c4.4 5.6 11.4 4.8 16.2-2.6" stroke-width="2.2"/>
    <path d="M50 53v6M43.6 59.4c2 1.6 4.4 1.8 5.6.4M56.4 59.4c-2 1.6-4.4 1.8-5.6.4M44 67.6c1.8 1.4 4 1.6 5.2.4M56 67.6c-1.8 1.4-4 1.6-5.2.4M44.6 75.6c1.6 1.2 3.6 1.4 4.6.4M55.4 75.6c-1.6 1.2-3.6 1.4-4.6.4M49.2 83.4c.5.7 1.1.7 1.6 0" stroke-width="1.6"/>
    <path d="M32.4 84c3.4 5.6 7.6 9.6 12 12.6M64.6 88c-2.8 4.4-6.2 7.6-9.8 9.6" stroke-width="1.8"/>
    <path d="M30.6 84.2c-1.4 5.2-1 10.6.4 16.4l3 18.6c1 6 1.8 11.6 2 17.4-1 5-2.6 9.6-2.2 15.4.4 9 3.2 18.4 4 28.8l-1.6 5.2c-1.6 1.4-2.4 2.8-1.6 3.8h10.6c.8-1.6.4-3.4-.6-5.2.2-9.6 1-18.6.4-27.4-.2-6 1-11.4 1.6-16.6l1.8-14.6c.8-7 2.6-13 4-20"/>
    <path d="M66 88.4c1.6 7 1.8 14 .6 21.4l-3.2 16.4c-.6 5-.4 10-1.6 14.6.4 5.6 2.6 10.4 3.4 16.2.6 8.2-.2 16.4.2 25l3.4 3.4c1.4 1.6 1.8 3 1.2 4h-9.2l-1.4-4.4c-1.4-8.4-3.6-16-4-24.2-.4-6 .2-11.6-.4-17.2l-2-14.2c-1-7.2-1.6-14-2.6-20.2"/>
    <path d="M35.4 135c1.8 2 4.4 2.6 7 1.6M60 139.6c1.6 2 4 2.4 6 1.2" stroke-width="1.8"/>
    <path d="M27 190v-38c.6-3.6 3.4-4.8 5.4-2.4" stroke-width="2.2"/>
    <path d="M18 190h66v6H18zM12 196h78"/>
  </g>`,
  coins:`<path d="M90 104V30M90 104h62" stroke-width="1"/>
    <path d="M96 84l14-12 12 6 22-30M136 48h8v8"/>
    <path d="M100 90h4M112 90h4M124 90h4M136 90h4" stroke-width=".9"/>
    <ellipse cx="38" cy="66" rx="18" ry="5.5"/><path d="M20 66v32M56 66v32M20 98a18 5.5 0 0 0 36 0M20 90a18 5.5 0 0 0 36 0M20 82a18 5.5 0 0 0 36 0M20 74a18 5.5 0 0 0 36 0"/>
    <ellipse cx="66" cy="84" rx="16" ry="5"/><path d="M50 84v16M82 84v16M50 100a16 5 0 0 0 32 0M50 92a16 5 0 0 0 32 0"/>
    <path d="M38 63v6M35 66h6" stroke-width=".9"/>`,
  peak:`<path d="M4 104H156"/>
    <path d="M8 104l40-46 16 18 28-46 60 74"/>
    <path d="M80 50l12-20 12 20-6-4-6 6-6-6z"/>
    <path d="M24 92l6-6M60 90l6-6M112 84l6-6M126 94l6-6" stroke-width=".9"/>`,
  cup:`<ellipse cx="80" cy="98" rx="42" ry="6"/>
    <path d="M48 54h60l-6 36c-1 5-6 7-11 7H65c-5 0-10-2-11-7z"/><path d="M108 62c13 0 15 20 0 22"/>
    <path d="M50 60h56" stroke-width=".9"/>
    <path d="M68 46c-6-8 6-12 0-20M80 46c-6-8 6-12 0-20M92 46c-6-8 6-12 0-20"/>`,
  temple:`<path d="M26 40L80 14l54 26z"/><path d="M26 40h108v9H26z"/>
    <path d="M36 49v43M44 49v43M54 49v43M62 49v43M72 49v43M80 49v43M90 49v43M98 49v43M108 49v43M116 49v43M126 49v43M134 49v43" stroke-width="1"/>
    <path d="M24 92h112v5H24zM20 97h120v5H20z"/><path d="M70 30h20" stroke-width=".9"/>`,
  book:`<path d="M80 34c-14-8-34-8-56-2v62c22-6 42-6 56 2c14-8 34-8 56-2V32c-22-6-42-6-56 2z"/><path d="M80 34v62"/>
    <path d="M32 44c12-3 26-3 40 1M32 54c12-3 26-3 40 1M32 64c12-3 26-3 40 1M32 74c12-3 26-3 40 1M88 45c14-4 28-4 40-1M88 55c14-4 28-4 40-1M88 65c14-4 28-4 40-1M88 75c14-4 28-4 40-1" stroke-width=".9"/>`,
  glass:`<path d="M50 14h60M50 102h60M54 14v88M106 14v88"/>
    <path d="M64 16c0 26 32 30 32 42s-32 16-32 42M96 16c0 26-32 30-32 42s32 16 32 42"/>
    <path d="M70 96c4-9 16-9 20 0z"/><path d="M80 62v30" stroke-dasharray="1.5 3"/><path d="M70 30h20" stroke-width=".9"/>`,
  envelope:`<rect x="30" y="30" width="100" height="62"/><path d="M30 30l50 36 50-36M30 92l38-30M130 92l-38-30"/>`,
  house:`<path d="M30 102V58l50-36 50 36v44z"/><path d="M70 102V76h20v26M40 66h16v14H40zM104 66h16v14h-16z"/><path d="M4 102h152"/>`,
  page:`<rect x="40" y="20" width="80" height="80"/><path d="M40 40h80M56 14v12M104 14v12"/>`
};
const AREA_ART = {School:"hall", Fitness:"statue", BASIS:"temple", Career:"temple", Research:"book", Life:"house"};
const art = (name, extra="") => `<svg class="art" viewBox="0 0 160 110" fill="none" stroke="currentColor" stroke-width="1.4" stroke-linecap="round" stroke-linejoin="round" role="img" aria-hidden="true" ${extra}>${ART[name]||ART.page}</svg>`;
const CREST = s => `<span class="crest" style="width:${s}px;height:${s}px" role="img" aria-label="Soart crest"></span>`;
const WORD = (size, cls="") => `<span class="wordmark ${cls}" style="font-size:${size}px">SOART</span>`;

function vToday(){
  const now = new Date(), h = now.getHours();
  const hi = h<12?"Good morning":h<18?"Good afternoon":"Good evening";
  const iss = issue();
  const nx = nextThing();
  const top3 = S.tasks.items.filter(t=>t.today);
  const urg = urgentList();
  const overdue = urg.filter(x=>daysUntil(x.due)<0);
  const soon = urg.filter(x=>{ const n=daysUntil(x.due); return n>=0 && n<=2; });
  const td = itemsOn(today());
  const wk = weekStart(today());
  const gymDays = new Set(S.fitness.items.filter(w=>w.date>=wk).map(w=>w.date)).size;
  const mo = today().slice(0,7);
  const spent = S.money.items.filter(x=>x.date.startsWith(mo) && x.amount<0).reduce((s,x)=>s-x.amount,0);
  const budget = Object.values(S.money.budgets).reduce((s,v)=>s+(+v||0),0);
  const T = ui.timer;
  // fitness lead: most recently logged lift
  const lastSet = [...S.fitness.items].sort((a,b)=>b.date.localeCompare(a.date)||(b.t||0)-(a.t||0))[0];
  const liftPts = lastSet ? prSeries(lastSet.exercise) : [];
  const liftBest = liftPts.length ? Math.max(...liftPts.map(p=>p.v)) : 0;
  const lastPR = [...liftPts].reverse().find(p=>p.pr);
  // school lead
  const openA = S.school.items.filter(a=>!a.done).sort((a,b)=>a.due.localeCompare(b.due));
  const weekA = openA.filter(a=>daysUntil(a.due)<=7);
  // goal lead: nearest target, else most progress
  const goals = S.goals.items.map(g=>{ const ms=g.milestones||[]; return {g, pct: ms.length?Math.round(ms.filter(m=>m.done).length/ms.length*100):0}; });
  const goal = goals.filter(x=>x.pct<100).sort((a,b)=>(a.g.target||"9").localeCompare(b.g.target||"9"))[0];
  const leadArt = nx ? (nx.kind==="a" ? "hall" : AREA_ART[nx.sub] || "page") : "peak";
  const news = [];
  if(overdue.length) news.push(`<b>Overdue.</b> ${overdue.slice(0,3).map(x=>esc(x.title)).join("; ")}${overdue.length>3?` and ${overdue.length-3} more`:""}.`);
  soon.slice(0,3).forEach(x=>{ const n=daysUntil(x.due); news.push(`<b>${esc(x.kind==="a"?x.sub.split(" · ")[0]:x.sub)}.</b> ${esc(x.title)} is due ${n===0?"today":n===1?"tomorrow":fmtD(x.due.slice(0,10))}${x.due.length>10?" at "+fmtT(x.due):""}.`); });
  if(lastSet) news.push(`<b>Fitness.</b> ${gymDays} gym day${gymDays===1?"":"s"} this week. ${esc(lastSet.exercise)} estimate stands at <span class="num">${liftBest}</span> lb.`);
  news.push(`<b>Money.</b> <span class="num">${money(spent)}</span> spent in ${MONTHS[+mo.slice(5)-1]}${budget?`, <span class="num">${money(Math.abs(budget-spent))}</span> ${budget-spent>=0?"under":"over"} budget`:""}.`);
  if(S.inbox.items.length) news.push(`<b>Inbox.</b> ${S.inbox.items.length} item${S.inbox.items.length>1?"s":""} waiting to be sorted.`);
  news.splice(5);

  return `
  ${hasExamples()?`<div class="note"><span>Items tagged <span class="chip out">example</span> are sample data.</span><button class="btn sm" data-act="clearExamples">Clear examples</button></div>`:""}
  <header class="mast">
    <div class="mast-top"><span>${hi}, Selim</span></div>
    <h1 class="mast-name">${WORD(84)}</h1>
    <div class="dateline"><span>${fmtLong(today())}, ${now.getFullYear()}</span><span>Vol. ${ROMAN(iss.vol)} · No. ${iss.no}</span><span>${urg.filter(x=>daysUntil(x.due)<=7).length} deadlines this week</span></div>
  </header>

  <div class="fp">
    <section class="fp-col fp-news">
      <h2 class="boxhed">What's News</h2>
      <ul class="briefs">${news.map(n=>`<li>${n}</li>`).join("")}</ul>
    </section>

    <section class="fp-col fp-lead">
      <div class="kicker">${nx?(daysUntil((nx.due||today()).slice(0,10))<0?"Overdue":"Next up"):"All clear"}${nx&&nx.due?" · "+fmtD(nx.due.slice(0,10)):""}</div>
      <h2 class="hed xl">${nx?esc(nx.title):"Nothing urgent on the docket"}</h2>
      <p class="deck">${nx?`${esc(nx.sub||"")}. ${esc(nx.why)}`:"No deadlines pressing. Pick a goal and move it one step forward."}</p>
      <div class="row">${nx?`<button class="btn primary" data-act="${nx.kind==="a"?"toggleA":"toggleT"}" data-id="${nx.id}">Mark done</button><button class="btn" data-act="startTimer">${i("bolt")}Focus 25 min</button>`:`<a class="btn" href="#goals">Open goals</a>`}</div>
      <figure class="fig">${art(leadArt)}<figcaption>${leadArt==="hall"?"Burruss Hall, Virginia Tech":leadArt==="statue"?"In the weight room":leadArt==="temple"?"The markets desk":leadArt==="book"?"Radford research":leadArt==="peak"?"The long climb":"On the list"}</figcaption></figure>
      <div class="subhed"><h3 class="hed sm">Top 3 today</h3><span class="muted small num">${top3.filter(t=>t.done).length}/${top3.length}</span></div>
      <div class="list">${top3.length?top3.map(taskRow).join(""):`<div class="empty">Star up to three tasks to lead tomorrow's edition.</div>`}</div>
      ${top3.filter(t=>!t.done).length<3?`<form class="row" data-form="addTop" style="margin-top:8px"><input type="text" id="topIn" name="title" placeholder="Add a Top 3 task" required style="flex:1"><button class="btn sm">Add</button></form>`:""}
    </section>

    <aside class="fp-col fp-side">
      <div class="side-block">
        <div class="kicker">Focus</div>
        <div class="row" style="justify-content:space-between;align-items:center">
          <div class="timer" id="timerOut">${pad(Math.floor(T.left/60))}:${pad(T.left%60)}</div>
          <div class="mini-art">${art("glass")}</div>
        </div>
        <div class="row"><button class="btn primary sm" data-act="${T.run?"pauseTimer":"startTimer"}">${T.run?"Pause":"Start"}</button><button class="btn sm" data-act="resetTimer">Reset</button><button class="btn ghost sm" data-act="breakTimer">Break</button><span class="muted small">${T.mode}</span></div>
      </div>
      <div class="side-block">
        <h3 class="boxhed sm">Today's Agenda</h3>
        <div class="list">${td.ev.length?td.ev.map(e=>`<div class="item"><span class="num small muted" style="min-width:70px">${e.start?fmtHM(e.start):"All day"}</span><div class="t">${esc(e.title)}${exTag(e)}</div></div>`).join(""):`<div class="empty">Nothing scheduled.</div>`}</div>
        ${!(S.settings.calendars||[]).length?`<a class="small muted" href="#settings">Link your calendar</a>`:""}
      </div>
      ${S.inbox.items.length?`<div class="side-block">
        <h3 class="boxhed sm">Inbox</h3>
        <div class="list">${S.inbox.items.map(it=>`
          <div class="item" style="flex-wrap:wrap"><div class="t" style="flex-basis:100%">${esc(it.text)}${exTag(it)}</div>
            ${aiReady()?`<button class="btn sm" data-act="inboxSort" data-id="${it.id}">${i("spark")}Sort</button>`:`<button class="btn sm" data-act="inboxTask" data-id="${it.id}">Task</button>
            <button class="btn sm" data-act="inboxTop" data-id="${it.id}">Top 3</button>
            <button class="btn sm" data-act="inboxGrocery" data-id="${it.id}">Grocery</button>`}
            <button class="icon-btn" data-act="inboxDel" data-id="${it.id}" aria-label="Delete">${i("x")}</button></div>`).join("")}</div>
      </div>`:""}
    </aside>
  </div>

  <div class="teasers">
    <a class="teaser" href="#school">${art("hall")}
      <div class="kicker">School</div>
      <h3 class="hed md">${weekA.length?`${weekA.length} assignment${weekA.length>1?"s":""} due this week`:"No assignments due this week"}</h3>
      <p class="deck sm">${openA[0]?`${esc(openA[0].course)}: ${esc(openA[0].title)} leads, due ${fmtD(openA[0].due.slice(0,10))}.`:"The docket is clear."}</p></a>
    <a class="teaser" href="#fitness">${art("statue")}
      <div class="kicker">Fitness</div>
      <h3 class="hed md">${lastSet?`${esc(lastSet.exercise)} reaches <span class="num">${liftBest}</span> lb`:"Log your first lift"}</h3>
      <p class="deck sm">${lastSet?`${gymDays} gym day${gymDays===1?"":"s"} this week.${lastPR?` Last record set ${fmtD(lastPR.d)}.`:""}`:"Track sets to chart your progress."}</p></a>
    <a class="teaser" href="#money">${art("coins")}
      <div class="kicker">Money</div>
      <h3 class="hed md">${MONTHS[+mo.slice(5)-1]} spending at <span class="num">${money(spent)}</span></h3>
      <p class="deck sm">${budget?`${budget-spent>=0?"Under":"Over"} budget by <span class="num">${money(Math.abs(budget-spent))}</span>.`:"Set budgets to track the month."}</p></a>
    <a class="teaser" href="#goals">${art("peak")}
      <div class="kicker">Goals</div>
      <h3 class="hed md">${goal?esc(goal.g.title):"Set a goal worth climbing"}</h3>
      <p class="deck sm">${goal?`${goal.pct}% complete${goal.g.target?`, target ${fmtD(goal.g.target)}`:""}.`:"Write one up with milestones."}</p></a>
  </div>`;
}

function taskRow(t){
  const g = t.goalId ? S.goals.items.find(x=>x.id===t.goalId) : null;
  return `<div class="item ${t.done?"done":""}">
    <span class="pri p${t.priority||3}" title="Priority ${t.priority||3}"></span>
    <button class="check ${t.done?"on":""}" data-act="toggleT" data-id="${t.id}" aria-label="Mark done"></button>
    <div class="t">${esc(t.title)}${exTag(t)}${g?` <span class="chip acc">${esc(g.title)}</span>`:""}</div>
    <span class="chip area">${esc(t.area||"")}</span>${dueChip(t.due,t.done)}
    <button class="icon-btn ${t.today?"on":""}" data-act="starT" data-id="${t.id}" aria-label="${t.today?"Remove from":"Add to"} Top 3">${i(t.today?"starOn":"star")}</button>
    <button class="icon-btn" data-act="editT" data-id="${t.id}" aria-label="Edit">${i("edit")}</button>
  </div>`;
}

function vTasks(){
  const items = S.tasks.items.filter(t=>ui.taskArea==="All"||t.area===ui.taskArea);
  const open = items.filter(t=>!t.done).sort((a,b)=>(a.priority||3)-(b.priority||3) || (a.due||"9").localeCompare(b.due||"9"));
  const done = items.filter(t=>t.done);
  return `<div class="head"><h1>Tasks</h1><span class="muted num">${S.tasks.items.filter(t=>!t.done).length} open</span></div>
  <div class="card">
    <form class="row" data-form="addTask">
      <div class="field" style="flex:3;min-width:200px"><label for="tTitle">Task</label><input id="tTitle" type="text" name="title" required placeholder="What needs doing?"></div>
      <div class="field"><label for="tArea">Area</label><select id="tArea" name="area">${AREAS.map(a=>`<option ${a===ui.taskArea?"selected":""}>${a}</option>`).join("")}</select></div>
      <div class="field"><label for="tDue">Due</label><input id="tDue" type="date" name="due"></div>
      <div class="field" style="max-width:120px"><label for="tPri">Priority</label><select id="tPri" name="priority"><option value="1">High</option><option value="2">Medium</option><option value="3" selected>Low</option></select></div>
      <button class="btn primary" style="align-self:flex-end">Add task</button>
    </form>
  </div>
  <div class="tabs">${["All",...AREAS].map(a=>`<button class="tab" data-act="taskArea" data-id="${a}" aria-pressed="${ui.taskArea===a}">${a}<span class="num">${S.tasks.items.filter(t=>!t.done&&(a==="All"||t.area===a)).length}</span></button>`).join("")}</div>
  <div class="card"><div class="list">${open.length?open.map(taskRow).join(""):`<div class="empty">Nothing open here.</div>`}</div></div>
  ${done.length?`<div class="row"><button class="btn ghost" data-act="showDone">${ui.showDone?"Hide":"Show"} ${done.length} completed</button>${ui.showDone?`<button class="btn ghost" data-act="clearDone">Clear completed</button>`:""}</div>`:""}
  ${ui.showDone&&done.length?`<div class="card"><div class="list">${done.map(taskRow).join("")}</div></div>`:""}`;
}

function vSchool(){
  const c = ui.course;
  const items = S.school.items.filter(a=>c==="All"||a.course===c);
  const open = items.filter(a=>!a.done).sort((a,b)=>a.due.localeCompare(b.due));
  const done = items.filter(a=>a.done).sort((a,b)=>b.due.localeCompare(a.due));
  const soon = S.school.items.filter(a=>!a.done && daysUntil(a.due)<=2);
  const tab = ui.schoolTab || "assignments";
  const tabs = `<div class="tabs">${[["assignments","Assignments"],["grades","Grades"],["transcript","Transcript"]].map(([k,l])=>`<button class="tab" data-act="schoolTab" data-id="${k}" aria-pressed="${tab===k}">${l}</button>`).join("")}</div>`;
  if(tab==="grades") return `<div class="head"><h1>School</h1></div>${tabs}${vGrades()}`;
  if(tab==="transcript") return `<div class="head"><h1>School</h1></div>${tabs}${vTranscript()}`;
  return `<div class="head"><h1>School</h1><span class="muted num">${S.school.items.filter(a=>!a.done).length} open</span></div>
  ${tabs}
  ${soon.length?`<div class="alert">${i("alert")}<div>${soon.map(a=>`<strong>${esc(a.title)}</strong> <span class="muted">(${esc(a.course)})</span> ${daysUntil(a.due)<0?"is overdue":daysUntil(a.due)===0?"is due today":"is due "+fmtD(a.due.slice(0,10))}`).join("<br>")}</div></div>`:""}
  <div class="card">
    <form class="row" data-form="addA">
      <div class="field" style="flex:3;min-width:200px"><label for="aTitle">Assignment</label><input id="aTitle" type="text" name="title" required placeholder="e.g. Ch. 4 adjusting entries"></div>
      <div class="field"><label for="aCourse">Class</label><select id="aCourse" name="course">${S.school.courses.map(x=>`<option ${x===c?"selected":""}>${esc(x)}</option>`).join("")}</select></div>
      <div class="field"><label for="aType">Type</label><select id="aType" name="type">${A_TYPES.map(x=>`<option>${x}</option>`).join("")}</select></div>
      <div class="field"><label for="aDue">Due</label><input id="aDue" type="datetime-local" name="due" required></div>
      <button class="btn primary" style="align-self:flex-end">Add</button>
    </form>
  </div>
  <div class="row" style="justify-content:space-between">
    <div class="tabs">${["All",...S.school.courses].map(x=>`<button class="tab" data-act="course" data-id="${esc(x)}" aria-pressed="${c===x}">${esc(x)}</button>`).join("")}</div>
    <form class="row" data-form="addCourse"><input type="text" name="name" placeholder="New class" required style="width:140px"><button class="btn sm">Add class</button>${c!=="All"?`<button type="button" class="btn ghost sm danger" data-act="delCourse" data-id="${esc(c)}">Remove ${esc(c)}</button>`:""}</form>
  </div>
  <div class="card"><div class="list">${open.length?open.map(aRow).join(""):`<div class="empty">No open assignments${c!=="All"?" for "+esc(c):""}.</div>`}</div></div>
  ${done.length?`<details class="card"><summary class="muted" style="cursor:pointer">${done.length} completed</summary><div class="list">${done.map(aRow).join("")}</div></details>`:""}`;
}
function aRow(a){
  return `<div class="item ${a.done?"done":""}"><button class="check ${a.done?"on":""}" data-act="toggleA" data-id="${a.id}" aria-label="Mark done"></button>
  <span class="chip out">${esc(a.course)}</span><div class="t">${esc(a.title)} <span class="muted small">${esc(a.type)}</span>${exTag(a)}</div>${dueChip(a.due,a.done)}
  <span class="muted small num">${fmtD(a.due.slice(0,10))} ${fmtT(a.due)}</span>
  <button class="icon-btn" data-act="editA" data-id="${a.id}" aria-label="Edit">${i("edit")}</button></div>`;
}

function vCalendar(){
  const [y,m] = ui.calMonth.split("-").map(Number);
  const first = new Date(y,m-1,1);
  const start = new Date(first); start.setDate(1-((first.getDay()+6)%7));
  let cells = "";
  for(let k=0;k<42;k++){
    const d = new Date(start); d.setDate(start.getDate()+k); const s = ymd(d);
    if(k===35 && d.getMonth()!==m-1) break;
    const it = itemsOn(s);
    const chips = [...it.ev.map(e=>`<div class="ev e">${e.start?fmtHM(e.start)+" ":""}${esc(e.title)}</div>`), ...it.as.map(a=>`<div class="ev a">${esc(a.title)}</div>`), ...it.ts.map(t=>`<div class="ev">${esc(t.title)}</div>`), ...(it.ws.length?[`<div class="ev w">${esc(it.ws.join(", "))}</div>`]:[])];
    const dots = [...it.ev.map(()=>'<i></i>'),...it.as.map(()=>'<i class="a"></i>'),...it.ts.map(()=>'<i class="t"></i>'),...(it.ws.length?['<i class="w"></i>']:[])].slice(0,6).join("");
    cells += `<button class="day ${d.getMonth()!==m-1?"out":""} ${s===today()?"today":""} ${s===ui.calSel?"sel":""}" data-act="calSel" data-id="${s}"><span class="n">${d.getDate()}</span>${chips.slice(0,3).join("")}${chips.length>3?`<span class="small muted">+${chips.length-3}</span>`:""}<span class="dots">${dots}</span></button>`;
  }
  const sel = itemsOn(ui.calSel);
  return `<div class="head"><h1>${MONTHS[m-1]} ${y}</h1>
    <div class="row"><button class="btn" data-act="calPrev" aria-label="Previous month">${i("left")}</button><button class="btn" data-act="calToday">Today</button><button class="btn" data-act="calNext" aria-label="Next month">${i("right")}</button></div></div>
  <div class="legend"><span><i style="background:var(--accent)"></i>Events</span><span><i style="background:var(--bad)"></i>Assignments</span><span><i style="background:var(--muted)"></i>Tasks</span><span><i style="background:var(--ok)"></i>Workouts</span></div>
  <div class="cal">${["Mon","Tue","Wed","Thu","Fri","Sat","Sun"].map(x=>`<div class="dow">${x}</div>`).join("")}${cells}</div>
  <div class="grid g2">
    <div class="card"><h2>${fmtD(ui.calSel)}</h2>
      <div class="list">
      ${sel.ev.map(e=>`<div class="item"><span class="num small muted" style="min-width:92px">${e.start?fmtHM(e.start)+(e.end?"–"+fmtHM(e.end):""):"All day"}</span><div class="t">${esc(e.title)}${exTag(e)}</div>${e.linked?`<span class="chip out">${esc(e.cal||"Linked")}</span>`:`<span class="chip">${esc(e.cat||"")}</span><button class="icon-btn" data-act="delEv" data-id="${e.id}" aria-label="Delete event">${i("x")}</button>`}</div>`).join("")}
      ${sel.as.map(a=>`<div class="item ${a.done?"done":""}"><span class="chip bad">${esc(a.course)}</span><div class="t">${esc(a.title)}</div>${fmtT(a.due)?`<span class="small muted num">${fmtT(a.due)}</span>`:""}</div>`).join("")}
      ${sel.ts.map(t=>`<div class="item ${t.done?"done":""}"><span class="chip">${esc(t.area)}</span><div class="t">${esc(t.title)}</div></div>`).join("")}
      ${sel.ws.length?`<div class="item"><span class="chip ok">Workout</span><div class="t">${esc(sel.ws.join(", "))}</div></div>`:""}
      ${!sel.ev.length&&!sel.as.length&&!sel.ts.length&&!sel.ws.length?`<div class="empty">Nothing on this day.</div>`:""}
      </div>
    </div>
    <div class="card"><h2>Add event</h2>
      <form class="row" data-form="addEv">
        <div class="field" style="flex-basis:100%"><label for="eTitle">Title</label><input id="eTitle" type="text" name="title" required placeholder="e.g. BASIS meeting"></div>
        <div class="field"><label for="eDate">Date</label><input id="eDate" type="date" name="date" value="${ui.calSel}" required></div>
        <div class="field"><label for="eStart">Start</label><input id="eStart" type="time" name="start"></div>
        <div class="field"><label for="eEnd">End</label><input id="eEnd" type="time" name="end"></div>
        <div class="field"><label for="eCat">Type</label><select id="eCat" name="cat">${["Class","Work","Research","BASIS","Gym","Social","Appointment","Other"].map(x=>`<option>${x}</option>`).join("")}</select></div>
        <div class="field"><label for="eRep">Repeat</label><select id="eRep" name="repeat"><option value="0">Once</option><option value="1">Weekly, rest of semester</option></select></div>
        <button class="btn primary" style="align-self:flex-end">Add event</button>
      </form>
    </div>
  </div>`;
}

function prSeries(ex){
  const byDay = {};
  S.fitness.items.filter(w=>w.exercise===ex).forEach(w=>{ const v = e1rm(+w.weight, +w.reps); if(!byDay[w.date] || v>byDay[w.date].v) byDay[w.date] = {v, w:+w.weight, r:+w.reps}; });
  let best = 0;
  return Object.keys(byDay).sort().map(d=>{ const p = byDay[d]; const pr = p.v>best; if(pr) best = p.v; return {d, v:Math.round(p.v), w:p.w, r:p.r, pr}; });
}
function prChart(pts){
  if(pts.length<2) return `<div class="empty">Log this lift on two different days to see a trend.</div>`;
  const W=640,H=240,L=44,R=16,T=18,B=28;
  const t0 = parseD(pts[0].d)-0, t1 = parseD(pts[pts.length-1].d)-0;
  let lo = Math.min(...pts.map(p=>p.v)), hi = Math.max(...pts.map(p=>p.v));
  const span = Math.max(hi-lo, 10); const step = [5,10,20,25,50,100].find(s=>span/s<=5)||100;
  lo = Math.floor((lo-span*.1)/step)*step; hi = Math.ceil((hi+span*.08)/step)*step;
  const X = d => L + ((parseD(d)-t0)/((t1-t0)||1))*(W-L-R), Yv = v => T + (1-(v-lo)/(hi-lo))*(H-T-B);
  let grid=""; for(let v=lo; v<=hi; v+=step) grid += `<line x1="${L}" x2="${W-R}" y1="${Yv(v)}" y2="${Yv(v)}" stroke="var(--line)" stroke-width="1"/><text x="${L-8}" y="${Yv(v)+4}" text-anchor="end" font-size="11" fill="var(--muted)" font-family="Libre Caslon Text, Georgia, serif">${v}</text>`;
  const n = Math.min(4, pts.length); let xl="";
  for(let k=0;k<n;k++){ const p = pts[Math.round(k*(pts.length-1)/(n-1||1))]; const d=parseD(p.d); xl += `<text x="${X(p.d)}" y="${H-8}" text-anchor="${k===0?"start":k===n-1?"end":"middle"}" font-size="11" fill="var(--muted)">${MON[d.getMonth()]} ${d.getDate()}</text>`; }
  const line = pts.map((p,k)=>(k?"L":"M")+X(p.d).toFixed(1)+","+Yv(p.v).toFixed(1)).join("");
  const area = line + `L${X(pts[pts.length-1].d)},${H-B}L${X(pts[0].d)},${H-B}Z`;
  const last = pts[pts.length-1];
  const marks = pts.map(p=>p.pr?`<circle cx="${X(p.d)}" cy="${Yv(p.v)}" r="4.5" fill="var(--accent)" stroke="var(--surface)" stroke-width="2"/>`:`<circle cx="${X(p.d)}" cy="${Yv(p.v)}" r="3.5" fill="var(--surface)" stroke="var(--accent)" stroke-width="1.8"/>`).join("");
  return `<div class="chart" id="prChart" data-pts='${esc(JSON.stringify(pts.map(p=>({x:X(p.d)/W,y:Yv(p.v)/H,d:p.d,v:p.v,w:p.w,r:p.r,pr:p.pr}))))}'>
    <svg viewBox="0 0 ${W} ${H}" role="img" aria-label="Estimated one-rep max over time">
      <defs><linearGradient id="gf" x1="0" y1="0" x2="0" y2="1"><stop offset="0" stop-color="var(--accent)" stop-opacity=".16"/><stop offset="1" stop-color="var(--accent)" stop-opacity="0"/></linearGradient></defs>
      ${grid}${xl}<path d="${area}" fill="url(#gf)"/><path d="${line}" fill="none" stroke="var(--accent)" stroke-width="2" stroke-linejoin="round"/>${marks}
      <text x="${Math.min(X(last.d), W-R)}" y="${Yv(last.v)-12}" text-anchor="end" font-size="12" font-weight="600" fill="var(--ink)" font-family="Libre Caslon Text, Georgia, serif">${last.v} lb</text>
      <line id="cross" x1="0" x2="0" y1="${T}" y2="${H-B}" stroke="var(--muted)" stroke-dasharray="3 3" visibility="hidden"/>
    </svg><div class="tip" id="prTip"></div></div>
    <div class="legend"><span><svg width="10" height="10"><circle cx="5" cy="5" r="4" fill="var(--accent)"/></svg>New PR</span><span><svg width="10" height="10"><circle cx="5" cy="5" r="3.5" fill="none" stroke="var(--accent)" stroke-width="1.8"/></svg>Best set that day</span><span>Estimated 1-rep max (Epley), lb</span></div>`;
}
function wireChart(){
  const c = $("#prChart"); if(!c) return;
  const pts = JSON.parse(c.dataset.pts), svg = c.querySelector("svg"), tip = $("#prTip"), cross = c.querySelector("#cross");
  const move = ev => {
    const r = svg.getBoundingClientRect(), fx = (ev.clientX - r.left)/r.width;
    let best = pts[0]; pts.forEach(p=>{ if(Math.abs(p.x-fx) < Math.abs(best.x-fx)) best = p; });
    tip.style.display="block"; tip.style.left = (best.x*r.width)+"px"; tip.style.top = (best.y*r.height)+"px";
    tip.innerHTML = `<b>${fmtD(best.d)}</b><br>${best.w} lb × ${best.r} → ~${best.v} lb 1RM${best.pr?" · PR":""}`;
    cross.setAttribute("x1", best.x*640); cross.setAttribute("x2", best.x*640); cross.setAttribute("visibility","visible");
  };
  svg.addEventListener("pointermove", move); svg.addEventListener("pointerdown", move);
  svg.addEventListener("pointerleave", ()=>{ tip.style.display="none"; cross.setAttribute("visibility","hidden"); });
}

function vFitness(){
  const F = S.fitness;
  const logged = [...new Set(F.items.map(w=>w.exercise))];
  if(!ui.exercise || !F.exercises.includes(ui.exercise)) ui.exercise = logged[0] || F.exercises[0];
  const pts = prSeries(ui.exercise);
  const prs = F.exercises.map(ex=>{ const s = F.items.filter(w=>w.exercise===ex); if(!s.length) return null;
    const heavy = s.reduce((a,b)=>+b.weight>+a.weight?b:a); const est = s.reduce((a,b)=>e1rm(+b.weight,+b.reps)>e1rm(+a.weight,+a.reps)?b:a);
    return {ex, heavy, est, n:new Set(s.map(x=>x.date)).size}; }).filter(Boolean);
  const recent = [...F.items].sort((a,b)=>b.date.localeCompare(a.date)||(b.t||0)-(a.t||0)).slice(0,12);
  const wk = weekStart(today());
  const weeks = [...Array(8)].map((_,k)=>{ const s = addDays(wk,-7*(7-k)), e = addDays(s,7); return {s, n:new Set(F.items.filter(w=>w.date>=s&&w.date<e).map(w=>w.date)).size}; });
  const maxW = Math.max(3,...weeks.map(w=>w.n));
  return `<div class="head"><h1>Fitness</h1><span class="muted num">${prs.length} lifts tracked</span></div>
  <div class="card"><h2>Log a set</h2>
    <form class="row" data-form="addSet">
      <div class="field" style="flex:2"><label for="fEx">Exercise</label><select id="fEx" name="exercise">${F.exercises.map(x=>`<option ${x===ui.exercise?"selected":""}>${esc(x)}</option>`).join("")}</select></div>
      <div class="field"><label for="fW">Weight (lb)</label><input id="fW" type="number" inputmode="decimal" step="0.5" min="0" name="weight" required></div>
      <div class="field"><label for="fR">Reps</label><input id="fR" type="number" inputmode="numeric" min="1" name="reps" required></div>
      <div class="field"><label for="fS">Sets</label><input id="fS" type="number" inputmode="numeric" min="1" name="sets" value="1"></div>
      <div class="field"><label for="fD">Date</label><input id="fD" type="date" name="date" value="${today()}"></div>
      <button class="btn primary" style="align-self:flex-end">Log set</button>
    </form>
    <form class="row" data-form="addEx"><input type="text" name="name" placeholder="New exercise" required style="max-width:220px"><button class="btn sm">Add exercise</button></form>
  </div>
  <div class="card">
    <div class="card-h"><h2>${esc(ui.exercise)}</h2>${pts.length?`<span class="chip acc num">Best ~${Math.max(...pts.map(p=>p.v))} lb</span>`:""}</div>
    <div class="tabs">${F.exercises.map(x=>`<button class="tab" data-act="exercise" data-id="${esc(x)}" aria-pressed="${x===ui.exercise}">${esc(x)}</button>`).join("")}</div>
    ${pts.length?prChart(pts):`<div class="empty">No sets logged for ${esc(ui.exercise)} yet.</div>`}
  </div>
  <div class="grid g2">
    <div class="card"><h2>Personal records</h2>
      ${prs.length?`<div class="scroll"><table><thead><tr><th>Lift</th><th class="r">Heaviest</th><th class="r">Est. 1RM</th><th class="r">Days</th></tr></thead><tbody>
      ${prs.map(p=>`<tr><td>${esc(p.ex)}</td><td class="r num">${+p.heavy.weight} × ${p.heavy.reps}</td><td class="r num">${Math.round(e1rm(+p.est.weight,+p.est.reps))} lb</td><td class="r num">${p.n}</td></tr>`).join("")}</tbody></table></div>`:`<div class="empty">Log your first set above.</div>`}
    </div>
    <div class="card"><h2>Gym days per week</h2>
      <svg viewBox="0 0 320 140" role="img" aria-label="Gym days per week, last 8 weeks" style="width:100%;height:auto">
        ${weeks.map((w,k)=>{ const h = (w.n/maxW)*82, x = 10+k*38; return `<rect x="${x}" y="${108-h}" width="28" height="${Math.max(h,0)}" rx="3" fill="${k===7?"var(--accent)":"var(--line-2)"}"><title>Week of ${fmtD(w.s)}: ${w.n} days</title></rect><text x="${x+14}" y="${108-h-6}" text-anchor="middle" font-size="11" fill="var(--ink)" font-family="Libre Caslon Text, Georgia, serif">${w.n||""}</text><text x="${x+14}" y="126" text-anchor="middle" font-size="10" fill="var(--muted)">${k===7?"This wk":MON[parseD(w.s).getMonth()]+" "+parseD(w.s).getDate()}</text>`; }).join("")}
        <line x1="6" x2="314" y1="108.5" y2="108.5" stroke="var(--line-2)"/>
      </svg>
    </div>
  </div>
  <div class="card"><h2>Recent sets</h2>
    ${recent.length?`<div class="scroll"><table><thead><tr><th>Date</th><th>Exercise</th><th class="r">Weight × reps</th><th class="r">Sets</th><th></th></tr></thead><tbody>
    ${recent.map(w=>`<tr><td>${fmtD(w.date)}</td><td>${esc(w.exercise)}${exTag(w)}</td><td class="r num">${+w.weight} × ${w.reps}</td><td class="r num">${w.sets||1}</td><td class="r"><button class="icon-btn" data-act="delSet" data-id="${w.id}" aria-label="Delete set">${i("x")}</button></td></tr>`).join("")}</tbody></table></div>`:`<div class="empty">No sets yet.</div>`}
  </div>`;
}

function vMoney(){
  const M = S.money, mo = ui.moneyMonth;
  const rows = M.items.filter(x=>x.date.startsWith(mo)).sort((a,b)=>b.date.localeCompare(a.date));
  const inc = rows.filter(x=>x.amount>0).reduce((s,x)=>s+x.amount,0), exp = rows.filter(x=>x.amount<0).reduce((s,x)=>s-x.amount,0);
  const byCat = {}; rows.filter(x=>x.amount<0).forEach(x=>byCat[x.cat]=(byCat[x.cat]||0)-x.amount);
  const totalBudget = Object.values(M.budgets).reduce((s,v)=>s+(+v||0),0);
  const cats = EXP_CATS.filter(c=>byCat[c]||M.budgets[c]).sort((a,b)=>(byCat[b]||0)-(byCat[a]||0));
  const maxV = Math.max(1,...cats.map(c=>Math.max(byCat[c]||0, +M.budgets[c]||0)));
  const allTime = M.items.reduce((s,x)=>s+x.amount,0);
  return `<div class="head"><h1>Money</h1><div class="row"><label for="mMonth" class="label">Month</label><input id="mMonth" type="month" value="${mo}" data-change="moneyMonth" style="width:auto"></div></div>
  <div class="grid g4 tiles">
    <div class="tile"><div class="label">Income</div><div class="v" style="color:var(--ok)">${money(inc)}</div></div>
    <div class="tile"><div class="label">Spent</div><div class="v">${money(exp)}</div></div>
    <div class="tile"><div class="label">Net</div><div class="v" style="color:${inc-exp<0?"var(--bad)":"var(--ink)"}">${money(inc-exp)}</div></div>
    <div class="tile"><div class="label">${totalBudget?"Budget left":"Net, all time"}</div><div class="v">${totalBudget?money(totalBudget-exp):money(allTime)}</div></div>
  </div>
  <div class="card"><h2>Add transaction</h2>
    <form class="row" data-form="addTx">
      <div class="field" style="max-width:130px"><label for="xKind">Type</label><select id="xKind" name="kind" data-change="txKind"><option value="exp">Expense</option><option value="inc">Income</option></select></div>
      <div class="field" style="flex:2"><label for="xDesc">Description</label><input id="xDesc" type="text" name="desc" required placeholder="e.g. Kroger, paycheck"></div>
      <div class="field"><label for="xAmt">Amount ($)</label><input id="xAmt" type="number" inputmode="decimal" step="0.01" min="0" name="amount" required></div>
      <div class="field"><label for="xCat">Category</label><select id="xCat" name="cat">${EXP_CATS.map(c=>`<option>${c}</option>`).join("")}</select></div>
      <div class="field"><label for="xDate">Date</label><input id="xDate" type="date" name="date" value="${mo===today().slice(0,7)?today():mo+"-01"}"></div>
      <button class="btn primary" style="align-self:flex-end">Add</button>
    </form>
  </div>
  <div class="grid g2">
    <div class="card"><div class="card-h"><h2>Spending vs budget</h2><button class="btn ghost sm" data-act="editBudgets">Set budgets</button></div>
      ${cats.length?cats.map(c=>{ const v = byCat[c]||0, b = +M.budgets[c]||0, over = b && v>b;
        return `<div><div class="row" style="justify-content:space-between"><span>${c}${over?` <span class="chip bad">Over ${money(v-b)}</span>`:""}</span><span class="num small">${money(v)}${b?` <span class="muted">/ ${money(b)}</span>`:""}</span></div>
        <div class="bar ${over?"over":""}" style="margin-top:6px"><i style="width:${(b? Math.min(100,v/b*100) : v/maxV*100).toFixed(1)}%"></i></div></div>`; }).join(""):`<div class="empty">No spending logged this month.</div>`}
    </div>
    <div class="card"><h2>Ledger</h2>
      ${rows.length?`<div class="scroll"><table><thead><tr><th>Date</th><th>Description</th><th>Category</th><th class="r">Amount</th><th></th></tr></thead><tbody>
      ${rows.map(x=>`<tr><td class="num small">${x.date.slice(5)}</td><td>${esc(x.desc)}${exTag(x)}</td><td class="small muted">${esc(x.cat)}</td><td class="r num" style="color:${x.amount>0?"var(--ok)":"var(--ink)"}">${x.amount>0?"+":""}${money(x.amount)}</td><td class="r"><button class="icon-btn" data-act="delTx" data-id="${x.id}" aria-label="Delete">${i("x")}</button></td></tr>`).join("")}
      </tbody></table></div>`:`<div class="empty">No transactions this month.</div>`}
    </div>
  </div>`;
}

function vLists(){
  const L = S.lists.items;
  if(!ui.listId || !L.find(l=>l.id===ui.listId)) ui.listId = L[0] && L[0].id;
  const cur = L.find(l=>l.id===ui.listId);
  const total = cur && cur.kind==="wishlist" ? cur.items.filter(x=>!x.done).reduce((s,x)=>s+(+x.price||0),0) : 0;
  return `<div class="head"><h1>Lists</h1>
    <form class="row" data-form="addList"><input type="text" name="name" placeholder="New list" required style="width:160px"><select name="kind" style="width:auto"><option value="grocery">Grocery</option><option value="wishlist">Wishlist</option><option value="general">General</option></select><button class="btn sm">Create</button></form></div>
  ${L.length?`<div class="tabs">${L.map(l=>`<button class="tab" data-act="list" data-id="${l.id}" aria-pressed="${l.id===ui.listId}">${esc(l.name)}<span class="num">${l.items.filter(x=>!x.done).length}</span></button>`).join("")}</div>`:""}
  ${cur?`<div class="card">
    <div class="card-h"><h2>${esc(cur.name)} <span class="chip">${cur.kind}</span>${exTag(cur)}</h2>
      <div class="row">${cur.kind==="wishlist"?`<span class="num">Total ${money(total)}</span>`:""}${cur.items.some(x=>x.done)?`<button class="btn ghost sm" data-act="clearChecked">Clear checked</button>`:""}<button class="btn ghost sm danger" data-act="delList">Delete list</button></div></div>
    <form class="row" data-form="addItem"><input type="text" name="text" required placeholder="${cur.kind==="grocery"?"Add item":cur.kind==="wishlist"?"Item you want":"Add item"}" style="flex:3;min-width:160px">
      ${cur.kind==="wishlist"?`<input type="number" inputmode="decimal" step="0.01" min="0" name="price" placeholder="Price" style="flex:1;min-width:90px"><input type="url" name="link" placeholder="Link (optional)" style="flex:2;min-width:140px">`:""}
      <button class="btn primary">Add</button></form>
    <div class="list">${cur.items.length?cur.items.map(x=>`<div class="item ${x.done?"done":""}"><button class="check ${x.done?"on":""}" data-act="toggleItem" data-id="${x.id}" aria-label="Check off"></button>
      <div class="t">${x.link?`<a href="${esc(x.link)}" target="_blank" rel="noopener">${esc(x.text)}</a>`:esc(x.text)}</div>
      ${x.price?`<span class="num small">${money(+x.price)}</span>`:""}<button class="icon-btn" data-act="delItem" data-id="${x.id}" aria-label="Delete">${i("x")}</button></div>`).join(""):`<div class="empty">Empty list.</div>`}</div>
  </div>`:`<div class="card"><div class="empty">Create your first list above.</div></div>`}`;
}

const HORIZONS = ["This semester","This year","Long term"];
function vGoals(){
  const G = S.goals.items;
  return `<div class="head"><h1>Goals</h1><span class="muted num">${G.length} active</span></div>
  <div class="card"><h2>New goal</h2>
    <form class="row" data-form="addGoal">
      <div class="field" style="flex:3;min-width:220px"><label for="gT">Goal</label><input id="gT" type="text" name="title" required placeholder="e.g. Land a sophomore S&T insight program"></div>
      <div class="field"><label for="gH">Timeframe</label><select id="gH" name="horizon">${HORIZONS.map(x=>`<option>${x}</option>`).join("")}</select></div>
      <div class="field"><label for="gA">Area</label><select id="gA" name="area">${AREAS.map(a=>`<option>${a}</option>`).join("")}</select></div>
      <div class="field"><label for="gD">Target date</label><input id="gD" type="date" name="target"></div>
      <div class="field" style="flex-basis:100%"><label for="gW">Why it matters</label><input id="gW" type="text" name="why" placeholder="One line you'll reread on a hard day"></div>
      <div class="field" style="flex-basis:100%"><label for="gM">Milestones, one per line</label><textarea id="gM" name="ms" placeholder="Polish resume&#10;Coffee chats with 5 alumni on desks&#10;Apply to 10 programs"></textarea></div>
      <button class="btn primary">Save goal</button>
    </form>
  </div>
  ${HORIZONS.map(h=>{ const gs = G.filter(g=>g.horizon===h); if(!gs.length) return "";
    return `<div class="label">${h}</div><div class="grid g2">${gs.map(goalCard).join("")}</div>`; }).join("")}`;
}
function goalCard(g){
  const ms = g.milestones||[], d = ms.filter(m=>m.done).length, pct = ms.length? Math.round(d/ms.length*100) : 0;
  const linked = S.tasks.items.filter(t=>t.goalId===g.id && !t.done).length;
  return `<div class="card">
    <div class="card-h"><h3 style="font-size:15px">${esc(g.title)}${exTag(g)}</h3><button class="icon-btn" data-act="editG" data-id="${g.id}" aria-label="Edit goal">${i("edit")}</button></div>
    <div class="row"><span class="chip">${esc(g.area)}</span>${g.target?`<span class="chip ${daysUntil(g.target)<14?"warn":""}">By ${fmtD(g.target)}</span>`:""}${linked?`<span class="chip acc">${linked} linked task${linked>1?"s":""}</span>`:""}</div>
    ${g.why?`<div class="muted small" style="border-left:2px solid var(--line-2);padding-left:10px">${esc(g.why)}</div>`:""}
    <div><div class="row" style="justify-content:space-between"><span class="small muted">${d} of ${ms.length} milestones</span><span class="num small">${pct}%</span></div><div class="bar" style="margin-top:6px"><i style="width:${pct}%"></i></div></div>
    <div class="list">${ms.map(m=>`<div class="item ${m.done?"done":""}"><button class="check ${m.done?"on":""}" data-act="toggleMs" data-id="${g.id}|${m.id}" aria-label="Mark done"></button><div class="t">${esc(m.text)}</div>${m.done?"":`<button class="btn ghost sm" data-act="msToTask" data-id="${g.id}|${m.id}">Make task</button>`}</div>`).join("")}</div>
    <form class="row" data-form="addMs" data-id="${g.id}"><input type="text" name="text" required placeholder="Add milestone" style="flex:1"><button class="btn sm">Add</button></form>
  </div>`;
}

function vSettings(){
  const P = store && store.push, st = ui.push, s = S.settings;
  const hours = [...Array(24)].map((_,h)=>`<option value="${h}" ${+s.digestHour===h?"selected":""}>${(h%12||12)+(h<12?" am":" pm")}</option>`).join("");
  let pushBlock;
  if(!P) pushBlock = `<div class="empty">Notifications work in the installed Soart app, not in this preview.</div>`;
  else if(st==="needs-install") pushBlock = `<div class="note" style="color:var(--ink)"><span>On iPhone, notifications only work once Soart is on your home screen. In Safari tap <strong>Share → Add to Home Screen</strong>, open Soart from the icon, then come back here.</span></div>`;
  else if(st==="unsupported") pushBlock = `<div class="empty">This browser can't receive notifications.</div>`;
  else if(st==="denied") pushBlock = `<div class="empty">Notifications are blocked. Allow them for Soart in your phone or browser settings, then reload.</div>`;
  else pushBlock = `<div class="row" style="justify-content:space-between"><span>${st==="on"?`<span class="chip ok">On for this device</span>`:`<span class="chip">Off on this device</span>`}</span>
      <div class="row">${st==="on"?`<button class="btn" data-act="pushTest">Send a test</button><button class="btn ghost" data-act="pushOff">Turn off</button>`:`<button class="btn accent" data-act="pushOn">${i("bell")}Turn on notifications</button>`}</div></div>`;
  return `<div class="head"><h1>Settings</h1>${store && store.email?`<span class="muted small">${esc(store.email)}</span>`:""}</div>
  <div class="card"><h2>Notifications</h2>
    ${pushBlock}
    <form class="row" data-form="saveNotify">
      <div class="field"><label for="nH">Daily briefing at</label><select id="nH" name="digestHour">${hours}</select></div>
      <div class="field" style="flex:2"><label for="nA">Deadline alerts</label><select id="nA" name="alerts"><option value="1" ${s.alerts?"selected":""}>24 hours and 3 hours before assignments are due</option><option value="0" ${!s.alerts?"selected":""}>Off</option></select></div>
      <button class="btn" style="align-self:flex-end">Save</button>
    </form>
    <div class="muted small">The daily briefing lists what's overdue, due today and due tomorrow, plus your Top 3. Times use ${esc(s.tz || Intl.DateTimeFormat().resolvedOptions().timeZone)}.</div>
  </div>
  <div class="card"><h2>Claude</h2>${aiBlock()}</div>
  <div class="card"><h2>Linked calendars</h2>
    ${calBlock()}
  </div>
  <div class="card"><h2>Data</h2>
    <div class="row"><button class="btn" data-act="exportData">Export backup</button><label class="btn" for="importFile">Import backup</label><input id="importFile" type="file" accept="application/json" class="sr" data-change="import">${hasExamples()?`<button class="btn" data-act="clearExamples">Clear examples</button>`:""}</div>
  </div>
  ${store && store.signOut?`<div class="card"><h2>Account</h2><div class="row"><button class="btn" data-act="signOut">Sign out</button></div></div>`:""}`;
}

function aiBlock(){
  if(!store || !store.ai) return `<div class="empty">Not available here.</div>`;
  if(store.kind==="preview") return `<div>${aiReady()?`<span class="chip ok">On</span> Uses your Claude account. Drop screenshots or files anywhere, paste a screenshot, or type in the capture bar.`:`<span class="chip">Off</span> Claude isn't available in this view.`}</div>`;
  return `<div class="row" style="justify-content:space-between"><span>${aiReady()?`<span class="chip ok">On</span>`:`<span class="chip">Off</span>`} Drop-to-sort, auto-sorted captures and chart requests.</span></div>
    <form class="row" data-form="saveAiKey"><div class="field" style="flex:1;min-width:220px"><label for="aiK">Anthropic API key</label><input id="aiK" type="password" name="key" autocomplete="off" placeholder="${aiReady()?"Saved. Paste a new key to replace it.":"sk-ant-…"}"></div><button class="btn" style="align-self:flex-end">Save key</button></form>
    <div class="small muted">Get a key at console.anthropic.com → API Keys, and add a few dollars of credit under Billing. You pay per use; sorting a screenshot typically costs a few cents. The key is stored only in your private Soart account.</div>`;
}
function calBlock(){
  const cals = S.settings.calendars||[], L = S.linked||{};
  if(store && store.kind==="preview") return `<div class="empty">Calendar syncing works in the installed Soart app. Set it up there under Settings, then Linked calendars.</div>`;
  const ago = L.updated ? Math.round((Date.now()-Date.parse(L.updated))/60000) : null;
  return `${cals.length?`<div class="list">${cals.map(c=>`<div class="item"><div class="t"><strong>${esc(c.name)}</strong> <span class="muted small">${esc((c.url.match(/^https?:\/\/([^/]+)/)||[])[1]||"")}</span></div><span class="chip ${c.kind==="school"?"bad":"acc"}">${c.kind==="school"?"Assignments":"Events"}</span><button class="icon-btn" data-act="delCal" data-id="${c.id}" aria-label="Remove ${esc(c.name)}">${i("x")}</button></div>`).join("")}</div>
    <div class="muted small">${ago===null?"Waiting for the first sync. It runs every hour.":`Last synced ${ago<60?ago+" min":Math.round(ago/60)+" h"} ago · ${(L.events||[]).length} upcoming events.`}${(L.errors||[]).length?` <span style="color:var(--bad)">${(L.errors||[]).map(esc).join("; ")}</span>`:""}</div>`:""}
    <form class="row" data-form="addCal">
      <div class="field"><label for="cName">Name</label><input id="cName" type="text" name="name" required placeholder="Google Calendar"></div>
      <div class="field" style="flex:3;min-width:220px"><label for="cUrl">Calendar link (iCal / .ics)</label><input id="cUrl" type="text" name="url" required placeholder="https://calendar.google.com/calendar/ical/…/basic.ics"></div>
      <div class="field"><label for="cKind">Import as</label><select id="cKind" name="kind"><option value="events">Calendar events</option><option value="school">School assignments</option></select></div>
      <button class="btn" style="align-self:flex-end">Link</button>
    </form>
    <details class="small muted"><summary style="cursor:pointer">Where to find your calendar link</summary>
      <p style="margin:8px 0 0"><strong>Google Calendar</strong> (on a computer): Settings → click your calendar on the left → <em>Integrate calendar</em> → copy <em>Secret address in iCal format</em>.</p>
      <p style="margin:6px 0 0"><strong>iPhone / iCloud</strong>: Calendar app → Calendars → tap ⓘ next to a calendar → turn on <em>Public Calendar</em> → Share Link → Copy.</p>
      <p style="margin:6px 0 0"><strong>Outlook / VT email</strong>: Outlook on the web → Settings → Calendar → Shared calendars → Publish a calendar → copy the ICS link.</p>
      <p style="margin:6px 0 0"><strong>Canvas</strong>: Calendar → <em>Calendar Feed</em> (bottom right) → copy the link. Choose <em>School assignments</em> so due dates land in School and trigger alerts.</p>
      <p style="margin:6px 0 0">Keep these links private: anyone with one can see that calendar. Soart stores them only in your account.</p>
    </details>`;
}

/* ================= GRADES ================= */
const SCALE = [["A",93,4.0],["A-",90,3.7],["B+",87,3.3],["B",83,3.0],["B-",80,2.7],["C+",77,2.3],["C",73,2.0],["C-",70,1.7],["D+",67,1.3],["D",63,1.0],["D-",60,0.7],["F",0,0]];
const letterOf = p => p==null ? "—" : (SCALE.find(s=>p>=s[1])||SCALE[SCALE.length-1])[0];
const pointsOf = L => { const s = SCALE.find(x=>x[0]===L); return s ? s[2] : null; };
const termNameFor = d => { const m = +d.slice(5,7), y = d.slice(0,4); return m>=8 ? `Fall ${y}` : m<=5 ? `Spring ${y}` : `Summer ${y}`; };
const curTerm = () => (S.grades.terms||[]).find(t=>t.current);
const normName = s => String(s||"").toLowerCase().replace(/[^a-z0-9]/g,"");
function findCourse(term, name){ const n = normName(name); return term && term.courses.find(c=>normName(c.name)===n || (c.code && normName(c.code)===n) || normName(c.name).includes(n) || n.includes(normName(c.name))); }
function ensureTerm(){
  let t = curTerm();
  if(!t){ t = {id:uid(), name:termNameFor(today()), current:true, courses:S.school.courses.map(n=>({id:uid(), name:n, code:"", credits:3, weights:[], items:[]}))}; S.grades.terms = [...(S.grades.terms||[]), t]; }
  return t;
}
function ensureCourse(term, name){
  let c = findCourse(term, name);
  if(!c){ c = {id:uid(), name, code:"", credits:3, weights:[], items:[]}; term.courses.push(c); if(!S.school.courses.includes(name)){ S.school.courses.push(name); save("school"); } }
  return c;
}
function courseCalc(c){
  const items = (c.items||[]).filter(x=>x.score!=null && x.possible>0);
  const W = c.weights||[];
  if(!W.length){
    const s = items.reduce((a,x)=>a+ +x.score,0), p = items.reduce((a,x)=>a+ +x.possible,0);
    return {pct: p? s/p*100 : null, cats:[], gradedW:0, totalW:0};
  }
  let num=0, den=0;
  const cats = W.map(w=>{
    const its = items.filter(x=>normName(x.cat)===normName(w.name));
    const s = its.reduce((a,x)=>a+ +x.score,0), p = its.reduce((a,x)=>a+ +x.possible,0);
    const pct = p ? s/p*100 : null;
    if(pct!=null){ num += pct*w.pct; den += +w.pct; }
    return {name:w.name, w:+w.pct, pct, n:its.length};
  });
  const totalW = W.reduce((a,w)=>a+ +w.pct,0);
  return {pct: den? num/den : null, cats, gradedW:den, totalW};
}
function needed(c, target){
  const k = courseCalc(c); if(!k.cats.length || k.pct==null) return null;
  const rem = k.totalW - k.gradedW; if(rem<=0.01) return null;
  return (target*k.totalW - k.pct*k.gradedW)/rem;
}
function gpa(courses){ let q=0, cr=0; courses.forEach(c=>{ const p = pointsOf(c.letter); if(p!=null && c.credits>0){ q+=p*c.credits; cr+= +c.credits; } }); return {gpa: cr? q/cr : null, credits:cr}; }
function projected(t){ return t.courses.map(c=>({letter: c.letter || letterOf(courseCalc(c).pct), credits:+c.credits||0})).filter(c=>c.letter!=="—"); }
const fmtGpa = g => g==null ? "—" : g.toFixed(2);

function vGrades(){
  const t = curTerm();
  const past = (S.grades.terms||[]).filter(x=>!x.current);
  const pastCourses = past.flatMap(x=>x.courses);
  const cum = gpa(pastCourses), proj = t ? gpa(projected(t)) : {gpa:null,credits:0};
  const withTerm = gpa([...pastCourses, ...(t?projected(t):[])]);
  if(!t) return `<div class="card"><h2>Set up grades for ${termNameFor(today())}</h2><p class="muted" style="margin:0">Start a term with your ${S.school.courses.length} classes. Then drop in each syllabus to set the weights, and screenshots of Canvas grades to fill in scores.</p><div class="row"><button class="btn primary" data-act="startTerm">Start ${termNameFor(today())}</button></div></div>`;
  return `<div class="grid g3 tiles">
    <div class="tile"><div class="label">${esc(t.name)} GPA, projected</div><div class="v">${fmtGpa(proj.gpa)}</div></div>
    <div class="tile"><div class="label">Cumulative GPA</div><div class="v">${fmtGpa(cum.gpa)}</div><div class="small muted">${fmtGpa(withTerm.gpa)} with this term</div></div>
    <div class="tile"><div class="label">Credits completed</div><div class="v">${cum.credits}</div><div class="small muted">${proj.credits} in progress</div></div>
  </div>
  <div class="grid g2">${t.courses.map(c=>courseCard(t,c)).join("")}</div>
  <div class="row"><form class="row" data-form="addGradeCourse"><input type="text" name="name" placeholder="Add a class" required style="width:180px"><button class="btn sm">Add class</button></form>
    <button class="btn ghost sm" data-act="finishTerm">Finish ${esc(t.name)} and move it to transcript</button></div>`;
}
function courseCard(t,c){
  const k = courseCalc(c), L = letterOf(k.pct);
  const needA = needed(c,93), needB = needed(c,83);
  const items = [...(c.items||[])].sort((a,b)=>(b.date||"").localeCompare(a.date||""));
  return `<div class="card">
    <div class="card-h"><div><h2 class="hed md" style="margin:0">${esc(c.name)}</h2><div class="small muted">${c.code?esc(c.code)+" · ":""}${c.credits} credits</div></div>
      <div style="text-align:right"><div class="num" style="font-size:30px;line-height:1">${k.pct==null?"—":k.pct.toFixed(1)+"%"}</div>${k.pct==null?"":`<div class="label" style="margin-top:4px">${L}</div>`}</div></div>
    ${k.cats.length?`<div class="list">${k.cats.map(x=>`<div class="item" style="flex-wrap:wrap"><span style="flex:1">${esc(x.name)} <span class="muted small num">${x.w}%</span></span><span class="num small">${x.pct==null?"—":x.pct.toFixed(1)+"%"}</span><div class="bar" style="flex-basis:100%"><i style="width:${x.pct==null?0:Math.min(100,x.pct)}%"></i></div></div>`).join("")}</div>`
      :`<div class="empty">No syllabus weights yet. Drop the syllabus here, or set them by hand. Until then the grade uses total points.</div>`}
    ${needA!=null?`<div class="small" style="border-left:2px solid var(--ink);padding-left:10px">${needA>100?`An A is out of reach; a B needs <span class="num">${needB>100?">100":Math.max(0,needB).toFixed(0)+"%"}</span> on the remaining <span class="num">${(k.totalW-k.gradedW).toFixed(0)}%</span>.`:`For an A you need <span class="num">${Math.max(0,needA).toFixed(0)}%</span> on the remaining <span class="num">${(k.totalW-k.gradedW).toFixed(0)}%</span> of the grade.`}</div>`:""}
    <details><summary class="small muted" style="cursor:pointer">${items.length} graded item${items.length===1?"":"s"}</summary>
      <div class="list">${items.map(x=>`<div class="item"><div class="t">${esc(x.name)} <span class="muted small">${esc(x.cat||"")}</span></div><span class="num small">${+x.score}/${+x.possible}</span><span class="num small muted" style="min-width:48px;text-align:right">${(x.score/x.possible*100).toFixed(0)}%</span><button class="icon-btn" data-act="delGrade" data-id="${t.id}|${c.id}|${x.id}" aria-label="Delete">${i("x")}</button></div>`).join("")}</div></details>
    <form class="row" data-form="addGrade" data-id="${t.id}|${c.id}">
      <input type="text" name="name" placeholder="Item, e.g. Exam 2" required style="flex:2;min-width:120px">
      ${c.weights.length?`<select name="cat" style="flex:1;min-width:100px">${c.weights.map(w=>`<option>${esc(w.name)}</option>`).join("")}</select>`:""}
      <input type="number" inputmode="decimal" step="any" name="score" placeholder="Score" required style="width:76px">
      <input type="number" inputmode="decimal" step="any" name="possible" placeholder="Out of" required style="width:76px">
      <button class="btn sm">Add</button></form>
    <div class="row"><button class="btn ghost sm" data-act="editCourse" data-id="${t.id}|${c.id}">Edit weights and credits</button></div>
  </div>`;
}
function vTranscript(){
  const terms = (S.grades.terms||[]).filter(x=>!x.current);
  const all = terms.flatMap(x=>x.courses), cum = gpa(all);
  return `<div class="grid g3 tiles">
    <div class="tile"><div class="label">Cumulative GPA</div><div class="v">${fmtGpa(cum.gpa)}</div></div>
    <div class="tile"><div class="label">Credits</div><div class="v">${cum.credits}</div></div>
    <div class="tile"><div class="label">Terms</div><div class="v">${terms.length}</div></div></div>
  ${terms.map(tm=>{ const g = gpa(tm.courses); return `<div class="card">
    <div class="card-h"><h2 class="hed md" style="margin:0">${esc(tm.name)}</h2><span class="num">GPA ${fmtGpa(g.gpa)} · ${g.credits} cr</span></div>
    <div class="scroll"><table><thead><tr><th>Course</th><th class="r">Credits</th><th class="r">Grade</th><th></th></tr></thead><tbody>
    ${tm.courses.map(c=>`<tr><td>${c.code?`<span class="num small muted">${esc(c.code)}</span> `:""}${esc(c.name)}</td><td class="r num">${c.credits}</td><td class="r num">${esc(c.letter||"—")}</td><td class="r"><button class="icon-btn" data-act="delTxCourse" data-id="${tm.id}|${c.id}" aria-label="Delete">${i("x")}</button></td></tr>`).join("")}
    </tbody></table></div>
    <form class="row" data-form="addTxCourse" data-id="${tm.id}"><input type="text" name="code" placeholder="Code, e.g. FIN 3104" style="width:130px"><input type="text" name="name" placeholder="Course name" required style="flex:1;min-width:140px"><input type="number" name="credits" value="3" min="0" step="0.5" style="width:70px" aria-label="Credits"><select name="letter" style="width:80px" aria-label="Grade">${SCALE.map(s=>`<option>${s[0]}</option>`).join("")}<option>P</option><option>W</option></select><button class="btn sm">Add</button></form>
    <div class="row"><button class="btn ghost sm danger" data-act="delTerm" data-id="${tm.id}">Delete term</button></div>
  </div>`; }).join("")}
  <div class="card"><h2>Add a past term</h2><form class="row" data-form="addPastTerm"><input type="text" name="name" placeholder="e.g. Spring 2026" required style="width:200px"><button class="btn sm">Add term</button></form>
  <div class="small muted">Faster: drop a screenshot or PDF of your unofficial transcript from Hokie SPA and Soart fills this in.</div></div>`;
}

/* ================= CHARTS ================= */
const CH_SOURCES = {
  money:{label:"Money", fields:["spend","income","amount"], groups:["cat","desc"]},
  fitness:{label:"Fitness", fields:["e1rm","weight","reps","volume","sets"], groups:["exercise"]},
  tasks:{label:"Tasks completed", fields:["count"], groups:["area"]},
  school:{label:"Assignments", fields:["count"], groups:["course","type"]},
  grades:{label:"Grades", fields:["pct","score"], groups:["course","cat"]},
  events:{label:"Calendar events", fields:["count"], groups:["cat","cal"]}
};
function chartRows(src){
  if(src==="money") return S.money.items.map(x=>({date:x.date, amount:x.amount, spend:x.amount<0?-x.amount:0, income:x.amount>0?x.amount:0, cat:x.cat, desc:x.desc}));
  if(src==="fitness") return S.fitness.items.map(w=>({date:w.date, exercise:w.exercise, weight:+w.weight, reps:+w.reps, sets:+w.sets||1, volume:w.weight*w.reps*(w.sets||1), e1rm:Math.round(e1rm(+w.weight,+w.reps))}));
  if(src==="tasks") return S.tasks.items.filter(t=>t.done&&t.doneAt).map(t=>({date:t.doneAt, area:t.area, count:1}));
  if(src==="school") return S.school.items.map(a=>({date:a.due.slice(0,10), course:a.course, type:a.type, done:a.done?1:0, count:1}));
  if(src==="grades") return (S.grades.terms||[]).flatMap(t=>t.courses.flatMap(c=>(c.items||[]).filter(x=>x.possible>0).map(x=>({date:x.date||"", course:c.name, cat:x.cat||"", pct:x.score/x.possible*100, score:+x.score}))));
  if(src==="events") return [...S.events.items, ...(S.linked.events||[])].map(e=>({date:e.date, cat:e.cat||e.cal||"", cal:e.cal||"Soart", count:1}));
  return [];
}
function bucketKey(d, b){ if(!d) return ""; if(b==="month") return d.slice(0,7); if(b==="week") return weekStart(d); return d.slice(0,10); }
function computeChart(sp){
  let rows = chartRows(sp.source);
  if(sp.days) { const from = addDays(today(), -sp.days); rows = rows.filter(r=>r.date && r.date>=from); }
  (sp.filter||[]).forEach(f=>{ rows = rows.filter(r=>{ const v=r[f.field]; const t=f.value;
    return f.op==="!="? String(v)!==String(t) : f.op===">"? +v>+t : f.op==="<"? +v<+t : f.op==="contains"? String(v).toLowerCase().includes(String(t).toLowerCase()) : String(v).toLowerCase()===String(t).toLowerCase(); }); });
  const isDate = sp.x==="date";
  const xKey = r => isDate ? bucketKey(r.date, sp.bucket||"week") : String(r[sp.x]??"");
  const sKey = r => sp.split ? String(r[sp.split]??"") : "All";
  const groups = {};
  rows.forEach(r=>{ const x=xKey(r); if(!x) return; const s=sKey(r); ((groups[s]=groups[s]||{})[x]=groups[s][x]||[]).push(r); });
  let xs = [...new Set(Object.values(groups).flatMap(g=>Object.keys(g)))];
  xs.sort(); if(!isDate){ const tot = x => Object.values(groups).reduce((a,g)=>a+(g[x]?g[x].length:0),0); xs.sort((a,b)=>tot(b)-tot(a)); }
  xs = isDate ? xs.slice(-60) : xs.slice(0,16);
  const agg = (arr) => { if(!arr||!arr.length) return null; const f=sp.field||"count"; const v=arr.map(r=>f==="count"?1:+r[f]||0);
    return sp.op==="avg"? v.reduce((a,b)=>a+b,0)/v.length : sp.op==="max"? Math.max(...v) : sp.op==="min"? Math.min(...v) : sp.op==="count"? v.length : v.reduce((a,b)=>a+b,0); };
  let series = Object.keys(groups).map(name=>({name, values: xs.map(x=>agg(groups[name][x]))}));
  series.sort((a,b)=>b.values.reduce((s,v)=>s+(v||0),0)-a.values.reduce((s,v)=>s+(v||0),0)); series = series.slice(0,6);
  if(sp.cumulative) series.forEach(s=>{ let run=0; s.values = s.values.map(v=>(run+=(v||0))); });
  const label = x => isDate ? (sp.bucket==="month" ? MON[+x.slice(5,7)-1]+" "+x.slice(2,4) : MON[+x.slice(5,7)-1]+" "+(+x.slice(8,10))) : x;
  return {xs, labels:xs.map(label), series};
}
const CH_COLORS = ["var(--accent)","#B45309","#0F766E","#7C3AED","#BE123C","#4D7C0F"];
function drawChart(sp, cid){
  const d = computeChart(sp);
  if(!d.xs.length || !d.series.length) return `<div class="empty">No data for this chart yet.</div>`;
  const W=460,H=230,L=40,R=10,T=16,B=34, n=d.xs.length;
  const vals = d.series.flatMap(s=>s.values.filter(v=>v!=null));
  let lo = sp.type==="bar" ? Math.min(0,...vals) : Math.min(...vals), hi = Math.max(...vals, sp.type==="bar"?1:Math.min(...vals)+1);
  if(sp.type!=="bar"){ const pad=(hi-lo)*0.12||1; lo=lo-pad; hi=hi+pad; if(Math.min(...vals)>=0) lo=Math.max(0,lo); }
  const raw = (hi-lo)/4, mag = Math.pow(10,Math.floor(Math.log10(raw||1))), step = [1,2,2.5,5,10].map(m=>m*mag).find(s=>s>=raw)||raw;
  hi = Math.ceil(hi/step)*step; lo = Math.floor(lo/step)*step;
  const Y = v => T + (1-(v-lo)/((hi-lo)||1))*(H-T-B);
  const fmtV = v => Math.abs(v)>=1000 ? (v/1000).toFixed(v>=10000?0:1)+"k" : (Math.round(v*10)/10).toString();
  let g=""; for(let v=lo; v<=hi+1e-9; v+=step) g += `<line x1="${L}" x2="${W-R}" y1="${Y(v)}" y2="${Y(v)}" stroke="var(--line)"/><text x="${L-8}" y="${Y(v)+4}" text-anchor="end" font-size="11" fill="var(--muted)" font-family="Libre Caslon Text, Georgia, serif">${fmtV(v)}</text>`;
  const every = Math.ceil(n/6); let xl="", marks="";
  const bw = (W-L-R)/n, X = k => sp.type==="bar" ? L + bw*k + bw/2 : L + (n===1? (W-L-R)/2 : k*(W-L-R)/(n-1));
  d.labels.forEach((lb,k)=>{ if(k%every===0 || k===n-1) xl += `<text x="${X(k)}" y="${H-B+16}" text-anchor="middle" font-size="11" fill="var(--muted)">${esc(String(lb).slice(0,14))}</text>`; });
  if(sp.type==="bar"){
    const m = d.series.length, gw = Math.min(bw*0.8, 46), w = gw/m - 2;
    d.series.forEach((s,si)=>s.values.forEach((v,k)=>{ if(v==null) return; const x = X(k)-gw/2 + si*(gw/m)+1, y = Y(Math.max(v,0)), h = Math.abs(Y(v)-Y(0));
      marks += `<rect x="${x}" y="${y}" width="${Math.max(w,2)}" height="${Math.max(h,1)}" rx="2" fill="${CH_COLORS[si]}"><title>${esc(s.name)} · ${esc(d.labels[k])}: ${fmtV(v)}</title></rect>`; }));
  } else {
    d.series.forEach((s,si)=>{ let path="", pen=false; s.values.forEach((v,k)=>{ if(v==null){ pen=false; return; } path += (pen?"L":"M")+X(k).toFixed(1)+","+Y(v).toFixed(1); pen=true; });
      marks += `<path d="${path}" fill="none" stroke="${CH_COLORS[si]}" stroke-width="2" stroke-linejoin="round"/>`;
      s.values.forEach((v,k)=>{ if(v!=null) marks += `<circle cx="${X(k)}" cy="${Y(v)}" r="3" fill="var(--surface)" stroke="${CH_COLORS[si]}" stroke-width="1.8"><title>${esc(s.name)} · ${esc(d.labels[k])}: ${fmtV(v)}</title></circle>`; });
      const lastK = s.values.map((v,k)=>v==null?-1:k).filter(k=>k>=0).pop(); if(lastK!=null && d.series.length===1) marks += `<text x="${Math.min(X(lastK),W-R)}" y="${Y(s.values[lastK])-9}" text-anchor="end" font-size="12" font-weight="600" fill="var(--ink)" font-family="Libre Caslon Text, Georgia, serif">${fmtV(s.values[lastK])}</text>`; });
  }
  const legend = d.series.length>1 ? `<div class="legend">${d.series.map((s,si)=>`<span><i style="background:${CH_COLORS[si]}"></i>${esc(s.name)}</span>`).join("")}</div>` : "";
  return `<svg viewBox="0 0 ${W} ${H}" role="img" aria-label="${esc(sp.title||"Chart")}" style="width:100%;height:auto;display:block">${g}${xl}${marks}<line x1="${L}" x2="${W-R}" y1="${Y(Math.max(lo,0))}" y2="${Y(Math.max(lo,0))}" stroke="var(--line-2)"/></svg>${legend}`;
}
function vCharts(){
  const C = S.charts.items||[];
  const src = ui.chartSrc || "money", meta = CH_SOURCES[src];
  return `<div class="head"><h1>Charts</h1><span class="muted num">${C.length} saved</span></div>
  ${aiReady()?`<div class="card"><h2>Ask for a chart</h2>
    <form class="row" data-form="askChart"><input type="text" id="chartAsk" name="q" required placeholder="e.g. weekly spending by category since September" style="flex:1;min-width:220px"><button class="btn primary">Make chart</button></form>
    <div class="small muted">Works with anything Soart tracks: spending, lifts, grades, assignments, completed tasks, calendar.</div></div>`:""}
  <details class="card" ${aiReady()?"":"open"}><summary style="cursor:pointer"><h2 style="display:inline">Build one yourself</h2></summary>
    <form class="row" data-form="buildChart" style="margin-top:10px">
      <div class="field" style="flex-basis:100%"><label for="bcT">Title</label><input id="bcT" type="text" name="title" required placeholder="Bench press estimate"></div>
      <div class="field"><label for="bcS">Data</label><select id="bcS" name="source" data-change="chartSrc">${Object.entries(CH_SOURCES).map(([k,v])=>`<option value="${k}" ${k===src?"selected":""}>${v.label}</option>`).join("")}</select></div>
      <div class="field"><label for="bcM">Measure</label><select id="bcM" name="op">${[["sum","Total"],["avg","Average"],["max","Highest"],["count","Count"]].map(([v,l])=>`<option value="${v}">${l}</option>`).join("")}</select></div>
      <div class="field"><label for="bcF">Of</label><select id="bcF" name="field">${meta.fields.map(f=>`<option>${f}</option>`).join("")}</select></div>
      <div class="field"><label for="bcX">Across</label><select id="bcX" name="x"><option value="date">Time</option>${meta.groups.map(f=>`<option>${f}</option>`).join("")}</select></div>
      <div class="field"><label for="bcB">Time step</label><select id="bcB" name="bucket"><option>week</option><option>day</option><option>month</option></select></div>
      <div class="field"><label for="bcSp">One line per</label><select id="bcSp" name="split"><option value="">Nothing</option>${meta.groups.map(f=>`<option>${f}</option>`).join("")}</select></div>
      <div class="field"><label for="bcD">Period</label><select id="bcD" name="days"><option value="30">Last 30 days</option><option value="90" selected>Last 90 days</option><option value="365">Last year</option><option value="0">All time</option></select></div>
      <div class="field"><label for="bcTy">Style</label><select id="bcTy" name="type"><option value="line">Line</option><option value="bar">Bars</option></select></div>
      <button class="btn" style="align-self:flex-end">Add chart</button>
    </form></details>
  <div class="grid g2">${C.map(sp=>`<div class="card"><div class="card-h"><h2 class="hed md" style="margin:0">${esc(sp.title)}</h2><button class="icon-btn" data-act="delChart" data-id="${sp.id}" aria-label="Delete chart">${i("x")}</button></div>${drawChart(sp)}${sp.note?`<div class="small muted">${esc(sp.note)}</div>`:""}</div>`).join("")}</div>
  ${!C.length?`<div class="empty">No charts yet.</div>`:""}`;
}

/* ================= DROP-TO-SORT (Claude) ================= */
const aiReady = () => !!(store && store.ai && store.ai.ready());
function soarContext(){
  const t = curTerm();
  return JSON.stringify({
    today: today(), weekday: DOW[new Date().getDay()], timezone: Intl.DateTimeFormat().resolvedOptions().timeZone,
    taskAreas: AREAS, schoolClasses: S.school.courses,
    gradeCourses: t ? t.courses.map(c=>({name:c.name, code:c.code, weights:(c.weights||[]).map(w=>w.name+" "+w.pct+"%")})) : [],
    openAssignments: S.school.items.filter(a=>!a.done).slice(0,60).map(a=>({course:a.course, title:a.title, due:a.due})),
    exercises: S.fitness.exercises, lists: S.lists.items.map(l=>l.name+" ("+l.kind+")"), goals: S.goals.items.map(g=>g.title),
    expenseCategories: EXP_CATS, incomeCategories: INC_CATS, eventTypes:["Class","Work","Research","BASIS","Gym","Social","Appointment","Other"]
  });
}
const SORT_RULES = `You are the intake clerk for Soart, a student's personal organizer. Read what the student dropped in (screenshots, documents or text) and turn it into data changes.
Return ONLY a JSON object: {"summary": "<one short sentence of what you did>", "actions": [ ... ]}.
Action types (use only these; omit fields you can't read):
- {"type":"add_assignment","course":"<class>","title":"","kind":"Homework|Reading|Quiz|Exam|Project|Paper","due":"YYYY-MM-DDTHH:MM"}  (use 23:59 when no time shown)
- {"type":"complete_assignment","course":"","title":""}
- {"type":"add_task","title":"","area":"<one of taskAreas>","due":"YYYY-MM-DD","priority":1|2|3}
- {"type":"add_event","title":"","date":"YYYY-MM-DD","start":"HH:MM","end":"HH:MM","cat":"<eventType>"}
- {"type":"set_syllabus","course":"","code":"","credits":3,"weights":[{"name":"Exams","pct":50}]}  (weights should total 100)
- {"type":"add_grades","course":"","items":[{"name":"","cat":"<weight category if known>","score":0,"possible":0,"date":"YYYY-MM-DD"}]}
- {"type":"add_transcript","terms":[{"name":"Fall 2025","courses":[{"code":"","name":"","credits":3,"letter":"A-"}]}]}
- {"type":"add_transaction","desc":"","amount":-12.50,"cat":"<category>","date":"YYYY-MM-DD"}  (expenses negative, income positive)
- {"type":"log_set","exercise":"","weight":0,"reps":0,"sets":1,"date":"YYYY-MM-DD"}
- {"type":"add_list_items","list":"<existing list name or new>","kind":"grocery|wishlist|general","items":[{"text":"","price":null}]}
- {"type":"add_goal","title":"","horizon":"This semester|This year|Long term","area":"","target":"YYYY-MM-DD","why":"","milestones":[""]}
- {"type":"inbox","text":""}  (anything that fits nowhere)
Rules: only record what is actually shown or said; never invent dates, scores or amounts. Resolve relative dates ("Friday", "tomorrow") from today. Match class names to existing schoolClasses / gradeCourses when they are clearly the same class (Canvas course codes like "FIN 3104" or "POLS-2024" map to the closest existing class). A Canvas dashboard or to-do list becomes add_assignment items. A grades page becomes add_grades, with cat set to the matching syllabus weight category. A syllabus becomes set_syllabus plus add_assignment for dated deadlines. A transcript becomes add_transcript (completed terms only). A receipt becomes add_transaction.`;

async function sortIntake({text="", files=[]}){
  if(!aiReady()){ if(text){ S.inbox.items.unshift({id:uid(), text, created:today()}); commit("inbox"); toast("Captured to Inbox. Turn on Claude in Settings to auto-sort."); } else toast("Turn on Claude in Settings to sort files."); return; }
  const images = files.filter(f=>/^image\//.test(f.type)), pdfs = files.filter(f=>f.type==="application/pdf");
  let extra = "";
  for(const f of files.filter(f=>/^text\/|json$|csv$/.test(f.type)||/\.(txt|csv|md|ics)$/i.test(f.name))){ try{ extra += `\n--- ${f.name} ---\n` + (await f.text()).slice(0,40000); }catch(e){} }
  if(pdfs.length && !store.ai.pdf){ toast("PDFs work in the installed app. Screenshot the page instead."); if(!images.length && !text && !extra) return; }
  const what = [images.length?`${images.length} image${images.length>1?"s":""}`:"", pdfs.length&&store.ai.pdf?`${pdfs.length} PDF${pdfs.length>1?"s":""}`:"", text?"a note":"", extra?"text files":""].filter(Boolean).join(", ");
  ui.sorting = {status:`Reading ${what}…`}; renderDesk();
  try{
    const prompt = `${SORT_RULES}\n\nCurrent Soart data (for matching names):\n${soarContext()}\n\n${text?`Student's note:\n${text}\n`:""}${extra?`Attached text:\n${extra}\n`:""}${images.length||pdfs.length?"The attached file(s) are what the student dropped in.":""}`;
    const out = await store.ai.json(prompt, {images, pdfs: store.ai.pdf ? pdfs : [], quick: !images.length && !pdfs.length && text.length<400});
    const acts = Array.isArray(out && out.actions) ? out.actions : [];
    if(!acts.length){ ui.sorting = {done:true, summary: (out && out.summary) || "Nothing to add from that.", lines:[]}; renderDesk(); return; }
    const res = applyActions(acts);
    ui.sorting = {done:true, summary: out.summary || "Sorted.", lines: res.lines, undo: res.undo};
    render();
  }catch(e){
    ui.sorting = {done:true, error:true, summary: e && e.message ? e.message : "Claude couldn't read that. Try a clearer screenshot."};
    if(text){ S.inbox.items.unshift({id:uid(), text, created:today()}); commit("inbox"); ui.sorting.summary += " Your note is saved in Inbox."; }
    renderDesk();
  }
}
function applyActions(acts){
  const keys = ["tasks","inbox","school","events","fitness","money","lists","goals","grades"];
  const before = clone(keys.reduce((o,k)=>(o[k]=S[k],o),{}));
  const touched = new Set(), count = {};
  const bump = (k,label) => { touched.add(k); count[label]=(count[label]||0)+1; };
  const courseName = n => { const t = curTerm(); const c = findCourse(t, n); if(c) return c.name; const m = S.school.courses.find(x=>normName(x)===normName(n) || normName(n).includes(normName(x)) || normName(x).includes(normName(n))); return m || String(n||"General").trim(); };
  for(const a of acts){ try{
    if(a.type==="add_assignment" && a.title && a.due){
      const course = courseName(a.course), due = a.due.length===10 ? a.due+"T23:59" : a.due.slice(0,16);
      if(!S.school.courses.includes(course)) S.school.courses.push(course);
      const ex = S.school.items.find(x=>normName(x.course)===normName(course) && normName(x.title)===normName(a.title));
      if(ex){ if(ex.due!==due){ ex.due=due; bump("school","assignment updated"); } }
      else { S.school.items.push({id:uid(), title:a.title, course, type:A_TYPES.includes(a.kind)?a.kind:"Homework", due, done:false}); bump("school","assignment"); }
    } else if(a.type==="complete_assignment"){
      const ex = S.school.items.find(x=>normName(x.title)===normName(a.title) && (!a.course || normName(x.course)===normName(courseName(a.course))));
      if(ex && !ex.done){ ex.done=true; ex.doneAt=today(); bump("school","assignment marked done"); }
    } else if(a.type==="add_task" && a.title){
      S.tasks.items.unshift({id:uid(), title:a.title, area:AREAS.includes(a.area)?a.area:"Life", due:a.due||null, priority:[1,2,3].includes(+a.priority)?+a.priority:3, done:false, created:today()}); bump("tasks","task");
    } else if(a.type==="add_event" && a.title && a.date){
      S.events.items.push({id:uid(), title:a.title, date:a.date, start:a.start||"", end:a.end||"", cat:a.cat||"Other"}); bump("events","event");
    } else if(a.type==="set_syllabus" && a.course){
      const t = ensureTerm(), c = ensureCourse(t, courseName(a.course));
      if(Array.isArray(a.weights) && a.weights.length) c.weights = a.weights.filter(w=>w.name).map(w=>({id:uid(), name:String(w.name), pct:+w.pct||0}));
      if(a.code) c.code = a.code; if(+a.credits) c.credits = +a.credits; bump("grades","syllabus");
    } else if(a.type==="add_grades" && a.course && Array.isArray(a.items)){
      const t = ensureTerm(), c = ensureCourse(t, courseName(a.course));
      a.items.filter(x=>x.name && x.possible>0 && x.score!=null).forEach(x=>{
        const cat = c.weights.length ? (c.weights.find(w=>normName(w.name)===normName(x.cat))||c.weights.find(w=>normName(x.cat).includes(normName(w.name))||normName(w.name).includes(normName(x.cat)))||{}).name || x.cat || "" : (x.cat||"");
        const ex = c.items.find(y=>normName(y.name)===normName(x.name));
        if(ex) Object.assign(ex,{score:+x.score, possible:+x.possible, cat}); else c.items.push({id:uid(), name:x.name, cat, score:+x.score, possible:+x.possible, date:x.date||today()});
        bump("grades","grade");
      });
    } else if(a.type==="add_transcript" && Array.isArray(a.terms)){
      a.terms.forEach(tm=>{ if(!tm.name) return;
        let term = (S.grades.terms||[]).find(x=>!x.current && normName(x.name)===normName(tm.name));
        if(!term){ term = {id:uid(), name:tm.name, current:false, courses:[]}; S.grades.terms = [...(S.grades.terms||[]), term]; }
        (tm.courses||[]).forEach(c=>{ if(!c.name && !c.code) return; const ex = term.courses.find(x=>(c.code && normName(x.code)===normName(c.code)) || normName(x.name)===normName(c.name));
          if(ex) Object.assign(ex,{credits:+c.credits||ex.credits, letter:c.letter||ex.letter}); else term.courses.push({id:uid(), code:c.code||"", name:c.name||c.code, credits:+c.credits||3, letter:c.letter||"", weights:[], items:[]}); bump("grades","transcript course"); });
      });
      S.grades.terms.sort((x,y)=>(x.current?1:0)-(y.current?1:0));
    } else if(a.type==="add_transaction" && a.desc && +a.amount){
      S.money.items.push({id:uid(), date:a.date||today(), desc:a.desc, amount:Math.round(+a.amount*100)/100, cat:a.cat||(+a.amount>0?"Other income":"Other")}); bump("money","transaction");
    } else if(a.type==="log_set" && a.exercise && +a.weight>=0 && +a.reps>0){
      const ex = S.fitness.exercises.find(x=>normName(x)===normName(a.exercise)) || a.exercise;
      if(!S.fitness.exercises.includes(ex)) S.fitness.exercises.push(ex);
      S.fitness.items.push({id:uid(), date:a.date||today(), exercise:ex, weight:+a.weight, reps:+a.reps, sets:+a.sets||1, t:Date.now()}); bump("fitness","set");
    } else if(a.type==="add_list_items" && Array.isArray(a.items)){
      let l = S.lists.items.find(x=>normName(x.name)===normName(a.list)) || (a.kind && S.lists.items.find(x=>x.kind===a.kind));
      if(!l){ l = {id:uid(), name:a.list||"List", kind:["grocery","wishlist"].includes(a.kind)?a.kind:"general", items:[]}; S.lists.items.push(l); }
      a.items.filter(x=>x.text).forEach(x=>{ l.items.push({id:uid(), text:x.text, price:x.price?+x.price:null, link:"", done:false}); bump("lists","list item"); });
    } else if(a.type==="add_goal" && a.title){
      S.goals.items.push({id:uid(), title:a.title, horizon:HORIZONS.includes(a.horizon)?a.horizon:"This year", area:AREAS.includes(a.area)?a.area:"Life", target:a.target||null, why:a.why||"", milestones:(a.milestones||[]).filter(Boolean).map(text=>({id:uid(), text:String(text), done:false})), created:today()}); bump("goals","goal");
    } else if(a.type==="inbox" && a.text){
      S.inbox.items.unshift({id:uid(), text:a.text, created:today()}); bump("inbox","inbox note");
    }
  }catch(err){ console.warn("Skipped action", a, err); } }
  if(touched.has("school") || S.school.courses.length !== before.school.courses.length) touched.add("school");
  touched.forEach(k=>save(k));
  const lines = Object.entries(count).map(([k,n])=>`${n} ${k}${n>1&&!k.endsWith("updated")&&!k.endsWith("done")?"s":""}`);
  return {lines, undo: ()=>{ touched.forEach(k=>{ S[k]=before[k]; save(k); }); }};
}
function renderDesk(){
  const el = $("#desk"); if(!el) return;
  const s = ui.sorting;
  if(!s){ el.innerHTML=""; return; }
  el.innerHTML = s.done ? `<div class="desk ${s.error?"err":""}"><div><strong>${esc(s.summary)}</strong>${s.lines&&s.lines.length?`<div class="small muted">Added ${esc(s.lines.join(", "))}.</div>`:""}</div>
    <div class="row">${s.undo?`<button class="btn sm" data-act="undoSort">Undo</button>`:""}<button class="icon-btn" data-act="closeDesk" aria-label="Dismiss">${i("x")}</button></div></div>`
    : `<div class="desk"><span class="spin" aria-hidden="true"></span><span>${esc(s.status)}</span></div>`;
}
async function askChart(q){
  ui.sorting = {status:"Designing your chart…"}; renderDesk();
  const schema = Object.entries(CH_SOURCES).map(([k,v])=>`${k}: numeric fields [${v.fields.join(", ")}], group fields [${v.groups.join(", ")}]`).join("\n");
  const names = {exercises:S.fitness.exercises, categories:EXP_CATS, courses:S.school.courses, areas:AREAS};
  try{
    const sp = await store.ai.json(`Turn the request into a chart spec for Soart. Reply with ONLY a JSON object:
{"title":"","type":"line|bar","source":"money|fitness|tasks|school|grades|events","op":"sum|avg|max|min|count","field":"<numeric field or count>","x":"date|<group field>","bucket":"day|week|month","split":"<group field or empty>","days":<number of days back, 0 for all time>,"filter":[{"field":"","op":"==|!=|>|<|contains","value":""}],"cumulative":false,"note":"<optional one-line caveat>"}
Sources:\n${schema}\nKnown names: ${JSON.stringify(names)}\nToday is ${today()}. Lifting progress → fitness, field e1rm, op max, filter exercise. Spending → money field spend. Grades over time → grades field pct op avg.
Request: ${q}`, {quick:true});
    if(!sp || !CH_SOURCES[sp.source]) throw {message:"Couldn't turn that into a chart. Try naming what to measure."};
    S.charts.items = [{id:uid(), ...sp, days:+sp.days||0}, ...(S.charts.items||[])]; ui.sorting=null; commit("charts"); renderDesk();
  }catch(e){ ui.sorting = {done:true, error:true, summary:e.message||"Couldn't make that chart."}; renderDesk(); }
}

/* ---------- modal ---------- */
function renderModal(){
  const m = ui.modal, root = $("#modalRoot");
  if(!m){ root.innerHTML=""; return; }
  let body = "";
  const foot = (del, delAct, id) => `<div class="row" style="flex-basis:100%;justify-content:space-between;grid-column:1/-1">${del?`<button type="button" class="btn ghost danger" data-act="${delAct}" data-id="${id}">${del}</button>`:"<span></span>"}<div class="row"><button type="button" class="btn" data-act="closeModal">Cancel</button><button class="btn primary">Save</button></div></div>`;
  if(m.kind==="task"){ const t = S.tasks.items.find(x=>x.id===m.id); if(!t){ui.modal=null;return renderModal();}
    body = `<h2>Edit task</h2><form data-form="saveT" class="row">
      <div class="field" style="flex-basis:100%"><label for="mT">Task</label><input id="mT" type="text" name="title" value="${esc(t.title)}" required></div>
      <div class="field"><label for="mA">Area</label><select id="mA" name="area">${AREAS.map(a=>`<option ${a===t.area?"selected":""}>${a}</option>`).join("")}</select></div>
      <div class="field"><label for="mD">Due</label><input id="mD" type="date" name="due" value="${t.due||""}"></div>
      <div class="field"><label for="mP">Priority</label><select id="mP" name="priority">${[[1,"High"],[2,"Medium"],[3,"Low"]].map(([v,l])=>`<option value="${v}" ${+t.priority===v?"selected":""}>${l}</option>`).join("")}</select></div>
      <div class="field" style="flex-basis:100%"><label for="mG">Supports goal</label><select id="mG" name="goalId"><option value="">None</option>${S.goals.items.map(g=>`<option value="${g.id}" ${g.id===t.goalId?"selected":""}>${esc(g.title)}</option>`).join("")}</select></div>
      ${foot("Delete task","delT",t.id)}</form>`; }
  if(m.kind==="a"){ const a = S.school.items.find(x=>x.id===m.id); if(!a){ui.modal=null;return renderModal();}
    body = `<h2>Edit assignment</h2><form data-form="saveA" class="row">
      <div class="field" style="flex-basis:100%"><label for="mT">Assignment</label><input id="mT" type="text" name="title" value="${esc(a.title)}" required></div>
      <div class="field"><label for="mC">Class</label><select id="mC" name="course">${S.school.courses.map(c=>`<option ${c===a.course?"selected":""}>${esc(c)}</option>`).join("")}</select></div>
      <div class="field"><label for="mTy">Type</label><select id="mTy" name="type">${A_TYPES.map(x=>`<option ${x===a.type?"selected":""}>${x}</option>`).join("")}</select></div>
      <div class="field"><label for="mD">Due</label><input id="mD" type="datetime-local" name="due" value="${a.due}" required></div>
      ${foot("Delete","delA",a.id)}</form>`; }
  if(m.kind==="goal"){ const g = S.goals.items.find(x=>x.id===m.id); if(!g){ui.modal=null;return renderModal();}
    body = `<h2>Edit goal</h2><form data-form="saveG" class="row">
      <div class="field" style="flex-basis:100%"><label for="mT">Goal</label><input id="mT" type="text" name="title" value="${esc(g.title)}" required></div>
      <div class="field"><label for="mH">Timeframe</label><select id="mH" name="horizon">${HORIZONS.map(x=>`<option ${x===g.horizon?"selected":""}>${x}</option>`).join("")}</select></div>
      <div class="field"><label for="mD">Target date</label><input id="mD" type="date" name="target" value="${g.target||""}"></div>
      <div class="field" style="flex-basis:100%"><label for="mW">Why it matters</label><input id="mW" type="text" name="why" value="${esc(g.why||"")}"></div>
      ${foot("Delete goal","delG",g.id)}</form>`; }
  if(m.kind==="course"){ const [tid,cid]=m.id.split("|"); const t=(S.grades.terms||[]).find(x=>x.id===tid), c=t&&t.courses.find(x=>x.id===cid); if(!c){ui.modal=null;return renderModal();}
    body = `<h2>${esc(c.name)}</h2><form data-form="saveCourse" class="row">
      <div class="field" style="flex:2"><label for="mcN">Name</label><input id="mcN" type="text" name="name" value="${esc(c.name)}"></div>
      <div class="field"><label for="mcC">Code</label><input id="mcC" type="text" name="code" value="${esc(c.code||"")}" placeholder="FIN 3104"></div>
      <div class="field" style="max-width:90px"><label for="mcR">Credits</label><input id="mcR" type="number" step="0.5" min="0" name="credits" value="${c.credits}"></div>
      <div class="field" style="flex-basis:100%"><label for="mcW">Syllabus weights, one per line</label><textarea id="mcW" name="weights" style="min-height:130px" placeholder="Exams, 45&#10;Quizzes, 20&#10;Homework, 25&#10;Participation, 10">${esc((c.weights||[]).map(w=>w.name+", "+w.pct).join("\n"))}</textarea></div>
      ${foot("Remove class","delCourseGrades",m.id)}</form>`; }
  if(m.kind==="budgets"){
    body = `<h2>Monthly budgets</h2><p class="muted small" style="margin:0">Leave blank for no limit.</p><form data-form="saveBudgets" class="grid g2">
      ${EXP_CATS.map(c=>`<div class="field"><label for="b-${c.replace(/\s/g,"")}">${c}</label><input id="b-${c.replace(/\s/g,"")}" type="number" inputmode="decimal" min="0" step="1" name="${c}" value="${S.money.budgets[c]||""}"></div>`).join("")}
      ${foot()}</form>`; }
  if(m.kind==="export"){
    body = `<h2>Backup</h2><p class="muted small" style="margin:0">Copy this and keep it somewhere safe. Import it in Settings to restore.</p><textarea id="expText" readonly style="min-height:220px;font-family:var(--mono);font-size:12px">${esc(JSON.stringify(S))}</textarea><div class="row" style="justify-content:flex-end"><button class="btn" data-act="closeModal">Close</button><button class="btn primary" data-act="copyExport">Copy</button></div>`; }
  root.innerHTML = `<div class="modal-back" data-act="backdrop"><div class="modal" role="dialog" aria-modal="true">${body}</div></div>`;
  const f = root.querySelector("input,textarea"); if(f) f.focus();
}

function toast(msg){ const r = $("#toastRoot"); r.innerHTML = `<div class="toast" role="status">${esc(msg)}</div>`; clearTimeout(toast.t); toast.t = setTimeout(()=>r.innerHTML="", 3200); }

/* ---------- render ---------- */
function render(){
  renderRail();
  const fn = {today:vToday, tasks:vTasks, school:vSchool, calendar:vCalendar, fitness:vFitness, money:vMoney, lists:vLists, goals:vGoals, charts:vCharts, settings:vSettings}[ui.view] || vToday;
  const a = document.activeElement, keep = a && a.id && a.closest("#view") ? {id:a.id, v:a.value, s:a.selectionStart} : null;
  $("#view").innerHTML = (ui.view==="today" ? "" : `<div class="cornermark">${WORD(26)}</div>`) + fn();
  renderDesk();
  if(keep){ const el = document.getElementById(keep.id); if(el){ el.value = keep.v; el.focus(); try{ el.setSelectionRange(keep.s,keep.s); }catch(e){} } }
  wireChart();
  renderModal();
}
async function refreshPush(){ if(store && store.push){ try{ ui.push = await store.push.state(); }catch(e){ ui.push="unsupported"; } } }
function route(){ const h = location.hash.slice(1); ui.view = ALLVIEWS.some(v=>v[0]===h) ? h : "today"; if(ui.view==="settings") refreshPush().then(render); render(); window.scrollTo(0,0); }

/* ---------- timer ---------- */
let actx=null;
function beep(){ try{ actx = actx || new (window.AudioContext||window.webkitAudioContext)(); [0,.25,.5].forEach(t=>{ const o=actx.createOscillator(), g=actx.createGain(); o.frequency.value=880; g.gain.setValueAtTime(.12,actx.currentTime+t); g.gain.exponentialRampToValueAtTime(.001,actx.currentTime+t+.2); o.connect(g).connect(actx.destination); o.start(actx.currentTime+t); o.stop(actx.currentTime+t+.22); }); }catch(e){} }
function tick(){
  const T = ui.timer; T.left--;
  const out = $("#timerOut"); if(out) out.textContent = pad(Math.floor(Math.max(T.left,0)/60))+":"+pad(Math.max(T.left,0)%60);
  document.title = T.run ? `${pad(Math.floor(T.left/60))}:${pad(T.left%60)} · Soart` : "Soart";
  if(T.left<=0){ clearInterval(T.h); T.run=false; beep(); toast(T.mode==="Focus"?"Focus block done. Take five.":"Break over."); T.mode = T.mode==="Focus"?"Break":"Focus"; T.left = T.mode==="Focus"?25*60:5*60; document.title="Soart"; if(ui.view==="today") render(); }
}

/* ---------- actions ---------- */
const find = (arr,id) => arr.find(x=>x.id===id);
const top3Full = () => S.tasks.items.filter(x=>x.today&&!x.done).length>=3;
const A = {
  toggleT(id){ const t = find(S.tasks.items,id); if(!t) return; t.done=!t.done; t.doneAt = t.done?today():null; if(t.done) toast("Done."); commit("tasks"); },
  starT(id){ const t = find(S.tasks.items,id); if(!t) return; if(!t.today && top3Full()){ toast("Top 3 is full. Finish or unstar one first."); return; } t.today=!t.today; commit("tasks"); },
  editT(id){ ui.modal={kind:"task",id}; renderModal(); },
  delT(id){ S.tasks.items = S.tasks.items.filter(x=>x.id!==id); ui.modal=null; commit("tasks"); },
  taskArea(id){ ui.taskArea=id; render(); },
  showDone(){ ui.showDone=!ui.showDone; render(); },
  clearDone(){ S.tasks.items = S.tasks.items.filter(t=>!t.done || (ui.taskArea!=="All" && t.area!==ui.taskArea)); commit("tasks"); },
  toggleA(id){ const a = find(S.school.items,id); if(!a) return; a.done=!a.done; a.doneAt=a.done?today():null; if(a.done) toast("Assignment done."); commit("school"); },
  editA(id){ ui.modal={kind:"a",id}; renderModal(); },
  delA(id){ S.school.items = S.school.items.filter(x=>x.id!==id); ui.modal=null; commit("school"); },
  course(id){ ui.course=id; render(); },
  delCourse(id){ S.school.courses = S.school.courses.filter(c=>c!==id); ui.course="All"; commit("school"); },
  inboxTask(id){ const it = find(S.inbox.items,id); S.tasks.items.unshift({id:uid(), title:it.text, area:"Life", priority:3, done:false, created:today()}); S.inbox.items=S.inbox.items.filter(x=>x.id!==id); save("tasks"); commit("inbox"); toast("Moved to Tasks."); },
  inboxTop(id){ if(top3Full()){ toast("Top 3 is full."); return; } const it = find(S.inbox.items,id); S.tasks.items.unshift({id:uid(), title:it.text, area:"Life", priority:2, today:true, done:false, created:today()}); S.inbox.items=S.inbox.items.filter(x=>x.id!==id); save("tasks"); commit("inbox"); },
  inboxGrocery(id){ const it = find(S.inbox.items,id); let g = S.lists.items.find(l=>l.kind==="grocery"); if(!g){ g={id:uid(),name:"Groceries",kind:"grocery",items:[]}; S.lists.items.unshift(g); } g.items.push({id:uid(), text:it.text, done:false}); S.inbox.items=S.inbox.items.filter(x=>x.id!==id); save("lists"); commit("inbox"); toast("Added to "+g.name+"."); },
  inboxDel(id){ S.inbox.items=S.inbox.items.filter(x=>x.id!==id); commit("inbox"); },
  startTimer(){ const T=ui.timer; if(T.run) return; T.run=true; try{ actx = actx || new (window.AudioContext||window.webkitAudioContext)(); }catch(e){} T.h=setInterval(tick,1000); if(ui.view!=="today") location.hash="today"; else render(); },
  pauseTimer(){ const T=ui.timer; T.run=false; clearInterval(T.h); document.title="Soart"; render(); },
  resetTimer(){ const T=ui.timer; T.run=false; clearInterval(T.h); T.mode="Focus"; T.left=25*60; document.title="Soart"; render(); },
  breakTimer(){ const T=ui.timer; clearInterval(T.h); T.run=false; T.mode="Break"; T.left=5*60; render(); },
  calSel(id){ ui.calSel=id; if(id.slice(0,7)!==ui.calMonth) ui.calMonth=id.slice(0,7); render(); },
  calPrev(){ const [y,m]=ui.calMonth.split("-").map(Number); ui.calMonth=ymd(new Date(y,m-2,1)).slice(0,7); render(); },
  calNext(){ const [y,m]=ui.calMonth.split("-").map(Number); ui.calMonth=ymd(new Date(y,m,1)).slice(0,7); render(); },
  calToday(){ ui.calMonth=today().slice(0,7); ui.calSel=today(); render(); },
  delEv(id){ const e = find(S.events.items,id); if(e && e.series){ S.events.items=S.events.items.filter(x=>x.series!==e.series || x.date<e.date); toast("Removed this and later repeats."); } else S.events.items=S.events.items.filter(x=>x.id!==id); commit("events"); },
  exercise(id){ ui.exercise=id; render(); },
  delSet(id){ S.fitness.items=S.fitness.items.filter(x=>x.id!==id); commit("fitness"); },
  delTx(id){ S.money.items=S.money.items.filter(x=>x.id!==id); commit("money"); },
  editBudgets(){ ui.modal={kind:"budgets"}; renderModal(); },
  list(id){ ui.listId=id; render(); },
  toggleItem(id){ const l=find(S.lists.items,ui.listId); const x=find(l.items,id); x.done=!x.done; commit("lists"); },
  delItem(id){ const l=find(S.lists.items,ui.listId); l.items=l.items.filter(x=>x.id!==id); commit("lists"); },
  clearChecked(){ const l=find(S.lists.items,ui.listId); l.items=l.items.filter(x=>!x.done); commit("lists"); },
  delList(){ const l=find(S.lists.items,ui.listId); if(l.items.length && !A.delList.armed){ A.delList.armed=true; toast("Press Delete list again to confirm."); setTimeout(()=>A.delList.armed=false,3000); return; } A.delList.armed=false; S.lists.items=S.lists.items.filter(x=>x.id!==ui.listId); ui.listId=null; commit("lists"); },
  toggleMs(id){ const [g,m]=id.split("|"); const goal=find(S.goals.items,g), ms=find(goal.milestones,m); ms.done=!ms.done; if(goal.milestones.every(x=>x.done)) toast("Goal complete."); commit("goals"); },
  msToTask(id){ const [g,m]=id.split("|"); const goal=find(S.goals.items,g), ms=find(goal.milestones,m); S.tasks.items.unshift({id:uid(), title:ms.text, area:goal.area, priority:2, goalId:goal.id, done:false, created:today()}); commit("tasks"); toast("Added to Tasks, linked to this goal."); },
  editG(id){ ui.modal={kind:"goal",id}; renderModal(); },
  delG(id){ S.goals.items=S.goals.items.filter(x=>x.id!==id); S.tasks.items.forEach(t=>{ if(t.goalId===id) t.goalId=null; }); ui.modal=null; save("tasks"); commit("goals"); },
  clearExamples(){ EXK.forEach(k=>{ const n=S[k].items.length; S[k].items=S[k].items.filter(x=>!x.ex); if(S[k].items.length!==n) save(k); }); render(); toast("Examples cleared."); },
  async pushOn(){ try{ await store.push.enable(); toast("Notifications on for this device."); }catch(e){ toast(e && e.message || "Couldn't turn on notifications."); } await refreshPush(); render(); },
  async pushOff(){ try{ await store.push.disable(); }catch(e){} await refreshPush(); render(); },
  async pushTest(){ try{ await store.push.test(); }catch(e){ toast("Couldn't show a test notification."); } },
  exportData(){ if(store && store.download){ try{ store.download("soart-backup-"+today()+".json", JSON.stringify(S,null,1)); return; }catch(e){} } ui.modal={kind:"export"}; renderModal(); },
  async copyExport(){ try{ await navigator.clipboard.writeText(JSON.stringify(S)); toast("Copied."); }catch(e){ const t=$("#expText"); t.select(); toast("Press Ctrl/Cmd+C to copy."); } },
  async signOut(){ if(store && store.signOut) await store.signOut(); },
  delCal(id){ S.settings.calendars=(S.settings.calendars||[]).filter(c=>c.id!==id); commit("settings"); toast("Calendar removed. Its events clear at the next sync."); },
  schoolTab(id){ ui.schoolTab=id; render(); },
  startTerm(){ ensureTerm(); commit("grades"); },
  finishTerm(){ const t=curTerm(); if(!t) return; if(!A.finishTerm.armed){ A.finishTerm.armed=true; toast("Press again to lock in final grades for "+t.name+"."); setTimeout(()=>A.finishTerm.armed=false,3500); return; } A.finishTerm.armed=false;
    t.courses.forEach(c=>{ if(!c.letter) c.letter = letterOf(courseCalc(c).pct)==="—" ? "" : letterOf(courseCalc(c).pct); }); t.current=false; commit("grades"); ui.schoolTab="transcript"; render(); toast(t.name+" moved to your transcript."); },
  delGrade(id){ const [tid,cid,gid]=id.split("|"); const c=find(find(S.grades.terms,tid).courses,cid); c.items=c.items.filter(x=>x.id!==gid); commit("grades"); },
  editCourse(id){ ui.modal={kind:"course", id}; renderModal(); },
  delCourseGrades(id){ const [tid,cid]=id.split("|"); const t=find(S.grades.terms,tid); t.courses=t.courses.filter(x=>x.id!==cid); ui.modal=null; commit("grades"); },
  delTxCourse(id){ const [tid,cid]=id.split("|"); const t=find(S.grades.terms,tid); t.courses=t.courses.filter(x=>x.id!==cid); commit("grades"); },
  delTerm(id){ if(!A.delTerm.armed){ A.delTerm.armed=true; toast("Press Delete term again to confirm."); setTimeout(()=>A.delTerm.armed=false,3000); return; } A.delTerm.armed=false; S.grades.terms=S.grades.terms.filter(x=>x.id!==id); commit("grades"); },
  delChart(id){ S.charts.items=S.charts.items.filter(x=>x.id!==id); commit("charts"); },
  undoSort(){ if(ui.sorting && ui.sorting.undo){ ui.sorting.undo(); ui.sorting=null; render(); toast("Undone."); } },
  closeDesk(){ ui.sorting=null; renderDesk(); },
  inboxSort(id){ const it=find(S.inbox.items,id); if(!it) return; S.inbox.items=S.inbox.items.filter(x=>x.id!==id); save("inbox"); render(); sortIntake({text:it.text}); },
  closeModal(){ ui.modal=null; renderModal(); },
  backdrop(id,ev){ if(ev.target.classList.contains("modal-back")){ ui.modal=null; renderModal(); } }
};
const F = {
  addTop(f){ if(top3Full()) return toast("Top 3 is full."); S.tasks.items.unshift({id:uid(), title:f.title, area:"Life", priority:2, today:true, done:false, created:today()}); commit("tasks"); },
  addTask(f){ S.tasks.items.unshift({id:uid(), title:f.title, area:f.area, due:f.due||null, priority:+f.priority, done:false, created:today()}); commit("tasks"); },
  saveT(f){ const t = find(S.tasks.items, ui.modal.id); Object.assign(t,{title:f.title, area:f.area, due:f.due||null, priority:+f.priority, goalId:f.goalId||null}); ui.modal=null; commit("tasks"); },
  addA(f){ S.school.items.push({id:uid(), title:f.title, course:f.course, type:f.type, due:f.due, done:false}); commit("school"); toast("Added. It shows on Today and the calendar."); },
  saveA(f){ const a = find(S.school.items, ui.modal.id); Object.assign(a,{title:f.title, course:f.course, type:f.type, due:f.due}); ui.modal=null; commit("school"); },
  addCourse(f){ const n=f.name.trim(); if(!S.school.courses.includes(n)) S.school.courses.push(n); ui.course=n; commit("school"); },
  addEv(f){ const base={title:f.title, start:f.start||"", end:f.end||"", cat:f.cat};
    if(f.repeat==="1"){ const series=uid(); const [y,mo]=f.date.split("-").map(Number); const endD = mo<=5 ? `${y}-05-15` : mo<=7 ? `${y}-08-10` : `${y}-12-15`; for(let d=f.date; d<=endD; d=addDays(d,7)) S.events.items.push(Object.assign({id:uid(), date:d, series}, base)); toast("Added weekly through "+fmtD(endD)+"."); }
    else S.events.items.push(Object.assign({id:uid(), date:f.date}, base));
    ui.calSel=f.date; commit("events"); },
  addSet(f){ const n = Math.max(1, +f.sets||1); const prev = prSeries(f.exercise); const bestPrev = prev.length? Math.max(...prev.map(p=>p.v)) : 0;
    S.fitness.items.push({id:uid(), date:f.date||today(), exercise:f.exercise, weight:+f.weight, reps:+f.reps, sets:n, t:Date.now()}); ui.exercise=f.exercise;
    if(prev.length && Math.round(e1rm(+f.weight,+f.reps))>bestPrev) toast("New PR on "+f.exercise+"."); commit("fitness"); },
  addEx(f){ const n=f.name.trim(); if(!S.fitness.exercises.includes(n)) S.fitness.exercises.push(n); ui.exercise=n; commit("fitness"); },
  addTx(f){ const amt = Math.abs(+f.amount) * (f.kind==="inc"?1:-1); S.money.items.push({id:uid(), date:f.date||today(), desc:f.desc, amount:Math.round(amt*100)/100, cat:f.cat}); ui.moneyMonth=(f.date||today()).slice(0,7); commit("money"); },
  saveBudgets(f){ const b={}; EXP_CATS.forEach(c=>{ if(f[c]!=="" && +f[c]>0) b[c]=+f[c]; }); S.money.budgets=b; ui.modal=null; commit("money"); },
  addList(f){ const l={id:uid(), name:f.name, kind:f.kind, items:[]}; S.lists.items.push(l); ui.listId=l.id; commit("lists"); },
  addItem(f){ const l=find(S.lists.items,ui.listId); l.items.push({id:uid(), text:f.text, price:f.price?+f.price:null, link:f.link||"", done:false}); commit("lists"); setTimeout(()=>{ const x=$('[data-form="addItem"] input[name=text]'); if(x) x.focus(); }); },
  addGoal(f){ S.goals.items.push({id:uid(), title:f.title, horizon:f.horizon, area:f.area, target:f.target||null, why:f.why, milestones:(f.ms||"").split("\n").map(s=>s.trim()).filter(Boolean).map(text=>({id:uid(), text, done:false})), created:today()}); commit("goals"); toast("Goal saved. Turn a milestone into a task to start."); },
  addMs(f,form){ const g=find(S.goals.items, form.dataset.id); g.milestones=g.milestones||[]; g.milestones.push({id:uid(), text:f.text, done:false}); commit("goals"); },
  saveG(f){ const g=find(S.goals.items, ui.modal.id); Object.assign(g,{title:f.title, horizon:f.horizon, target:f.target||null, why:f.why}); ui.modal=null; commit("goals"); },
  addCal(f){ let url=f.url.trim().replace(/^webcals?:\/\//i,"https://"); if(!/^https?:\/\//i.test(url)) return toast("Paste the full link, starting with https:// or webcal://");
    S.settings.calendars=[...(S.settings.calendars||[]), {id:uid(), name:f.name, url, kind:f.kind}]; commit("settings"); toast("Linked. Events appear within the hour."); },
  addGrade(f,form){ const [tid,cid]=form.dataset.id.split("|"); const c=find(find(S.grades.terms,tid).courses,cid); c.items.push({id:uid(), name:f.name, cat:f.cat||"", score:+f.score, possible:+f.possible, date:today()}); commit("grades"); },
  addGradeCourse(f){ const t=ensureTerm(); ensureCourse(t, f.name.trim()); commit("grades"); },
  saveCourse(f){ const [tid,cid]=ui.modal.id.split("|"); const c=find(find(S.grades.terms,tid).courses,cid);
    const w=(f.weights||"").split("\n").map(l=>l.trim()).filter(Boolean).map(l=>{ const m=l.match(/^(.*?)[,:\s]+(\d+(?:\.\d+)?)\s*%?$/); return m?{id:uid(), name:m[1].trim(), pct:+m[2]}:null; }).filter(Boolean);
    const tot=w.reduce((s,x)=>s+x.pct,0); if(w.length && Math.abs(tot-100)>0.5) toast("Heads up: weights add to "+tot+"%, not 100%.");
    Object.assign(c,{name:f.name||c.name, code:f.code, credits:+f.credits||0, weights:w}); ui.modal=null; commit("grades"); },
  addTxCourse(f,form){ const t=find(S.grades.terms,form.dataset.id); t.courses.push({id:uid(), code:f.code, name:f.name, credits:+f.credits||0, letter:f.letter, weights:[], items:[]}); commit("grades"); },
  addPastTerm(f){ S.grades.terms=[{id:uid(), name:f.name, current:false, courses:[]}, ...(S.grades.terms||[])]; commit("grades"); },
  askChart(f){ askChart(f.q); },
  buildChart(f){ S.charts.items=[{id:uid(), title:f.title, type:f.type, source:f.source, op:f.op, field:f.op==="count"?"count":f.field, x:f.x, bucket:f.bucket, split:f.split, days:+f.days||0, filter:[]}, ...(S.charts.items||[])]; commit("charts"); },
  async saveAiKey(f){ try{ await store.ai.setKey(f.key.trim()); toast(f.key.trim()?"Claude is on.":"Key removed."); }catch(e){ toast("Couldn't save the key."); } render(); },
  saveNotify(f){ S.settings.digestHour=+f.digestHour; S.settings.alerts=f.alerts==="1"; S.settings.tz=Intl.DateTimeFormat().resolvedOptions().timeZone; commit("settings"); toast("Saved."); }
};

function bindEvents(){
  document.addEventListener("click", ev => {
    const el = ev.target.closest("[data-act]"); if(!el) return;
    const fn = A[el.dataset.act]; if(!fn) return;
    if(el.dataset.act!=="backdrop") ev.preventDefault();
    fn(el.dataset.id, ev);
  });
  document.addEventListener("submit", ev => {
    ev.preventDefault();
    const form = ev.target;
    if(form.id==="capture"){ const inp=$("#captureInput"), v=inp.value.trim(); if(!v) return; inp.value="";
      if(aiReady() && S.settings.autoSort!==false) sortIntake({text:v}); else { S.inbox.items.unshift({id:uid(), text:v, created:today()}); save("inbox"); render(); toast("Captured to Inbox."); } return; }
    const fn = F[form.dataset.form]; if(!fn) return;
    const data = {}; new FormData(form).forEach((v,k)=>data[k]=typeof v==="string"?v.trim():v);
    fn(data, form);
  });
  document.addEventListener("change", async ev => {
    const k = ev.target.dataset && ev.target.dataset.change;
    if(k==="attach" && ev.target.files.length){ const files=[...ev.target.files]; ev.target.value=""; sortIntake({files}); return; }
    if(k==="chartSrc"){ ui.chartSrc = ev.target.value; const keepT = ($("#bcT")||{}).value; render(); const tt=$("#bcT"); if(tt&&keepT) tt.value=keepT; const det=document.querySelector("details.card"); if(det) det.open=true; return; }
    if(k==="moneyMonth" && ev.target.value){ ui.moneyMonth=ev.target.value; render(); }
    if(k==="txKind"){ $("#xCat").innerHTML=(ev.target.value==="inc"?INC_CATS:EXP_CATS).map(c=>`<option>${c}</option>`).join(""); }
    if(k==="import" && ev.target.files[0]){
      try{ const data = JSON.parse(await ev.target.files[0].text()); let n=0;
        Object.keys(SECTIONS).forEach(key=>{ if(data[key] && typeof data[key]==="object"){ S[key]=Object.assign(clone(SECTIONS[key]), data[key]); save(key); n++; } });
        render(); toast(n ? "Backup restored." : "That file isn't a Soart backup."); }
      catch(e){ toast("That file isn't a Soart backup."); }
    }
  });
  document.addEventListener("keydown", ev => {
    if(ev.key==="Escape" && ui.modal){ ui.modal=null; renderModal(); }
    if(ev.key==="/" && !/INPUT|TEXTAREA|SELECT/.test(document.activeElement.tagName)){ ev.preventDefault(); $("#captureInput").focus(); }
  });
  document.addEventListener("visibilitychange", ()=>{ if(!document.hidden && !ui.modal) render(); });
  window.addEventListener("hashchange", route);
  let dragDepth = 0;
  const hasFiles = ev => ev.dataTransfer && [...ev.dataTransfer.types].includes("Files");
  document.addEventListener("dragenter", ev => { if(!hasFiles(ev)) return; dragDepth++; $("#dropOverlay").hidden=false; });
  document.addEventListener("dragleave", ev => { if(!hasFiles(ev)) return; dragDepth=Math.max(0,dragDepth-1); if(!dragDepth) $("#dropOverlay").hidden=true; });
  document.addEventListener("dragover", ev => { if(hasFiles(ev)) ev.preventDefault(); });
  document.addEventListener("drop", ev => { if(!hasFiles(ev)) return; ev.preventDefault(); dragDepth=0; $("#dropOverlay").hidden=true; const files=[...ev.dataTransfer.files]; if(files.length) sortIntake({files}); });
  document.addEventListener("paste", ev => { const files=[...(ev.clipboardData&&ev.clipboardData.files||[])].filter(f=>/^image\//.test(f.type)); if(!files.length) return; ev.preventDefault(); const note=($("#captureInput")||{}).value||""; if(note) $("#captureInput").value=""; sortIntake({files, text:note.trim()}); });
}

const SHELL = `<div class="app">
  <nav class="rail" id="rail" aria-label="Sections"></nav>
  <main>
    <form class="capture" id="capture" autocomplete="off">
      <div class="in"><label for="captureInput" class="sr">Capture</label><input id="captureInput" type="text" placeholder="Type, paste or drop anything. Soart sorts it."><span class="kbd">/</span></div>
      <label class="btn attach" for="attachIn" title="Attach screenshots or files">${i("clip")}<span class="sr">Attach files</span></label><input id="attachIn" type="file" multiple accept="image/*,application/pdf,.txt,.csv,.md,.ics" class="sr" data-change="attach">
      <button class="btn primary" type="submit">Capture</button>
      <a class="gear" href="#settings" id="gear" aria-label="Settings">${i("settings")}</a>
    </form>
    <div id="desk" class="deskwrap" aria-live="polite"></div>
    <div id="view" class="view"></div>
  </main>
</div><div id="modalRoot"></div><div id="toastRoot"></div><div id="dropOverlay" class="drop-overlay" hidden><div>${i("clip")}<strong>Drop to sort into Soart</strong><span>Screenshots, PDFs, syllabi, receipts, notes</span></div></div>`;

let bound = false;
window.Soart = {
  toast, refresh: () => { if(!ui.modal) render(); },
  start(adapter){
    store = adapter; loaded = false; failed = false;
    Object.keys(SECTIONS).forEach(k => { S[k] = clone(SECTIONS[k]); const v = lsGet(k); if(v) S[k] = Object.assign(clone(SECTIONS[k]), v); });
    $("#root").innerHTML = SHELL;
    if(!bound){ bindEvents(); bound = true; }
    route();
    if(store && store.connect){
      store.connect(
        (key, data) => { if(applyRemote(key, data) && !ui.modal) render(); },
        () => { loaded = true;
          const tz = Intl.DateTimeFormat().resolvedOptions().timeZone;
          if(store.write && S.settings.tz !== tz){ S.settings.tz = tz; save("settings"); }
          setSync(); },
        () => { failed = true; setSync(); }
      );
    } else { loaded = true; setSync(); }
  }
};
})();
