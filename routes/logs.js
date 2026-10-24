// Log API route, used by xterm dashboard and HTTP fallback.
const express=require("express");const {getLogs}=require("../logger");
const router=express.Router();router.get("/",(req,res)=>res.json(getLogs(Number(req.query.n)||300)));module.exports=router;
