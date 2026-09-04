/* ==========================================================================
   services/catalogService.js
   Catalogo esercizi di sistema. Vive su un DB IndexedDB SEPARATO dal DB
   principale (`fit-circuit-tracker-v18-optional-day`):

     name   : fit-catalog-v1
     version: 1
     store  : catalog     (keyPath: 'id')

   Motivazione DB separato:
     - Read-mostly (>95% read): il picker esercizi legge, l'utente non
       modifica il catalogo di sistema (custom exercises restano nel DB
       principale, store `exercises`).
     - La reset Danger Zone del DB principale NON deve wipare il catalogo.
     - `restoreFromRemote()` NON deve toccare fit-catalog-v1: 300+ voci
       statiche non hanno motivo di viaggiare nel backup GitHub dell'utente.
     - Versioning schema indipendente dal DB utente.

   API pubblica (ESM):
     initCatalog()                 - apre DB, seed se necessario, cache
     searchCatalog(query, filters) - accent-fold + tokens AND su name+muscles
     orderByUsage(items, usageMap) - riordina spingendo i piu' usati in cima
     getCatalogEntry(id)           - lookup diretto per id

   T0.4 (2026-08-14) - PROGETTO_MOCKUP.
   ========================================================================== */

const DB_NAME  = 'fit-catalog-v1';
const DB_VER   = 1;
const STORE    = 'catalog';
// Risolvi la seed relativa al modulo (non al document), cosi funziona
// anche se il modulo viene importato da una page test in una subdir.
const SEED_URL = new URL('../data/exercisesCatalog.json', import.meta.url).href;

let _dbPromise = null;
let _cache     = null;      // Exercise[]
let _initPromise = null;    // per chiamate concorrenti a initCatalog

// ---------- utilities ----------

// Rimuove accenti/diacritici e normalizza a lowercase.
// "Più" -> "piu", "Estensione" -> "estensione", "Cavo Basso" -> "cavo basso"
function accentFold(s) {
  if (s == null) return '';
  return String(s)
    .normalize('NFD')
    .replace(/[̀-ͯ]/g, '')
    .toLowerCase()
    .trim();
}

function tokenize(query) {
  return accentFold(query).split(/\s+/).filter(Boolean);
}

// Un entry matcha una query se OGNI token appare in name o in almeno un muscle
// (accent-fold, case-insensitive, ordine libero).
function entryMatchesTokens(entry, tokens) {
  if (!tokens.length) return true;
  const hay = accentFold(entry.name) + ' ' + accentFold((entry.muscles || []).join(' '));
  for (const t of tokens) {
    if (hay.indexOf(t) === -1) return false;
  }
  return true;
}

function applyFilters(items, filters) {
  if (!filters) return items;
  let out = items;
  if (filters.category) {
    out = out.filter(e => e.category === filters.category);
  }
  if (Array.isArray(filters.equipment) && filters.equipment.length) {
    const set = new Set(filters.equipment);
    out = out.filter(e => set.has(e.equipment));
  }
  return out;
}

// ---------- IndexedDB helpers ----------

function openDb() {
  if (_dbPromise) return _dbPromise;
  _dbPromise = new Promise((res, rej) => {
    const r = indexedDB.open(DB_NAME, DB_VER);
    r.onupgradeneeded = e => {
      const db = e.target.result;
      if (!db.objectStoreNames.contains(STORE)) {
        db.createObjectStore(STORE, { keyPath: 'id' });
      }
    };
    r.onsuccess = e => res(e.target.result);
    r.onerror   = () => rej(r.error);
  });
  return _dbPromise;
}

function dbCount(db) {
  return new Promise((res, rej) => {
    const req = db.transaction(STORE, 'readonly').objectStore(STORE).count();
    req.onsuccess = () => res(req.result || 0);
    req.onerror   = () => rej(req.error);
  });
}

function dbGetAll(db) {
  return new Promise((res, rej) => {
    const req = db.transaction(STORE, 'readonly').objectStore(STORE).getAll();
    req.onsuccess = () => res(req.result || []);
    req.onerror   = () => rej(req.error);
  });
}

