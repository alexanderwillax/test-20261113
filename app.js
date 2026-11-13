'use strict';

/* =========================================================
   Einstellungen
   ========================================================= */
const YEAR = 2027;
const MAX_PERSONS = 10;
const ALLOWANCE = 30;      // Urlaubstage pro Person
const CRITICAL_FROM = 3;   // ab so vielen Personen ist ein Tag kritisch
const MAX_NAME = 30;
const STORAGE_KEY = 'urlaubsplaner-2027';

/* Nur für Tests: hier kann ein anderes "Heute" gesetzt werden (Format JJJJ-MM-TT) */
let TODAY_OVERRIDE = null;

/* Gesetzliche Feiertage Bayern 2027 */
const HOLIDAYS = {
  '2027-01-01': 'Neujahr',
  '2027-01-06': 'Heilige Drei Könige',
  '2027-03-26': 'Karfreitag',
  '2027-03-29': 'Ostermontag',
  '2027-05-01': 'Tag der Arbeit',
  '2027-05-06': 'Christi Himmelfahrt',
  '2027-05-17': 'Pfingstmontag',
  '2027-05-27': 'Fronleichnam',
  '2027-08-15': 'Mariä Himmelfahrt',
  '2027-10-03': 'Tag der Deutschen Einheit',
  '2027-11-01': 'Allerheiligen',
  '2027-12-25': '1. Weihnachtstag',
  '2027-12-26': '2. Weihnachtstag'
};

/* Schulferien Bayern 2027 (nur zur Anzeige). Bitte mit km.bayern.de prüfen! */
const SCHOOL_HOLIDAYS = [
  { name: 'Weihnachtsferien', from: '2027-01-01', to: '2027-01-08' },
  { name: 'Winterferien',     from: '2027-02-08', to: '2027-02-12' },
  { name: 'Osterferien',      from: '2027-03-22', to: '2027-04-02' },
  { name: 'Pfingstferien',    from: '2027-05-18', to: '2027-05-28' },
  { name: 'Sommerferien',     from: '2027-08-02', to: '2027-09-13' },
  { name: 'Herbstferien',     from: '2027-11-02', to: '2027-11-05' },
  { name: 'Buß- und Bettag',  from: '2027-11-17', to: '2027-11-17' },
  { name: 'Weihnachtsferien', from: '2027-12-24', to: '2027-12-31' }
];

const MONTHS = ['Januar', 'Februar', 'März', 'April', 'Mai', 'Juni',
  'Juli', 'August', 'September', 'Oktober', 'November', 'Dezember'];
const WEEKDAYS = ['So', 'Mo', 'Di', 'Mi', 'Do', 'Fr', 'Sa'];
const STATUS_TEXT = { pend: 'offen', ok: 'genehmigt' };
const STATUS_SYMBOL = { pend: '?', ok: '✓' };

/* =========================================================
   Datum-Hilfen (Datum immer als Text "JJJJ-MM-TT")
   ========================================================= */
function isoDate(month, day) {
  return YEAR + '-' + String(month + 1).padStart(2, '0') + '-' + String(day).padStart(2, '0');
}

function parseIso(text) {
  const [y, m, d] = text.split('-').map(Number);
  return new Date(Date.UTC(y, m - 1, d));
}

function weekday(text) {
  return parseIso(text).getUTCDay();
}

function isWeekend(text) {
  const w = weekday(text);
  return w === 0 || w === 6;
}

function isHoliday(text) {
  return Object.prototype.hasOwnProperty.call(HOLIDAYS, text);
}

/* Arbeitstag = kein Wochenende und kein Feiertag. Nur diese kosten Urlaub. */
function isWorkday(text) {
  return !isWeekend(text) && !isHoliday(text);
}

function schoolHoliday(text) {
  return SCHOOL_HOLIDAYS.find(f => text >= f.from && text <= f.to) || null;
}

function daysInMonth(month) {
  return new Date(Date.UTC(YEAR, month + 1, 0)).getUTCDate();
}

function isInYear(text) {
  return /^\d{4}-\d{2}-\d{2}$/.test(text) && text.startsWith(YEAR + '-');
}

/* Heutiges Datum (Ortszeit des Computers) */
function todayIso() {
  if (TODAY_OVERRIDE) return TODAY_OVERRIDE;
  const now = new Date();
  return now.getFullYear() + '-' + String(now.getMonth() + 1).padStart(2, '0') + '-' +
    String(now.getDate()).padStart(2, '0');
}

/* Vergangene Tage (vor heute) sind gesperrt */
function isPast(text) {
  return text < todayIso();
}

/* Alle Tage von "from" bis "to" (beide eingeschlossen) */
function rangeDays(from, to) {
  const result = [];
  let current = parseIso(from);
  const end = parseIso(to);
  while (current <= end) {
    result.push(current.toISOString().slice(0, 10));
    current = new Date(current.getTime() + 86400000);
  }
  return result;
}

function formatDate(text) {
  const [y, m, d] = text.split('-');
  return d + '.' + m + '.' + y;
}

