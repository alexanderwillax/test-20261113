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

function formatDateLong(text) {
  return WEEKDAYS[weekday(text)] + ', ' + formatDate(text);
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

/* Wer ist an welchem Tag weg? Ergebnis: Map Tag -> Liste der Namen */
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

/* Fasst Urlaubstage zu Blöcken zusammen.
   Zwei Tage gehören zusammen, wenn dazwischen nur Wochenenden oder Feiertage liegen. */
function vacationBlocks(days) {
  const sorted = [...days].sort();
  const blocks = [];
  let current = null;
  for (const d of sorted) {
    if (current && rangeDays(current.to, d).slice(1, -1).every(x => !isWorkday(x))) {
      current.to = d;
      current.count++;
    } else {
      current = { from: d, to: d, count: 1 };
      blocks.push(current);
    }
  }
  return blocks;
}

/* =========================================================
   Speichern und Laden
   ========================================================= */
let state = { persons: [] };

function loadState() {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (!raw) return { persons: [] };
    const data = JSON.parse(raw);
    if (!data || !Array.isArray(data.persons)) return { persons: [] };
    const persons = data.persons
      .filter(p => p && typeof p.name === 'string' && Array.isArray(p.days))
      .slice(0, MAX_PERSONS)
      .map(p => ({
        id: String(p.id),
        name: p.name.slice(0, MAX_NAME),
        days: [...new Set(p.days.filter(d => typeof d === 'string' && isInYear(d) && isWorkday(d)))]
          .sort()
          .slice(0, ALLOWANCE)
      }));
    return { persons };
  } catch (e) {
    return { persons: [] };
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
  state.persons.push({ id: newId(), name, days: [] });
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

  if (action === 'delete') {
    const ok = confirm(person.name + ' wirklich löschen?\nAlle Urlaubstage von ' + person.name + ' werden auch gelöscht.');
    if (!ok) return;
    state.persons = state.persons.filter(p => p.id !== person.id);
    saveState();
    showMsg(msg, person.name + ' wurde gelöscht.', 'ok');
    render();
  }

  if (action === 'remove-block') {
    const from = button.dataset.from;
    const to = button.dataset.to;
    const before = person.days.length;
    person.days = person.days.filter(d => d < from || d > to);
    const removed = before - person.days.length;
    saveState();
    showMsg(msg, daysText(removed) + ' von ' + person.name + ' gelöscht. Rest: ' + remaining(person) + '.', 'ok');
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

  list.innerHTML = state.persons.map(p => {
    const taken = p.days.length;
    const rest = remaining(p);
    const id = escapeHtml(p.id);
    const name = escapeHtml(p.name);
    const blocks = vacationBlocks(p.days);
    const entries = blocks.map(b => {
      const range = b.from === b.to ? formatDate(b.from) : formatDate(b.from) + ' – ' + formatDate(b.to);
      return '<li><span>' + range + ' · ' + daysText(b.count) + '</span>' +
        '<button type="button" class="secondary danger" data-action="remove-block" data-id="' + id +
        '" data-from="' + b.from + '" data-to="' + b.to + '" aria-label="Urlaub ' + range + ' von ' + name +
        ' löschen">Löschen</button></li>';
    }).join('');

    return '<li class="person">' +
      '<div class="person-head">' +
        '<span class="person-name">' + name + '</span>' +
        '<span class="person-count' + (rest === 0 ? ' none' : '') + '">' + taken + ' von ' + ALLOWANCE +
          ' genommen · Rest ' + rest + '</span>' +
        '<span class="person-actions">' +
          '<button type="button" class="secondary" data-action="rename" data-id="' + id + '">Umbenennen</button>' +
          '<button type="button" class="secondary danger" data-action="delete" data-id="' + id + '">Löschen</button>' +
        '</span>' +
      '</div>' +
      '<div class="bar" aria-hidden="true"><span style="width:' + Math.round(taken / ALLOWANCE * 100) + '%"></span></div>' +
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
  const current = select.value;
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

function readVacationForm() {
  const person = findPerson($('vac-person').value);
  const from = $('vac-from').value;
  const to = $('vac-to').value || from;

  if (!person) return { error: 'Bitte lege zuerst eine Person an.' };
  if (!from) return { error: 'Bitte gib ein Startdatum ein.' };
  if (!isInYear(from) || !isInYear(to)) return { error: 'Bitte nur Tage im Jahr ' + YEAR + ' wählen.' };
  if (to < from) return { error: 'Das Enddatum liegt vor dem Startdatum.' };

  return { person, from, to, newDays: newDaysInRange(person, from, to) };
}

function updatePreview() {
  const preview = $('vac-preview');
  preview.className = 'preview';
  if (!$('vac-from').value) {
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

  r.person.days = [...r.person.days, ...r.newDays].sort();
  saveState();

  const abs = absences(state.persons);
  const critical = r.newDays.filter(d => abs.get(d).length >= CRITICAL_FROM).length;
  let text = daysText(n) + ' für ' + r.person.name + ' eingetragen. Rest: ' + remaining(r.person) + '.';
  if (critical > 0) {
    text += ' Achtung: ' + (critical === 1 ? '1 Tag ist' : critical + ' Tage sind') + ' jetzt kritisch.';
  }
  showMsg(msg, text, critical > 0 ? 'error' : 'ok');

  $('vac-from').value = '';
  $('vac-to').value = '';
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
    count: names.length,
    critical: names.length >= CRITICAL_FROM
  };
  const cls = [];
  if (info.school) cls.push('school');
  if (info.critical) cls.push('crit');
  if (info.weekend) cls.push('we');
  if (info.holiday) cls.push('hol');
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
  const daySets = new Map(state.persons.map(p => [p.id, new Set(p.days)]));
  let html = '';

  for (let m = 0; m < 12; m++) {
    const infos = [];
    for (let d = 1; d <= daysInMonth(m); d++) infos.push(dayInfo(isoDate(m, d), abs));

    html += '<section class="month-block"><h3>' + MONTHS[m] + ' ' + YEAR + '</h3>' +
      '<div class="table-wrap"><table class="month"><thead><tr>' +
      '<th scope="col" class="name-col">Person</th>';

    for (const i of infos) {
      const title = [i.holiday, i.school ? i.school.name : '', i.critical ? 'Kritisch' : '']
        .filter(Boolean).join(' · ');
      html += '<th scope="col" class="' + i.cls + '"' + (title ? ' title="' + escapeHtml(title) + '"' : '') + '>' +
        '<span class="d">' + i.num + '</span><span class="wd">' + i.wd + '</span></th>';
    }
    html += '</tr></thead><tbody>';

    for (const p of state.persons) {
      const set = daySets.get(p.id);
      html += '<tr><th scope="row" class="name-col" title="' + escapeHtml(p.name) + '">' + escapeHtml(p.name) + '</th>';
      for (const i of infos) {
        if (i.weekend || i.holiday) {
          html += '<td class="' + i.cls + '">' + (i.holiday ? 'F' : '') + '</td>';
        } else {
          const on = set.has(i.day);
          const label = p.name + ', ' + formatDateLong(i.day) + ': ' + (on ? 'Urlaub' : 'kein Urlaub');
          html += '<td class="' + i.cls + '"><button type="button" class="cell' + (on ? ' on' : '') +
            '" data-id="' + escapeHtml(p.id) + '" data-day="' + i.day + '" aria-pressed="' + on +
            '" aria-label="' + escapeHtml(label) + '">' + (on ? 'U' : '') + '</button></td>';
        }
      }
      html += '</tr>';
    }

    html += '</tbody><tfoot><tr><th scope="row" class="name-col">Abwesend</th>';
    for (const i of infos) {
      const text = i.count === 0 ? '' : (i.critical ? i.count + '!' : String(i.count));
      html += '<td class="' + i.cls + '">' + text + '</td>';
    }
    html += '</tr></tfoot></table></div></section>';
  }

  box.innerHTML = html;
}

function onOverviewClick(event) {
  const button = event.target.closest('button.cell');
  if (!button) return;
  const person = findPerson(button.dataset.id);
  const day = button.dataset.day;
  if (!person || !isWorkday(day)) return;

  if (person.days.includes(day)) {
    person.days = person.days.filter(d => d !== day);
  } else {
    if (remaining(person) <= 0) {
      showToast(person.name + ' hat keinen Resturlaub mehr.', true);
      return;
    }
    person.days = [...person.days, day].sort();
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
  renderPersons();
  renderPersonSelect();
  renderCritical();
  renderOverview();
  updatePreview();
}

function init() {
  state = loadState();

  $('person-form').addEventListener('submit', onAddPerson);
  $('person-list').addEventListener('click', onPersonListClick);
  $('vacation-form').addEventListener('submit', onAddVacation);
  $('overview').addEventListener('click', onOverviewClick);

  for (const id of ['vac-person', 'vac-from', 'vac-to']) {
    $(id).addEventListener('input', updatePreview);
    $(id).addEventListener('change', updatePreview);
  }
  /* Wenn "Von" gesetzt wird und "Bis" leer oder davor ist: "Bis" gleich "Von" setzen */
  $('vac-from').addEventListener('change', () => {
    const to = $('vac-to');
    if (!to.value || to.value < $('vac-from').value) to.value = $('vac-from').value;
    updatePreview();
  });

  render();
}

if (typeof document !== 'undefined') init();
