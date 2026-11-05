/* VidaMayor — script.js
   App para acompañar a adultos mayores (medicinas, citas, familia, emergencia y ubicación).
   Funciona dentro de Capacitor (el APK) y también en el navegador para probarla.
   Los datos se guardan SOLO en el teléfono (localStorage). Lo que es demostración está marcado en pantalla. */
(() => {
'use strict';

/* ═══════════════════════════════════════════════════════════
   1. Utilidades
   ═══════════════════════════════════════════════════════════ */
const $ = (sel, root = document) => root.querySelector(sel);
const esc = (s) => String(s ?? '').replace(/[&<>"']/g, (c) => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c]));
const uid = () => Math.random().toString(36).slice(2, 9) + Date.now().toString(36).slice(-3);
const pad = (n) => String(n).padStart(2, '0');
const dstr = (d = new Date()) => `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}`;
const parseDate = (s) => { const [y, m, d] = s.split('-').map(Number); return new Date(y, m - 1, d); };
const at = (date, time) => { const [y, m, d] = date.split('-').map(Number); const [h, mi] = time.split(':').map(Number); return new Date(y, m - 1, d, h, mi, 0, 0); };
const addDays = (d, n) => { const x = new Date(d); x.setDate(x.getDate() + n); return x; };
const hhmm = (d = new Date()) => `${pad(d.getHours())}:${pad(d.getMinutes())}`;
const t12 = (time) => { const [h, m] = time.split(':').map(Number); return `${h % 12 || 12}:${pad(m)} ${h >= 12 ? 'p. m.' : 'a. m.'}`; };
const cap = (s) => s.charAt(0).toUpperCase() + s.slice(1);
const fmt = (d, o) => new Intl.DateTimeFormat('es-MX', o).format(d);
const hash = (s) => { let h = 2166136261; for (let i = 0; i < s.length; i++) { h ^= s.charCodeAt(i); h = Math.imul(h, 16777619); } return h >>> 0; };
const digits = (p) => String(p || '').replace(/[^\d+]/g, '');
const firstName = (n) => String(n || '').trim().split(/\s+/)[0] || '';
const byTime = (a, b) => a.time.localeCompare(b.time);

/** "en 2 h 10 min" / "hace 15 min" */
function rel(ms) {
  const mins = Math.round(Math.abs(ms) / 60000);
  if (mins < 1) return 'ahora';
  let txt;
  if (mins < 60) txt = `${mins} min`;
  else if (mins < 1440) { const h = Math.floor(mins / 60), m = mins % 60; txt = m ? `${h} h ${m} min` : `${h} h`; }
  else { const d = Math.round(mins / 1440); txt = d === 1 ? '1 día' : `${d} días`; }
  return ms >= 0 ? `en ${txt}` : `hace ${txt}`;
}
function dayLabel(ds) {
  const t = dstr();
  if (ds === t) return 'Hoy';
  if (ds === dstr(addDays(new Date(), 1))) return 'Mañana';
  return cap(fmt(parseDate(ds), { weekday: 'long', day: 'numeric', month: 'long' }));
}
function setPath(obj, path, value) {
  const keys = path.split('.');
  const last = keys.pop();
  const target = keys.reduce((o, k) => (o[k] ??= {}), obj);
  target[last] = value;
}

/* ═══════════════════════════════════════════════════════════
   2. Íconos (SVG propios, se ven igual en todos los teléfonos)
   ═══════════════════════════════════════════════════════════ */
const ICONS = {
  home: '<path d="M3 11.5 12 4l9 7.5"/><path d="M5.5 10v10h5v-6h3v6h5V10"/>',
  calendar: '<rect x="3.5" y="5" width="17" height="15.5" rx="3"/><path d="M8 3v4M16 3v4M3.5 10h17"/>',
  pill: '<g transform="rotate(-45 12 12)"><rect x="2.5" y="7.5" width="19" height="9" rx="4.5"/><path d="M12 7.5v9"/></g>',
  users: '<circle cx="9" cy="8.5" r="3.5"/><path d="M2.5 20c0-3.5 2.9-5.8 6.5-5.8s6.5 2.3 6.5 5.8"/><circle cx="17.2" cy="9.3" r="2.6"/><path d="M17.3 14.4c2.5.2 4.2 2 4.2 4.8"/>',
  alert: '<path d="M12 3.5 21.5 20h-19L12 3.5z"/><path d="M12 10v4.5M12 17.4v.1"/>',
  pin: '<path d="M12 21s6.8-5.9 6.8-11.2A6.8 6.8 0 0 0 5.2 9.8C5.2 15.1 12 21 12 21z"/><circle cx="12" cy="9.8" r="2.4"/>',
  user: '<circle cx="12" cy="8" r="4"/><path d="M4 21c0-4.2 3.6-6.8 8-6.8s8 2.6 8 6.8"/>',
  bell: '<path d="M6 16v-5a6 6 0 0 1 12 0v5l2 2H4l2-2z"/><path d="M10 21h4"/>',
  phone: '<path d="M5 3h4l2 5-2.5 1.5a11 11 0 0 0 6 6L16 13l5 2v4a2 2 0 0 1-2 2A16 16 0 0 1 3 5a2 2 0 0 1 2-2z"/>',
  check: '<path d="M5 12.5l4.5 4.5L19 7"/>',
  plus: '<path d="M12 5v14M5 12h14"/>',
  chevL: '<path d="M15 5l-7 7 7 7"/>',
  chevR: '<path d="M9 5l7 7-7 7"/>',
  edit: '<path d="M4 20h4L19 9a2.8 2.8 0 0 0-4-4L4 16v4z"/>',
  trash: '<path d="M4 7h16M9 7V4h6v3M6 7l1 13h10l1-13"/>',
  shield: '<path d="M12 3l8 3v6c0 5-3.4 8-8 9-4.6-1-8-4-8-9V6l8-3z"/><path d="M9 12l2.2 2.2L15.5 10"/>',
  msg: '<path d="M4 5h16a1 1 0 0 1 1 1v10a1 1 0 0 1-1 1H9l-5 4V6a1 1 0 0 1 1-1z"/>',
  eye: '<path d="M2 12s3.6-7 10-7 10 7 10 7-3.6 7-10 7S2 12 2 12z"/><circle cx="12" cy="12" r="3"/>',
  logout: '<path d="M9 4H5a1 1 0 0 0-1 1v14a1 1 0 0 0 1 1h4M16 8l4 4-4 4M20 12H9"/>',
  camera: '<path d="M4 8h3l2-3h6l2 3h3a1 1 0 0 1 1 1v10a1 1 0 0 1-1 1H4a1 1 0 0 1-1-1V9a1 1 0 0 1 1-1z"/><circle cx="12" cy="13.5" r="3.5"/>',
  lock: '<rect x="5" y="11" width="14" height="10" rx="2"/><path d="M8 11V8a4 4 0 0 1 8 0v3"/>',
  clock: '<circle cx="12" cy="12" r="9"/><path d="M12 7v5l3 2"/>',
  info: '<circle cx="12" cy="12" r="9"/><path d="M12 11v5M12 8v.1"/>',
  heart: '<path d="M12 21.35l-1.45-1.32C5.4 15.36 2 12.28 2 8.5 2 5.42 4.42 3 7.5 3c1.74 0 3.41.81 4.5 2.09C13.09 3.81 14.76 3 16.5 3 19.58 3 22 5.42 22 8.5c0 3.78-3.4 6.86-8.55 11.54L12 21.35z"/>',
  map: '<path d="M9 4 3 6.5v14L9 18l6 2.5 6-2.5v-14L15 6.5 9 4z"/><path d="M9 4v14M15 6.5v14"/>',
};
const I = (name, cls = '') => `<svg class="ico ${cls}" viewBox="0 0 24 24" aria-hidden="true" focusable="false">${ICONS[name] || ''}</svg>`;
const LOGO = '<svg viewBox="0 0 24 24" aria-hidden="true"><rect width="24" height="24" rx="7" fill="#2E7D74"/><g transform="translate(4.6 4.6) scale(.617)"><path fill="#fff" d="M12 21.35l-1.45-1.32C5.4 15.36 2 12.28 2 8.5 2 5.42 4.42 3 7.5 3c1.74 0 3.41.81 4.5 2.09C13.09 3.81 14.76 3 16.5 3 19.58 3 22 5.42 22 8.5c0 3.78-3.4 6.86-8.55 11.54L12 21.35z"/><path d="M12 6.8v6M9 9.8h6" stroke="#2E7D74" stroke-width="1.9" stroke-linecap="round" fill="none"/></g></svg>';

/* ═══════════════════════════════════════════════════════════
   3. Datos (se guardan en el teléfono)
   ═══════════════════════════════════════════════════════════ */
const KEY = 'vidamayor:v1';
const TYPES = {
  cita: { label: 'Cita médica', art: 'una cita médica', icon: 'calendar', tone: '' },
  actividad: { label: 'Actividad', art: 'una actividad', icon: 'users', tone: 'lav' },
  recordatorio: { label: 'Recordatorio', art: 'un recordatorio', icon: 'bell', tone: 'warn' },
};

function defaults() {
  return {
    v: 1, onboarded: false, loggedOut: false,
    profile: { name: '', age: '', phone: '', photo: '', doctorName: '', doctorPhone: '', medicalInfo: '' },
    settings: {
      size: 'normal',
      notif: { enabled: false, followUp: true },
      privacy: { meds: true, appts: true, location: false },
    },
    meds: [],       // { id, name, dose, time:'08:00', notes }
    log: {},        // { '2026-11-05': { medId: '08:05' } }  -> medicinas confirmadas
    appts: [],      // { id, type, title, place, date:'2026-11-05', time:'16:00' }
    family: [],     // { id, name, relation, phone, photo, authorized }
    location: null, // { lat, lng, acc, at }
    alerts: [],     // { id, at, loc, resolvedAt, notified:[ids] }
  };
}
function merge(base, saved) {
  if (!saved || typeof saved !== 'object') return base;
  for (const k of Object.keys(base)) {
    const b = base[k], s = saved[k];
    if (s === undefined) continue;
    base[k] = (b && typeof b === 'object' && !Array.isArray(b) && s && typeof s === 'object') ? merge(b, s) : s;
  }
  return base;
}
let memoryOnly = null; // si el teléfono no deja guardar, se usa memoria
function load() {
  try {
    const raw = localStorage.getItem(KEY);
    if (raw) return merge(defaults(), JSON.parse(raw));
  } catch (e) { /* sin almacenamiento */ }
  return memoryOnly ? merge(defaults(), memoryOnly) : defaults();
}
let state = load();
function save() {
  try { localStorage.setItem(KEY, JSON.stringify(state)); } catch (e) { memoryOnly = JSON.parse(JSON.stringify(state)); }
  scheduleReminders();
}
function seedDemo(name) {
  const now = new Date();
  const d = (n) => dstr(addDays(now, n));
  state.profile.name = name || 'María';
  state.profile.age = '72';
  state.profile.doctorName = 'Dra. Ramírez';
  state.profile.doctorPhone = '55 0000 0003';
  state.meds = [
    { id: uid(), name: 'Losartán', dose: '1 tableta de 50 mg', time: '08:00', notes: 'Después del desayuno' },
    { id: uid(), name: 'Metformina', dose: '1 tableta', time: '12:00', notes: 'Con la comida' },
    { id: uid(), name: 'Vitamina D', dose: '1 cápsula', time: '20:00', notes: '' },
  ];
  state.appts = [
    { id: uid(), type: 'cita', title: 'Consulta con la Dra. Ramírez', place: 'Clínica Santa María', date: d(0), time: '16:00' },
    { id: uid(), type: 'recordatorio', title: 'Llevar estudios de laboratorio', place: '', date: d(1), time: '09:00' },
    { id: uid(), type: 'cita', title: 'Análisis de laboratorio', place: 'Laboratorio Central', date: d(3), time: '10:30' },
    { id: uid(), type: 'actividad', title: 'Caminata con las vecinas', place: 'Parque del barrio', date: d(6), time: '17:00' },
  ];
  state.family = [
    { id: uid(), name: 'Carlos Hernández', relation: 'Hijo', phone: '55 0000 0001', photo: '', authorized: true },
    { id: uid(), name: 'Laura Hernández', relation: 'Hija', phone: '55 0000 0002', photo: '', authorized: true },
    { id: uid(), name: 'Rosa Medina', relation: 'Vecina', phone: '55 0000 0004', photo: '', authorized: false },
  ];
  // Para que el panel familiar se vea con vida: si ya pasaron las 8, la primera medicina está confirmada
  if (now.getHours() >= 8) state.log[d(0)] = { [state.meds[0].id]: '08:05' };
}

/* ── Consultas sobre los datos ── */
const medById = (id) => state.meds.find((m) => m.id === id);
const isTaken = (medId, date = dstr()) => !!(state.log[date] && state.log[date][medId]);
const activeAlert = () => state.alerts.find((a) => !a.resolvedAt);
const authorizedFamily = () => state.family.filter((f) => f.authorized);
const apptsOn = (date) => state.appts.filter((a) => a.date === date).sort(byTime);
function upcomingAppts(now = new Date()) {
  return state.appts.map((a) => ({ ...a, when: at(a.date, a.time) })).filter((a) => a.when >= now).sort((a, b) => a.when - b.when);
}
/** Estado de una medicina HOY: taken | late (pasaron más de 30 min) | due (es la hora) | soon (más tarde) */
function medStatus(m, now = new Date()) {
  const today = dstr(now);
  const due = at(today, m.time);
  if (isTaken(m.id, today)) return { key: 'taken', takenAt: state.log[today][m.id], due };
  const diff = now - due;
  if (diff > 30 * 60000) return { key: 'late', due };
  if (diff >= 0) return { key: 'due', due };
  return { key: 'soon', due };
}

/* ═══════════════════════════════════════════════════════════
   4. Estado de la pantalla
   ═══════════════════════════════════════════════════════════ */
const MAIN = ['inicio', 'agenda', 'medicinas', 'familia', 'emergencia'];
const now0 = new Date();
const ui = {
  view: 'inicio', prev: 'inicio',
  cal: { y: now0.getFullYear(), m: now0.getMonth() },
  selDay: dstr(now0),
  mode: 'adulto',   // 'adulto' | 'familiar' (vista de familiar, simulada)
  asId: '',
  fired: new Set(),
};

/* ═══════════════════════════════════════════════════════════
   5. Funciones del teléfono (Capacitor) con respaldo para el navegador
   ═══════════════════════════════════════════════════════════ */
const Cap = window.Capacitor;
const isNative = !!(Cap && typeof Cap.isNativePlatform === 'function' && Cap.isNativePlatform());
const P = (Cap && Cap.Plugins) || {};
/** Plugin nativo por nombre. En el APK, Capacitor deja los plugins instalados en Capacitor.Plugins;
    si alguna versión no lo hiciera, se pide con registerPlugin. En el navegador devuelve null. */
const plug = (name) => {
  if (!isNative) return null;
  try { return P[name] || (typeof Cap.registerPlugin === 'function' ? Cap.registerPlugin(name) : null); } catch (e) { return null; }
};
const CHANNEL = 'vidamayor-recordatorios';

async function getPosition() {
  const G = plug('Geolocation');
  if (isNative && G) {
    let perm = await G.checkPermissions();
    if (perm.location !== 'granted' && perm.coarseLocation !== 'granted') perm = await G.requestPermissions({ permissions: ['location'] });
    if (perm.location !== 'granted' && perm.coarseLocation !== 'granted') throw Object.assign(new Error('permiso'), { code: 1 });
    const pos = await G.getCurrentPosition({ enableHighAccuracy: true, timeout: 15000 });
    return { lat: pos.coords.latitude, lng: pos.coords.longitude, acc: Math.round(pos.coords.accuracy || 0), at: new Date().toISOString() };
  }
  return new Promise((ok, no) => {
    if (!navigator.geolocation) return no(Object.assign(new Error('sin-gps'), { code: 2 }));
    navigator.geolocation.getCurrentPosition(
      (p) => ok({ lat: p.coords.latitude, lng: p.coords.longitude, acc: Math.round(p.coords.accuracy || 0), at: new Date().toISOString() }),
      (e) => no(e),
      { enableHighAccuracy: true, timeout: 15000, maximumAge: 60000 }
    );
  });
}
const geoMsg = (e) => (e && (e.code === 1 || /permiso|denied/i.test(e.message || ''))
  ? 'No diste permiso de ubicación. Puedes activarlo en los ajustes del teléfono.'
  : 'No pude obtener tu ubicación. Revisa que el GPS esté encendido e intenta de nuevo.');

/** Pide permiso para avisos. Devuelve { ok, msg } */
async function enableNotifications() {
  const LN = plug('LocalNotifications');
  if (isNative && LN) {
    let st = await LN.checkPermissions();
    if (st.display !== 'granted') st = await LN.requestPermissions();
    if (st.display !== 'granted') return { ok: false, msg: 'No diste permiso para los avisos. Actívalo en los ajustes del teléfono.' };
    try { await LN.createChannel({ id: CHANNEL, name: 'Recordatorios', description: 'Medicinas y citas', importance: 5, visibility: 1, vibration: true }); } catch (e) { /* ya existe */ }
    try {
      const ex = await LN.checkExactNotificationSetting();
      if (ex && ex.exact_alarm === 'denied') {
        const si = await ask({ title: 'Avisos puntuales', text: 'Para que los avisos lleguen justo a la hora, activa "Alarmas y recordatorios" para VidaMayor en la siguiente pantalla.', ok: 'Abrir ajustes', cancel: 'Ahora no' });
        if (si) await LN.changeExactNotificationSetting();
      }
    } catch (e) { /* versiones antiguas de Android */ }
    return { ok: true };
  }
  if ('Notification' in window) {
    const r = await Notification.requestPermission();
    return r === 'granted' ? { ok: true } : { ok: false, msg: 'El navegador no dio permiso para los avisos.' };
  }
  return { ok: false, msg: 'Este dispositivo no permite avisos.' };
}
function webNotify(title, body) {
  if (isNative || !('Notification' in window) || Notification.permission !== 'granted' || !state.settings.notif.enabled) return;
  try { new Notification(title, { body }); } catch (e) { /* ignorar */ }
}

/** Arma los avisos de los próximos 7 días (medicinas) y 30 días (citas) */
function buildSchedule(now = new Date()) {
  const out = [];
  const push = (key, when, title, body, type) => {
    if (when <= now) return;
    out.push({ id: hash(key) & 0x7fffffff, title, body, schedule: { at: when, allowWhileIdle: true }, channelId: CHANNEL, smallIcon: 'ic_stat_vidamayor', iconColor: '#2E7D74', extra: { type } });
  };
  for (let n = 0; n < 7; n++) {
    const date = dstr(addDays(now, n));
    const slots = {};
    for (const m of state.meds) { if (isTaken(m.id, date)) continue; (slots[m.time] ||= []).push(m); }
    for (const [time, meds] of Object.entries(slots)) {
      const when = at(date, time);
      push(`med|${date}|${time}`, when, 'Hora de tomar tu medicina', meds.map((m) => m.name + (m.dose ? ` · ${m.dose}` : '')).join('\n'), 'med');
      if (state.settings.notif.followUp) {
        push(`medf|${date}|${time}`, new Date(when.getTime() + 30 * 60000), '¿Ya tomaste tu medicina?', `Aún no la confirmas: ${meds.map((m) => m.name).join(', ')}. Ábrela y presiona "Ya lo tomé".`, 'medf');
      }
    }
  }
  for (const a of state.appts) {
    const when = at(a.date, a.time);
    if (when - now > 30 * 86400000) continue;
    const lead = new Date(when.getTime() - 3600000);
    const body = t12(a.time) + (a.place ? ` · ${a.place}` : '');
    if (lead > now) push(`ap|${a.id}|1h`, lead, `En 1 hora: ${a.title}`, body, 'appt');
    else push(`ap|${a.id}|0`, when, `Es la hora: ${a.title}`, body, 'appt');
  }
  return out.slice(0, 150);
}
let schedTimer = null;
function scheduleReminders() { clearTimeout(schedTimer); schedTimer = setTimeout(syncNative, 400); }
async function syncNative() {
  const LN = plug('LocalNotifications');
  if (!isNative || !LN) return;
  try {
    const pend = await LN.getPending();
    if (pend && pend.notifications && pend.notifications.length) await LN.cancel({ notifications: pend.notifications.map((n) => ({ id: n.id })) });
    if (!state.settings.notif.enabled) return;
    const list = buildSchedule();
    if (list.length) await LN.schedule({ notifications: list });
  } catch (e) { console.warn('Avisos:', e); }
}
async function testNotification() {
  const title = 'Aviso de prueba', body = 'Así se verán tus recordatorios de VidaMayor.';
  const LN = plug('LocalNotifications');
  if (isNative && LN) {
    await LN.schedule({ notifications: [{ id: 999999, title, body, schedule: { at: new Date(Date.now() + 4000) }, channelId: CHANNEL, smallIcon: 'ic_stat_vidamayor', iconColor: '#2E7D74' }] });
    toast('Te llegará un aviso en unos segundos. Puedes salir de la app.', 'ok');
  } else {
    webNotify(title, body);
    toast('Aviso de prueba enviado.', 'ok');
  }
}
/** Mientras la app está abierta, avisa cuando llega la hora */
function tickDue() {
  if (!state.onboarded || state.loggedOut) return;
  const now = new Date(), today = dstr(now);
  let changed = false;
  for (const m of state.meds) {
    if (isTaken(m.id, today)) continue;
    const diff = now - at(today, m.time);
    const kDue = `${today}|${m.id}|due`, kLate = `${today}|${m.id}|late`;
    if (diff >= 0 && diff < 180000 && !ui.fired.has(kDue)) {
      ui.fired.add(kDue); changed = true;
      toast(`Hora de tomar ${m.name}`);
      webNotify('Hora de tomar tu medicina', m.name + (m.dose ? ` · ${m.dose}` : ''));
    }
    if (diff >= 1800000 && diff < 1980000 && !ui.fired.has(kLate) && state.settings.notif.followUp) {
      ui.fired.add(kLate); changed = true;
      toast(`Aún no confirmas ${m.name}`, 'err');
      webNotify('¿Ya tomaste tu medicina?', `Aún no confirmas ${m.name}.`);
    }
  }
  if (changed) refreshLive();
}

/* ═══════════════════════════════════════════════════════════
   6. Piezas de interfaz
   ═══════════════════════════════════════════════════════════ */
const PALETTE = [['#DDF0EC', '#22625B'], ['#ECE7F8', '#4B3F8C'], ['#FFEBDA', '#8A4A12'], ['#E0EEF9', '#1D5A8C'], ['#FFE3E0', '#9A2F2F']];
function avatar(name, photo, size = 'lg') {
  const [bg, fg] = PALETTE[hash(name || '?') % PALETTE.length];
  const ini = (name || '?').trim().split(/\s+/).slice(0, 2).map((w) => w[0]).join('').toUpperCase() || '?';
  return `<span class="avatar ${size}" style="background:${bg};color:${fg}">${photo ? `<img src="${esc(photo)}" alt="">` : esc(ini)}</span>`;
}

function topbar({ back = false, title = '', actions = true } = {}) {
  const n = noticeCount();
  const left = back
    ? `<button class="icon-btn" data-act="back" aria-label="Volver">${I('chevL')}</button>`
    : `<div class="brand">${LOGO}<span>VidaMayor</span></div>`;
  const mid = title ? `<h1 class="top-title">${esc(title)}</h1>` : '';
  const right = actions
    ? `<button class="icon-btn" data-act="go" data-view="avisos" aria-label="Avisos${n ? `, ${n} pendientes` : ''}">${I('bell')}${n ? `<span class="badge">${n}</span>` : ''}</button>
       <button class="avatar-btn" data-act="go" data-view="perfil" aria-label="Mi perfil">${avatar(state.profile.name, state.profile.photo, 'sm')}</button>`
    : '';
  return `<header class="topbar">${left}${mid}<div class="top-actions">${right}</div></header>`;
}

const TABS = [['inicio', 'Inicio', 'home'], ['agenda', 'Agenda', 'calendar'], ['medicinas', 'Medicinas', 'pill'], ['familia', 'Familia', 'users'], ['emergencia', 'SOS', 'alert']];
function renderTabbar() {
  $('#tabbar').innerHTML = TABS.map(([v, label, ic]) =>
    `<button class="tab ${v === 'emergencia' ? 'sos' : ''}" data-act="go" data-view="${v}" ${ui.view === v ? 'aria-current="page"' : ''}><span class="pill">${I(ic)}</span>${label}</button>`).join('');
}

const fld = (label, name, value, { type = 'text', ph = '', req = false, ac = 'off' } = {}) =>
  `<label class="field"><span>${label}</span><input class="input" type="${type}" name="${name}" value="${esc(value)}" placeholder="${esc(ph)}" autocomplete="${ac}" ${req ? 'required' : ''}></label>`;
const bindFld = (label, bind, value, { type = 'text', ph = '', ac = 'off' } = {}) =>
  `<label class="field"><span>${label}</span><input class="input" type="${type}" data-bind="${bind}" value="${esc(value)}" placeholder="${esc(ph)}" autocomplete="${ac}"></label>`;
const sw = (id, title, desc, checked) =>
  `<div class="switch-row"><div class="txt"><div class="t">${esc(title)}</div>${desc ? `<div class="d">${esc(desc)}</div>` : ''}</div><label class="switch"><input type="checkbox" data-switch="${id}" ${checked ? 'checked' : ''} aria-label="${esc(title)}"><span class="track"></span></label></div>`;
const simNote = (text) => `<div class="banner sim">${I('info')}<div>${text}</div></div>`;

let toastTimer = null;
function toast(msg, kind = '') {
  const t = $('#toast');
  t.textContent = msg;
  t.className = `toast show ${kind}`;
  clearTimeout(toastTimer);
  toastTimer = setTimeout(() => { t.className = 'toast'; }, 4500);
}

/* ── Hoja inferior (formularios y confirmaciones) ── */
const sheet = $('#sheet');
function openSheet({ title, body, submit = 'Guardar', onSubmit, onDelete = null, deleteText = 'Eliminar' }) {
  sheet.innerHTML = `<form class="sheet-form" novalidate>
      <h2 id="sheet-title" tabindex="-1" autofocus>${esc(title)}</h2>
      <div>${body}</div>
      <p class="form-error" role="alert" hidden></p>
      <div class="sheet-actions">
        <button type="submit" class="btn btn-primary btn-block btn-xl">${esc(submit)}</button>
        <button type="button" class="btn btn-soft btn-block" data-act="closeSheet">Cancelar</button>
        ${onDelete ? `<button type="button" class="btn btn-danger-ghost btn-block" data-act="sheetDelete">${I('trash')} ${esc(deleteText)}</button>` : ''}
      </div>
    </form>`;
  const form = $('form', sheet);
  form.addEventListener('submit', async (e) => {
    e.preventDefault();
    const err = $('.form-error', form);
    err.hidden = true;
    try {
      const r = await onSubmit(new FormData(form), form);
      if (r && r.error) { err.textContent = r.error; err.hidden = false; return; }
      closeSheet();
    } catch (ex) {
      console.error(ex);
      err.textContent = 'No se pudo guardar. Intenta de nuevo.';
      err.hidden = false;
    }
  });
  sheet._onDelete = onDelete;
  if (!sheet.open) sheet.showModal();
}
function closeSheet() { if (sheet.open) sheet.close(); }
sheet.addEventListener('close', () => {
  const after = sheet._after; // algo que debe ocurrir DESPUÉS de cerrar (p. ej. confirmar un borrado)
  sheet._after = null;
  if (sheet._ask) { const r = sheet._ask; sheet._ask = null; r(sheet._askYes === true); }
  sheet._askYes = false;
  sheet._onDelete = null;
  sheet.innerHTML = '';
  if (after) after();
});
sheet.addEventListener('click', (e) => { if (e.target === sheet) closeSheet(); });

function ask({ title, text = '', ok = 'Aceptar', cancel = 'Cancelar', danger = false }) {
  return new Promise((resolve) => {
    sheet.innerHTML = `<div class="sheet-form">
        <h2 id="sheet-title" tabindex="-1" autofocus>${esc(title)}</h2>
        ${text ? `<p class="sheet-text">${text}</p>` : ''}
        <div class="sheet-actions">
          <button class="btn ${danger ? 'btn-danger' : 'btn-primary'} btn-block btn-xl" data-act="askYes">${esc(ok)}</button>
          <button class="btn btn-soft btn-block" data-act="closeSheet">${esc(cancel)}</button>
        </div>
      </div>`;
    sheet._ask = resolve;
    sheet._askYes = false;
    sheet.showModal();
  });
}

/** Elige una foto, la recorta en cuadro y devuelve un texto pequeño (dataURL) */
function pickPhoto() {
  return new Promise((resolve) => {
    const input = document.createElement('input');
    input.type = 'file'; input.accept = 'image/*'; input.style.display = 'none';
    document.body.appendChild(input);
    input.addEventListener('change', () => {
      const file = input.files && input.files[0];
      input.remove();
      if (!file) return resolve(null);
      const img = new Image();
      const url = URL.createObjectURL(file);
      img.onload = () => {
        const size = 192, c = document.createElement('canvas');
        c.width = c.height = size;
        const s = Math.min(img.width, img.height);
        c.getContext('2d').drawImage(img, (img.width - s) / 2, (img.height - s) / 2, s, s, 0, 0, size, size);
        URL.revokeObjectURL(url);
        resolve(c.toDataURL('image/jpeg', 0.82));
      };
      img.onerror = () => { URL.revokeObjectURL(url); resolve(null); };
      img.src = url;
    });
    input.click();
  });
}

/* ═══════════════════════════════════════════════════════════
   7. Avisos y estado del día
   ═══════════════════════════════════════════════════════════ */
function familyNote() {
  const s = state.settings;
  const names = authorizedFamily().map((f) => firstName(f.name));
  if (!s.notif.followUp || !s.privacy.meds || !names.length) return '';
  return ` · Se avisaría a ${names.slice(0, 2).join(' y ')} (simulación)`;
}
function computeNotices(now = new Date()) {
  const out = [];
  const act = activeAlert();
  if (act) out.push({ kind: 'sos', icon: 'alert', title: 'Alerta de emergencia activa', sub: `Enviada a las ${t12(hhmm(new Date(act.at)))}`, go: 'emergencia' });
  for (const m of [...state.meds].sort(byTime)) {
    const s = medStatus(m, now);
    const sub = `${m.name}${m.dose ? ` · ${m.dose}` : ''}`;
    if (s.key === 'late') out.push({ kind: 'warn', icon: 'alert', title: `No se ha confirmado tu medicamento de las ${t12(m.time)}`, sub: sub + familyNote(), medId: m.id });
    else if (s.key === 'due') out.push({ kind: 'due', icon: 'pill', title: `${t12(m.time)} — Hora de tomar medicamento`, sub, medId: m.id });
    else if (s.key === 'soon' && s.due - now <= 3600000) out.push({ kind: 'info', icon: 'pill', title: `${t12(m.time)} — Medicamento ${rel(s.due - now)}`, sub });
  }
  for (const a of apptsOn(dstr(now))) {
    const when = at(a.date, a.time);
    if (when < now) continue;
    const t = TYPES[a.type] || TYPES.cita;
    out.push({ kind: when - now <= 3600000 ? 'due' : 'info', icon: t.icon, title: `${t12(a.time)} — Tienes ${t.art}`, sub: a.title + (a.place ? ` · ${a.place}` : '') });
  }
  return out;
}
const noticeCount = () => computeNotices().filter((n) => n.kind === 'warn' || n.kind === 'due' || n.kind === 'sos').length;

/* ═══════════════════════════════════════════════════════════
   8. Pantallas
   ═══════════════════════════════════════════════════════════ */
const VIEWS = {};

/* ── Inicio ── */
VIEWS.inicio = () => {
  const now = new Date(), h = now.getHours();
  const saludo = h < 12 ? 'Buenos días' : h < 19 ? 'Buenas tardes' : 'Buenas noches';
  const name = firstName(state.profile.name);
  const alertBanner = activeAlert()
    ? `<div class="banner alert" role="alert">${I('alert')}<div>Hay una alerta de emergencia activa.<br><button class="btn btn-danger btn-sm" data-act="go" data-view="emergencia">Ver alerta</button></div></div>` : '';
  return `${topbar()}<div class="page">
    <p class="eyebrow">${saludo}</p>
    <h1 class="page-title">Hola${name ? `, ${esc(name)}` : ''}</h1>
    <p class="lead">${cap(fmt(now, { weekday: 'long', day: 'numeric', month: 'long' }))}</p>
    ${alertBanner}
    ${cardNextMed(now)}
    ${cardNextAppt(now)}
    ${cardDayStatus(now)}
    ${quickTiles()}
    <button class="sos-wide" data-act="askSOS">${I('alert')} EMERGENCIA</button>
  </div>`;
};

function cardNextMed(now) {
  const head = `<div class="card-head">${I('pill')}Próximo medicamento</div>`;
  const meds = [...state.meds].sort(byTime);
  if (!meds.length) {
    return `<section class="card">${head}<p class="muted">Aún no hay medicamentos registrados.</p><button class="btn btn-soft btn-block" style="margin-top:.7rem" data-act="addMed">${I('plus')} Agregar medicamento</button></section>`;
  }
  const today = dstr(now);
  const pend = meds.find((m) => !isTaken(m.id, today));
  if (!pend) {
    const next = meds[0];
    return `<section class="card tint-primary">${head}<div class="row"><span class="icon-bubble ok">${I('check')}</span><div class="grow"><div class="big-line">Todo al día</div><div class="muted">Tomaste todas tus medicinas de hoy. Mañana: ${esc(next.name)} a las ${t12(next.time)}.</div></div></div></section>`;
  }
  const s = medStatus(pend, now);
  const chip = s.key === 'late' ? `<span class="chip warn">${I('alert', 'sm')} Pendiente · pasó la hora</span>`
    : s.key === 'due' ? `<span class="chip">${I('clock', 'sm')} Es la hora</span>`
    : `<span class="chip neutral">${I('clock', 'sm')} ${rel(s.due - now)}</span>`;
  return `<section class="card">${head}
    <div class="big-line">${esc(pend.name)}</div>
    <div class="muted">${esc(pend.dose)}${pend.dose ? ' · ' : ''}${t12(pend.time)}${pend.notes ? ` · ${esc(pend.notes)}` : ''}</div>
    <div style="margin:.6rem 0 .8rem">${chip}</div>
    <button class="btn btn-primary btn-block btn-xl" data-act="takeMed" data-id="${pend.id}">${I('check')} Ya lo tomé</button>
  </section>`;
}
function cardNextAppt(now) {
  const head = `<div class="card-head">${I('calendar')}Próxima cita</div>`;
  const a = upcomingAppts(now)[0];
  if (!a) return `<section class="card">${head}<p class="muted">No tienes citas próximas.</p><button class="btn btn-soft btn-block" style="margin-top:.7rem" data-act="addAppt">${I('plus')} Agregar cita</button></section>`;
  const t = TYPES[a.type] || TYPES.cita;
  return `<section class="card">${head}
    <div class="big-line">${esc(a.title)}</div>
    <div class="muted">${dayLabel(a.date)} · ${t12(a.time)}${a.place ? ` · ${esc(a.place)}` : ''}</div>
    <div style="margin-top:.6rem"><span class="chip">${I(t.icon, 'sm')} ${t.label}</span> <span class="chip neutral">${rel(a.when - now)}</span></div>
  </section>`;
}
function cardDayStatus(now) {
  const today = dstr(now);
  const total = state.meds.length;
  const taken = state.meds.filter((m) => isTaken(m.id, today)).length;
  const late = state.meds.filter((m) => medStatus(m, now).key === 'late').length;
  const pct = total ? Math.round((taken / total) * 100) : 0;
  const todayAppts = apptsOn(today);
  let msg;
  if (!total) msg = 'Agrega tus medicinas para llevar el control del día.';
  else if (taken === total) msg = '¡Muy bien! Ya tomaste todas tus medicinas de hoy.';
  else if (late) msg = `Tienes ${late} ${late === 1 ? 'medicina' : 'medicinas'} por confirmar.`;
  else msg = 'Todo va bien. Sigue con tu día.';
  return `<section class="card tint-lav">
    <div class="card-head">${I('heart')}Estado del día</div>
    <div class="row between"><strong>Medicinas</strong><span>${taken} de ${total}</span></div>
    <div class="progress" role="progressbar" aria-valuemin="0" aria-valuemax="100" aria-valuenow="${pct}" aria-label="Medicinas tomadas hoy"><i style="width:${pct}%"></i></div>
    <div class="row between"><strong>Citas de hoy</strong><span>${todayAppts.length}</span></div>
    <p style="margin-top:.7rem;font-weight:700">${msg}</p>
  </section>`;
}
function quickTiles() {
  const c = authorizedFamily().find((f) => f.phone) || state.family.find((f) => f.phone);
  const call = c
    ? `<a class="tile sky" href="tel:${digits(c.phone)}">${I('phone')}Llamar a ${esc(firstName(c.name))}<small>${esc(c.relation || 'Familiar')}</small></a>`
    : `<button class="tile sky" data-act="go" data-view="familia">${I('users')}Agregar familiar<small>Para llamar rápido</small></button>`;
  const loc = state.location ? `Compartida ${rel(new Date(state.location.at) - new Date())}` : 'Sin compartir';
  return `<div class="quick">${call}<button class="tile peach" data-act="go" data-view="ubicacion">${I('pin')}Mi ubicación<small>${loc}</small></button></div>`;
}

/* ── Agenda ── */
VIEWS.agenda = () => {
  const { y, m } = ui.cal;
  const first = new Date(y, m, 1), days = new Date(y, m + 1, 0).getDate(), today = dstr();
  const byDate = {};
  for (const a of state.appts) (byDate[a.date] ||= []).push(a);
  let cells = '';
  for (let i = 0; i < first.getDay(); i++) cells += '<span class="day blank"></span>';
  for (let d = 1; d <= days; d++) {
    const ds = `${y}-${pad(m + 1)}-${pad(d)}`;
    const ev = byDate[ds] || [];
    const dots = ev.slice(0, 3).map((e) => `<i class="d-${e.type}"></i>`).join('');
    const label = `${d} de ${fmt(first, { month: 'long' })}${ev.length ? `, ${ev.length} ${ev.length === 1 ? 'evento' : 'eventos'}` : ''}${ds === today ? ', hoy' : ''}`;
    cells += `<button class="day ${ds === today ? 'is-today' : ''} ${ds === ui.selDay ? 'is-sel' : ''}" data-act="selectDay" data-date="${ds}" aria-label="${label}" aria-pressed="${ds === ui.selDay}">${d}<span class="dots">${dots}</span></button>`;
  }
  const dow = ['D', 'L', 'M', 'M', 'J', 'V', 'S'].map((x) => `<span class="cal-dow" aria-hidden="true">${x}</span>`).join('');
  const list = apptsOn(ui.selDay);
  const items = list.length ? list.map((a) => {
    const t = TYPES[a.type] || TYPES.cita;
    return `<div class="item"><span class="icon-bubble ${t.tone}">${I(t.icon)}</span><div class="grow"><div class="item-title">${esc(a.title)}</div><div class="item-sub">${t12(a.time)} · ${t.label}${a.place ? ` · ${esc(a.place)}` : ''}</div></div><button class="icon-btn" data-act="editAppt" data-id="${a.id}" aria-label="Editar ${esc(a.title)}">${I('edit')}</button></div>`;
  }).join('') : `<div class="empty">${I('calendar')}<p>No hay nada agendado para este día.</p></div>`;
  return `${topbar()}<div class="page">
    <h1 class="page-title">Agenda</h1>
    <section class="card">
      <div class="cal-head">
        <button class="icon-btn" data-act="calPrev" aria-label="Mes anterior">${I('chevL')}</button>
        <h2>${cap(fmt(first, { month: 'long', year: 'numeric' }))}</h2>
        <button class="icon-btn" data-act="calNext" aria-label="Mes siguiente">${I('chevR')}</button>
      </div>
      <div class="cal-grid">${dow}${cells}</div>
      <button class="btn btn-line btn-sm" style="margin-top:.7rem" data-act="calToday">Ir a hoy</button>
    </section>
    <h2 class="section-title">${dayLabel(ui.selDay)}</h2>
    <section class="card" style="margin-top:.4rem">${items}</section>
    <button class="btn btn-primary btn-block btn-xl fab-row" data-act="addAppt">${I('plus')} Agregar cita o recordatorio</button>
  </div>`;
};

/* ── Medicinas ── */
function medCard(m, now) {
  const s = medStatus(m, now);
  let chip;
  if (s.key === 'taken') chip = `<span class="chip ok">${I('check', 'sm')} Tomada a las ${t12(s.takenAt)}</span>`;
  else if (s.key === 'late') chip = `<span class="chip warn">${I('alert', 'sm')} Pendiente · pasó la hora ${rel(now - s.due)}</span>`;
  else if (s.key === 'due') chip = `<span class="chip">${I('clock', 'sm')} Es la hora</span>`;
  else chip = `<span class="chip neutral">${I('clock', 'sm')} Hoy ${rel(s.due - now)}</span>`;
  const btn = s.key === 'taken'
    ? `<button class="btn btn-line" data-act="undoMed" data-id="${m.id}">Deshacer</button>`
    : `<button class="btn ${s.key === 'soon' ? 'btn-soft' : 'btn-primary'}" data-act="takeMed" data-id="${m.id}">${I('check')} Ya lo tomé</button>`;
  return `<article class="card med-card">
    <div class="med-top"><div class="grow"><div class="med-name">${esc(m.name)}</div>
      <div class="muted">${esc(m.dose)}${m.dose ? ' · ' : ''}${t12(m.time)}</div>
      ${m.notes ? `<div class="item-sub">${esc(m.notes)}</div>` : ''}</div>
      <button class="icon-btn" data-act="editMed" data-id="${m.id}" aria-label="Editar ${esc(m.name)}">${I('edit')}</button></div>
    <div style="margin-top:.6rem">${chip}</div>
    <div class="med-actions">${btn}</div>
  </article>`;
}
VIEWS.medicinas = () => {
  const now = new Date(), today = dstr(now);
  const meds = [...state.meds].sort(byTime);
  const pend = meds.filter((m) => !isTaken(m.id, today));
  const done = meds.filter((m) => isTaken(m.id, today));
  const body = !meds.length
    ? `<div class="card"><div class="empty">${I('pill')}<p>Aún no hay medicinas registradas.</p></div></div>`
    : `${pend.length ? `<h2 class="section-title">Pendientes</h2>${pend.map((m) => medCard(m, now)).join('')}` : `<div class="banner sim" style="background:var(--ok-l);color:var(--ok);border-color:var(--ok)">${I('check')}<div><strong>¡Todo al día!</strong> Ya tomaste tus medicinas de hoy.</div></div>`}
       ${done.length ? `<h2 class="section-title">Tomadas hoy</h2>${done.map((m) => medCard(m, now)).join('')}` : ''}`;
  return `${topbar()}<div class="page">
    <p class="eyebrow">Hoy</p>
    <h1 class="page-title">Medicinas</h1>
    <p class="lead">${meds.length ? `${done.length} de ${meds.length} tomadas` : 'Registra tus medicinas y su hora'}</p>
    ${body}
    <button class="btn btn-primary btn-block btn-xl fab-row" data-act="addMed">${I('plus')} Agregar medicamento</button>
  </div>`;
};

/* ── Familia ── */
VIEWS.familia = () => {
  const cards = state.family.length ? state.family.map((f) => `
    <article class="card">
      <div class="family-row">${avatar(f.name, f.photo, 'lg')}
        <div class="grow"><div class="item-title" style="font-size:1.15rem">${esc(f.name)}</div>
          <div class="item-sub">${esc(f.relation || 'Familiar')}${f.phone ? ` · ${esc(f.phone)}` : ''}</div>
          <div style="margin-top:.35rem">${f.authorized ? `<span class="chip ok">${I('shield', 'sm')} Autorizado</span>` : `<span class="chip neutral">${I('lock', 'sm')} Sin acceso a mi información</span>`}</div></div>
      </div>
      <div class="btn-row" style="margin-top:.8rem">
        ${f.phone ? `<a class="btn btn-primary" href="tel:${digits(f.phone)}">${I('phone')} Llamar</a>` : ''}
        <button class="btn btn-soft" data-act="editFamily" data-id="${f.id}">${I('edit')} Editar</button>
      </div>
    </article>`).join('')
    : `<div class="card"><div class="empty">${I('users')}<p>Agrega a tus familiares para llamarles con un toque.</p></div></div>`;
  return `${topbar()}<div class="page">
    <h1 class="page-title">Familia</h1>
    <p class="lead">Las personas autorizadas pueden ver tu estado en su panel.</p>
    ${cards}
    <button class="btn btn-primary btn-block btn-xl fab-row" data-act="addFamily">${I('plus')} Agregar familiar</button>
    <button class="btn btn-line btn-block" style="margin-top:.7rem" data-act="enterFamily">${I('eye')} Ver cómo lo ve mi familiar</button>
  </div>`;
};

/* ── Emergencia ── */
function sosText(a) {
  const who = state.profile.name || 'Tu familiar';
  let t = `¡EMERGENCIA! ${who} necesita ayuda (aviso de VidaMayor, ${t12(hhmm(new Date(a.at)))}).`;
  if (a.loc) t += ` Ubicación: https://www.google.com/maps?q=${a.loc.lat},${a.loc.lng}`;
  return t;
}
function waLink(phone, text) {
  const dg = digits(phone).replace('+', '');
  const full = dg.length === 10 ? `52${dg}` : dg;
  return `https://wa.me/${full}?text=${encodeURIComponent(text)}`;
}
VIEWS.emergencia = () => {
  const act = activeAlert();
  const past = state.alerts.filter((a) => a.resolvedAt).slice(0, 5);
  const history = past.length ? `<h2 class="section-title">Alertas anteriores</h2><section class="card" style="margin-top:.4rem">${past.map((a) => `<div class="item"><span class="icon-bubble">${I('clock')}</span><div class="grow"><div class="item-title">${cap(fmt(new Date(a.at), { day: 'numeric', month: 'long' }))} · ${t12(hhmm(new Date(a.at)))}</div><div class="item-sub">Resuelta a las ${t12(hhmm(new Date(a.resolvedAt)))}</div></div></div>`).join('')}</section>` : '';
  if (!act) {
    return `${topbar()}<div class="page">
      <h1 class="page-title">Emergencia</h1>
      <p class="lead">Si necesitas ayuda, presiona el botón. Antes de enviar te pediremos confirmación.</p>
      <div class="sos-round-wrap"><button class="sos-round" data-act="askSOS" aria-label="Pedir ayuda de emergencia">${I('alert')}EMERGENCIA</button></div>
      <a class="btn btn-line btn-block btn-xl" href="tel:911">${I('phone')} Llamar al 911</a>
      ${simNote('<strong>Modo demostración.</strong> El aviso queda registrado en el panel familiar de este teléfono y puedes mandar mensajes con un toque. El envío automático a otros celulares necesita un servidor (siguiente fase).')}
      ${history}
    </div>`;
  }
  const people = act.notified.map((id) => state.family.find((f) => f.id === id)).filter(Boolean);
  const text = sosText(act);
  const rows = people.length ? people.map((f) => `
      <div class="item" style="display:block">
        <div class="family-row">${avatar(f.name, f.photo, 'lg')}<div class="grow"><div class="item-title">${esc(f.name)}</div><div class="item-sub">${esc(f.relation || '')}</div></div></div>
        <div class="btn-grid3">
          <a class="btn btn-primary btn-sm" href="tel:${digits(f.phone)}">${I('phone')} Llamar</a>
          <a class="btn btn-soft btn-sm" href="sms:${digits(f.phone)}?body=${encodeURIComponent(text)}">${I('msg')} SMS</a>
          <a class="btn btn-soft btn-sm" href="${waLink(f.phone, text)}" target="_blank" rel="noopener">WhatsApp</a>
        </div></div>`).join('')
    : `<p class="muted" style="padding:.6rem 0">No tienes familiares autorizados. Llama al 911 o agrega familiares en la sección Familia.</p>`;
  const loc = act.loc
    ? `<div class="item"><span class="icon-bubble danger">${I('pin')}</span><div class="grow"><div class="item-title">Ubicación incluida</div><div class="item-sub">Precisión aproximada: ${act.loc.acc || '?'} m</div></div><a class="btn btn-soft btn-sm" href="https://www.google.com/maps?q=${act.loc.lat},${act.loc.lng}" target="_blank" rel="noopener">Ver mapa</a></div>`
    : `<div class="item"><span class="icon-bubble">${I('pin')}</span><div class="grow"><div class="item-title">${state.settings.privacy.location ? 'Buscando tu ubicación…' : 'Ubicación no incluida'}</div><div class="item-sub">${state.settings.privacy.location ? 'Se agregará al aviso en cuanto se encuentre.' : 'Puedes permitirla en Mi perfil → Privacidad.'}</div></div></div>`;
  return `${topbar()}<div class="page">
    <div class="banner alert" role="alert">${I('alert')}<div>Aviso de emergencia registrado a las ${t12(hhmm(new Date(act.at)))}</div></div>
    <a class="btn btn-danger btn-block btn-xl" style="margin-top:.9rem" href="tel:911">${I('phone')} Llamar al 911</a>
    <section class="card"><div class="card-head">${I('users')}Avisar a tu familia ahora</div>${rows}</section>
    <section class="card">${loc}</section>
    ${simNote('<strong>Modo demostración.</strong> El aviso ya aparece en el panel familiar de este teléfono. Para que le llegue solo a otro celular hace falta conectar un servidor (siguiente fase). Mientras tanto, usa los botones de arriba.')}
    <button class="btn btn-soft btn-block btn-xl" style="margin-top:1rem" data-act="resolveAlert" data-id="${act.id}">${I('check')} Ya estoy bien · cerrar alerta</button>
    ${history}
  </div>`;
};
async function askSOS() {
  const names = authorizedFamily().map((f) => esc(f.name));
  let text = names.length ? `Se avisará a: <strong>${names.join(', ')}</strong>.` : 'Aún no tienes familiares autorizados, pero podrás llamar al 911.';
  if (state.settings.privacy.location) text += ' Se incluirá tu ubicación.';
  const ok = await ask({ title: '¿Necesitas ayuda de emergencia?', text, ok: 'Sí, pedir ayuda', cancel: 'No, cancelar', danger: true });
  if (!ok) return;
  const a = { id: uid(), at: new Date().toISOString(), loc: null, resolvedAt: null, notified: authorizedFamily().map((f) => f.id) };
  state.alerts.unshift(a);
  save();
  ui.view = 'emergencia';
  render();
  if (state.settings.privacy.location) {
    try {
      const p = await getPosition();
      a.loc = p; state.location = p; save();
      if (ui.view === 'emergencia') render(true);
    } catch (e) { toast(geoMsg(e), 'err'); }
  }
}

/* ── Ubicación ── */
VIEWS.ubicacion = () => {
  const loc = state.location, on = state.settings.privacy.location;
  const fam = state.family.length
    ? state.family.map((f) => `<div class="item">${avatar(f.name, f.photo, 'lg')}<div class="grow"><div class="item-title">${esc(f.name)}</div><div class="item-sub">${esc(f.relation || '')}</div></div>${f.authorized && on ? `<span class="chip ok">Puede verla</span>` : `<span class="chip neutral">No</span>`}</div>`).join('')
    : `<p class="muted" style="padding:.5rem 0">Aún no hay familiares agregados.</p>`;
  const last = loc
    ? `<dl class="dl"><dt>Última vez</dt><dd>${cap(fmt(new Date(loc.at), { day: 'numeric', month: 'long' }))}, ${t12(hhmm(new Date(loc.at)))} (${rel(new Date(loc.at) - new Date())})</dd>
       <dt>Coordenadas</dt><dd>${loc.lat.toFixed(5)}, ${loc.lng.toFixed(5)}</dd>
       <dt>Precisión aproximada</dt><dd>${loc.acc || '?'} metros</dd></dl>
       <a class="btn btn-soft btn-block" href="https://www.google.com/maps?q=${loc.lat},${loc.lng}" target="_blank" rel="noopener">${I('map')} Abrir en el mapa</a>`
    : `<div class="empty">${I('pin')}<p>Todavía no has compartido tu ubicación.</p></div>`;
  return `${topbar({ back: true, title: 'Ubicación', actions: false })}<div class="page">
    <section class="card">${sw('privacy.location', 'Compartir mi ubicación', 'Solo los familiares autorizados podrán verla.', on)}</section>
    <section class="card"><div class="card-head">${I('pin')}Última ubicación compartida</div>${last}</section>
    <button class="btn btn-primary btn-block btn-xl fab-row" data-act="shareLocationNow" ${on ? '' : 'aria-disabled="true"'}>${I('pin')} Compartir mi ubicación ahora</button>
    ${on ? '' : '<p class="small muted" style="text-align:center;margin-top:.5rem">Activa el interruptor de arriba para poder compartirla.</p>'}
    <h2 class="section-title">¿Quién puede verla?</h2>
    <section class="card" style="margin-top:.4rem">${fam}<button class="btn btn-line btn-block btn-sm" style="margin-top:.6rem" data-act="go" data-view="perfil">Cambiar permisos</button></section>
    ${simNote('<strong>Modo demostración.</strong> La ubicación se guarda en este teléfono. Para que tu familia la vea en su celular se necesita un servidor (siguiente fase).')}
  </div>`;
};
async function shareLocationNow() {
  if (!state.settings.privacy.location) { toast('Primero activa "Compartir mi ubicación".', 'err'); return; }
  toast('Buscando tu ubicación…');
  try {
    state.location = await getPosition();
    save(); render(true);
    toast('Ubicación compartida.', 'ok');
  } catch (e) { toast(geoMsg(e), 'err'); }
}

/* ── Perfil, privacidad y avisos ── */
VIEWS.perfil = () => {
  const p = state.profile, s = state.settings;
  const sizeBtn = (v, l) => `<button data-act="setSize" data-size="${v}" aria-pressed="${s.size === v}">${l}</button>`;
  const fam = state.family.length
    ? state.family.map((f) => sw(`fam:${f.id}`, f.name, f.relation || 'Familiar', f.authorized)).join('')
    : '<p class="muted" style="padding:.5rem 0">Agrega familiares en la sección Familia.</p>';
  const webNote = isNative ? 'Los avisos se programan en tu teléfono y llegan aunque la app esté cerrada.' : 'En el navegador los avisos solo funcionan con la app abierta. En el APK llegan aunque esté cerrada.';
  return `${topbar({ back: true, title: 'Mi perfil', actions: false })}<div class="page">
    <section class="card">
      <div class="photo-pick">${avatar(p.name, p.photo, 'xl')}<div class="stack"><button class="btn btn-soft btn-sm" data-act="pickProfilePhoto">${I('camera')} Cambiar foto</button>${p.photo ? '<button class="btn btn-line btn-sm" data-act="removeProfilePhoto">Quitar foto</button>' : ''}</div></div>
      ${bindFld('Nombre', 'profile.name', p.name, { ac: 'name' })}
      ${bindFld('Edad', 'profile.age', p.age, { type: 'number' })}
      ${bindFld('Mi teléfono', 'profile.phone', p.phone, { type: 'tel', ac: 'tel' })}
    </section>
    <section class="card">
      <div class="card-head">${I('shield')}Médico de confianza</div>
      ${bindFld('Nombre del médico', 'profile.doctorName', p.doctorName)}
      ${bindFld('Teléfono del consultorio', 'profile.doctorPhone', p.doctorPhone, { type: 'tel' })}
      ${p.doctorPhone ? `<a class="btn btn-soft btn-block" style="margin-top:.8rem" href="tel:${digits(p.doctorPhone)}">${I('phone')} Llamar al médico</a>` : ''}
    </section>
    <section class="card">
      <div class="card-head">${I('heart')}Información médica</div>
      <p class="small muted">Escribe solo lo que tú decidas guardar (alergias, padecimientos, tipo de sangre…). Se queda en este teléfono.</p>
      <label class="field"><span class="label">Mis notas médicas</span><textarea class="input" data-bind="profile.medicalInfo" rows="4">${esc(p.medicalInfo)}</textarea></label>
    </section>

    <h2 class="section-title" id="privacidad">Privacidad y permisos</h2>
    <section class="card" style="margin-top:.4rem">
      <div class="card-head">${I('eye')}Qué información se comparte</div>
      ${sw('privacy.meds', 'Mis medicinas', 'Si las tomé o están pendientes.', s.privacy.meds)}
      ${sw('privacy.appts', 'Mis citas', 'Citas y actividades de hoy.', s.privacy.appts)}
      ${sw('privacy.location', 'Mi ubicación', 'Solo cuando yo la comparto.', s.privacy.location)}
    </section>
    <section class="card">
      <div class="card-head">${I('users')}Contactos autorizados</div>
      <p class="small muted">Solo ellos pueden consultar tu información.</p>
      ${fam}
    </section>
    <section class="card">
      <div class="switch-row"><div class="txt"><div class="t">Cambiar contraseña</div><div class="d">Disponible cuando la app tenga cuentas reales (siguiente fase).</div></div><span class="chip neutral">Próximamente</span></div>
      <div class="switch-row"><div class="txt"><div class="t">Cerrar sesión</div><div class="d">Vuelves a la pantalla de entrada. Tus datos se conservan.</div></div><button class="btn btn-line btn-sm" data-act="logout">${I('logout')} Salir</button></div>
    </section>

    <h2 class="section-title">Notificaciones</h2>
    <section class="card" style="margin-top:.4rem">
      ${sw('notif.enabled', 'Avisos de medicinas y citas', webNote, s.notif.enabled)}
      ${sw('notif.followUp', 'Recordarme si olvido confirmar', 'Un segundo aviso a los 30 minutos.', s.notif.followUp)}
      <button class="btn btn-soft btn-block" style="margin-top:.8rem" data-act="testNotif">${I('bell')} Probar un aviso</button>
    </section>

    <h2 class="section-title">Tamaño de letra</h2>
    <section class="card" style="margin-top:.4rem"><div class="seg" role="group" aria-label="Tamaño de letra">${sizeBtn('normal', 'Normal')}${sizeBtn('large', 'Grande')}${sizeBtn('xlarge', 'Muy grande')}</div></section>

    <h2 class="section-title">Más</h2>
    <section class="card" style="margin-top:.4rem">
      <button class="btn btn-line btn-block" data-act="enterFamily">${I('eye')} Ver cómo lo ve mi familiar</button>
      <button class="btn btn-danger-ghost btn-block" style="margin-top:.6rem" data-act="resetAll">${I('trash')} Borrar todos mis datos</button>
    </section>
  </div>`;
};

VIEWS.avisos = () => {
  const list = computeNotices();
  const items = list.length ? list.map((n) => {
    const tone = n.kind === 'warn' || n.kind === 'sos' ? 'danger' : n.kind === 'due' ? 'warn' : '';
    const action = n.medId ? `<button class="btn btn-primary btn-sm" data-act="takeMed" data-id="${n.medId}">${I('check')} Ya lo tomé</button>`
      : n.go ? `<button class="btn btn-danger btn-sm" data-act="go" data-view="${n.go}">Ver</button>` : '';
    return `<div class="item" style="align-items:flex-start"><span class="icon-bubble ${tone}">${I(n.icon)}</span><div class="grow"><div class="item-title">${esc(n.title)}</div><div class="item-sub">${esc(n.sub)}</div>${action ? `<div style="margin-top:.5rem">${action}</div>` : ''}</div></div>`;
  }).join('') : `<div class="empty">${I('check')}<p><strong>No tienes avisos pendientes.</strong><br>Todo está en orden.</p></div>`;
  return `${topbar({ back: true, title: 'Avisos', actions: false })}<div class="page">
    <section class="card">${items}</section>
    <p class="small muted" style="margin-top:.8rem">${state.settings.notif.enabled ? 'Los avisos del teléfono están activados.' : 'Activa los avisos del teléfono en Mi perfil → Notificaciones.'}</p>
    <button class="btn btn-line btn-block" style="margin-top:.6rem" data-act="go" data-view="perfil">${I('bell')} Configurar notificaciones</button>
  </div>`;
};

/* ── Panel familiar (simulación de lo que vería un familiar) ── */
function familyRows(now = new Date()) {
  const s = state.settings, today = dstr(now), rows = [];
  if (s.privacy.meds) {
    for (const m of [...state.meds].sort(byTime)) {
      const st = medStatus(m, now);
      if (st.key === 'taken') rows.push({ tone: 'ok', icon: 'check', text: `Medicamento ${t12(m.time)} — Confirmado`, sub: `${m.name} · tomada a las ${t12(st.takenAt)}` });
      else if (st.key === 'late') rows.push({ tone: 'warn', icon: 'alert', text: `Medicamento ${t12(m.time)} — Sin confirmar`, sub: `${m.name} · pasó la hora ${rel(now - st.due)}` });
      else rows.push({ tone: '', icon: 'pill', text: `Medicamento ${t12(m.time)} — Pendiente`, sub: m.name });
    }
    if (!state.meds.length) rows.push({ tone: '', icon: 'pill', text: 'Medicamentos — Sin registrar', sub: '' });
  } else rows.push({ tone: 'lock', icon: 'lock', text: 'Medicinas — no se comparten', sub: `${firstName(state.profile.name) || 'La persona'} decidió no compartir esta información.` });
  if (s.privacy.appts) {
    const list = apptsOn(today);
    for (const a of list) {
      const past = at(a.date, a.time) < now;
      rows.push({ tone: past ? 'lock' : '', icon: 'calendar', text: `${(TYPES[a.type] || TYPES.cita).label} ${t12(a.time)} — ${past ? 'Ya pasó' : 'Pendiente'}`, sub: a.title + (a.place ? ` · ${a.place}` : '') });
    }
    if (!list.length) rows.push({ tone: '', icon: 'calendar', text: 'Citas de hoy — Ninguna', sub: '' });
  } else rows.push({ tone: 'lock', icon: 'lock', text: 'Citas — no se comparten', sub: '' });
  if (s.privacy.location && state.location) rows.push({ tone: 'ok', icon: 'pin', text: `Última ubicación compartida — ${rel(new Date(state.location.at) - now)}`, sub: 'Actualizada', link: `https://www.google.com/maps?q=${state.location.lat},${state.location.lng}` });
  else rows.push({ tone: 'lock', icon: 'pin', text: 'Ubicación — no compartida', sub: '' });
  const act = activeAlert();
  rows.push(act ? { tone: 'danger', icon: 'alert', text: `Emergencia activa desde las ${t12(hhmm(new Date(act.at)))}`, sub: 'Llama de inmediato', link: null }
    : { tone: 'ok', icon: 'alert', text: 'Emergencias — Sin alertas', sub: '' });
  return rows;
}
VIEWS.familiar = () => {
  const fam = state.family;
  const who = fam.find((f) => f.id === ui.asId) || fam.find((f) => f.authorized) || fam[0];
  const patient = firstName(state.profile.name) || 'La persona';
  const head = `<header class="topbar"><div class="brand">${LOGO}<span>Panel familiar</span></div><button class="btn btn-line btn-sm" data-act="exitFamily">${I('logout')} Salir</button></header>`;
  const note = simNote('<strong>Simulación.</strong> Así lo vería tu familiar en su propio celular. Aquí lo ves en el mismo teléfono para la demostración.');
  if (!who) return `${head}<div class="page">${note}<div class="card"><div class="empty">${I('users')}<p>Primero agrega familiares en la sección Familia.</p></div></div></div>`;
  const picker = `<label class="field"><span>Estoy viendo como:</span><select class="input" data-change="familyAs">${fam.map((f) => `<option value="${f.id}" ${f.id === who.id ? 'selected' : ''}>${esc(f.name)} (${esc(f.relation || 'Familiar')})${f.authorized ? '' : ' — sin permiso'}</option>`).join('')}</select></label>`;
  if (!who.authorized) {
    return `${head}<div class="page">${note}${picker}<section class="card"><div class="empty">${I('lock')}<p><strong>${esc(patient)} no te ha autorizado.</strong><br>Para ver su información, ${esc(patient)} debe activarte en Mi perfil → Privacidad.</p></div></section></div>`;
  }
  const rows = familyRows().map((r) => {
    const tone = r.tone === 'lock' ? '' : r.tone;
    return `<div class="item" style="align-items:flex-start"><span class="icon-bubble ${tone}" ${r.tone === 'lock' ? 'style="background:#EFE9DF;color:var(--ink2)"' : ''}>${I(r.icon)}</span><div class="grow"><div class="item-title" ${r.tone === 'lock' ? 'style="color:var(--ink2)"' : ''}>${esc(r.text)}</div>${r.sub ? `<div class="item-sub">${esc(r.sub)}</div>` : ''}${r.link ? `<a class="btn btn-soft btn-sm" style="margin-top:.4rem" href="${r.link}" target="_blank" rel="noopener">Ver en el mapa</a>` : ''}</div></div>`;
  }).join('');
  const call = state.profile.phone ? `<a class="btn btn-primary btn-block btn-xl" style="margin-top:1rem" href="tel:${digits(state.profile.phone)}">${I('phone')} Llamar a ${esc(patient)}</a>` : '';
  return `${head}<div class="page">${note}${picker}
    <section class="card"><div class="row" style="margin-bottom:.4rem">${avatar(state.profile.name, state.profile.photo, 'lg')}<div><div class="big-line" style="font-size:1.3rem">${esc(patient)} — Estado actual</div><div class="item-sub">${cap(fmt(new Date(), { weekday: 'long', day: 'numeric', month: 'long' }))}</div></div></div>${rows}</section>
    ${call}
  </div>`;
};

/* ═══════════════════════════════════════════════════════════
   9. Formularios (hojas inferiores)
   ═══════════════════════════════════════════════════════════ */
function medSheet(id) {
  const m = id ? medById(id) : { name: '', dose: '', time: '08:00', notes: '' };
  openSheet({
    title: id ? 'Editar medicamento' : 'Agregar medicamento',
    body: fld('Nombre del medicamento', 'name', m.name, { ph: 'Ej. Losartán', req: true }) + fld('Dosis', 'dose', m.dose, { ph: 'Ej. 1 tableta' }) + fld('Hora', 'time', m.time, { type: 'time', req: true }) + fld('Notas (opcional)', 'notes', m.notes, { ph: 'Ej. Con la comida' }),
    onSubmit: (fd) => {
      const name = String(fd.get('name') || '').trim(), time = String(fd.get('time') || '');
      if (!name) return { error: 'Escribe el nombre del medicamento.' };
      if (!time) return { error: 'Elige la hora.' };
      const data = { name, dose: String(fd.get('dose') || '').trim(), time, notes: String(fd.get('notes') || '').trim() };
      if (id) Object.assign(medById(id), data); else state.meds.push({ id: uid(), ...data });
      save(); render(true); toast(id ? 'Medicamento actualizado.' : 'Medicamento agregado.', 'ok');
    },
    onDelete: id ? async () => {
      if (await ask({ title: `¿Eliminar ${m.name}?`, text: 'Dejará de aparecer en tu lista y en los avisos.', ok: 'Sí, eliminar', danger: true })) {
        state.meds = state.meds.filter((x) => x.id !== id); save(); render(true); toast('Medicamento eliminado.');
      }
    } : null,
  });
}
function apptSheet(id, date) {
  const a = id ? state.appts.find((x) => x.id === id) : { type: 'cita', title: '', place: '', date: date || ui.selDay, time: '10:00' };
  const opts = Object.entries(TYPES).map(([k, v]) => `<option value="${k}" ${a.type === k ? 'selected' : ''}>${v.label}</option>`).join('');
  openSheet({
    title: id ? 'Editar' : 'Agregar a mi agenda',
    body: `<label class="field"><span>Tipo</span><select class="input" name="type">${opts}</select></label>` + fld('¿Qué es?', 'title', a.title, { ph: 'Ej. Consulta con la doctora', req: true }) + fld('Lugar (opcional)', 'place', a.place, { ph: 'Ej. Clínica Santa María' }) + fld('Fecha', 'date', a.date, { type: 'date', req: true }) + fld('Hora', 'time', a.time, { type: 'time', req: true }),
    onSubmit: (fd) => {
      const data = { type: String(fd.get('type')), title: String(fd.get('title') || '').trim(), place: String(fd.get('place') || '').trim(), date: String(fd.get('date') || ''), time: String(fd.get('time') || '') };
      if (!data.title) return { error: 'Escribe qué es.' };
      if (!data.date || !data.time) return { error: 'Elige la fecha y la hora.' };
      if (id) Object.assign(a, data); else state.appts.push({ id: uid(), ...data });
      ui.selDay = data.date; const d = parseDate(data.date); ui.cal = { y: d.getFullYear(), m: d.getMonth() };
      save(); render(true); toast('Agenda actualizada.', 'ok');
    },
    onDelete: id ? async () => {
      if (await ask({ title: '¿Eliminar de la agenda?', text: esc(a.title), ok: 'Sí, eliminar', danger: true })) {
        state.appts = state.appts.filter((x) => x.id !== id); save(); render(true); toast('Eliminado de la agenda.');
      }
    } : null,
  });
}
function familySheet(id) {
  const f = id ? state.family.find((x) => x.id === id) : { name: '', relation: '', phone: '', photo: '', authorized: true };
  openSheet({
    title: id ? 'Editar familiar' : 'Agregar familiar',
    body: `<div class="photo-pick"><span id="fam-preview">${avatar(f.name, f.photo, 'xl')}</span><button type="button" class="btn btn-soft btn-sm" data-act="pickFamilyPhoto">${I('camera')} Foto</button></div>
      <input type="hidden" name="photo" value="${esc(f.photo)}">`
      + fld('Nombre', 'name', f.name, { ph: 'Ej. Carlos Hernández', req: true, ac: 'name' }) + fld('Parentesco', 'relation', f.relation, { ph: 'Ej. Hijo, hija, vecina' }) + fld('Teléfono', 'phone', f.phone, { type: 'tel', ph: '10 dígitos', req: true, ac: 'tel' })
      + sw('authorized', 'Puede ver mi información', 'Medicinas, citas y ubicación (según tus permisos).', f.authorized).replace('data-switch="authorized"', 'name="authorized" data-switch-local="1"'),
    onSubmit: (fd) => {
      const data = { name: String(fd.get('name') || '').trim(), relation: String(fd.get('relation') || '').trim(), phone: String(fd.get('phone') || '').trim(), photo: String(fd.get('photo') || ''), authorized: fd.get('authorized') === 'on' };
      if (!data.name) return { error: 'Escribe el nombre.' };
      if (digits(data.phone).replace('+', '').length < 8) return { error: 'Escribe un teléfono válido (al menos 8 dígitos).' };
      if (id) Object.assign(f, data); else state.family.push({ id: uid(), ...data });
      save(); render(true); toast(id ? 'Familiar actualizado.' : 'Familiar agregado.', 'ok');
    },
    onDelete: id ? async () => {
      if (await ask({ title: `¿Quitar a ${f.name}?`, text: 'Ya no podrá ver tu información ni recibir tus avisos.', ok: 'Sí, quitar', danger: true })) {
        state.family = state.family.filter((x) => x.id !== id); save(); render(true); toast('Familiar eliminado.');
      }
    } : null,
    deleteText: 'Quitar familiar',
  });
}

/* ═══════════════════════════════════════════════════════════
   10. Acciones (toques) y eventos
   ═══════════════════════════════════════════════════════════ */
function takeMed(id) {
  const m = medById(id); if (!m) return;
  const today = dstr();
  (state.log[today] ||= {})[id] = hhmm();
  save(); render(true);
  toast(`Listo, confirmaste ${m.name}.`, 'ok');
}
function logout() { state.loggedOut = true; save(); showWelcome(); }
async function resetAll() {
  const ok = await ask({ title: '¿Borrar todos tus datos?', text: 'Se eliminarán medicinas, citas, familiares y alertas de este teléfono. No se puede deshacer.', ok: 'Sí, borrar todo', danger: true });
  if (!ok) return;
  try { localStorage.removeItem(KEY); } catch (e) { /* nada */ }
  memoryOnly = null;
  state = defaults();
  document.documentElement.dataset.size = 'normal';
  ui.view = 'inicio'; ui.mode = 'adulto';
  scheduleReminders();
  showWelcome();
}

const ACTIONS = {
  go: (el) => go(el.dataset.view),
  back: () => go(ui.prev || 'inicio'),
  takeMed: (el) => takeMed(el.dataset.id),
  undoMed: (el) => { const l = state.log[dstr()]; if (l) delete l[el.dataset.id]; save(); render(true); },
  addMed: () => medSheet(),
  editMed: (el) => medSheet(el.dataset.id),
  addAppt: () => apptSheet(null, ui.view === 'agenda' ? ui.selDay : dstr()),
  editAppt: (el) => apptSheet(el.dataset.id),
  selectDay: (el) => { ui.selDay = el.dataset.date; render(true); },
  calPrev: () => { const d = new Date(ui.cal.y, ui.cal.m - 1, 1); ui.cal = { y: d.getFullYear(), m: d.getMonth() }; render(true); },
  calNext: () => { const d = new Date(ui.cal.y, ui.cal.m + 1, 1); ui.cal = { y: d.getFullYear(), m: d.getMonth() }; render(true); },
  calToday: () => { const d = new Date(); ui.cal = { y: d.getFullYear(), m: d.getMonth() }; ui.selDay = dstr(d); render(true); },
  addFamily: () => familySheet(),
  editFamily: (el) => familySheet(el.dataset.id),
  askSOS: () => askSOS(),
  resolveAlert: (el) => {
    const a = state.alerts.find((x) => x.id === el.dataset.id); if (!a) return;
    a.resolvedAt = new Date().toISOString(); save(); render(true); toast('Alerta cerrada. Me alegra que estés bien.', 'ok');
  },
  shareLocationNow: () => shareLocationNow(),
  pickProfilePhoto: async () => { const p = await pickPhoto(); if (p) { state.profile.photo = p; save(); render(true); } },
  removeProfilePhoto: () => { state.profile.photo = ''; save(); render(true); },
  pickFamilyPhoto: async () => {
    const p = await pickPhoto(); if (!p) return;
    const form = $('form', sheet); if (!form) return;
    form.elements['photo'].value = p;
    $('#fam-preview', form).innerHTML = avatar(form.elements['name'].value, p, 'xl');
  },
  setSize: (el) => { state.settings.size = el.dataset.size; document.documentElement.dataset.size = el.dataset.size; save(); render(true); },
  enterFamily: () => { ui.mode = 'familiar'; render(); },
  exitFamily: () => { ui.mode = 'adulto'; render(); },
  logout: () => logout(),
  resetAll: () => resetAll(),
  testNotif: async () => {
    if (!state.settings.notif.enabled) { toast('Primero activa "Avisos de medicinas y citas".', 'err'); return; }
    await testNotification();
  },
  closeSheet: () => closeSheet(),
  sheetDelete: () => { sheet._after = sheet._onDelete; closeSheet(); },
  askYes: () => { sheet._askYes = true; closeSheet(); },
  startDemo: () => startApp(true),
  startEmpty: () => startApp(false),
  enter: () => { state.loggedOut = false; save(); ui.view = 'inicio'; showApp(); },
};

document.addEventListener('click', (e) => {
  const el = e.target.closest('[data-act]');
  if (!el || el.getAttribute('aria-disabled') === 'true' && el.dataset.act !== 'shareLocationNow') return;
  const fn = ACTIONS[el.dataset.act];
  if (fn) { e.preventDefault(); fn(el, e); }
});

document.addEventListener('change', async (e) => {
  const el = e.target;
  if (el.matches('[data-bind]')) { setPath(state, el.dataset.bind, el.value.trim()); save(); return; }
  if (el.matches('[data-change="familyAs"]')) { ui.asId = el.value; render(true); return; }
  if (el.matches('[data-switch]')) await onSwitch(el);
});

async function onSwitch(el) {
  const id = el.dataset.switch, on = el.checked;
  if (id.startsWith('fam:')) {
    const f = state.family.find((x) => x.id === id.slice(4)); if (!f) return;
    f.authorized = on; save(); render(true);
    toast(on ? `${f.name} ahora puede ver tu información.` : `${f.name} ya no puede ver tu información.`);
    return;
  }
  if (id === 'privacy.location') {
    if (on) {
      try {
        state.location = await getPosition();
        state.settings.privacy.location = true; save(); toast('Ubicación activada.', 'ok');
      } catch (err) {
        state.settings.privacy.location = false; save(); toast(geoMsg(err), 'err');
      }
    } else { state.settings.privacy.location = false; save(); toast('Dejarás de compartir tu ubicación.'); }
    render(true); return;
  }
  if (id === 'notif.enabled') {
    if (on) {
      const r = await enableNotifications();
      state.settings.notif.enabled = !!r.ok; save();
      toast(r.ok ? 'Avisos activados.' : r.msg, r.ok ? 'ok' : 'err');
    } else { state.settings.notif.enabled = false; save(); toast('Avisos desactivados.'); }
    render(true); return;
  }
  setPath(state.settings, id, on); save();
}

/* ═══════════════════════════════════════════════════════════
   11. Navegación, dibujo y arranque
   ═══════════════════════════════════════════════════════════ */
function go(view) {
  if (ui.view !== view && MAIN.includes(ui.view)) ui.prev = ui.view;
  ui.view = view;
  render(false);
}
function render(keepScroll = false) {
  const box = $('#view');
  const top = keepScroll ? box.scrollTop : 0;
  const family = ui.mode === 'familiar';
  $('#tabbar').hidden = family;
  if (!family) renderTabbar();
  const fn = VIEWS[family ? 'familiar' : ui.view] || VIEWS.inicio;
  box.innerHTML = fn();
  box.scrollTop = top;
}
/** Redibuja lo que cambia con la hora, sin molestar si estás escribiendo */
function refreshLive() {
  if (sheet.open || $('#app').hidden) return;
  const a = document.activeElement;
  if (a && /^(INPUT|TEXTAREA|SELECT)$/.test(a.tagName)) return;
  if (['inicio', 'medicinas', 'avisos', 'emergencia', 'ubicacion'].includes(ui.view) || ui.mode === 'familiar') render(true);
}

function showApp() {
  $('#welcome').hidden = true;
  $('#app').hidden = false;
  ui.mode = 'adulto';
  render();
  scheduleReminders();
}
function showWelcome() {
  const first = !state.onboarded;
  $('#app').hidden = true;
  const w = $('#welcome');
  w.hidden = false;
  w.innerHTML = `<div class="welcome-inner">
    <div class="welcome-logo">${LOGO}</div>
    <h1>VidaMayor</h1>
    <p class="tag">Tus medicinas, tus citas y tu familia, siempre a la mano.</p>
    ${first
      ? `<label class="field"><span>¿Cómo te llamas?</span><input id="welcome-name" class="input" type="text" placeholder="Ej. María" autocomplete="given-name" value="${esc(state.profile.name)}"></label>
         <button class="btn btn-primary btn-block btn-xl" data-act="startDemo">Comenzar con datos de ejemplo</button>
         <button class="btn btn-line btn-block btn-xl" data-act="startEmpty">Comenzar desde cero</button>`
      : `<p class="lead" style="margin-top:1.3rem">Hola de nuevo${firstName(state.profile.name) ? `, <strong>${esc(firstName(state.profile.name))}</strong>` : ''}.</p>
         <button class="btn btn-primary btn-block btn-xl" data-act="enter">Entrar</button>`}
    <p class="small muted" style="margin-top:1.3rem">Versión de demostración: tus datos se guardan solo en este teléfono.</p>
  </div>`;
}
function startApp(demo) {
  const name = ($('#welcome-name') && $('#welcome-name').value.trim()) || '';
  state.onboarded = true; state.loggedOut = false;
  if (demo) seedDemo(name); else state.profile.name = name;
  save();
  ui.view = 'inicio';
  showApp();
}

function setupNative() {
  if (!isNative) return;
  const App = plug('App'), LN = plug('LocalNotifications');
  if (App && App.addListener) {
    App.addListener('backButton', () => {
      if (sheet.open) closeSheet();
      else if (ui.mode === 'familiar') { ui.mode = 'adulto'; render(); }
      else if (ui.view !== 'inicio') go(MAIN.includes(ui.view) ? 'inicio' : (ui.prev || 'inicio'));
      else if (App.exitApp) App.exitApp();
    });
  }
  if (LN && state.settings.notif.enabled) {
    LN.createChannel({ id: CHANNEL, name: 'Recordatorios', description: 'Medicinas y citas', importance: 5, visibility: 1, vibration: true }).catch(() => {});
  }
}

function boot() {
  document.documentElement.dataset.size = state.settings.size || 'normal';
  // Limpia registros de medicinas con más de 60 días
  const limit = dstr(addDays(new Date(), -60));
  for (const k of Object.keys(state.log)) if (k < limit) delete state.log[k];
  if (!state.onboarded || state.loggedOut) showWelcome(); else showApp();
  setupNative();
  setInterval(() => { if (!document.hidden) { tickDue(); refreshLive(); } }, 30000);
  document.addEventListener('visibilitychange', () => { if (!document.hidden) { tickDue(); refreshLive(); scheduleReminders(); } });
}
boot();
})();