/* "TT.MM.JJJJ" (oder "JJJJ-MM-TT") in "JJJJ-MM-TT" umwandeln. Ungültig: '' */
function parseGermanDate(text) {
  const value = text.trim();
  let y, m, d;
  let match = /^(\d{1,2})\.(\d{1,2})\.(\d{4})$/.exec(value);
  if (match) {
    [, d, m, y] = match.map(Number);
  } else {
    match = /^(\d{4})-(\d{2})-(\d{2})$/.exec(value);
    if (!match) return '';
    [, y, m, d] = match.map(Number);
  }
  const date = new Date(Date.UTC(y, m - 1, d));
  if (date.getUTCFullYear() !== y || date.getUTCMonth() !== m - 1 || date.getUTCDate() !== d) return '';
  return date.toISOString().slice(0, 10);
}

function formatDateLong(text) {
  return WEEKDAYS[weekday(text)] + ', ' + formatDate(text);
}

function formatRange(from, to) {
  return from === to ? formatDate(from) : formatDate(from) + ' – ' + formatDate(to);
}

function daysText(n) {
  return n === 1 ? '1 Urlaubstag' : n + ' Urlaubstage';
}

/* =========================================================
   Rechnen
   ========================================================= */

/* Neue Urlaubstage in einem Zeitraum (nur Arbeitstage, die noch nicht eingetragen sind) */
function newDaysInRange(person, from, to) {
  return rangeDays(from, to).filter(d => isWorkday(d) && !person.days.includes(d));
}

function remaining(person) {
  return ALLOWANCE - person.days.length;
}

/* Status eines Urlaubstags: 'pend' = offen, 'ok' = genehmigt */
function statusOf(person, day) {
  return person.approved.includes(day) ? 'ok' : 'pend';
}

/* Neue Tage hinzufügen. Sie sind immer erst "offen". */
function addDays(person, days) {
  person.days = [...new Set([...person.days, ...days])].sort();
}

/* Tage löschen, für die test(tag) wahr ist */
function removeDays(person, test) {
  person.days = person.days.filter(d => !test(d));
  person.approved = person.approved.filter(d => person.days.includes(d));
}

/* Wer ist an welchem Tag weg? Ergebnis: Map Tag -> Liste der Namen.
   Offene und genehmigte Wünsche zählen beide. */
function absences(persons) {
  const map = new Map();
  for (const p of persons) {
    for (const d of p.days) {
      if (!map.has(d)) map.set(d, []);
      map.get(d).push(p.name);
    }
  }
  return map;
}

function criticalDays(persons) {
  return [...absences(persons)]
    .filter(([, names]) => names.length >= CRITICAL_FROM)
    .sort(([a], [b]) => (a < b ? -1 : 1));
}

/* Fasst Urlaubstage einer Person zu Wünschen (Blöcken) zusammen.
   Zwei Tage gehören zusammen, wenn sie denselben Status haben und
   dazwischen nur Wochenenden oder Feiertage liegen. */
function vacationBlocks(person) {
  const blocks = [];
  let current = null;
  for (const d of [...person.days].sort()) {
    const status = statusOf(person, d);
    if (current && current.status === status &&
        rangeDays(current.to, d).slice(1, -1).every(x => !isWorkday(x))) {
      current.to = d;
      current.days.push(d);
    } else {
      current = { from: d, to: d, status, days: [d] };
      blocks.push(current);
    }
  }
  return blocks;
}

/* Alle Wünsche aller Personen mit einem bestimmten Status, nach Datum sortiert */
function allWishes(status) {
  return state.persons
    .flatMap(p => vacationBlocks(p).filter(b => b.status === status).map(b => ({ ...b, person: p })))
    .sort((a, b) => (a.from < b.from ? -1 : a.from > b.from ? 1 : 0));
}

/* =========================================================
   Speichern und Laden
   ========================================================= */
let state = { persons: [], currentId: '' };

function loadState() {
  const empty = { persons: [], currentId: '' };
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (!raw) return empty;
    const data = JSON.parse(raw);
    if (!data || !Array.isArray(data.persons)) return empty;
    const persons = data.persons
      .filter(p => p && typeof p.name === 'string' && Array.isArray(p.days))
      .slice(0, MAX_PERSONS)
      .map(p => {
        const days = [...new Set(p.days.filter(d => typeof d === 'string' && isInYear(d) && isWorkday(d)))]
          .sort()
          .slice(0, ALLOWANCE);
        const approved = Array.isArray(p.approved) ? p.approved.filter(d => days.includes(d)) : [];
        return { id: String(p.id), name: p.name.slice(0, MAX_NAME), admin: p.admin === true, days, approved };
      });
    const currentId = persons.some(p => p.id === data.currentId) ? data.currentId : '';
    return { persons, currentId };
  } catch (e) {
    return empty;
  }
}

function saveState() {
  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(state));
  } catch (e) {
    showToast('Speichern hat nicht geklappt. Erlaubt der Browser das Speichern?', true);
  }
}

