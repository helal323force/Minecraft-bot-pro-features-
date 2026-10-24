// Auto-fish requires a fishing rod and an accessible water area.
async function fish(instance,config){const b=instance.bot;if(!b||!config.modules?.auto_fish?.enabled)throw Error("Auto-fish disabled");const rod=b.inventory.items().find(i=>i.name==="fishing_rod");if(!rod)throw Error("Fishing rod not found in inventory");await b.equip(rod,"hand");await b.fish();return {caught:true};}
module.exports={fish};
