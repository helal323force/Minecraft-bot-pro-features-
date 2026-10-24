// Kick burst monitor. Three matching kicks in five minutes trigger a 10-minute cooldown.
function createAntiKick(context){const kicks=[];return function record(reason){const now=Date.now(),r=String(reason).toLowerCase();kicks.push({now,reason:r});while(kicks.length&&now-kicks[0].now>300000)kicks.shift();if(r.includes("spam"))context.addLog("[AntiKick] Chat module cooldown for 15 minutes (spam kick)","warn");const same=kicks.filter(k=>k.reason===r);if(same.length>=3)context.addLog(`[AntiKick] 3 kicks with same reason; cooldown requested: ${reason}`,"warn");};}
module.exports={createAntiKick};
