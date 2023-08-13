"use strict";
exports.__esModule = true;
exports.NetworkAdapter = void 0;
/** misc */
var packets_1 = require("./packets");
var Codec_js_1 = require("./Codec.js");
/** imports */
var ws_1 = require("ws");
var events_1 = require("events");
/** servers */
var servers_1 = require("../../utils/servers");
var NetworkAdapter = /** @class */ (function () {
    function NetworkAdapter(game, agent) {
        var _this = this;
        /** ping */
        this.ping = 0;
        /** connecting */
        this.connected = false;
        this.connecting = false;
        /** proxySupport */
        this.proxySupport = true;
        /** agent */
        this.agent = null;
        this.codec = new Codec_js_1.Codec(game);
        this.emitter = new events_1.EventEmitter();
        this.emitter.setMaxListeners(50);
        this.agent = agent;
        /** ping handlers */
        this.addConnectHandler(this.sendPingIfNecessary.bind(this));
        this.addPingHandler(this.onPing.bind(this));
        /** connect handlers */
        this.addConnectHandler(function () {
            _this.connected = true;
            _this.connecting = false;
        });
        this.addCloseHandler(function () {
            _this.connected = false;
            _this.connecting = false;
        });
    }
    /** connect method */
    NetworkAdapter.prototype.connect = function (server) {
        var parsedServer = servers_1.Servers[server];
        this.connectionOptions = parsedServer;
        this.connected = false;
        this.connecting = true;
        var options = {
            headers: {
                'Accept-Encoding': 'gzip, deflate, br',
                'Accept-Language': 'en-US,en;q=0.9',
                'Cache-Control': 'no-cache',
                'Origin': "https://zombs.io/",
                'Host': this.connectionOptions.hostname,
                'User-Agent': "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/112.0.0.0 Safari/537.36"
            }
        };
        if (this.agent != null)
            options.headers.agent = this.agent;
        /** websocket */
        this.socket = new ws_1.WebSocket("wss://".concat(this.connectionOptions.hostname), options);
        /** bind event listeners */
        this.bindEventListeners();
    };
    /** bind event listeners method */
    NetworkAdapter.prototype.bindEventListeners = function () {
        this.socket.addEventListener('open', this.emitter.emit.bind(this.emitter, 'connected'));
        this.socket.addEventListener('message', this.onMessage.bind(this));
        this.socket.addEventListener('close', this.emitter.emit.bind(this.emitter, 'close'));
        this.socket.addEventListener('error', this.emitter.emit.bind(this.emitter, 'error'));
        /** send enter world2 on enter world */
        this.addPreEnterWorldHandler(this.onConnectionStart.bind(this));
        this.addEnterWorldHandler(this.sendEnterWorld2.bind(this));
    };
    /** disconnect method */
    NetworkAdapter.prototype.disconnect = function () {
        this.emitter.removeAllListeners();
        this.socket.close();
        this.socket = null;
    };
    /** get ping method */
    NetworkAdapter.prototype.getPing = function () {
        return this.ping;
    };
    /** encode + send packets method */
    NetworkAdapter.prototype.sendPacket = function (event, data) {
        if (!event || !data)
            return;
        this.socket.send(this.codec.encode(event, data));
    };
    /** on message method */
    NetworkAdapter.prototype.onMessage = function (msg) {
        var message = this.codec.decode(msg.data);
        var opcode = message.opcode;
        this.emitter.emit(packets_1.Packets[opcode], message);
    };
    /** send ping if necessary method */
    NetworkAdapter.prototype.sendPingIfNecessary = function () {
        this.connecting = false;
        this.connected = true;
        var pingInProgress = (this.pingStart != null);
        if (pingInProgress)
            return;
        if (this.pingCompletion != null) {
            var msSinceLastPing = (new Date().getTime() - this.pingCompletion.getTime());
            if (msSinceLastPing <= 5000)
                return;
        }
        this.pingStart = new Date();
        this.sendPing({
            nonce: 0
        });
    };
    /** on ping method */
    NetworkAdapter.prototype.onPing = function () {
        this.ping = (new Date().getTime() - this.pingStart.getTime()) / 2;
        this.pingStart = new Date();
        this.pingCompletion = new Date();
    };
    /** on connection start method */
    NetworkAdapter.prototype.onConnectionStart = function (data) {
        this.sendEnterWorld({
            displayName: "typescript test",
            extra: data.extra
        });
    };
    /** NetworkAdapter methods */
    /** send enter world */
    NetworkAdapter.prototype.sendEnterWorld = function (data) {
        this.sendPacket(packets_1.Packets.PACKET_ENTER_WORLD, data);
    };
    /** send neter world2 */
    NetworkAdapter.prototype.sendEnterWorld2 = function () {
        this.sendPacket(packets_1.Packets.PACKET_ENTER_WORLD2, {});
    };
    /** send input */
    NetworkAdapter.prototype.sendInput = function (data) {
        this.sendPacket(packets_1.Packets.PACKET_INPUT, data);
    };
    /** send ping */
    NetworkAdapter.prototype.sendPing = function (data) {
        this.sendPacket(packets_1.Packets.PACKET_PING, data);
    };
    /** send rpc */
    NetworkAdapter.prototype.sendRpc = function (data) {
        this.sendPacket(packets_1.Packets.PACKET_RPC, data);
    };
    /** add pre enter world handler */
    NetworkAdapter.prototype.addPreEnterWorldHandler = function (callback) {
        this.addPacketHandler(packets_1.Packets.PACKET_PRE_ENTER_WORLD, function (response) { return callback(response); });
    };
    /** add enter world handler */
    NetworkAdapter.prototype.addEnterWorldHandler = function (callback) {
        this.addPacketHandler(packets_1.Packets.PACKET_ENTER_WORLD, function (response) { return callback(response); });
    };
    /** add entity update handler */
    NetworkAdapter.prototype.addEntityUpdateHandler = function (callback) {
        this.addPacketHandler(packets_1.Packets.PACKET_ENTITY_UPDATE, function (response) { return callback(response); });
    };
    /** add ping handler */
    NetworkAdapter.prototype.addPingHandler = function (callback) {
        this.addPacketHandler(packets_1.Packets.PACKET_PING, function (response) { return callback(response); });
    };
    /** add rpc handler */
    NetworkAdapter.prototype.addRpcHandler = function (rpcName, callback) {
        this.addPacketHandler(packets_1.Packets.PACKET_RPC, function (rpc) {
            if (rpc.name == rpcName) {
                callback(rpc.response);
            }
        });
    };
    /** connect handler */
    NetworkAdapter.prototype.addConnectHandler = function (callback) {
        this.emitter.on('connect', callback);
    };
    /** close handler */
    NetworkAdapter.prototype.addCloseHandler = function (callback) {
        this.emitter.on('close', callback);
    };
    /** error handler */
    NetworkAdapter.prototype.addErrorHandler = function (callback) {
        this.emitter.on('error', callback);
    };
    /** add packet handler */
    NetworkAdapter.prototype.addPacketHandler = function (opcode, callback) {
        this.emitter.on(packets_1.Packets[opcode], callback);
    };
    return NetworkAdapter;
}());
exports.NetworkAdapter = NetworkAdapter;
