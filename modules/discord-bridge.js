// Bridges Mineflayer chat to Discord; configured bridge channel only.
function bridge(instance,config,client,context){if(!client||!config.discord?.chat_bridge?.enabled)return()=>{};const channelId=resolve(config.discord.chat_bridge.channelId);function resolve(v){return typeof v==="string"&&v.startsWith("ENV:")?process.env[v.slice(4)]:v;}
 const handler=async msg=>{try{const ch=await client.channels.fetch(channelId);if(ch)await ch.send({embeds:[{description:String(msg).slice(0,4000),color:0x22c55e,footer:{text:`Minecraft · ${instance.id}`}}]});}catch(e){context.addLog(`[Bridge] ${e.message}`,"warn");}};
 instance.bot?.on("messagestr",handler);return()=>instance.bot?.removeListener("messagestr",handler);}
module.exports={bridge};
