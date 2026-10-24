// Minecraft AFK Bot v3.0 entrypoint. Bootstraps config, sessions, Socket.IO, Mineflayer instances and APIs.
require("dotenv").config();
const fs=require("fs"),path=require("path"),http=require("http"),express=require("express");
const config=JSON.parse(fs.readFileSync(path.join(__dirname,"settings.json"),"utf8"));
const {addLog,getLogs}=require("./logger");const {state,selected}=require("./core/state");const {setupAuth}=require("./core/auth");const {setupSocket}=require("./core/socket");const {BotInstance}=require("./core/bot-instance");const {createAIChat}=require("./modules/ai-chat");const {startBrain}=require("./modules/ai-brain");const {createScheduler}=require("./modules/scheduler");const {createDiscord}=require("./modules/discord-bot");const {startBackup}=require("./modules/backup");const {installTracker}=require("./modules/tracker");const {createAntiKick}=require("./modules/anti-kick");const {start:startAutoUpdate}=require("./modules/auto-update");const db=require("./core/database");
const app=express();
app.set("trust proxy", 1);
app.disable("x-powered-by");app.use(express.json({limit:"8mb"}));app.use(express.urlencoded({extended:false}));const server=http.createServer(app);
app.get("/health",(req,res)=>res.json({ok:true,uptime:Math.floor(process.uptime()),accounts:state.instances.size}));app.get("/ping",(req,res)=>res.status(200).send("pong"));
setupAuth(app);const io=setupSocket(server,app);
const chatHistory=[];const context={config,io,addLog,getLogs,chatHistory:()=>chatHistory,instances:()=>[...state.instances.values()],instance:id=>state.instances.get(id),selected,select:id=>state.selectedAccount=id,event:(type,detail)=>db.event(type,detail),onKick:(reason,instance)=>instance.antiKick?.(reason),rawMessage:(message,account)=>{if(config.utils["chat-log"])addLog(`[${account}] ${message}`,"info");},chat:(message,account)=>{const entry={message:String(message),account,at:Date.now()};chatHistory.push(entry);if(chatHistory.length>200)chatHistory.shift();io.emit("chat",entry);addLog(`[${account}] ${message}`,"chat");},executeDecision:async(i,d)=>{if(!i.bot)return;switch(d.action){case"idle":break;case"walk_random":{const p=i.bot.entity.position;const {goals}=require("mineflayer-pathfinder");await i.bot.pathfinder.goto(new goals.GoalNear(p.x+Math.round(Math.random()*8-4),p.y,p.z+Math.round(Math.random()*8-4),1));break;}case"flee":{const p=i.bot.entity.position;const {goals}=require("mineflayer-pathfinder");await i.bot.pathfinder.goto(new goals.GoalNear(p.x+12,p.y,p.z+12,2));break;}case"mine":case"farm":case"fish":addLog(`[Brain] action ${d.action} received; enable module to run manually`,"warn");break;default:break;}}};
context.ai=createAIChat(config,context);
for(const account of (config.accounts||[]).filter(a=>a.enabled!==false)){const id=account.id||account.username;const instance=new BotInstance(account,config,context);state.instances.set(id,instance);}
if(!state.instances.size){const a=config["bot-account"];state.instances.set("main",new BotInstance({id:"main",...a},config,context));}
context.scheduler=createScheduler(config,context);
const discord=createDiscord(config,context,context.ai);
for(const instance of state.instances.values()){
 const antiKick=createAntiKick(context);instance.antiKick=antiKick;instance.start=instance.start.bind(instance); 
 const oldConnect=instance.connect.bind(instance);instance.connect=function(){oldConnect();const wait=setTimeout(()=>{if(instance.bot && instance.moduleBot !== instance.bot){instance.moduleBot=instance.bot;const off=installTracker(instance,config,context);instance.cleanup.push(off);instance.timers.add(setInterval(()=>{if(instance.bot===instance.moduleBot)io.emit("status",instance.snapshot());},1000));startBackup(instance,config,context);if(config.ai_brain?.enabled)instance.timers.add(startBrain(instance,config,context));}},1500);instance.timers.add(wait);};
 const oldStop=instance.stop.bind(instance);instance.stop=function(){for(const off of instance.cleanup||[])try{off();}catch{}instance.cleanup=[];oldStop();};
 instance.cleanup=[];
}
const {createApi}=require("./routes/api");const {createDashboard}=require("./routes/dashboard");const logsRouter=require("./routes/logs");
app.use("/api",createApi(context));app.use("/logs-data",logsRouter);app.use("/",createDashboard());
app.post("/start",(req,res)=>{const i=context.instance(req.body?.account)||context.selected();if(!i)return res.status(404).json({error:"No bot account"});i.start();res.json({ok:true,account:i.id});});
app.post("/stop",(req,res)=>{const i=context.instance(req.body?.account)||context.selected();if(!i)return res.status(404).json({error:"No bot account"});i.stop();res.json({ok:true,account:i.id});});
app.post("/command",(req,res)=>{try{const i=context.instance(req.body?.account)||context.selected();if(!i?.bot)return res.status(503).json({error:"Bot is not connected"});const cmd=String(req.body?.command||req.body?.cmd||"").trim();if(!cmd)return res.status(400).json({error:"Command required"});i.command(cmd);addLog(`[Console] ${cmd}`,"control");res.json({ok:true});}catch(e){res.status(400).json({error:e.message});}});
const PORT=Number(process.env.PORT)||3000;server.listen(PORT,"0.0.0.0",()=>addLog(`[Server] Dashboard listening on ${PORT}`,"success"));
if(process.env.RENDER_EXTERNAL_URL){const https=require("https");setInterval(()=>{https.get(`${process.env.RENDER_EXTERNAL_URL.replace(/\/$/,"")}/ping`,r=>r.resume()).on("error",e=>addLog(`[KeepAlive] ${e.message}`,"warn"));},10*60*1000);}
startAutoUpdate(config,addLog);
setInterval(()=>{const mem=process.memoryUsage();addLog(`[Memory] Heap ${(mem.heapUsed/1024/1024).toFixed(1)} MB`,"info");},10*60*1000);
process.on("SIGINT",shutdown);process.on("SIGTERM",shutdown);
function shutdown(){addLog("[Shutdown] Cleaning up","control");for(const i of state.instances.values())i.destroy();if(discord)discord.destroy();server.close(()=>process.exit(0));setTimeout(()=>process.exit(1),5000).unref();}