function dbBulkPut(db, records) {
  return new Promise((res, rej) => {
    const tx = db.transaction(STORE, 'readwrite');
    const os = tx.objectStore(STORE);
    for (const rec of records) os.put(rec);
    tx.oncomplete = () => res();
    tx.onerror    = () => rej(tx.error);
    tx.onabort    = () => rej(tx.error);
  });
}

async function fetchSeed() {
  const r = await fetch(SEED_URL, { cache: 'no-store' });
  if (!r.ok) throw new Error('catalogService: seed fetch HTTP ' + r.status);
  const data = await r.json();
  if (!Array.isArray(data)) throw new Error('catalogService: seed non e un array');
  return data;
}

// ---------- API pubblica ----------

/**
 * Apre il DB, seed se lo store e vuoto, carica in cache in memoria.
 * Chiamate concorrenti condividono la stessa promise (idempotente).
 * @returns {Promise<Exercise[]>} la cache popolata.
 */
export function initCatalog() {
  if (_initPromise) return _initPromise;
  _initPromise = (async () => {
    const db = await openDb();
    const count = await dbCount(db);
    if (count === 0) {
      const seed = await fetchSeed();
      await dbBulkPut(db, seed);
    }
    const all = await dbGetAll(db);
    _cache = all;
    return _cache;
  })().catch(err => {
    // Reset dello state su errore per permettere retry successivi.
    _initPromise = null;
    throw err;
  });
  return _initPromise;
}

/**
 * Cerca nel catalogo. accent-fold + tokens AND su `name` + `muscles`.
 * Filters: { category?: string, equipment?: string[] }.
 * Ritorna [] se il catalogo non e ancora inizializzato (nessun crash).
 * @param {string} query
 * @param {{category?:string, equipment?:string[]}} [filters]
 * @returns {Exercise[]}
 */
export function searchCatalog(query, filters) {
  if (!_cache) return [];
  const tokens = tokenize(query || '');
  const matched = tokens.length
    ? _cache.filter(e => entryMatchesTokens(e, tokens))
    : _cache.slice();
  return applyFilters(matched, filters);
}

/**
 * Riordina la lista di esercizi spingendo in cima quelli piu usati.
 * `usageMap` e una mappa `{ exerciseName -> count }` fornita dal chiamante
 * (il catalogService NON legge il DB principale, separazione rigorosa).
 * Il matching e case-insensitive + accent-fold sui nomi.
 * Ordinamento stabile: entries con stesso count mantengono l'ordine relativo.
 * @param {Exercise[]} items
 * @param {Record<string, number>} usageMap
 * @returns {Exercise[]}
 */
export function orderByUsage(items, usageMap) {
  if (!Array.isArray(items) || !items.length) return items || [];
  const normUsage = new Map();
  if (usageMap && typeof usageMap === 'object') {
    for (const k of Object.keys(usageMap)) {
      const c = Number(usageMap[k]) || 0;
      if (c > 0) normUsage.set(accentFold(k), c);
    }
  }
  if (!normUsage.size) return items.slice();
  const decorated = items.map((e, i) => ({
    e,
    i,
    c: normUsage.get(accentFold(e.name)) || 0,
  }));
  decorated.sort((a, b) => (b.c - a.c) || (a.i - b.i));
  return decorated.map(d => d.e);
}

/**
 * Lookup diretto per id nel catalogo. `undefined` se non trovato.
 * @param {string} id
 * @returns {Exercise|undefined}
 */
export function getCatalogEntry(id) {
  if (!_cache || !id) return undefined;
  return _cache.find(e => e.id === id);
}

// ---------- test helpers (non parte dell'API stabile) ----------

/**
 * Solo per i test sandbox: resetta lo stato in memoria del modulo,
 * cosi il prossimo initCatalog() rifara l'intero flow (open + seed check
 * + reload cache). NON tocca il DB su disco.
 * @internal
 */
export function __resetForTests() {
  _dbPromise = null;
  _cache = null;
  _initPromise = null;
}

/**
 * Solo per i test sandbox: ritorna lo snapshot corrente della cache
 * (o null se non ancora inizializzata).
 * @internal
 */
export function __getCacheSnapshot() {
  return _cache ? _cache.slice() : null;
}
