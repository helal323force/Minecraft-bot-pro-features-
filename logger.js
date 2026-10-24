// Typed, bounded logger. addLog(message, type = "info") preserves the old API.
const logs = [];
const listeners = new Set();
const ANSI = { info: "\x1b[36m", warn: "\x1b[33m", error: "\x1b[31m", chat: "\x1b[35m", success: "\x1b[32m", control: "\x1b[34m", ai: "\x1b[96m" };
function addLog(message, type = "info") {
  const time = new Date().toLocaleTimeString();
  const entry = { time, type, message: String(message), formatted: `[${time}] ${String(message)}` };
  console.log(`${ANSI[type] || ""}${entry.formatted}\x1b[0m`);
  logs.push(entry); if (logs.length > 1000) logs.shift();
  for (const listener of listeners) { try { listener(entry); } catch {} }
  return entry;
}
function getLogs(n = 300) { return logs.slice(-Math.max(0, Number(n) || 0)); }
function onLog(fn) { listeners.add(fn); return () => listeners.delete(fn); }
module.exports = { addLog, getLogs, onLog };
