"use strict";
exports.__esModule = true;
exports.Replication = void 0;
var Replication = /** @class */ (function () {
    function Replication(game) {
        /** ticks */
        this.ticks = [];
        /** shiftedGameTime */
        this.shiftedGameTime = 0;
        /** lastShiftedGameTime */
        this.lastShiftedGameTime = 0;
        /** receivedFirstTick */
        this.receivedFirstTick = false;
        /** serverTime */
        this.serverTime = 0;
        /** msPerTick */
        this.msPerTick = 0;
        /** msInThisTick */
        this.msInThisTick = 0;
        /** msElapsed */
        this.msElapsed = 0;
        /** lastMsElapsed */
        this.lastMsElapsed = 0;
        /** ping */
        this.ping = 0;
        /** lastPing */
        this.lastPing = 0;
        /** startShiftedGameTime */
        this.startShiftedGameTime = 0;
        /** frameStutters */
        this.frameStutters = 0;
        /** frameTimes */
        this.frameTimes = [];
        /** interpolating */
        this.interpolating = false;
        /** ticksDesynced */
        this.ticksDesynced = 0;
        /** ticksDesynced2 */
        this.ticksDesynced2 = 0;
        /** clientTimeResets */
        this.clientTimeResets = 0;
        /** maxExtrapolationTime */
        this.maxExtrapolationTime = 0;
        /** totalExtrapolationTime */
        this.totalExtrapolationTime = 0;
        /** extrapolationIncidents */
        this.extrapolationIncidents = 0;
        /** differenceInClientTime */
        this.differenceInClientTime = 0;
        /** equalTimes */
        this.equalTimes = 0;
        /** wasRendererJustUnpaused */
        this.wasRendererJustUnpaused = false;
        this.currentGame = game;
    }
    /** init method */
    Replication.prototype.init = function () {
        this.currentGame.network.addEnterWorldHandler(this.onEnterWorld.bind(this));
        this.currentGame.network.addEntityUpdateHandler(this.onEntityUpdate.bind(this));
        this.currentGame.renderer.addTickCallback(this.onTick.bind(this));
    };
    /** set target tick updated callback */
    Replication.prototype.setTargetTickUpdatedCallback = function (tickUpdatedCallback) {
        this.tickUpdatedCallback = tickUpdatedCallback;
    };
    /** set latest tick updated callback */
    Replication.prototype.setLatestTickUpdatedCallback = function (callback) {
        this.latestTickUpdatedCallback = callback;
    };
    /** get client time resets */
    Replication.prototype.getClientTimeResets = function () {
        return this.clientTimeResets;
    };
    /** get ms in this tick */
    Replication.prototype.getMsInThisTick = function () {
        return Math.floor(this.msInThisTick);
    };
    /** get ms per tick */
    Replication.prototype.getMsPerTick = function () {
        return this.msPerTick;
    };
    /** get ms until tick */
    Replication.prototype.getMsuntilTick = function (tick) {
        return tick * this.msPerTick - this.shiftedGameTime;
    };
    /** get ms since tick */
    Replication.prototype.getMsSinceTick = function (tick, useInterpolationOffset) {
        if (useInterpolationOffset === void 0) { useInterpolationOffset = true; }
        if (useInterpolationOffset)
            tick += 2;
        return this.shiftedGameTime - tick * this.msPerTick;
    };
    /** get server time */
    Replication.prototype.getServerTime = function () {
        return Math.floor(this.serverTime);
    };
    /** get client time */
    Replication.prototype.getClientTime = function () {
        return Math.floor(this.shiftedGameTime);
    };
    /** get real client time */
    Replication.prototype.getRealClientTime = function () {
        if (!this.startTime)
            return 0;
        var msElapsed = (new Date().getTime() - this.startTime.getTime());
        return Math.floor(this.startShiftedGameTime + msElapsed);
    };
    /** get frame stutters */
    Replication.prototype.getFrameStutters = function () {
        return this.frameStutters;
    };
    /** get difference in client time */
    Replication.prototype.getDifferenceInClientTime = function () {
        return this.differenceInClientTime;
    };
    /** is fps ready */
    Replication.prototype.isFpsReady = function () {
        return this.frameTimes.length >= 10;
    };
    /** get fps */
    Replication.prototype.getFps = function () {
        var time = 0;
        for (var i = 0; i < this.frameTimes.length; i++)
            time += this.frameTimes[i];
        return 1000 / (time / this.frameTimes.length);
    };
    /** get interpolating */
    Replication.prototype.getInterpolating = function () {
        return this.interpolating;
    };
    /** get tick byte size */
    Replication.prototype.getTickByteSize = function () {
        if (!this.currentTick)
            return 0;
        return this.currentTick.byteSize;
    };
    /** get tick entities */
    Replication.prototype.getTickEntities = function () {
        if (!this.currentTick)
            return 0;
        return Object.keys(this.currentTick.entities).length;
    };
    /** get tick index */
    Replication.prototype.getTickIndex = function () {
        if (!this.currentTick)
            return 0;
        return this.currentTick.tick;
    };
    /** get last ms elapsed */
    Replication.prototype.getLastMsElapsed = function () {
        return this.lastMsElapsed;
    };
    /** get max extrapolation time */
    Replication.prototype.getMaxExtrapolationTime = function () {
        return this.maxExtrapolationTime;
    };
    /** get extrapolation incidents */
    Replication.prototype.getExtrapolationIncidents = function () {
        return this.extrapolationIncidents;
    };
    /** get total extrapolation time */
    Replication.prototype.getTotalExtrapolationTime = function () {
        return this.totalExtrapolationTime;
    };
    /** reset client lag */
    Replication.prototype.resetClientLag = function () {
        this.shiftedGameTime = this.getRealClientTime();
    };
    /** on tick */
    Replication.prototype.onTick = function (msElapsed) {
        this.msElapsed += msElapsed;
        this.lastMsElapsed = msElapsed;
        this.frameTimes.push(msElapsed);
        if (this.frameTimes.length > 10)
            this.frameTimes.shift();
        var steps = 0;
        var timeStep = 1000 / 60;
        while (this.msElapsed >= timeStep) {
            this.msElapsed -= timeStep;
            steps++;
        }
        if (steps > 1)
            this.frameStutters++;
        if (this.isRendererPaused()) {
            this.wasRendererJustUnpaused = true;
            this.equalTimes = 0;
            msElapsed = 0;
        }
        this.serverTime += msElapsed;
        this.shiftedGameTime += msElapsed;
        this.msInThisTick += msElapsed;
        this.updateTick();
    };
    /** update tick */
    Replication.prototype.updateTick = function () {
        for (var i = 0; i < this.ticks.length; i++) {
            var tick = this.ticks[i];
            var tickStart = this.msPerTick * tick.tick;
            if (this.shiftedGameTime >= tickStart) {
                this.currentTick = tick;
                this.msInThisTick = this.shiftedGameTime - tickStart;
                this.tickUpdatedCallback(tick);
                this.ticks.shift();
                i--;
            }
        }
        if (this.currentTick != null) {
            var nextTickStart = this.msPerTick * (this.currentTick.tick + 1);
            if (this.shiftedGameTime >= nextTickStart) {
                if (this.interpolating) {
                    this.interpolating = false;
                    this.extrapolationIncidents++;
                }
                this.maxExtrapolationTime = Math.max(this.shiftedGameTime - nextTickStart, this.maxExtrapolationTime);
                var extrapolationTime = Math.min(this.msInThisTick - this.msPerTick, this.lastMsElapsed);
                this.totalExtrapolationTime += extrapolationTime;
            }
            else {
                this.interpolating = true;
            }
            if (this.serverTime - this.shiftedGameTime < this.ping) {
                this.ticksDesynced++;
                if (this.ticksDesynced >= 10) {
                }
            }
        }
    };
    /** on enter world */
    Replication.prototype.onEnterWorld = function (data) {
        if (!data.allowed)
            return;
        this.tickRate = data.tickRate;
        this.msPerTick = 1000 / this.tickRate;
        this.msInThisTick = 0;
        this.shiftedGameTime = 0;
        this.serverTime = 0;
        this.receivedFirstTick = false;
        this.msElapsed = 0;
        this.lastMsElapsed = 0;
        this.ping = this.currentGame.network.getPing();
        this.lastPing = this.ping;
        this.startTime = null;
        this.startShiftedGameTime = 0;
        this.interpolating = false;
    };
    /** check renderer paused */
    Replication.prototype.checkRendererPaused = function () {
        if (this.lastShiftedGameTime === this.shiftedGameTime)
            this.equalTimes++;
        else
            this.equalTimes = 0;
    };
    /** is renderer paused */
    Replication.prototype.isRendererPaused = function () {
        return this.equalTimes >= 8;
    };
    /** on entity update */
    Replication.prototype.onEntityUpdate = function (data) {
        if (this.latestTickUpdatedCallback)
            this.latestTickUpdatedCallback(data);
        this.serverTime = data.tick * this.msPerTick + this.ping;
        this.ticks.push(data);
        if (!this.receivedFirstTick) {
            this.receivedFirstTick = true;
            this.startTime = new Date();
            this.shiftedGameTime = data.tick * this.msPerTick - 90;
            this.startShiftedGameTime = this.shiftedGameTime;
            this.clientTimeResets = 0;
        }
        else {
            this.checkRendererPaused();
            var rendererPaused = this.isRendererPaused();
            var differenceInClientLag = (data.tick * this.msPerTick - 90) - this.shiftedGameTime;
            if (!rendererPaused)
                this.differenceInClientTime = this.differenceInClientTime = differenceInClientLag;
            if (Math.abs(differenceInClientLag) >= 40)
                this.ticksDesynced2++;
            this.ticksDesynced2 = 0;
            if (this.ticksDesynced2 >= 10 || this.wasRendererJustUnpaused) {
                var last = this.shiftedGameTime;
                this.shiftedGameTime = data.tick * this.msPerTick - 90;
                this.msInThisTick += (this.shiftedGameTime - last);
                if (!rendererPaused && !this.wasRendererJustUnpaused)
                    this.clientTimeResets++;
                this.ticksDesynced2 = 0;
                this.wasRendererJustUnpaused = false;
            }
            this.lastShiftedGameTime = this.shiftedGameTime;
        }
    };
    return Replication;
}());
exports.Replication = Replication;
