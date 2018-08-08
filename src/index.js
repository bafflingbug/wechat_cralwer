const AnyProxy = require('anyproxy');
const rule = require('./rule');
const options = {
    port: 8001,
    rule: rule,
    webInterface: {
        enable: true,
        webPort: 8002
    },
    throttle: 10000,
    forceProxyHttps: true,
    wsIntercept: true, // 不开启websocket代理
    silent: false
};
const proxyServer = new AnyProxy.ProxyServer(options);

proxyServer.on('ready', () => { console.log("proxyServer is ready") });
proxyServer.on('error', (e) => { console.log("proxyServer Error:") + e.toString() });
proxyServer.start();

//when finished
//proxyServer.close();