function newId() {
  return 'p' + Date.now().toString(36) + Math.random().toString(36).slice(2, 7);
}

function findPerson(id) {
  return state.persons.find(p => p.id === id) || null;
}

/* =========================================================
   Wer bist du? / Admin
   ========================================================= */
function currentUser() {
  return findPerson(state.currentId);
}

function isAdminUser() {
  const user = currentUser();
  return !!(user && user.admin);
}

/* Solange es keinen Admin gibt, darf jeder einen Admin bestimmen.
   Danach darf das nur noch ein Admin. */
function canChangeAdmin() {
  return !state.persons.some(p => p.admin) || isAdminUser();
}

function renderWhoAmI() {
  const select = $('whoami');
  select.innerHTML = '<option value="">– Bitte wählen –</option>' + state.persons.map(p =>
    '<option value="' + escapeHtml(p.id) + '">' + escapeHtml(p.name) + (p.admin ? ' (Admin)' : '') + '</option>'
  ).join('');
  select.value = state.currentId;
  select.disabled = state.persons.length === 0;

  const user = currentUser();
  const role = $('whoami-role');
  role.textContent = user ? (user.admin ? 'Admin' : 'Teammitglied') : '';
  role.className = 'badge' + (user ? (user.admin ? ' badge-admin' : ' badge-member') : '');
  role.hidden = !user;
}

function onWhoAmIChange() {
  state.currentId = $('whoami').value;
  saveState();
  render();
  if (state.currentId) {
    $('vac-person').value = state.currentId;
    updatePreview();
  }
}

/* =========================================================
   Anzeige-Hilfen
   ========================================================= */
const $ = id => document.getElementById(id);

function escapeHtml(text) {
  return String(text)
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#39;');
}

function showMsg(element, text, type) {
  element.textContent = text;
  element.className = 'msg' + (type ? ' ' + type : '');
}

let toastTimer = null;
function showToast(text, isError) {
  const toast = $('toast');
  toast.textContent = text;
  toast.className = 'toast show' + (isError ? ' error' : '');
  clearTimeout(toastTimer);
  toastTimer = setTimeout(() => { toast.className = 'toast'; }, 3500);
}

function avatarHtml(person) {
  return '<span class="avatar avatar-' + (state.persons.indexOf(person) % 5) + '" aria-hidden="true">' +
    escapeHtml(person.name.trim().charAt(0).toUpperCase()) + '</span>';
}

function statusBadge(status) {
  return '<span class="badge badge-' + status + '">' + STATUS_SYMBOL[status] + ' ' + STATUS_TEXT[status] + '</span>';
}

/* =========================================================
   Personen
   ========================================================= */
function validateName(rawName, exceptId) {
  const name = rawName.trim();
  if (!name) return 'Bitte gib einen Namen ein.';
  if (name.length > MAX_NAME) return 'Der Name darf höchstens ' + MAX_NAME + ' Zeichen lang sein.';
  const taken = state.persons.some(p => p.id !== exceptId && p.name.toLowerCase() === name.toLowerCase());
  if (taken) return 'Diesen Namen gibt es schon.';
  return '';
}

function onAddPerson(event) {
  event.preventDefault();
  const input = $('person-name');
  const msg = $('person-msg');

  if (state.persons.length >= MAX_PERSONS) {
    showMsg(msg, 'Es sind schon ' + MAX_PERSONS + ' Personen angelegt. Mehr geht nicht.', 'error');
    return;
  }
  const error = validateName(input.value);
  if (error) {
    showMsg(msg, error, 'error');
    input.focus();
    return;
  }
  const name = input.value.trim();
  state.persons.push({ id: newId(), name, admin: false, days: [], approved: [] });
  saveState();
  input.value = '';
  showMsg(msg, name + ' wurde angelegt.', 'ok');
  render();
}

