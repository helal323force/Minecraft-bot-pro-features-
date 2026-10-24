// Discord.js v14 prefix-command bot with admin-role gate; webhook support remains separate.
const {Client,GatewayIntentBits,EmbedBuilder,SlashCommandBuilder,REST,Routes}=require("discord.js");
function createDiscord(config,context,ai){const d=config.discord||{};const token=resolve(d.botToken);if(!d.enabled||!token)return null;const client=new Client({intents:[GatewayIntentBits.Guilds,GatewayIntentBits.GuildMessages,GatewayIntentBits.MessageContent]});
 function resolve(v){return typeof v==="string"&&v.startsWith("ENV:")?process.env[v.slice(4)]:v;}
 function allowed(m){if(d.guildId&&m.guildId!==resolve(d.guildId))return false;if(d.allowedChannels?.length&&!d.allowedChannels.includes(m.channelId))return false;return !d.adminRoles?.length||m.member?.roles?.cache?.some(r=>d.adminRoles.includes(r.id));}
 async function send(channel,title,description,color=0x38bdf8){return channel.send({embeds:[new EmbedBuilder().setTitle(title).setDescription(String(description).slice(0,4000)).setColor(color).setTimestamp()]});}
 client.on("messageCreate",async m=>{if(m.author.bot)return;try{
  if(d.chat_bridge?.enabled&&m.channelId===resolve(d.chat_bridge.channelId)&&!m.content.startsWith(d.prefix)){const i=context.selected();if(i?.bot)i.say(`<${m.author.username}> ${m.content}`.slice(0,256));}
  if(!m.content.startsWith(d.prefix))return;if(!allowed(m))return send(m.channel,"Permission denied","You need an allowed admin role.",0xef4444);
  const [cmd,...args]=m.content.slice(d.prefix.length).trim().split(/\s+/),i=context.instance(args[0])||context.selected(),rest=args.join(" ");
  if(cmd==="start"){i?.start();return send(m.channel,"Bot started",i?.id||"No account");}
  if(cmd==="stop"){i?.stop();return send(m.channel,"Bot stopped",i?.id||"No account");}
  if(cmd==="status")return send(m.channel,"Bot status",JSON.stringify(i?.snapshot()||{running:false},null,2));
  if(cmd==="pos")return send(m.channel,"Position",JSON.stringify(i?.snapshot()?.position||"Unknown"));
  if(cmd==="say"){i?.say(rest);return send(m.channel,"Sent",rest);}
  if(cmd==="cmd"){i?.command(rest);return send(m.channel,"Command sent",rest);}
  if(cmd==="ai"){const q=args.slice(i&&args[0]===i.id?1:0).join(" ");const r=await ai.answer(q,m.author.username,i);return send(m.channel,"AI reply",r);}
  if(cmd==="brain"){config.ai_brain.enabled=args[0]==="on";return send(m.channel,"AI brain",config.ai_brain.enabled?"Enabled":"Disabled");}
  if(cmd==="players")return send(m.channel,"Players",JSON.stringify(i?.snapshot()?.players||[]));
  if(cmd==="logs"){const n=Math.min(20,Math.max(1,Number(args[0])||10));return send(m.channel,"Recent logs",context.getLogs(n).map(x=>x.formatted||x).join("\n"));}
 }catch(e){context.addLog(`[Discord] ${e.message}`,"error");try{await send(m.channel,"Command error",e.message,0xef4444);}catch{}}});
 client.once("ready",()=>context.addLog(`[Discord] Logged in as ${client.user.tag}`,"success"));
 client.login(token).catch(e=>context.addLog(`[Discord] Login failed: ${e.message}`,"error"));
 return client;
}
module.exports={createDiscord};
