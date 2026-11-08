// Fetch linked calendar feeds (.ics) and turn them into simple day/time events in the user's time zone.
import ical from "node-ical";

function parts(d, tz) {
  const p = Object.fromEntries(new Intl.DateTimeFormat("en-CA", { timeZone: tz, year: "numeric", month: "2-digit", day: "2-digit", hour: "2-digit", minute: "2-digit", hourCycle: "h23" })
    .formatToParts(d).map(x => [x.type, x.value]));
  return { date: `${p.year}-${p.month}-${p.day}`, time: `${p.hour}:${p.minute}` };
}
const dow = s => new Date(s + "T00:00:00Z").getUTCDay();
const addMin = (t, m) => { if (!t) return ""; let x = (+t.slice(0, 2)) * 60 + (+t.slice(3, 5)) + Math.round(m); x = Math.min(x, 23 * 60 + 59); return String(Math.floor(x / 60)).padStart(2, "0") + ":" + String(x % 60).padStart(2, "0"); };
const keyDates = obj => obj ? Object.keys(obj).map(k => k.slice(0, 10)) : [];

function single(ev, tz) {
  const allDay = ev.datetype === "date";
  const s = allDay ? parts(ev.start, "UTC") : parts(ev.start, tz);
  const e = ev.end ? (allDay ? null : parts(ev.end, tz)) : null;
  return { date: s.date, start: allDay ? "" : s.time, end: e && e.date === s.date ? e.time : "" };
}

export async function fetchCalendar(url, tz, from, to) {
  const data = await ical.async.fromURL(url);
  const out = [];
  for (const ev of Object.values(data)) {
    if (!ev || ev.type !== "VEVENT" || !ev.start || ev.status === "CANCELLED") continue;
    const title = String(ev.summary && ev.summary.val || ev.summary || "Untitled").trim();
    const uid = String(ev.uid || title);
    const allDay = ev.datetype === "date";
    if (ev.rrule) {
      const base = single(ev, tz), baseDow = dow(base.date);
      const durMin = ev.end ? (ev.end - ev.start) / 60000 : 0;
      const ex = new Set(keyDates(ev.exdate));
      const moved = ev.recurrences || {};
      let occ = [];
      try { occ = ev.rrule.between(from, to, true); } catch (e) { occ = []; }
      for (const r of occ.slice(0, 400)) {
        // rrule may hand back "floating" times; pick the date that keeps the original weekday.
        const a = parts(r, "UTC").date, b = parts(r, tz).date;
        const date = allDay ? a : (dow(b) === baseDow || dow(a) !== baseDow ? b : a);
        if (ex.has(date)) continue;
        const ovKey = Object.keys(moved).find(k => k.slice(0, 10) === date);
        if (ovKey) { const o = moved[ovKey]; if (o.status !== "CANCELLED") out.push({ uid: uid + "@" + date, title: String(o.summary || title), ...single(o, tz) }); continue; }
        out.push({ uid: uid + "@" + date, title, date, start: base.start, end: allDay ? "" : addMin(base.start, durMin) });
      }
    } else {
      if (ev.end ? ev.end < from : ev.start < from) continue;
      if (ev.start > to) continue;
      out.push({ uid, title, ...single(ev, tz) });
    }
  }
  return out.sort((x, y) => (x.date + x.start).localeCompare(y.date + y.start));
}
