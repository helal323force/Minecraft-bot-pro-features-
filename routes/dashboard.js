// Serves dashboard SPA files; authentication middleware is mounted before this router.
const express=require("express"),path=require("path");
function createDashboard(){const r=express.Router();r.use(express.static(path.join(process.cwd(),"public")));r.get("/",(q,s)=>s.sendFile(path.join(process.cwd(),"public/index.html")));r.get("/logs",(q,s)=>s.sendFile(path.join(process.cwd(),"public/logs.html")));r.get("/setup",(q,s)=>s.sendFile(path.join(process.cwd(),"public/setup.html")));r.get("/analytics",(q,s)=>s.sendFile(path.join(process.cwd(),"public/analytics.html")));return r;}
module.exports={createDashboard};
