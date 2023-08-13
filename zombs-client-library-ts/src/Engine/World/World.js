"use strict";
exports.__esModule = true;
exports.World = void 0;
/** misc */
var Replication_1 = require("../Network/Replication");
var NetworkEntity_1 = require("../Network/NetworkEntity");
var LocalPlayer_1 = require("./LocalPlayer");
var World = /** @class */ (function () {
    function World(game) {
        /** entities */
        this.entities = {};
        /** inWorld */
        this.inWorld = false;
        /** myUid */
        this.myUid = null;
        /** networkEntityPool */
        this.networkEntityPool = [];
        /** modelEntityPool */
        this.modelEntityPool = {};
        /** width */
        this.width = 0;
        /** height */
        this.height = 0;
        /** tickRate */
        this.tickRate = 0;
        /** msPerTick */
        this.msPerTick = 0;
        this.currentGame = game;
        this.network = this.currentGame.network;
        this.renderer = this.currentGame.renderer;
        this.replicator = new Replication_1.Replication(this.currentGame);
        this.localPlayer = new LocalPlayer_1.LocalPlayer(this.currentGame);
    }
    /** init method */
    World.prototype.init = function () {
        this.replicator.setTargetTickUpdatedCallback(this.onEntityUpdate.bind(this));
        this.replicator.init();
        this.currentGame.network.addEnterWorldHandler(this.onEnterWorld.bind(this));
        this.currentGame.renderer.addTickCallback(this.onRendererTick.bind(this));
    };
    /** pre load network entities */
    World.prototype.preloadNetworkEntities = function () {
        if (!this.currentGame.getNetworkEntityPooling())
            return;
        var tick = {
            uid: 0,
            entityClass: null
        };
        var poolSize = this.currentGame.getNetworkEntityPooling();
        for (var i = 0; i < poolSize; i++) {
            var entity = new NetworkEntity_1.NetworkEntity(this.currentGame, tick);
            entity.reset();
            this.networkEntityPool.push(entity);
        }
    };
    /** pre load model entities */
    World.prototype.preloadModelEntities = function () {
        var modelIsToPool = this.currentGame.getModelEntityPooling();
        var modelName;
        for (modelName in modelIsToPool) {
            var poolSize = modelIsToPool[modelName];
            this.modelEntityPool[modelName] = [];
            for (var i = 0; i < poolSize; i++) {
                //
            }
        }
    };
    /** get tick rate */
    World.prototype.getTickRate = function () {
        return this.tickRate;
    };
    /** get ms per tick */
    World.prototype.getMsPerTick = function () {
        return this.msPerTick;
    };
    /** getReplicator */
    World.prototype.getReplicator = function () {
        return this.replicator;
    };
    /** get height */
    World.prototype.getHeight = function () {
        return this.height;
    };
    /** get width */
    World.prototype.getWidth = function () {
        return this.width;
    };
    /** get local player */
    World.prototype.getLocalPlayer = function () {
        return this.localPlayer;
    };
    /** get in world */
    World.prototype.getInWorld = function () {
        return this.inWorld;
    };
    /** get my uid */
    World.prototype.getMyUid = function () {
        return this.myUid;
    };
    /** get entities by uid */
    World.prototype.getEntityByUid = function (uid) {
        return this.entities[uid];
    };
    /** get pooled network entity count */
    World.prototype.getPooledNetworkEntityCount = function () {
        return this.networkEntityPool.length;
    };
    /** get model from pool */
    World.prototype.getModelfromPool = function (modelName) {
        if (this.modelEntityPool[modelName].length === 0)
            return null;
        return this.modelEntityPool[modelName].shift();
    };
    /** get pooled model entity count */
    World.prototype.getPooledModelEntityCount = function (modelName) {
        if (!(modelName in this.modelEntityPool))
            return 0;
        return this.modelEntityPool[modelName].length;
    };
    /** on enter world */
    World.prototype.onEnterWorld = function (data) {
        if (!data.allowed)
            return;
        this.width = data.x2;
        this.height = data.y2;
        this.tickRate = data.tickRate;
        this.msPerTick = 1000 / data.tickRate;
        this.inWorld = true;
        this.myUid = data.uid;
    };
    /** on entity update */
    World.prototype.onEntityUpdate = function (data) {
        var uid;
        for (uid in this.entities) {
            if (!(uid in data.entities)) {
                this.removeEntity(uid);
            }
            else if (data.entities[uid] !== true) {
                this.updateEntity(uid, data.entities[uid]);
            }
            else {
                this.updateEntity(uid, this.entities[uid].getTargetTick());
            }
        }
        for (uid in data.entities) {
            if (data.entities[uid] === true)
                continue;
            if (!(uid in this.entities))
                this.createEntity(data.entities[uid]);
            if (this.localPlayer != null && this.localPlayer.getEntity() === this.entities[uid]) {
                this.localPlayer.setTargetTick(data.entities[uid]);
            }
        }
    };
    /** create entity */
    World.prototype.createEntity = function (data) {
        var entity;
        if (this.currentGame.getNetworkEntityPooling() && this.networkEntityPool.length > 0) {
            entity = this.networkEntityPool.shift();
            entity.setTargetTick(data);
            entity.uid = data.uid;
        }
        else {
            entity = new NetworkEntity_1.NetworkEntity(this.currentGame, data);
        }
        entity.refreshModel(data.model);
        if (data.uid === this.myUid)
            this.localPlayer.setEntity(entity);
        this.entities[data.uid] = entity;
    };
    /** update entity */
    World.prototype.updateEntity = function (uid, data) {
        this.entities[uid].setTargetTick(data);
    };
    /** remove entity */
    World.prototype.removeEntity = function (uid) {
        delete this.entities[uid];
    };
    /** on renderer tick */
    World.prototype.onRendererTick = function (delta) {
        var msInThisTick = this.replicator.getMsInThisTick();
        var uid;
        for (uid in this.entities)
            this.entities[uid].tick(msInThisTick, this.msPerTick);
    };
    return World;
}());
exports.World = World;
