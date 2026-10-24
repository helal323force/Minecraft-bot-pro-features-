// .ai chat trigger, per-player/global limits, short cache, SQLite logging and memory.
const {ask}=require("./ai-providers");
const db=require("../core/database");
const {addLog}=require("../logger");
const cache=new Map(), playerTimes=new Map(), globalTimes=[];
const HELP="Ask me something: .ai <question>";
function createAIChat(config,context){
 async function answer(question,player="dashboard",instance=context.selected()){
  if(!config.ai?.enabled)throw Error("AI is disabled");
  const now=Date.now();while(globalTimes.length&&now-globalTimes[0]>60000)globalTimes.shift();
  if(globalTimes.length>=20)throw Error("AI global limit reached (20/min)");
  if(playerTimes.has(player)&&now-playerTimes.get(player)<10000)throw Error("Please wait 10 seconds before asking again");
  const q=String(question||"").trim();if(!q)return HELP;
  const key=q.toLowerCase();let result=cache.get(key);
  const started=Date.now();playerTimes.set(player,now);globalTimes.push(now);
  if(result&&now-result.ts<60000)result=result.value;else{
   const history=db.memory(player).map(x=>`${x.role}: ${x.content}`).join("\n");
   result=await ask(config,`Recent conversation with ${player}: ${history||"(none)"}\nQuestion: ${q}`,instance?.bot?.username||config.name);
   cache.set(key,{ts:now,value:result});
  }
  const response=String(result.text||"I couldn't think of a reply.").replace(/\s+/g," ").trim().slice(0,190);
  db.logAI({player,question:q,response,provider:result.provider,tokens:result.tokens,latency_ms:Date.now()-started});
  db.remember(player,"user",q);db.remember(player,"assistant",response);
  context.io?.emit("ai_response",{player,question:q,response,provider:result.provider,latency_ms:Date.now()-started});
  addLog(`[AI] ${player}: ${q} -> ${response} (${result.provider})`,"ai");
  return response;
 }
 function onChat(message,username,instance){
  const m=String(message).match(/\.ai\b/i);if(!m)return;
  const question=String(message).slice(m.index+m[0].length).trim();
  answer(question,username,instance).then(r=>{if(instance?.bot)instance.say(`@${username} ${r}`.slice(0,256));}).catch(e=>addLog(`[AI] ${e.message}`,"warn"));
 }
 return {answer,onChat};
}
module.exports={createAIChat};
