// Cron and delay task scheduler; task actions are validated before execution.
const cron=require("node-cron");
const {move}=require("./waypoint");
function createScheduler(config,context){const jobs=new Map();function execute(task){const bot=context.instance(task.account);if(!bot)return;const p=task.params||{};switch(task.action){case"cmd":return bot.command(p.command||"");case"say":return bot.say(p.message||"");case"walk_to":return move(bot,p,context.io);case"start_brain":config.ai_brain.enabled=true;break;case"stop_brain":config.ai_brain.enabled=false;break;case"mine":case"farm":case"fish":context.addLog(`Task ${task.action} requested; enable its module in settings.json`,"warn");break;default:throw Error("Unsupported task action");}}
 function add(task){const id=task.id||`${Date.now()}-${Math.random().toString(36).slice(2,7)}`;let cancel;if(task.cron){if(!cron.validate(task.cron))throw Error("Invalid cron expression");const job=cron.schedule(task.cron,()=>{try{execute(task);}catch(e){context.addLog(e.message,"error");}});cancel=()=>job.stop();}else if(task.delay_sec){const t=setTimeout(()=>{try{execute(task);}catch(e){context.addLog(e.message,"error");}jobs.delete(id);},Math.max(1,Number(task.delay_sec))*1000);cancel=()=>clearTimeout(t);}else throw Error("Task requires cron or delay_sec");jobs.set(id,{...task,id,cancel});return id;}
 function remove(id){const j=jobs.get(id);if(!j)return false;j.cancel();jobs.delete(id);return true;}
 for(const t of config.tasks||[])try{add(t);}catch(e){context.addLog(`[Scheduler] ${e.message}`,"warn");}
 return {add,remove,list:()=>[...jobs.values()].map(({cancel,...t})=>t)};}
module.exports={createScheduler};
