/** game classes */
import { NetworkAdapter } from './Network/NetworkAdapter';
import { World } from './World/World';
import { Renderer } from './Renderer/Renderer';
import { Metrics } from './Metrics/Metrics';

/** wasm */
import { _WebAssembly  } from './_WebAssembly';

class Game {
    /** network */
    public network: NetworkAdapter;

    /** world */
    public world: World;

    /** renderer */
    public renderer: Renderer;

    /** metrics */
    public metrics: Metrics;

    /** modelEntityPooling */
    public modelEntityPooling: any = {};

    /** networkEntityPooling */
    public networkEntityPooling: any = false;

    /** preloaded */
    public preloaded: boolean = false;

    /** agent */
    public agent: any;

    /** group */
    public group: any;

    /** _WebAssembly */
    public _WebAssembly: any;

    /** currentGame object */
    public currentGame: any;

    constructor(agent?: any) {
        this.network = new NetworkAdapter(this, agent);
        this.world = new World(this);
        this.renderer = new Renderer(this);
        this.metrics = new Metrics(this);

        this.currentGame = this;
    }

    /** preload */
    public preload(): any {
        return new Promise(async (resolve: any) => {
            this.world.init();

            this.world.preloadNetworkEntities();
            this.world.preloadModelEntities();

            this._WebAssembly = new _WebAssembly(this);
            await this._WebAssembly.init();

            this.network.addEnterWorldHandler(() => {
                this.renderer.update();
            });

            this.preloaded = true;
            resolve();
        });
    }

    /** get network entity pooling */
    public getNetworkEntityPooling(): any {
        return this.networkEntityPooling;
    }

    /** set network entity pooling */
    public setNetworkEntityPooling(poolSize: number): void {
        this.networkEntityPooling = poolSize;
    }

    /** get model entity pooling */
    public getModelEntityPooling(modelName?: any): any {
        if(modelName === undefined) modelName = null;

        if(modelName) return !!this.modelEntityPooling[modelName];

        return this.modelEntityPooling;
    }

    /** set model entity pooling */
    public setModelEntityPooling(modelName: any, poolSize: number): void {
        this.modelEntityPooling[modelName] = poolSize;
    }

    /** set group */
    public setGroup(group: any): void {
        this.group = group;
    }

    /** get group */
    public getGroup(): any {
        return this.group;
    }
}

export { Game };
