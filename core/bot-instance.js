// One Mineflayer lifecycle per configured account; destroy removes listeners and timers.
const mineflayer = require("mineflayer");
const { pathfinder, Movements, goals } = require("mineflayer-pathfinder");
const { addLog } = require("../logger");
class BotInstance {
 constructor(account,config,context){this.id=account.id||account.username;this.account=account;this.config=config;this.context=context;this.bot=null;this.running=false;this.reconnectTimer=null;this.timers=new Set();this.listeners=[];this.startedAt=null;this.lastError=null;this.currentTask="idle";this.proxyIndex=0;}
 on(event,fn){this.bot.on(event,fn);this.listeners.push([event,fn]);}
 start(){if(this.running&&this.bot)return;this.running=true;this.startedAt=Date.now();this.connect();}
 connect(){if(!this.running)return;try{
  const a=this.account, s=this.config.server;
  this.bot=mineflayer.createBot({host:s.ip,port:Number(s.port)||25565,username:this.resolve(a.username||this.config["bot-account"].username),password:this.resolve(a.password||this.config["bot-account"].password),auth:a.type||this.config["bot-account"].type||"offline",version:s.version||false});
  this.bot.loadPlugin(pathfinder);
  this.on("login",()=>{this.context.addLog(`[${this.id}] Logged in`,"success");this.context.event("connect",this.id);});
  this.on("spawn",()=>{this.context.addLog(`[${this.id}] Spawned`,"success");try{this.bot.pathfinder.setMovements(new Movements(this.bot));}catch{}this.context.io?.emit("status",this.snapshot());});
  this.on("messagestr",msg=>{this.context.rawMessage?.(msg,this.id);});
  this.on("chat",(username,msg)=>{this.context.chat(`${username}: ${msg}`,this.id);this.context.ai?.onChat(msg,username,this);});
  this.on("kicked",reason=>{this.lastError=String(reason);this.context.onKick?.(reason,this);this.context.addLog(`[${this.id}] Kicked: ${this.lastError}`,"warn");this.context.event("kick",this.lastError);});
  this.on("end",reason=>{this.context.addLog(`[${this.id}] Disconnected: ${reason||"unknown"}`,"warn");this.context.event("disconnect",String(reason||"unknown"));this.bot=null;if(this.running&&this.config.utils["auto-reconnect"])this.scheduleReconnect();});
  this.on("error",err=>{this.lastError=err.message;this.context.addLog(`[${this.id}] ${err.message}`,"error");});
 }catch(e){this.context.addLog(`[${this.id}] Create failed: ${e.message}`,"error");this.scheduleReconnect();}}
 resolve(v){if(typeof v==="string"&&v.startsWith("ENV:"))return process.env[v.slice(4)]||"";return v||"";}
 scheduleReconnect(){if(this.reconnectTimer||!this.running)return;const delay=Number(this.config.utils["auto-reconnect-delay"])||3000;this.reconnectTimer=setTimeout(()=>{this.reconnectTimer=null;this.connect();},delay);}
 stop(){this.running=false;if(this.reconnectTimer)clearTimeout(this.reconnectTimer);this.reconnectTimer=null;for(const t of this.timers)clearInterval(t);this.timers.clear();if(this.bot){for(const [e,fn] of this.listeners)this.bot.removeListener(e,fn);try{this.bot.quit("Dashboard stop");}catch{}this.bot=null;}this.listeners=[];this.context.addLog(`[${this.id}] Stopped`,"control");}
 destroy(){this.stop();}
 snapshot(){const b=this.bot;return {id:this.id,running:this.running,connected:!!b,username:b?.username||this.account.username,health:b?.health??null,food:b?.food??null,position:b?.entity?.position?{x:b.entity.position.x,y:b.entity.position.y,z:b.entity.position.z}:null,players:b?Object.keys(b.players||{}):[],task:this.currentTask,uptime:this.startedAt?Math.floor((Date.now()-this.startedAt)/1000):0};}
 say(msg){if(!this.bot)throw Error("Bot is not connected");this.bot.chat(String(msg).slice(0,256));}
 command(cmd){this.say(String(cmd).startsWith("/")?String(cmd):"/"+cmd);}
}
module.exports={BotInstance};