function onPersonListClick(event) {
  const button = event.target.closest('button[data-action]');
  if (!button) return;
  const person = findPerson(button.dataset.id);
  if (!person) return;
  const msg = $('person-msg');
  const action = button.dataset.action;

  if (action === 'rename') {
    const answer = prompt('Neuer Name für ' + person.name + ':', person.name);
    if (answer === null) return;
    const error = validateName(answer, person.id);
    if (error) {
      showMsg(msg, error, 'error');
      return;
    }
    const oldName = person.name;
    person.name = answer.trim();
    saveState();
    showMsg(msg, oldName + ' heißt jetzt ' + person.name + '.', 'ok');
    render();
  }

  if (action === 'toggle-admin') {
    if (!canChangeAdmin()) {
      showMsg(msg, 'Nur ein Admin darf Admins bestimmen. Wähle oben bei „Wer bist du?“ einen Admin.', 'error');
      return;
    }
    person.admin = !person.admin;
    saveState();
    showMsg(msg, person.name + (person.admin ? ' ist jetzt Admin.' : ' ist kein Admin mehr.'), 'ok');
    render();
  }

  if (action === 'delete') {
    const ok = confirm(person.name + ' wirklich löschen?\nAlle Urlaubstage von ' + person.name + ' werden auch gelöscht.');
    if (!ok) return;
    state.persons = state.persons.filter(p => p.id !== person.id);
    if (state.currentId === person.id) state.currentId = '';
    saveState();
    showMsg(msg, person.name + ' wurde gelöscht.', 'ok');
    render();
  }

  if (action === 'remove-block') {
    const from = button.dataset.from;
    const to = button.dataset.to;
    const inBlock = d => d >= from && d <= to && !isPast(d);
    if (person.days.some(d => inBlock(d) && statusOf(person, d) === 'ok')) {
      if (!confirm('Dieser Urlaub ist schon genehmigt. Trotzdem löschen?')) return;
    }
    const before = person.days.length;
    removeDays(person, inBlock);
    const removed = before - person.days.length;
    saveState();
    showMsg(msg, daysText(removed) + ' von ' + person.name + ' gelöscht. Rest: ' + remaining(person) + '.' +
      (person.days.some(d => d >= from && d <= to) ? ' Vergangene Tage bleiben stehen.' : ''), 'ok');
    render();
  }
}

function renderPersons() {
  const list = $('person-list');
  const openIds = new Set([...list.querySelectorAll('details[open]')].map(d => d.dataset.id));

  if (state.persons.length === 0) {
    list.innerHTML = '<li class="empty">Noch keine Personen angelegt.</li>';
    return;
  }

  const adminAllowed = canChangeAdmin();

  list.innerHTML = state.persons.map(p => {
    const taken = p.days.length;
    const approved = p.approved.length;
    const rest = remaining(p);
    const id = escapeHtml(p.id);
    const name = escapeHtml(p.name);
    const blocks = vacationBlocks(p);

    const entries = blocks.map(b => {
      const range = formatRange(b.from, b.to);
      const canDelete = b.days.some(d => !isPast(d));
      return '<li><span>' + range + ' · ' + daysText(b.days.length) + ' ' + statusBadge(b.status) + '</span>' +
        (canDelete
          ? '<button type="button" class="secondary danger" data-action="remove-block" data-id="' + id +
            '" data-from="' + b.from + '" data-to="' + b.to + '" aria-label="Urlaub ' + range + ' von ' + name +
            ' löschen">Löschen</button>'
          : '<span class="locked">vergangen</span>') +
        '</li>';
    }).join('');

    const adminButton = '<button type="button" class="secondary" data-action="toggle-admin" data-id="' + id + '"' +
      ' aria-pressed="' + p.admin + '"' +
      (adminAllowed ? '' : ' disabled title="Nur ein Admin darf Admins bestimmen."') + '>' +
      (p.admin ? 'Admin entfernen' : 'Zum Admin machen') + '</button>';

    return '<li class="person">' +
      '<div class="person-head">' +
        avatarHtml(p) +
        '<span class="person-name">' + name + (p.admin ? ' <span class="badge badge-admin">Admin</span>' : '') + '</span>' +
        '<span class="person-count' + (rest === 0 ? ' none' : '') + '">' + taken + ' von ' + ALLOWANCE +
          ' (' + approved + ' genehmigt) · Rest ' + rest + '</span>' +
        '<span class="person-actions">' +
          '<button type="button" class="secondary" data-action="rename" data-id="' + id + '">Umbenennen</button>' +
          adminButton +
          '<button type="button" class="secondary danger" data-action="delete" data-id="' + id + '">Löschen</button>' +
        '</span>' +
      '</div>' +
      '<div class="bar" aria-hidden="true">' +
        '<span class="bar-ok" style="width:' + Math.round(approved / ALLOWANCE * 100) + '%"></span>' +
        '<span class="bar-pend" style="width:' + Math.round((taken - approved) / ALLOWANCE * 100) + '%"></span>' +
      '</div>' +
      (blocks.length
        ? '<details data-id="' + id + '"' + (openIds.has(p.id) ? ' open' : '') + '><summary>Einträge (' +
          blocks.length + ')</summary><ul class="entries">' + entries + '</ul></details>'
        : '') +
      '</li>';
  }).join('');
}

/* =========================================================
   Urlaub eintragen (Formular)
   ========================================================= */
function renderPersonSelect() {
  const select = $('vac-person');
  const current = select.value || state.currentId;
  if (state.persons.length === 0) {
    select.innerHTML = '<option value="">Erst eine Person anlegen</option>';
    select.disabled = true;
    $('vac-submit').disabled = true;
    return;
  }
  select.disabled = false;
  $('vac-submit').disabled = false;
  select.innerHTML = state.persons.map(p =>
    '<option value="' + escapeHtml(p.id) + '">' + escapeHtml(p.name) + ' (Rest ' + remaining(p) + ')</option>'
  ).join('');
  if (findPerson(current)) select.value = current;
}

/* Frühester Tag, der noch gewählt werden darf */
function firstAllowedDay() {
  const today = todayIso();
  return today > isoDate(0, 1) ? today : isoDate(0, 1);
}

