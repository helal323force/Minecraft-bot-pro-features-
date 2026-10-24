// Player join/leave tracking to SQLite and Socket.IO.
const db=require("../core/database");
function installTracker(instance,config,context){const bot=instance.bot;if(!bot||config.tracker?.enabled===false)return()=>{};const sessions=new Map();
 const joined=p=>{if(!p?.username)return;const id=db.joinPlayer(p.username,p.uuid||"");sessions.set(p.username,id);context.io?.emit("player_event",{event:"join",username:p.username,account:instance.id,at:Date.now()});db.event("player_join",p.username);};
 const left=p=>{if(!p?.username)return;const id=sessions.get(p.username);if(id)db.leavePlayer(id);sessions.delete(p.username);context.io?.emit("player_event",{event:"leave",username:p.username,account:instance.id,at:Date.now()});db.event("player_leave",p.username);};
 bot.on("playerJoined",joined);bot.on("playerLeft",left);return()=>{bot.removeListener("playerJoined",joined);bot.removeListener("playerLeft",left);};}
module.exports={installTracker};
