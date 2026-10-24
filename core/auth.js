// Session auth. Configure DASHBOARD_PASSWORD and SESSION_SECRET in environment.
const session = require("express-session");
const { addLog } = require("../logger");
function setupAuth(app) {
  const password = process.env.DASHBOARD_PASSWORD || "admin123";
  if (!process.env.DASHBOARD_PASSWORD) addLog("[Security] DASHBOARD_PASSWORD missing; using dev fallback admin123", "warn");
  if (!process.env.SESSION_SECRET) addLog("[Security] SESSION_SECRET missing; using an ephemeral secret (sessions reset on restart)", "warn");
  const sessionMiddleware = session({ name:"afk.sid", secret:process.env.SESSION_SECRET || require("crypto").randomBytes(32).toString("hex"), resave:false, saveUninitialized:false, cookie:{httpOnly:true,sameSite:"lax",secure:process.env.NODE_ENV==="production",maxAge:12*60*60*1000} });
  app.set("sessionMiddleware", sessionMiddleware);
  app.use(sessionMiddleware);
  app.post("/auth",(req,res)=>{ if(req.body?.password !== password) return res.status(401).json({error:"Invalid password"}); req.session.authenticated=true; res.json({ok:true}); });
  app.post("/logout",(req,res)=>req.session.destroy(()=>res.json({ok:true})));
  app.get("/login",(req,res)=>res.sendFile(require("path").join(process.cwd(),"public/login.html")));
  app.use((req,res,next)=>{ if(["/health","/ping","/login","/auth"].includes(req.path) || req.path.startsWith("/socket.io")) return next(); if(req.session?.authenticated) return next(); if(req.path.startsWith("/api/") || req.path==="/start" || req.path==="/stop" || req.path==="/command") return res.status(401).json({error:"Login required"}); return res.redirect("/login"); });
}
module.exports={setupAuth};
