// Loads optional local plugins safely from ./plugins; each exports {name,version,init(bot,context)}.
const fs=require("fs"),path=require("path");
function loadPlugins(bot,context,addLog){const dir=path.join(process.cwd(),"plugins");fs.mkdirSync(dir,{recursive:true});let loaded=[];for(const f of fs.readdirSync(dir).filter(x=>x.endsWith(".js")&&x!=="example-plugin.js")){try{const p=require(path.join(dir,f));if(typeof p.init!=="function")throw Error("plugin must export init(bot, context)");p.init(bot,context);loaded.push(`${p.name||f} v${p.version||"1"}`);}catch(e){addLog(`[Plugins] ${f}: ${e.message}`,"error");}}addLog(`[Plugins] Loaded ${loaded.length} plugins: ${loaded.join(", ")||"none"}`);return loaded;}
module.exports={loadPlugins};
