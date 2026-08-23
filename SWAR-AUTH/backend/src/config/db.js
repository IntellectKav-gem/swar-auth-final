const { createClient } = require('@supabase/supabase-js');
const fs = require('fs');
const path = require('path');
require('dotenv').config();

const dbMode = String(process.env.DB_MODE || 'supabase').toLowerCase();
const isMemoryMode = dbMode === 'memory';

const rawUrl = process.env.SUPABASE_URL || '';
const supabaseUrl = rawUrl.replace(/\/rest\/v1\/?$/i, '').replace(/\/+$/, '');
const supabaseServiceKey = process.env.SUPABASE_SERVICE_KEY || '';

if (!isMemoryMode && (!supabaseUrl || !supabaseServiceKey)) {
  throw new Error(
    'Supabase configuration is required. Set SUPABASE_URL and SUPABASE_SERVICE_KEY, or explicitly set DB_MODE=memory for local tests only.'
  );
}

const supabase = isMemoryMode
  ? null
  : createClient(supabaseUrl, supabaseServiceKey, {
      auth: { persistSession: false, autoRefreshToken: false }
    });

// Explicit local-test store. It is never selected implicitly and must not be enabled in production.
const storePath = path.join(__dirname, '../../database/swar_auth_store.json');
let store = {
  users: [],
  students: [],
  faculty: [],
  subjects: [],
  voice_profiles: [],
  attendance_sessions: [],
  attendance: []
};

if (isMemoryMode) {
  try {
    if (fs.existsSync(storePath)) {
      store = JSON.parse(fs.readFileSync(storePath, 'utf8'));
    }
  } catch (error) {
    throw new Error(`Unable to load explicit memory-mode store: ${error.message}`);
  }
}

const matchQuery = (item, query) => Object.keys(query).every(key => item[key] === query[key]);

const memoryQueryOne = (table, query) => {
  const collection = store[table] || [];
  return collection.find(item => matchQuery(item, query)) || null;
};

const memoryQueryMany = (table, query) => {
  const collection = store[table] || [];
  return collection.filter(item => matchQuery(item, query));
};

const memoryInsertRecord = (table, record) => {
  if (!store[table]) store[table] = [];
  const newRecord = {
    ...record,
    created_at: record.created_at || new Date().toISOString()
  };
  const existingIdx = store[table].findIndex(item => item.id === record.id);
  if (existingIdx >= 0) store[table][existingIdx] = newRecord;
  else store[table].push(newRecord);
  return newRecord;
};

const memoryUpdateRecords = (table, query, updates, single = false) => {
  const collection = store[table] || [];
  const matches = collection.filter(item => matchQuery(item, query));
  const updated = matches.map(item => {
    Object.assign(item, updates, { updated_at: new Date().toISOString() });
    return item;
  });
  return single ? updated[0] || null : updated;
};

const memoryDeleteRecords = (table, query) => {
  if (!store[table]) return [];
  const deleted = store[table].filter(item => matchQuery(item, query));
  store[table] = store[table].filter(item => !matchQuery(item, query));
  return deleted;
};

const throwDatabaseError = (operation, table, error) => {
  console.error(`Supabase ${operation} failed for ${table}:`, error);
  const wrapped = new Error(`Database ${operation} failed for ${table}`);
  wrapped.cause = error;
  wrapped.status = 503;
  throw wrapped;
};

const queryOne = async (table, query = {}, columns = '*') => {
  if (isMemoryMode) return memoryQueryOne(table, query);

  const { data, error } = await supabase.from(table).select(columns).match(query).limit(1).maybeSingle();
  if (error) throwDatabaseError('read', table, error);
  return data;
};

const queryMany = async (table, query = {}, columns = '*') => {
  if (isMemoryMode) return memoryQueryMany(table, query);

  const { data, error } = await supabase.from(table).select(columns).match(query);
  if (error) throwDatabaseError('read', table, error);
  return data || [];
};

const insertRecord = async (table, record) => {
  if (isMemoryMode) return memoryInsertRecord(table, record);

  const { data, error } = await supabase.from(table).insert(record).select().single();
  if (error) throwDatabaseError('insert', table, error);
  return data;
};

const updateRecords = async (table, query, updates, single = false) => {
  if (isMemoryMode) return memoryUpdateRecords(table, query, updates, single);

  const builder = supabase.from(table).update(updates).match(query).select();
  const { data, error } = single ? await builder.single() : await builder;
  if (error) throwDatabaseError('update', table, error);
  return data;
};

const deleteRecords = async (table, query) => {
  if (isMemoryMode) return memoryDeleteRecords(table, query);

  const { data, error } = await supabase.from(table).delete().match(query);
  if (error) throwDatabaseError('delete', table, error);
  return data;
};

module.exports = {
  supabase,
  queryOne,
  queryMany,
  insertRecord,
  updateRecords,
  deleteRecords,
  isMemoryMode
};
