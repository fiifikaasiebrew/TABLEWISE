// Tablewise desktop — safe bridge between the page and the main process
const { contextBridge, ipcRenderer, webUtils } = require('electron');
const call = async (ch, ...a) => { const r = await ipcRenderer.invoke(ch, ...a); if (!r.ok) throw new Error(r.error); return r.v; };
contextBridge.exposeInMainWorld('twDesktop', {
  connect: cfg => call('db:connect', cfg),
  testConnection: cfg => call('db:test', cfg),
  query: (id, sql, params) => call('db:query', id, sql, params),
  listTables: id => call('db:listTables', id),
  describe: (id, t) => call('db:describe', id, t),
  transaction: (id, stmts) => call('db:transaction', id, stmts),
  snapshot: id => call('db:snapshot', id),
  restore: (id, b) => call('db:restore', id, b),
  close: id => call('db:close', id),
  listConnections: () => call('conn:list'),
  saveConnection: c => call('conn:save', c),
  deleteConnection: id => call('conn:delete', id),
  openSqliteDialog: () => call('file:openSqlite'),
  newSqliteDialog: () => call('file:newSqlite'),
  saveFile: (name, data) => call('file:save', name, data),
  pathOf: file => { try { return webUtils.getPathForFile(file) || null; } catch (e) { return null; } },
  getAISettings: () => call('ai:get'),
  saveAISettings: s => call('ai:save', s),
  aiChat: req => call('ai:chat', req),
  aiModels: () => call('ai:models')
});
