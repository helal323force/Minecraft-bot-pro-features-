// Round-robin proxy selector. Mineflayer proxy-agent integration varies by auth/version.
let cursor=0;function nextProxy(config){if(!config.proxy?.enabled||!config.proxy.list?.length)return null;const value=config.proxy.list[cursor%config.proxy.list.length];cursor++;return value;}module.exports={nextProxy};
