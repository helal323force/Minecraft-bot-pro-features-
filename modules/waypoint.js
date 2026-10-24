// Pathfinder waypoint movement helper.
const {goals}=require("mineflayer-pathfinder");
async function move(instance,{x,y,z},io){const bot=instance.bot;if(!bot?.entity)throw Error("Bot not spawned");io?.emit("move_status",{account:instance.id,status:"navigating",target:{x,y,z}});try{await bot.pathfinder.goto(new goals.GoalNear(Number(x),Number(y),Number(z),1));io?.emit("move_status",{account:instance.id,status:"arrived",target:{x,y,z}});return true;}catch(e){io?.emit("move_status",{account:instance.id,status:"failed",error:e.message});throw e;}}
module.exports={move};
