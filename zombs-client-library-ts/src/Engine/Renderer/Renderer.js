"use strict";
exports.__esModule = true;
exports.Renderer = void 0;
var Renderer = /** @class */ (function () {
    function Renderer(game) {
        /** tickCallbacks */
        this.tickCallbacks = [];
        /** lastMsElapsed */
        this.lastMsElapsed = 0;
        /** longFrames */
        this.longFrames = 0;
        this.currentGame = game;
    }
    /** add tick callback */
    Renderer.prototype.addTickCallback = function (callback) {
        this.tickCallbacks.push(callback);
    };
    /** get long frames */
    Renderer.prototype.getLongFrames = function () {
        return this.longFrames;
    };
    /** update */
    Renderer.prototype.update = function () {
        if (!this.firstPerformance) {
            this.firstPerformance = performance.now();
            setImmediate(this.update.bind(this));
            return;
        }
        var currentPerformance = performance.now();
        var performanceDelta = currentPerformance - this.firstPerformance;
        var msElapsed = performanceDelta - this.lastMsElapsed;
        this.lastMsElapsed = performanceDelta;
        try {
            for (var _i = 0, _a = this.tickCallbacks; _i < _a.length; _i++) {
                var callback = _a[_i];
                callback(msElapsed);
            }
        }
        catch (e) {
            console.log(e);
        }
        setImmediate(this.update.bind(this));
    };
    return Renderer;
}());
exports.Renderer = Renderer;
