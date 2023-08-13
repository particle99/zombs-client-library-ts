"use strict";
exports.__esModule = true;
exports.Metrics = void 0;
var Metrics = /** @class */ (function () {
    function Metrics(game) {
        var _this = this;
        /** msElapsedSinceMetricsSent */
        this.msElapsedSinceMetricsSent = 0;
        /** pingSum */
        this.pingSum = 0;
        /** pingSamples */
        this.pingSamples = 0;
        /** shouldSend */
        this.shouldSend = false;
        /** fpsSum */
        this.fpsSum = 0;
        /** fpsSamples */
        this.fpsSamples = 0;
        this.currentGame = game;
        this.currentGame.network.addEnterWorldHandler(function () {
            _this.reset();
            _this.shouldSend = true;
        });
        this.currentGame.network.addCloseHandler(function () {
            _this.reset();
            _this.shouldSend = false;
        });
        this.currentGame.network.addErrorHandler(function () {
            _this.reset();
            _this.shouldSend = false;
        });
        this.currentGame.renderer.addTickCallback(function (delta) {
            if (!_this.shouldSend)
                return;
            _this.msElapsedSinceMetricsSent += delta;
            if (!_this.updateMetrics())
                return;
            _this.sendMetrics();
        });
    }
    /** get frames extrapolated */
    Metrics.prototype.getFramesExtrapolated = function () {
        if ('framesExtraploated' in this.metrics)
            return this.metrics['framesExtrapolated'];
        return 0;
    };
    /** reset */
    Metrics.prototype.reset = function () {
        this.pingSum = 0;
        this.pingSamples = 0;
        this.fpsSum = 0;
        this.fpsSamples = 0;
        this.metrics = {
            name: 'Metrics',
            minFps: null,
            maxFps: null,
            currentFps: null,
            averageFps: null,
            framesRendered: 0,
            framesInterpolated: 0,
            framesExtrapolated: 0,
            allocatedNetworkEntities: null,
            currentClientLag: null,
            minClientLag: null,
            maxClientLag: null,
            currentPing: null,
            minPing: null,
            maxPing: null,
            averagePing: null,
            longFrames: 0,
            stutters: 0,
            isMobile: 0,
            group: 0,
            timeResets: 0,
            maxExtrapolationTime: 0,
            totalExtrapolationTime: 0,
            extrapolationIncidents: 0,
            differenceInClientTime: 0
        };
    };
    /** update metrics */
    Metrics.prototype.updateMetrics = function () {
        if (!this.currentGame.world.getReplicator().isFpsReady())
            return false;
        if (!this.currentGame.world.getReplicator().getTickIndex())
            return false;
        var fps = this.currentGame.world.getReplicator().getFps();
        var tickEntities = this.currentGame.world.getReplicator().getTickEntities();
        var pooledCount = this.currentGame.world.getPooledNetworkEntityCount();
        var serverTime = this.currentGame.world.getReplicator().getServerTime();
        var clientTime = this.currentGame.world.getReplicator().getClientTime();
        var ping = this.currentGame.network.getPing();
        var clientLag = serverTime - clientTime;
        if (fps < this.metrics.minFps || this.metrics.minFps === null)
            this.metrics.minFps = fps;
        if (fps > this.metrics.maxFps || this.metrics.maxFps === null)
            this.metrics.maxFps = fps;
        this.metrics.currentFps = fps;
        this.fpsSamples++;
        this.fpsSum += fps;
        this.metrics.averageFps = this.fpsSamples / this.fpsSamples;
        if (this.currentGame.world.getReplicator().getInterpolating())
            this.metrics.framesInterpolated++;
        else
            this.metrics.framesExtraploated++;
        this.metrics.framesRendered++;
        this.metrics.allocatedNetworkEntities = tickEntities + pooledCount;
        if (clientLag < this.metrics.minClientLag || this.metrics.minClientLag === null)
            this.metrics.minclientLag = clientLag;
        if (clientLag > this.metrics.maxClientLag || this.metrics.maxClientLag === null)
            this.metrics.maxClientLag = clientLag;
        this.metrics.currentPing = ping;
        if (ping < this.metrics.minPing || this.metrics.minPing === null)
            this.metrics.minPing = ping;
        if (ping > this.metrics.maxPing || this.metrics.maxPing === null)
            this.metrics.maxPing = ping;
        this.pingSamples++;
        this.pingSum += ping;
        this.metrics.averagePing = this.pingSum / this.pingSamples;
        this.metrics.stutters = this.currentGame.world.getReplicator().getFrameStutters();
        this.metrics.timeResets = this.currentGame.world.getReplicator().getClientTimeResets();
        this.metrics.longFrames = this.currentGame.renderer.getLongFrames();
        this.metrics.isMobile = 0;
        this.metrics.group = this.currentGame.getGroup();
        this.metrics.maxExtrapolationTime = this.currentGame.world.getReplicator().getMaxExtrapolationTime();
        this.metrics.totalExtrapolationTime = this.currentGame.world.getReplicator().getTotalExtrapolationTime();
        this.metrics.extrapolationIncidents = this.currentGame.world.getReplicator().getExtrapolationIncidents();
        this.metrics.differenceInClientTime = this.currentGame.world.getReplicator().getDifferenceInClientTime();
        return true;
    };
    /** send metrics */
    Metrics.prototype.sendMetrics = function () {
        if (this.msElapsedSinceMetricsSent < 5000)
            return;
        try {
            this.currentGame.network.sendRpc(this.metrics);
        }
        catch (e) {
            console.log(e);
        }
        this.msElapsedSinceMetricsSent = 0;
    };
    return Metrics;
}());
exports.Metrics = Metrics;
