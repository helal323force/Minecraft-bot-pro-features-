// SQLite persistence for AI usage, player sessions, and periodic backups.
const Database = require("better-sqlite3");
const path = require("path");
const fs = require("fs");
const dir = path.join(process.cwd(), "data"); fs.mkdirSync(dir, { recursive: true });
const db = new Database(path.join(dir, "bot.sqlite"));
db.pragma("journal_mode = WAL");
db.exec(`
CREATE TABLE IF NOT EXISTS ai_logs(id INTEGER PRIMARY KEY, ts INTEGER, player TEXT, question TEXT, response TEXT, provider TEXT, tokens INTEGER, latency_ms INTEGER);
CREATE TABLE IF NOT EXISTS player_sessions(id INTEGER PRIMARY KEY, username TEXT, uuid TEXT, joined_at INTEGER, left_at INTEGER, duration_sec INTEGER);
CREATE TABLE IF NOT EXISTS backups(id INTEGER PRIMARY KEY, timestamp INTEGER, account TEXT, position TEXT, health REAL, food INTEGER, inventory_json TEXT, experience TEXT);
CREATE TABLE IF NOT EXISTS events(id INTEGER PRIMARY KEY, ts INTEGER, type TEXT, detail TEXT);
CREATE TABLE IF NOT EXISTS chat_memory(id INTEGER PRIMARY KEY, ts INTEGER, player TEXT, role TEXT, content TEXT);
`);
const statements = {
 ai: db.prepare("INSERT INTO ai_logs(ts,player,question,response,provider,tokens,latency_ms) VALUES(?,?,?,?,?,?,?)"),
 join: db.prepare("INSERT INTO player_sessions(username,uuid,joined_at) VALUES(?,?,?)"),
 leave: db.prepare("UPDATE player_sessions SET left_at=?,duration_sec=? WHERE id=?"),
 history: db.prepare("SELECT username,uuid,joined_at,left_at,duration_sec FROM player_sessions WHERE username=? COLLATE NOCASE ORDER BY id DESC LIMIT 20"),
 backup: db.prepare("INSERT INTO backups(timestamp,account,position,health,food,inventory_json,experience) VALUES(?,?,?,?,?,?,?)"),
 backups: db.prepare("SELECT * FROM backups ORDER BY id DESC LIMIT 100"),
 restore: db.prepare("SELECT * FROM backups WHERE id=?"),
 event: db.prepare("INSERT INTO events(ts,type,detail) VALUES(?,?,?)"),
 memory: db.prepare("INSERT INTO chat_memory(ts,player,role,content) VALUES(?,?,?,?)"),
 recentMemory: db.prepare("SELECT role,content FROM chat_memory WHERE player=? COLLATE NOCASE AND ts>? ORDER BY id DESC LIMIT 10"),
 aiRecent: db.prepare("SELECT * FROM ai_logs ORDER BY id DESC LIMIT 50")
};
function logAI(v){ statements.ai.run(Date.now(),v.player||"dashboard",v.question,v.response,v.provider||"",v.tokens||0,v.latency_ms||0); }
function joinPlayer(username,uuid){ return statements.join.run(username,uuid,Date.now()).lastInsertRowid; }
function leavePlayer(id){ const now=Date.now(); const row=db.prepare("SELECT joined_at FROM player_sessions WHERE id=?").get(id); if(row) statements.leave.run(now,Math.max(0,Math.floor((now-row.joined_at)/1000)),id); }
function history(name){ return statements.history.all(name); }
function backup(account,b){ statements.backup.run(Date.now(),account,JSON.stringify(b.position||null),b.health??null,b.food??null,JSON.stringify(b.inventory||[]),JSON.stringify(b.experience||{})); }
function event(type,detail){ statements.event.run(Date.now(),type,String(detail)); }
function remember(player,role,content){ statements.memory.run(Date.now(),player,role,content); db.prepare("DELETE FROM chat_memory WHERE ts < ?").run(Date.now()-86400000); }
function memory(player){ return statements.recentMemory.all(player,Date.now()-86400000).reverse(); }
module.exports={db,logAI,joinPlayer,leavePlayer,history,backup,backups:()=>statements.backups.all(),restore:id=>statements.restore.get(id),event,remember,memory,aiRecent:()=>statements.aiRecent.all()};