function readVacationForm() {
  const person = findPerson($('vac-person').value);
  const fromText = $('vac-from').value.trim();
  const toText = $('vac-to').value.trim();
  const from = parseGermanDate(fromText);
  const to = toText ? parseGermanDate(toText) : from;

  if (!person) return { error: 'Bitte lege zuerst eine Person an.' };
  if (!fromText) return { error: 'Bitte gib ein Startdatum ein.' };
  if (!from || !to) return { error: 'Bitte das Datum so eingeben: TT.MM.JJJJ (zum Beispiel 15.03.2027).' };
  if (!isInYear(from) || !isInYear(to)) return { error: 'Bitte nur Tage im Jahr ' + YEAR + ' wählen.' };
  if (to < from) return { error: 'Das Enddatum liegt vor dem Startdatum.' };
  if (isPast(from)) {
    return { error: 'Vergangene Tage können nicht mehr gewählt werden. Frühestens: ' + formatDate(firstAllowedDay()) + '.' };
  }

  return { person, from, to, newDays: newDaysInRange(person, from, to) };
}

function updatePreview() {
  const preview = $('vac-preview');
  preview.className = 'preview';
  if (!$('vac-from').value.trim()) {
    preview.textContent = '';
    return;
  }
  const r = readVacationForm();
  if (r.error) {
    preview.textContent = r.error;
    preview.className = 'preview warn';
    return;
  }
  const n = r.newDays.length;
  const rest = remaining(r.person);
  if (n === 0) {
    preview.textContent = 'In diesem Zeitraum gibt es keine neuen Arbeitstage.';
  } else if (n > rest) {
    preview.textContent = 'Das kostet ' + daysText(n) + '. ' + r.person.name + ' hat nur noch ' + rest + '.';
    preview.className = 'preview warn';
  } else {
    preview.textContent = 'Das kostet ' + daysText(n) + '. Danach bleiben noch ' + (rest - n) + '.';
  }
  const holidays = rangeDays(r.from, r.to).filter(d => isHoliday(d) && !isWeekend(d));
  if (holidays.length) {
    preview.textContent += ' Feiertage im Zeitraum (kosten nichts): ' +
      holidays.map(d => formatDate(d).slice(0, 6) + ' ' + HOLIDAYS[d]).join(', ') + '.';
  }
}

function onAddVacation(event) {
  event.preventDefault();
  const msg = $('vac-msg');
  const r = readVacationForm();

  if (r.error) {
    showMsg(msg, r.error, 'error');
    return;
  }
  const n = r.newDays.length;
  if (n === 0) {
    showMsg(msg, 'In diesem Zeitraum gibt es keine neuen Arbeitstage.', 'error');
    return;
  }
  if (n > remaining(r.person)) {
    showMsg(msg, 'Nicht genug Resturlaub. ' + r.person.name + ' hat nur noch ' + remaining(r.person) +
      ', der Zeitraum kostet ' + n + '.', 'error');
    return;
  }

  addDays(r.person, r.newDays);
  saveState();

  const abs = absences(state.persons);
  const critical = r.newDays.filter(d => abs.get(d).length >= CRITICAL_FROM).length;
  let text = daysText(n) + ' für ' + r.person.name + ' als Wunsch eingetragen (noch nicht genehmigt). Rest: ' +
    remaining(r.person) + '.';
  if (critical > 0) {
    text += ' Achtung: ' + (critical === 1 ? '1 Tag ist' : critical + ' Tage sind') + ' jetzt kritisch.';
  }
  showMsg(msg, text, critical > 0 ? 'error' : 'ok');

  $('vac-from').value = '';
  $('vac-to').value = '';
  closePicker(false);
  render();
}

/* =========================================================
   Kritische Tage
   ========================================================= */
function renderCritical() {
  const days = criticalDays(state.persons);
  const section = $('critical-section');
  section.hidden = days.length === 0;
  $('critical-list').innerHTML = days.map(([day, names]) =>
    '<li><strong>' + formatDateLong(day) + ':</strong> ' + escapeHtml(names.join(', ')) +
    ' (' + names.length + ' Personen)</li>'
  ).join('');
}

/* =========================================================
   Admin-Bereich
   ========================================================= */
function wishItem(wish, withActions) {
  const p = wish.person;
  const range = formatRange(wish.from, wish.to);
  const data = ' data-id="' + escapeHtml(p.id) + '" data-from="' + wish.from + '" data-to="' + wish.to + '"';
  return '<li class="wish">' +
    avatarHtml(p) +
    '<span class="wish-text"><strong>' + escapeHtml(p.name) + '</strong><span>' + range + ' · ' +
      daysText(wish.days.length) + '</span></span>' +
    statusBadge(wish.status) +
    (withActions
      ? '<span class="wish-actions">' +
          '<button type="button" class="approve" data-action="approve"' + data +
            ' aria-label="Urlaub von ' + escapeHtml(p.name) + ', ' + range + ' genehmigen">Genehmigen</button>' +
          '<button type="button" class="secondary danger" data-action="reject"' + data +
            ' aria-label="Urlaub von ' + escapeHtml(p.name) + ', ' + range + ' ablehnen">Ablehnen</button>' +
        '</span>'
      : '') +
    '</li>';
}

