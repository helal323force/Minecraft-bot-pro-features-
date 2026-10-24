// Periodically saves bot snapshots to SQLite; restore endpoint is handled by API route.
const db=require("../core/database");
function startBackup(instance,config,context){const timer=setInterval(()=>{try{const b=instance.bot;if(!b?.entity)return;db.backup(instance.id,{position:b.entity.position,health:b.health,food:b.food,inventory:b.inventory.items().map(i=>({name:i.name,count:i.count})),experience:b.experience});}catch(e){context.addLog(`[Backup] ${e.message}`,"warn");}},300000);instance.timers.add(timer);return()=>{clearInterval(timer);instance.timers.delete(timer);};}
module.exports={startBackup};
