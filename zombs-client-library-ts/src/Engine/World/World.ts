/** game type */
import { Game } from '../game';

/** misc */
import { Replication } from '../Network/Replication';
import { NetworkEntity } from '../Network/NetworkEntity';
import { LocalPlayer } from './LocalPlayer';
import { Renderer } from '../Renderer/Renderer';
import { NetworkAdapter } from '../Network/NetworkAdapter';

class World {
    /** entities */
    public entities: any = {};

    /** inWorld */
    public inWorld: boolean = false;

    /** myUid */
    public myUid: any = null;

    /** networkEntityPool */
    public networkEntityPool: any = [];

    /** modelEntityPool */
    public modelEntityPool: any = {};

    /** width */
    public width: number = 0;

    /** height */
    public height: number = 0;

    /** tickRate */
    public tickRate: number = 0;

    /** msPerTick */
    public msPerTick: number = 0;

    /** network */
    public network: NetworkAdapter;

    /** renderer */
    public renderer: Renderer;

    /** replicator */
    public replicator: Replication;

    /** localPlayer */
    public localPlayer: LocalPlayer;

    /** currentGame */
    public currentGame: Game;

    constructor(game: Game) {
        this.currentGame = game;

        this.network = this.currentGame.network;
        this.renderer = this.currentGame.renderer;

        this.replicator = new Replication(this.currentGame);
        this.localPlayer = new LocalPlayer(this.currentGame);
    }

    /** init method */
    public init(): void {
        this.replicator.setTargetTickUpdatedCallback(this.onEntityUpdate.bind(this));
        this.replicator.init();

        this.currentGame.network.addEnterWorldHandler(this.onEnterWorld.bind(this));
        this.currentGame.renderer.addTickCallback(this.onRendererTick.bind(this));
    }

    /** pre load network entities */
    public preloadNetworkEntities(): void {
        if(!this.currentGame.getNetworkEntityPooling()) return;

        const tick: any = {
            uid: 0,
            entityClass: null
        };

        const poolSize: number = this.currentGame.getNetworkEntityPooling();
        for(let i: number = 0; i < poolSize; i++) {
            const entity = new NetworkEntity(this.currentGame, tick);
            entity.reset();
            this.networkEntityPool.push(entity);
        }
    }

    /** pre load model entities */
    public preloadModelEntities(): void {
        const modelIsToPool: any = this.currentGame.getModelEntityPooling();
        let modelName: any;
        for(modelName in modelIsToPool) {
            const poolSize: number = modelIsToPool[modelName];

            this.modelEntityPool[modelName] = [];
            for(let i: number = 0; i < poolSize; i++) {
                //
            }
        }
    }

    /** get tick rate */
    public getTickRate(): number {
        return this.tickRate;
    }

    /** get ms per tick */
    public getMsPerTick(): number {
        return this.msPerTick;
    }

    /** getReplicator */
    public getReplicator(): Replication {
        return this.replicator;
    }

    /** get height */
    public getHeight(): number {
        return this.height;
    }

    /** get width */
    public getWidth(): number {
        return this.width;
    }

    /** get local player */
    public getLocalPlayer(): LocalPlayer {
        return this.localPlayer;
    }

    /** get in world */
    public getInWorld(): boolean {
        return this.inWorld;
    }

    /** get my uid */
    public getMyUid(): any|number {
        return this.myUid;
    }

    /** get entities by uid */
    public getEntityByUid(uid: number): any {
        return this.entities[uid];
    }

    /** get pooled network entity count */
    public getPooledNetworkEntityCount(): number {
        return this.networkEntityPool.length;
    }

    /** get model from pool */
    public getModelfromPool(modelName: string): any {
        if(this.modelEntityPool[modelName].length === 0) return null;

        return this.modelEntityPool[modelName].shift()
    }

    /** get pooled model entity count */
    public getPooledModelEntityCount(modelName: string): number {
        if(!(modelName in this.modelEntityPool)) return 0;

        return this.modelEntityPool[modelName].length;
    }

    /** on enter world */
    public onEnterWorld(data: any): void {
        if(!data.allowed) return;

        this.width = data.x2;
        this.height = data.y2;
        this.tickRate = data.tickRate;
        this.msPerTick = 1000 / data.tickRate;
        this.inWorld = true;
        this.myUid = data.uid;
    }

    /** on entity update */
    public onEntityUpdate(data: any): void {
        let uid: any;

        for(uid in this.entities) {
            if(!(uid in data.entities)) {
                this.removeEntity(uid);
            } else if(data.entities[uid] !== true) {
                this.updateEntity(uid, data.entities[uid]);
            } else {
                this.updateEntity(uid, this.entities[uid].getTargetTick());
            }
        }

        for(uid in data.entities) {
            if(data.entities[uid] === true) continue;
            if(!(uid in this.entities)) this.createEntity(data.entities[uid]);

            if(this.localPlayer != null && this.localPlayer.getEntity() === this.entities[uid]) {
                this.localPlayer.setTargetTick(data.entities[uid]);
            }
        }
    }

    /** create entity */
    public createEntity(data: any): void {
        let entity: any;

        if(this.currentGame.getNetworkEntityPooling() && this.networkEntityPool.length > 0) {
            entity = this.networkEntityPool.shift();
            entity.setTargetTick(data);
            entity.uid = data.uid;
        } else {
            entity = new NetworkEntity(this.currentGame, data);
        }

        entity.refreshModel(data.model);

        if(data.uid === this.myUid) this.localPlayer.setEntity(entity);

        this.entities[data.uid] = entity;
    }

    /** update entity */
    public updateEntity(uid: number, data: any): void {
        this.entities[uid].setTargetTick(data);
    }

    /** remove entity */
    public removeEntity(uid: number): void {
        delete this.entities[uid];
    }

    /** on renderer tick */
    public onRendererTick(delta: any): void {
        const msInThisTick: number = this.replicator.getMsInThisTick();

        let uid: any;
        for(uid in this.entities) this.entities[uid].tick(msInThisTick, this.msPerTick);
    }
}

export { World };