function renderAdmin() {
  const section = $('admin-section');
  section.hidden = !isAdminUser();
  if (section.hidden) return;

  const pending = allWishes('pend');
  const approved = allWishes('ok');
  $('pending-count').textContent = pending.length;
  $('pending-list').innerHTML = pending.length
    ? pending.map(w => wishItem(w, true)).join('')
    : '<li class="empty">Keine offenen Urlaubswünsche.</li>';
  $('approved-list').innerHTML = approved.length
    ? approved.map(w => wishItem(w, false)).join('')
    : '<li class="empty">Noch nichts genehmigt.</li>';
}

function onAdminClick(event) {
  const button = event.target.closest('button[data-action]');
  if (!button || !isAdminUser()) return;
  const person = findPerson(button.dataset.id);
  if (!person) return;
  const from = button.dataset.from;
  const to = button.dataset.to;
  const range = formatRange(from, to);
  const msg = $('admin-msg');

  if (button.dataset.action === 'approve') {
    const days = person.days.filter(d => d >= from && d <= to);
    person.approved = [...new Set([...person.approved, ...days])].sort();
    saveState();
    showMsg(msg, 'Urlaub von ' + person.name + ' (' + range + ') ist genehmigt.', 'ok');
    render();
  }

  if (button.dataset.action === 'reject') {
    if (!confirm('Urlaubswunsch von ' + person.name + ' (' + range + ') ablehnen?\nDie Tage werden gelöscht und gehen zurück aufs Urlaubskonto.')) return;
    removeDays(person, d => d >= from && d <= to && statusOf(person, d) === 'pend');
    saveState();
    showMsg(msg, 'Urlaub von ' + person.name + ' (' + range + ') wurde abgelehnt. Rest: ' + remaining(person) + '.', 'ok');
    render();
  }
}

/* =========================================================
   Übersicht (12 Monatstabellen)
   ========================================================= */
function dayInfo(day, abs) {
  const names = abs.get(day) || [];
  const info = {
    day,
    num: Number(day.slice(8)),
    wd: WEEKDAYS[weekday(day)],
    weekend: isWeekend(day),
    holiday: isHoliday(day) ? HOLIDAYS[day] : '',
    school: schoolHoliday(day),
    past: isPast(day),
    count: names.length,
    critical: names.length >= CRITICAL_FROM
  };
  const cls = [];
  if (info.school) cls.push('school');
  if (info.critical) cls.push('crit');
  if (info.weekend) cls.push('we');
  if (info.holiday) cls.push('hol');
  if (info.past) cls.push('past');
  info.cls = cls.join(' ');
  return info;
}

function renderOverview() {
  const box = $('overview');
  if (state.persons.length === 0) {
    box.innerHTML = '<p class="empty">Lege zuerst eine Person an. Dann erscheint hier die Übersicht.</p>';
    return;
  }

  const abs = absences(state.persons);
  let html = '';

  for (let m = 0; m < 12; m++) {
    const infos = [];
    for (let d = 1; d <= daysInMonth(m); d++) infos.push(dayInfo(isoDate(m, d), abs));

    html += '<section class="month-block"><h3>' + MONTHS[m] + ' ' + YEAR + '</h3>' +
      '<div class="table-wrap"><table class="month"><thead><tr>' +
      '<th scope="col" class="name-col">Person</th>';

    for (const i of infos) {
      const title = [i.holiday, i.school ? i.school.name : '', i.critical ? 'Kritisch' : '', i.past ? 'Vergangen' : '']
        .filter(Boolean).join(' · ');
      html += '<th scope="col" class="' + i.cls + '"' + (title ? ' title="' + escapeHtml(title) + '"' : '') + '>' +
        '<span class="d">' + i.num + '</span><span class="wd">' + i.wd + '</span></th>';
    }
    html += '</tr></thead><tbody>';

    for (const p of state.persons) {
      const days = new Set(p.days);
      const approved = new Set(p.approved);
      html += '<tr><th scope="row" class="name-col" title="' + escapeHtml(p.name) + '">' + escapeHtml(p.name) + '</th>';
      for (const i of infos) {
        if (i.weekend || i.holiday) {
          html += '<td class="' + i.cls + '">' + (i.holiday ? 'F' : '') + '</td>';
          continue;
        }
        const status = days.has(i.day) ? (approved.has(i.day) ? 'ok' : 'pend') : '';
        if (i.past) {
          /* Vergangen: nur anzeigen, nicht mehr änderbar */
          html += '<td class="' + i.cls + (status ? ' v-' + status : '') + '"' +
            (status ? ' title="Urlaub (' + STATUS_TEXT[status] + '), vergangen"' : '') + '>' +
            (status ? STATUS_SYMBOL[status] : '') + '</td>';
        } else {
          const label = p.name + ', ' + formatDateLong(i.day) + ': ' +
            (status ? 'Urlaub (' + STATUS_TEXT[status] + ')' : 'kein Urlaub');
          html += '<td class="' + i.cls + '"><button type="button" class="cell' + (status ? ' v-' + status : '') +
            '" data-id="' + escapeHtml(p.id) + '" data-day="' + i.day + '" aria-pressed="' + !!status +
            '" aria-label="' + escapeHtml(label) + '">' + (status ? STATUS_SYMBOL[status] : '') + '</button></td>';
        }
      }
      html += '</tr>';
    }

    html += '</tbody><tfoot><tr><th scope="row" class="name-col">Abwesend</th>';
    for (const i of infos) {
      const text = i.count === 0 ? '' : (i.critical ? i.count + '!' : String(i.count));
      html += '<td class="' + i.cls + '">' + text + '</td>';
    }
    html += '</tr></tfoot></table></div>';

    const monthHolidays = infos.filter(i => i.holiday);
    if (monthHolidays.length) {
      html += '<p class="month-holidays"><span class="sw sw-hol">F</span><strong>Feiertage:</strong> ' +
        monthHolidays.map(i => i.wd + ' ' + formatDate(i.day).slice(0, 6) + ' ' + escapeHtml(i.holiday)).join(' · ') +
        '</p>';
    }
    html += '</section>';
  }

  box.innerHTML = html;
}

