// Shared application state used by HTTP, Socket.IO and modules.
const state = { instances: new Map(), selectedAccount: "main", startedAt: Date.now(), tasks: [], reconnects: [], chat: [], events: [], aiRequests: 0 };
function selected() { return state.instances.get(state.selectedAccount) || state.instances.values().next().value || null; }
module.exports = { state, selected };
