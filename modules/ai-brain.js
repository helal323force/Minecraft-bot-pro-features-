// Optional autonomous brain. Disabled by default; enforces hourly request cap.
const {ask}=require("./ai-providers");
const {addLog}=require("../logger");
function startBrain(instance,config,context){let timer=null, count=0, hour=Date.now();
 async function tick(){if(!config.ai_brain?.enabled||!instance.bot)return;if(Date.now()-hour>=3600000){hour=Date.now();count=0;}if(count>=Number(config.ai_brain.max_requests_per_hour||100)){addLog("[Brain] Hourly request cap reached","warn");return;}
 const b=instance.bot, p=b.entity?.position;const snapshot={health:b.health,food:b.food,position:p?{x:p.x,y:p.y,z:p.z}:null,players:Object.keys(b.players||{}),task:instance.currentTask,last_chat:context.chatHistory().slice(-5),nearby_mobs:Object.values(b.entities||{}).filter(e=>e.type==="mob"&&p&&e.position.distanceTo(p)<16).slice(0,8).map(e=>({name:e.name,distance:Math.round(e.position.distanceTo(p))}))};
 try{count++;const r=await ask(config,`Return ONLY JSON { "action":"flee|attack|follow|walk_random|mine|farm|fish|idle|reply_chat", "params":{}, "say":"" }. Situation: ${JSON.stringify(snapshot)}`,b.username);const decision=JSON.parse(r.text.replace(/```json|```/g,"").trim());context.io?.emit("task",{account:instance.id,decision});if(decision.say)instance.say(decision.say.slice(0,256));await context.executeDecision(instance,decision);}catch(e){addLog(`[Brain] ${e.message}`,"warn");}}
 timer=setInterval(tick,Math.max(10,Number(config.ai_brain.tick_interval)||30)*1000);return()=>clearInterval(timer);}
module.exports={startBrain};