function onOverviewClick(event) {
  const button = event.target.closest('button.cell');
  if (!button) return;
  const person = findPerson(button.dataset.id);
  const day = button.dataset.day;
  if (!person || !isWorkday(day)) return;
  if (isPast(day)) {
    showToast('Vergangene Tage können nicht mehr geändert werden.', true);
    return;
  }

  if (person.days.includes(day)) {
    if (statusOf(person, day) === 'ok' && !confirm('Dieser Tag ist schon genehmigt. Trotzdem löschen?')) return;
    removeDays(person, d => d === day);
  } else {
    if (remaining(person) <= 0) {
      showToast(person.name + ' hat keinen Resturlaub mehr.', true);
      return;
    }
    addDays(person, [day]);
    const count = absences(state.persons).get(day).length;
    if (count >= CRITICAL_FROM) {
      showToast('Achtung: Am ' + formatDate(day) + ' sind jetzt ' + count + ' Personen im Urlaub.', true);
    }
  }
  saveState();
  render();

  /* Fokus auf dasselbe Feld zurücksetzen (wichtig für Tastatur-Bedienung) */
  const again = $('overview').querySelector('button[data-id="' + person.id + '"][data-day="' + day + '"]');
  if (again) again.focus();
}

/* =========================================================
   Start
   ========================================================= */
function render() {
  renderWhoAmI();
  renderPersons();
  renderPersonSelect();
  renderCritical();
  renderAdmin();
  renderOverview();
  updatePreview();
}

function init() {
  state = loadState();

  $('whoami').addEventListener('change', onWhoAmIChange);
  $('person-form').addEventListener('submit', onAddPerson);
  $('person-list').addEventListener('click', onPersonListClick);
  $('vacation-form').addEventListener('submit', onAddVacation);
  $('admin-section').addEventListener('click', onAdminClick);
  $('overview').addEventListener('click', onOverviewClick);

  for (const id of ['vac-person', 'vac-from', 'vac-to']) {
    $(id).addEventListener('input', updatePreview);
    $(id).addEventListener('change', updatePreview);
  }
  $('vac-from').addEventListener('change', syncToWithFrom);

  initPicker();
  render();
}

/* Wenn "Von" gültig ist und "Bis" leer oder davor liegt: "Bis" gleich "Von" setzen */
function syncToWithFrom() {
  const from = parseGermanDate($('vac-from').value);
  if (!from) return;
  const to = parseGermanDate($('vac-to').value);
  if (!to || to < from) $('vac-to').value = formatDate(from);
  updatePreview();
}

/* =========================================================
   Eigene Kalenderauswahl (zeigt Feiertage farbig)
   ========================================================= */
const picker = { inputId: null, month: 0, focusDay: null };

function initPicker() {
  document.querySelectorAll('.picker-btn').forEach(btn => {
    btn.addEventListener('click', () => {
      if (picker.inputId === btn.dataset.for) closePicker(true);
      else openPicker(btn.dataset.for);
    });
  });
  $('picker-prev').addEventListener('click', () => changePickerMonth(-1));
  $('picker-next').addEventListener('click', () => changePickerMonth(1));
  $('picker-grid').addEventListener('click', event => {
    const btn = event.target.closest('button.pday');
    if (btn) choosePickerDay(btn.dataset.day);
  });
  $('picker-grid').addEventListener('keydown', onPickerKey);
  $('picker').addEventListener('keydown', event => {
    if (event.key === 'Escape') {
      event.preventDefault();
      closePicker(true);
    }
  });
  document.addEventListener('mousedown', event => {
    if (picker.inputId && !event.target.closest('#picker') && !event.target.closest('.picker-btn')) closePicker(false);
  });
}

