"use strict";
var __awaiter = (this && this.__awaiter) || function (thisArg, _arguments, P, generator) {
    function adopt(value) { return value instanceof P ? value : new P(function (resolve) { resolve(value); }); }
    return new (P || (P = Promise))(function (resolve, reject) {
        function fulfilled(value) { try { step(generator.next(value)); } catch (e) { reject(e); } }
        function rejected(value) { try { step(generator["throw"](value)); } catch (e) { reject(e); } }
        function step(result) { result.done ? resolve(result.value) : adopt(result.value).then(fulfilled, rejected); }
        step((generator = generator.apply(thisArg, _arguments || [])).next());
    });
};
var __generator = (this && this.__generator) || function (thisArg, body) {
    var _ = { label: 0, sent: function() { if (t[0] & 1) throw t[1]; return t[1]; }, trys: [], ops: [] }, f, y, t, g;
    return g = { next: verb(0), "throw": verb(1), "return": verb(2) }, typeof Symbol === "function" && (g[Symbol.iterator] = function() { return this; }), g;
    function verb(n) { return function (v) { return step([n, v]); }; }
    function step(op) {
        if (f) throw new TypeError("Generator is already executing.");
        while (_) try {
            if (f = 1, y && (t = op[0] & 2 ? y["return"] : op[0] ? y["throw"] || ((t = y["return"]) && t.call(y), 0) : y.next) && !(t = t.call(y, op[1])).done) return t;
            if (y = 0, t) op = [op[0] & 2, t.value];
            switch (op[0]) {
                case 0: case 1: t = op; break;
                case 4: _.label++; return { value: op[1], done: false };
                case 5: _.label++; y = op[1]; op = [0]; continue;
                case 7: op = _.ops.pop(); _.trys.pop(); continue;
                default:
                    if (!(t = _.trys, t = t.length > 0 && t[t.length - 1]) && (op[0] === 6 || op[0] === 2)) { _ = 0; continue; }
                    if (op[0] === 3 && (!t || (op[1] > t[0] && op[1] < t[3]))) { _.label = op[1]; break; }
                    if (op[0] === 6 && _.label < t[1]) { _.label = t[1]; t = op; break; }
                    if (t && _.label < t[2]) { _.label = t[2]; _.ops.push(op); break; }
                    if (t[2]) _.ops.pop();
                    _.trys.pop(); continue;
            }
            op = body.call(thisArg, _);
        } catch (e) { op = [6, e]; y = 0; } finally { f = t = 0; }
        if (op[0] & 5) throw op[1]; return { value: op[0] ? op[1] : void 0, done: true };
    }
};
exports.__esModule = true;
exports.Game = void 0;
/** game classes */
var NetworkAdapter_1 = require("./Network/NetworkAdapter");
var World_1 = require("./World/World");
var Renderer_1 = require("./Renderer/Renderer");
var Metrics_1 = require("./Metrics/Metrics");
/** wasm */
var _WebAssembly_1 = require("./_WebAssembly");
var Game = /** @class */ (function () {
    function Game(agent) {
        /** modelEntityPooling */
        this.modelEntityPooling = {};
        /** networkEntityPooling */
        this.networkEntityPooling = false;
        /** preloaded */
        this.preloaded = false;
        this.network = new NetworkAdapter_1.NetworkAdapter(this, agent);
        this.world = new World_1.World(this);
        this.renderer = new Renderer_1.Renderer(this);
        this.metrics = new Metrics_1.Metrics(this);
        this.currentGame = this;
    }
    /** preload */
    Game.prototype.preload = function () {
        var _this = this;
        return new Promise(function (resolve) { return __awaiter(_this, void 0, void 0, function () {
            var _this = this;
            return __generator(this, function (_a) {
                switch (_a.label) {
                    case 0:
                        this.world.init();
                        this.world.preloadNetworkEntities();
                        this.world.preloadModelEntities();
                        this._WebAssembly = new _WebAssembly_1._WebAssembly(this);
                        return [4 /*yield*/, this._WebAssembly.init()];
                    case 1:
                        _a.sent();
                        this.network.addEnterWorldHandler(function () {
                            _this.renderer.update();
                        });
                        this.preloaded = true;
                        resolve();
                        return [2 /*return*/];
                }
            });
        }); });
    };
    /** get network entity pooling */
    Game.prototype.getNetworkEntityPooling = function () {
        return this.networkEntityPooling;
    };
    /** set network entity pooling */
    Game.prototype.setNetworkEntityPooling = function (poolSize) {
        this.networkEntityPooling = poolSize;
    };
    /** get model entity pooling */
    Game.prototype.getModelEntityPooling = function (modelName) {
        if (modelName === undefined)
            modelName = null;
        if (modelName)
            return !!this.modelEntityPooling[modelName];
        return this.modelEntityPooling;
    };
    /** set model entity pooling */
    Game.prototype.setModelEntityPooling = function (modelName, poolSize) {
        this.modelEntityPooling[modelName] = poolSize;
    };
    /** set group */
    Game.prototype.setGroup = function (group) {
        this.group = group;
    };
    /** get group */
    Game.prototype.getGroup = function () {
        return this.group;
    };
    return Game;
}());
exports.Game = Game;
