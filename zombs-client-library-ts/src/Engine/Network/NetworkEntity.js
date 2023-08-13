"use strict";
exports.__esModule = true;
exports.NetworkEntity = void 0;
var NetworkEntity = /** @class */ (function () {
    function NetworkEntity(game, tick) {
        this.currentGame = game;
        this.uid = tick.uid;
        this.setTargetTick(tick);
    }
    /** reset method */
    NetworkEntity.prototype.reset = function () {
        this.uid = null;
        this.currentModel = null;
        this.entityClass = null;
        this.fromTick = null;
        this.targetTick = null;
    };
    /** is local method */
    NetworkEntity.prototype.isLocal = function () {
        var local = this.currentGame.world.getLocalPlayer();
        if (!local || !local.getEntity())
            return false;
        return this.uid === local.getEntity().uid;
    };
    /** get target tick method */
    NetworkEntity.prototype.getTargetTick = function () {
        return this.targetTick;
    };
    /** get from tick method */
    NetworkEntity.prototype.getFromTick = function () {
        return this.fromTick;
    };
    /** set target tick method */
    NetworkEntity.prototype.setTargetTick = function (tick) {
        if (!this.targetTick) {
            this.entityClass = tick.entityClass;
            this.targetTick = tick;
        }
        this.addMissingTickFields(tick, this.targetTick);
        this.fromTick = this.targetTick;
        this.targetTick = tick;
        if (this.fromTick.model !== this.targetTick.model) {
            this.refreshModel(this.targetTick.model);
        }
        this.entityClass = this.targetTick.entityClass;
    };
    /** override from tick method */
    NetworkEntity.prototype.overrideFromTick = function (tick) {
        this.fromTick = tick;
    };
    /** override target tick */
    NetworkEntity.prototype.overrideTargetTick = function (tick) {
        this.targetTick = tick;
    };
    /** tick method */
    NetworkEntity.prototype.tick = function (msInThisTick, msPerTick) {
        if (!this.fromTick)
            return;
    };
    /** update method */
    NetworkEntity.prototype.update = function (arg, args) {
    };
    /** refreshModel */
    NetworkEntity.prototype.refreshModel = function (networkModelName) {
    };
    /** add missing tick fields method */
    NetworkEntity.prototype.addMissingTickFields = function (tick, lastTick) {
        var fieldName;
        for (fieldName in lastTick) {
            var fieldValue = lastTick[fieldName];
            if (!(fieldName in tick))
                tick[fieldName] = fieldValue;
        }
    };
    return NetworkEntity;
}());
exports.NetworkEntity = NetworkEntity;