function openPicker(inputId) {
  const input = $(inputId);
  /* Startmonat: gewähltes Datum, sonst "Von"-Datum, sonst heute (bzw. Januar) */
  const start = parseGermanDate(input.value) || parseGermanDate($('vac-from').value);
  const fallback = isInYear(firstAllowedDay()) ? firstAllowedDay() : isoDate(11, 31);
  const startDay = start && isInYear(start) ? start : fallback;

  picker.inputId = inputId;
  picker.month = Number(startDay.slice(5, 7)) - 1;
  picker.focusDay = startDay;

  const box = $('picker');
  input.parentElement.appendChild(box);
  box.hidden = false;
  document.querySelectorAll('.picker-btn').forEach(b =>
    b.setAttribute('aria-expanded', String(b.dataset.for === inputId)));
  renderPicker(true);
}

function closePicker(returnFocus) {
  const id = picker.inputId;
  picker.inputId = null;
  $('picker').hidden = true;
  document.querySelectorAll('.picker-btn').forEach(b => b.setAttribute('aria-expanded', 'false'));
  if (returnFocus && id) $(id).focus();
}

function changePickerMonth(step) {
  const month = Math.min(11, Math.max(0, picker.month + step));
  if (month === picker.month) return;
  picker.month = month;
  picker.focusDay = isoDate(month, 1);
  renderPicker(false);
}

function renderPicker(moveFocus) {
  const m = picker.month;
  $('picker-title').textContent = MONTHS[m] + ' ' + YEAR;
  $('picker-prev').disabled = m === 0;
  $('picker-next').disabled = m === 11;

  const selected = parseGermanDate($(picker.inputId).value);
  const from = parseGermanDate($('vac-from').value);
  const to = parseGermanDate($('vac-to').value);

  let html = ['Mo', 'Di', 'Mi', 'Do', 'Fr', 'Sa', 'So']
    .map(w => '<span class="wd-head" aria-hidden="true">' + w + '</span>').join('');

  /* Leere Felder vor dem 1. (Woche beginnt am Montag) */
  const firstWeekday = (weekday(isoDate(m, 1)) + 6) % 7;
  for (let i = 0; i < firstWeekday; i++) html += '<span></span>';

  const holidays = [];
  for (let d = 1; d <= daysInMonth(m); d++) {
    const day = isoDate(m, d);
    const school = schoolHoliday(day);
    const holiday = isHoliday(day) ? HOLIDAYS[day] : '';
    const past = isPast(day);
    if (holiday) holidays.push(d + '. ' + holiday);

    const cls = ['pday'];
    if (school) cls.push('school');
    if (isWeekend(day)) cls.push('we');
    if (holiday) cls.push('hol');
    if (past) cls.push('past');
    if (from && to && day >= from && day <= to) cls.push('in-range');
    if (day === selected) cls.push('selected');

    const info = [holiday, school ? school.name : '', past ? 'vergangen, nicht wählbar' : ''].filter(Boolean).join(', ');
    const label = formatDateLong(day) + (info ? ' – ' + info : '');
    html += '<button type="button" class="' + cls.join(' ') + '" data-day="' + day + '"' +
      ' tabindex="' + (day === picker.focusDay ? '0' : '-1') + '"' +
      (past ? ' aria-disabled="true"' : '') +
      ' aria-label="' + escapeHtml(label) + '"' + (info ? ' title="' + escapeHtml(info) + '"' : '') + '>' +
      d + (holiday ? '<span class="mark" aria-hidden="true">F</span>' : '') + '</button>';
  }

  $('picker-grid').innerHTML = html;
  $('picker-info').textContent = holidays.length ? 'Feiertage: ' + holidays.join(', ') : '';

  if (moveFocus) {
    const btn = $('picker-grid').querySelector('button[data-day="' + picker.focusDay + '"]');
    if (btn) btn.focus();
  }
}

/* Pfeiltasten: Tag vor/zurück, Woche hoch/runter */
function onPickerKey(event) {
  const steps = { ArrowLeft: -1, ArrowRight: 1, ArrowUp: -7, ArrowDown: 7 };
  if (!(event.key in steps)) return;
  event.preventDefault();
  const next = new Date(parseIso(picker.focusDay).getTime() + steps[event.key] * 86400000)
    .toISOString().slice(0, 10);
  if (!isInYear(next)) return;
  picker.focusDay = next;
  picker.month = Number(next.slice(5, 7)) - 1;
  renderPicker(true);
}

function choosePickerDay(day) {
  if (isPast(day)) return;   // vergangene Tage sind gesperrt
  const inputId = picker.inputId;
  $(inputId).value = formatDate(day);
  closePicker(true);
  if (inputId === 'vac-from') syncToWithFrom();
  else updatePreview();
}

if (typeof document !== 'undefined') init();
