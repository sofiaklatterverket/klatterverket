/**
 * Klätterverket Academy — framstegsregister
 *
 * Tar emot medarbetarnas framsteg från Academy och sparar dem i det här
 * kalkylarket. Tre flikar skapas automatiskt:
 *
 *   Händelser  en rad per sak som hänt: lektion klar, prov godkänt, kurs klar …
 *   Personer   en rad per medarbetare: e-post, namn, anläggning
 *   Nycklar    rapportnycklarna — en för alla, en per anläggning
 *
 * Så installeras det (en gång):
 *   1. Tillägg → Apps Script. Ersätt allt i Kod.gs med den här filen. Spara.
 *   2. Välj funktionen "installera" i listan överst och tryck Kör.
 *      Godkänn behörigheterna (Google frågar första gången).
 *   3. Driftsätt → Ny driftsättning → typ: Webbapp.
 *      Kör som: Jag.  Vem har åtkomst: Alla.  Driftsätt.
 *   4. Kopiera webbappens adress (slutar på /exec) och klistra in den i
 *      Academy: redaktören → Inställningar → Framstegsregister. Spara.
 *
 * Ändrar du i skriptet senare: Driftsätt → Hantera driftsättningar →
 * pennan → Version: Ny version → Driftsätt. Adressen är densamma.
 *
 * Om säkerheten: alla som har adressen kan skicka in framsteg, och den som
 * skriver in en annan persons e-post kan se den personens egna framsteg.
 * Rapporten — allas framsteg — kräver en rapportnyckel. Byt en nyckel genom
 * att skriva en ny i fliken Nycklar. Ta bort en person: radera hennes rader i
 * Personer och Händelser.
 */

const FLIK_HANDELSER = 'Händelser';
const FLIK_PERSONER  = 'Personer';
const FLIK_NYCKLAR   = 'Nycklar';
const KOL_H = ['id', 'tid', 'e-post', 'anläggning', 'verb', 'typ', 'objekt', 'kontext', 'resultat', 'mottagen'];
const KOL_P = ['e-post', 'namn', 'anläggning', 'anläggningsnamn', 'registrerad', 'senast aktiv'];

/* ---------- installation ---------- */
function installera() {
  flik_(FLIK_HANDELSER, KOL_H);
  flik_(FLIK_PERSONER, KOL_P);
  nycklar_();
  const n = nycklar_();
  Logger.log('Klart. Rapportnycklar (finns också i fliken Nycklar):');
  n.forEach(function (k) { Logger.log('  ' + k.omfang + ': ' + k.nyckel); });
}

function bok_() { return SpreadsheetApp.getActiveSpreadsheet(); }

function flik_(namn, rubriker) {
  let s = bok_().getSheetByName(namn);
  if (!s) {
    s = bok_().insertSheet(namn);
    s.getRange(1, 1, 1, rubriker.length).setValues([rubriker]).setFontWeight('bold');
    s.setFrozenRows(1);
    /* Allt som text — annars gör kalkylarket om tidsstämplar och id till
       datum och tal, och de går inte att läsa tillbaka exakt. */
    s.getRange(1, 1, s.getMaxRows(), rubriker.length).setNumberFormat('@');
  }
  return s;
}

function nyNyckel_() { return Utilities.getUuid().replace(/-/g, '').slice(0, 10); }

function nycklar_() {
  const s = flik_(FLIK_NYCKLAR, ['omfång', 'nyckel', 'vem som har den']);
  if (s.getLastRow() < 2) {
    s.getRange(2, 1, 3, 3).setValues([
      ['alla', nyNyckel_(), 'Utbildningsansvarig — ser alla anläggningar'],
      ['ten.gasverket', nyNyckel_(), 'Platsansvarig Gasverket'],
      ['ten.sickla', nyNyckel_(), 'Platsansvarig Sickla']
    ]);
  }
  const rader = s.getRange(2, 1, Math.max(s.getLastRow() - 1, 1), 2).getValues();
  return rader
    .filter(function (r) { return String(r[0]).trim() && String(r[1]).trim(); })
    .map(function (r) { return { omfang: String(r[0]).trim(), nyckel: String(r[1]).trim() }; });
}

/* ---------- läsa ---------- */
function text_(v) { return v instanceof Date ? v.toISOString() : String(v == null ? '' : v); }
function json_(v) { try { return JSON.parse(text_(v) || '{}'); } catch (e) { return {}; } }
function norm_(e) { return String(e || '').trim().toLowerCase(); }

function lasHandelser_(villkor) {
  const s = flik_(FLIK_HANDELSER, KOL_H);
  const n = s.getLastRow() - 1;
  if (n < 1) return [];
  return s.getRange(2, 1, n, KOL_H.length).getValues()
    .filter(function (r) { return text_(r[0]); })
    .map(function (r) {
      return {
        id: text_(r[0]), ts: text_(r[1]),
        actor: { userId: norm_(r[2]), tenantId: text_(r[3]) || null },
        verb: text_(r[4]),
        object: { type: text_(r[5]), id: text_(r[6]) },
        context: json_(r[7]), result: json_(r[8])
      };
    })
    .filter(villkor || function () { return true; });
}

