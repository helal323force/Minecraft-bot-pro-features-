// Socket.IO event hub; emits typed updates to authenticated dashboard clients.
const { Server } = require("socket.io");
const { onLog } = require("../logger");
function setupSocket(server, app) {
  const io = new Server(server, { cors:{origin:false} });
  const sessionMiddleware = app.get("sessionMiddleware");
  if (sessionMiddleware) io.engine.use(sessionMiddleware);
  io.use((socket,next)=>{ if(socket.request.session?.authenticated) return next(); next(new Error("unauthorized")); });
  io.on("connection", socket=>socket.emit("connected",{at:Date.now()}));
  onLog(entry=>io.emit("log",entry));
  app.set("io",io);
  return io;
}
module.exports={setupSocket};
