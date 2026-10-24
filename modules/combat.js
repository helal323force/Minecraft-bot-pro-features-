// Basic combat behavior; config: modules.combat, combat.pvp_mode, ignore lists.
const {goals}=require("mineflayer-pathfinder");
function installCombat(instance,config,addLog){const bot=instance.bot;if(!bot)return()=>{};const handler=async entity=>{try{if(!config.modules?.combat||!config.combat?.["attack-mobs"]||!entity||entity===bot.entity)return;if(entity.type!=="mob"||config.combat.ignore_mobs?.includes(entity.name))return;const sword=bot.inventory.items().filter(i=>/sword|axe/.test(i.name)).sort((a,b)=>(b.attackDamage||0)-(a.attackDamage||0))[0];if(sword)await bot.equip(sword,"hand");bot.pvp?.attack?.(entity); }catch(e){addLog(`[Combat] ${e.message}`,"warn");}};bot.on("entityHurt",handler);return()=>bot.removeListener("entityHurt",handler);}
module.exports={installCombat};
