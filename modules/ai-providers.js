// Multi-provider AI adapter. Keys are read from ENV:... values or process.env.
const { GoogleGenerativeAI } = require("@google/generative-ai");
const Groq = require("groq-sdk");
const OpenAI = require("openai");
function resolve(v){return typeof v==="string"&&v.startsWith("ENV:")?process.env[v.slice(4)]:v;}
function key(config,name){return resolve(config.ai?.[name]?.apiKey)||process.env[`${name.toUpperCase()}_API_KEY`];}
async function askProvider(config,provider,prompt,system) {
 const model=config.ai?.[provider]?.model;
 if(provider==="gemini"){const k=key(config,"gemini");if(!k)throw Error("Gemini API key missing");const client=new GoogleGenerativeAI(k);const m=client.getGenerativeModel({model:model||"gemini-1.5-flash",systemInstruction:system});const r=await Promise.race([m.generateContent(prompt),new Promise((_,rej)=>setTimeout(()=>rej(Error("AI timeout")),10000))]);return {text:r.response.text(),tokens:r.response.usageMetadata?.totalTokenCount||0};}
 if(provider==="groq"){const k=key(config,"groq");if(!k)throw Error("Groq API key missing");const client=new Groq({apiKey:k,timeout:10000});const r=await client.chat.completions.create({model:model||"llama-3.1-8b-instant",messages:[{role:"system",content:system},{role:"user",content:prompt}],max_tokens:160});return {text:r.choices?.[0]?.message?.content||"",tokens:r.usage?.total_tokens||0};}
 if(provider==="openai"){const k=key(config,"openai");if(!k)throw Error("OpenAI API key missing");const client=new OpenAI({apiKey:k,timeout:10000});const r=await client.chat.completions.create({model:model||"gpt-4o-mini",messages:[{role:"system",content:system},{role:"user",content:prompt}],max_tokens:160});return {text:r.choices?.[0]?.message?.content||"",tokens:r.usage?.total_tokens||0};}
 throw Error(`Unknown AI provider: ${provider}`);
}
async function ask(config,prompt,name="AFKBot"){
 const providers=[config.ai?.primary||process.env.AI_PROVIDER||"gemini",...(config.ai?.fallbacks||[])];let last;
 const system=(config.ai?.system_prompt||"You are Minecraft bot {name}.").replaceAll("{name}",name)+" Personality: "+(config.ai?.personality||"friendly")+". Keep replies concise.";
 for(const provider of [...new Set(providers)]){try{return {...await askProvider(config,provider,prompt,system),provider};}catch(e){last=e;}}
 throw last||Error("No AI providers configured");
}
module.exports={ask};
