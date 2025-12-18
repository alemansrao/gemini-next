
// Dexie database + helpers
// /lib/db.js
import Dexie from 'dexie';

let dbInstance = null;

export function getDB() {
  if (dbInstance) return dbInstance;

  try {
    const db = new Dexie('gemini_frontend_db');
    db.version(1).stores({
      // chats: id (uuid), title, createdAt, updatedAt, model
      chats: 'id, title, createdAt, updatedAt, model',
      // messages: autoincrement id, chatId, role, content, createdAt
      messages: '++id, chatId, createdAt',
    });
    dbInstance = db;
    return db;
  } catch (err) {
    console.error('IndexedDB unavailable, falling back to localStorage:', err);
    dbInstance = null;
    return null;
  }
}

// ----- LocalStorage fallback (basic) -----
const LS_CHATS = 'gf_chats';
const LS_MESSAGES = 'gf_messages';

function lsRead(key, def) {
  try {
    const raw = localStorage.getItem(key);
    return raw ? JSON.parse(raw) : def;
  } catch {
    return def;
  }
}
function lsWrite(key, value) {
  try {
    localStorage.setItem(key, JSON.stringify(value));
  } catch { }
}

// ----- High-level helpers (work with Dexie or localStorage) -----
export async function createChat({ id, title = '', model, createdAt = Date.now() }) {
  console.log('createChat', { id, title, model, createdAt });
  const db = getDB();
  const updatedAt = createdAt;

  if (db) {
    await db.chats.add({ id, title, createdAt, updatedAt, model });
  } else {
    const chats = lsRead(LS_CHATS, {});
    chats[id] = { id, title, createdAt, updatedAt, model };
    lsWrite(LS_CHATS, chats);
  }
  return id;
}

export async function upsertChatTitle(id, title) {
  const db = getDB();
  if (db) {
    await db.chats.update(id, { title, updatedAt: Date.now() });
  } else {
    const chats = lsRead(LS_CHATS, {});
    if (chats[id]) {
      chats[id].title = title;
      chats[id].updatedAt = Date.now();
      lsWrite(LS_CHATS, chats);
    }
  }
}

export async function touchChat(id) {
  const db = getDB();
  const updatedAt = Date.now();
  if (db) {
    await db.chats.update(id, { updatedAt });
  } else {
    const chats = lsRead(LS_CHATS, {});
    if (chats[id]) {
      chats[id].updatedAt = updatedAt;
      lsWrite(LS_CHATS, chats);
    }
  }
}

export async function deleteChat(id) {
  const db = getDB();
  if (db) {
    await db.transaction('rw', db.chats, db.messages, async () => {
      await db.messages.where('chatId').equals(id).delete();
      await db.chats.delete(id);
    });
  } else {
    const chats = lsRead(LS_CHATS, {});
    const messages = lsRead(LS_MESSAGES, {});
    delete chats[id];
    for (const mid in messages) {
      if (messages[mid]?.chatId === id) delete messages[mid];
    }
    lsWrite(LS_CHATS, chats);
    lsWrite(LS_MESSAGES, messages);
  }
}

export async function addMessage({ chatId, role, content, createdAt = Date.now() }) {
  const db = getDB();
  if (db) {
    await db.messages.add({ chatId, role, content, createdAt });
  } else {
    const messages = lsRead(LS_MESSAGES, {});
    const id = String(Date.now()) + Math.random();
    messages[id] = { chatId, role, content, createdAt };
    lsWrite(LS_MESSAGES, messages);
  }
  await touchChat(chatId);
}

export async function getChat(id) {
  const db = getDB();
  if (db) {
    return db.chats.get(id);
  } else {
    const chats = lsRead(LS_CHATS, {});
    return chats[id] || null;
  }
}

export async function getMessages(chatId) {
  const db = getDB();
  if (db) {
    return db.messages.where('chatId').equals(chatId).sortBy('createdAt');
  } else {
    const messages = Object.values(lsRead(LS_MESSAGES, {}));
    return messages.filter((m) => m.chatId === chatId).sort((a, b) => a.createdAt - b.createdAt);
  }
}

export async function listChats() {
  const db = getDB();
  if (db) {
    return db.chats.orderBy('updatedAt').reverse().toArray();
  } else {
    const chats = Object.values(lsRead(LS_CHATS, {}));
    return chats.sort((a, b) => b.updatedAt - a.updatedAt);
  }
}


export async function deleteAllChats() {
  const db = getDB();

  if (db) {
    // Dexie: clear both tables in a single transaction
    await db.transaction('rw', db.chats, db.messages, async () => {
      await db.messages.clear();
      await db.chats.clear();
    });
  } else {
    // localStorage fallback: reset both stores
    lsWrite(LS_CHATS, {});
    lsWrite(LS_MESSAGES, {});
  }
}

//function to delete chats with no title
export async function deleteNoTitleChats() {
  const db = getDB();
  if (db) {
    const chats = await db.chats.toArray();
    for (const chat of chats) {
      if (!chat.title) {
        await deleteChat(chat.id);
      }
    }
  }
}