function lasPersoner_() {
  const s = flik_(FLIK_PERSONER, KOL_P);
  const n = s.getLastRow() - 1;
  const ut = {};
  if (n < 1) return ut;
  s.getRange(2, 1, n, KOL_P.length).getValues().forEach(function (r) {
    const e = norm_(r[0]);
    if (e) ut[e] = { name: text_(r[1]) || e, tenantId: text_(r[2]) || null, tenantName: text_(r[3]) || null };
  });
  return ut;
}

/* ---------- skriva ---------- */
function sparaPerson_(p) {
  const s = flik_(FLIK_PERSONER, KOL_P);
  const e = norm_(p.email);
  if (!e) return;
  const nu = new Date().toISOString();
  const n = s.getLastRow() - 1;
  const adresser = n > 0 ? s.getRange(2, 1, n, 1).getValues().map(function (r) { return norm_(r[0]); }) : [];
  const i = adresser.indexOf(e);
  if (i >= 0) {
    const rad = i + 2;
    s.getRange(rad, 2, 1, 3).setValues([[String(p.name || ''), String(p.tenantId || ''), String(p.tenantName || '')]]);
    s.getRange(rad, 6).setValue(nu);
  } else {
    s.getRange(n + 2, 1, 1, KOL_P.length).setValues([[e, String(p.name || ''), String(p.tenantId || ''),
      String(p.tenantName || ''), String(p.since || nu.slice(0, 10)), nu]]);
  }
}

function sparaHandelser_(lista) {
  const s = flik_(FLIK_HANDELSER, KOL_H);
  const sista = s.getLastRow();
  const finns = {};
  if (sista > 1) s.getRange(2, 1, sista - 1, 1).getValues().forEach(function (r) { finns[text_(r[0])] = true; });
  const nu = new Date().toISOString();
  const rader = [];
  lista.forEach(function (x) {
    if (!x || !x.id || !x.actor || !x.actor.userId || finns[x.id]) return;
    finns[x.id] = true;
    rader.push([String(x.id), String(x.ts || nu), norm_(x.actor.userId), String(x.actor.tenantId || ''),
      String(x.verb || ''), String((x.object || {}).type || ''), String((x.object || {}).id || ''),
      JSON.stringify(x.context || {}), JSON.stringify(x.result || {}), nu]);
  });
  if (rader.length) s.getRange(sista + 1, 1, rader.length, KOL_H.length).setValues(rader);
  return rader.length;
}

/* ---------- webbappen ---------- */
function svar_(o) {
  return ContentService.createTextOutput(JSON.stringify(o)).setMimeType(ContentService.MimeType.JSON);
}

function doGet(e) {
  const p = (e && e.parameter) || {};
  try {
    if (p.action === 'ping') {
      return svar_({ ok: true, app: 'kv-academy-register', version: 1,
        events: Math.max(flik_(FLIK_HANDELSER, KOL_H).getLastRow() - 1, 0),
        people: Math.max(flik_(FLIK_PERSONER, KOL_P).getLastRow() - 1, 0) });
    }
    if (p.action === 'mine') {
      const ep = norm_(p.email);
      if (!ep) return svar_({ ok: false, error: 'e-post saknas' });
      return svar_({ ok: true, person: lasPersoner_()[ep] || null,
        events: lasHandelser_(function (x) { return x.actor.userId === ep; }) });
    }
    if (p.action === 'report') {
      const nyckel = String(p.key || '').trim();
      const n = nyckel ? nycklar_().filter(function (k) { return k.nyckel === nyckel; })[0] : null;
      if (!n) return svar_({ ok: false, error: 'nyckel' });
      const alla = n.omfang === 'alla';
      const pers = lasPersoner_();
      const urval = {};
      Object.keys(pers).forEach(function (k) { if (alla || pers[k].tenantId === n.omfang) urval[k] = pers[k]; });
      return svar_({ ok: true, scope: n.omfang, people: urval,
        events: lasHandelser_(function (x) { return alla || x.actor.tenantId === n.omfang || !!urval[x.actor.userId]; }) });
    }
    return svar_({ ok: false, error: 'okänd begäran' });
  } catch (err) {
    return svar_({ ok: false, error: String(err) });
  }
}

function doPost(e) {
  const lock = LockService.getScriptLock();
  lock.waitLock(20000);
  try {
    const body = JSON.parse((e && e.postData && e.postData.contents) || '{}');
    if (body.person && body.person.email) sparaPerson_(body.person);
    const lista = Array.isArray(body.events) ? body.events : [];
    const sparade = sparaHandelser_(lista);
    return svar_({ ok: true, saved: sparade, ids: lista.map(function (x) { return x && x.id; }).filter(Boolean) });
  } catch (err) {
    return svar_({ ok: false, error: String(err) });
  } finally {
    lock.releaseLock();
  }
}
