"use strict";
exports.__esModule = true;
exports.LocalPlayer = void 0;
var LocalPlayer = /** @class */ (function () {
    function LocalPlayer(game) {
        this.currentGame = game;
    }
    /** set entity method */
    LocalPlayer.prototype.setEntity = function (entity) {
        this.entity = entity;
    };
    /** get entity method */
    LocalPlayer.prototype.getEntity = function () {
        return this.entity;
    };
    /** get party id method */
    LocalPlayer.prototype.getMyPartyId = function () {
        var myNetworkEntity = this.currentGame.world.getEntityByUid(this.currentGame.world.getMyUid());
        if (!myNetworkEntity)
            return 0;
        var target = myNetworkEntity.getTargetTick();
        if (!target)
            return 0;
        return target.partyId;
    };
    /** set target tick method */
    LocalPlayer.prototype.setTargetTick = function (tick) {
    };
    return LocalPlayer;
}());
exports.LocalPlayer = LocalPlayer;
