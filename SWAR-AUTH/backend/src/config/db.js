const { createClient } = require('@supabase/supabase-js');
const fs = require('fs');
const path = require('path');
require('dotenv').config();

const rawUrl = process.env.SUPABASE_URL || '';
const supabaseUrl = rawUrl.replace(/\/rest\/v1\/?$/i, '').replace(/\/+$/, '') || 'https://lcuzffaxenieuqxbmryc.supabase.co';
const supabaseKey = process.env.SUPABASE_SERVICE_KEY || process.env.SUPABASE_ANON_KEY || 'dummy_key';

const supabase = createClient(supabaseUrl, supabaseKey, {
  auth: { persistSession: false }
});

// Fallback in-memory store for error handling & connection resilience
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

try {
  if (fs.existsSync(storePath)) {
    store = JSON.parse(fs.readFileSync(storePath, 'utf8'));
  }
} catch (e) {
  // Clean fallback initialized
}

const matchQuery = (item, query) => {
  for (const key of Object.keys(query)) {
    if (item[key] !== query[key]) return false;
  }
  return true;
};

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
  if (existingIdx >= 0) {
    store[table][existingIdx] = newRecord;
  } else {
    store[table].push(newRecord);
  }
  return newRecord;
};

const memoryUpdateRecords = (table, query, updates, single = false) => {
  const collection = store[table] || [];
  const matches = collection.filter(item => matchQuery(item, query));
  const updated = matches.map(item => {
    Object.assign(item, updates, { updated_at: new Date().toISOString() });
    return item;
  });
  if (single) return updated[0] || null;
  return updated;
};

const memoryDeleteRecords = (table, query) => {
  if (!store[table]) return [];
  const deleted = store[table].filter(item => matchQuery(item, query));
  store[table] = store[table].filter(item => !matchQuery(item, query));
  return deleted;
};

// Database interface methods with Supabase client & connection error handling
const queryOne = async (table, query = {}, columns = '*') => {
  try {
    const { data, error } = await supabase.from(table).select(columns).match(query).limit(1).maybeSingle();
    if (error) throw error;
    if (data) memoryInsertRecord(table, data);
    return data;
  } catch (err) {
    return memoryQueryOne(table, query);
  }
};

const queryMany = async (table, query = {}, columns = '*') => {
  try {
    const { data, error } = await supabase.from(table).select(columns).match(query);
    if (error) throw error;
    if (Array.isArray(data) && data.length > 0) {
      data.forEach(item => memoryInsertRecord(table, item));
    }
    return data;
  } catch (err) {
    return memoryQueryMany(table, query);
  }
};

const insertRecord = async (table, record) => {
  memoryInsertRecord(table, record);
  try {
    const { data, error } = await supabase.from(table).insert(record).select().single();
    if (error) throw error;
    return data;
  } catch (err) {
    return memoryQueryOne(table, { id: record.id }) || record;
  }
};

const updateRecords = async (table, query, updates, single = false) => {
  const memRes = memoryUpdateRecords(table, query, updates, single);
  try {
    const builder = supabase.from(table).update(updates).match(query).select();
    const { data, error } = single ? await builder.single() : await builder;
    if (error) throw error;
    return data;
  } catch (err) {
    return memRes;
  }
};

const deleteRecords = async (table, query) => {
  const memRes = memoryDeleteRecords(table, query);
  try {
    const { data, error } = await supabase.from(table).delete().match(query);
    if (error) throw error;
    return data;
  } catch (err) {
    return memRes;
  }
};

module.exports = {
  supabase,
  queryOne,
  queryMany,
  insertRecord,
  updateRecords,
  deleteRecords
};
