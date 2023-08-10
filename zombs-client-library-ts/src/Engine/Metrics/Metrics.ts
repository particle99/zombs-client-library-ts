/** Game type */
import { Game } from '../game';

class Metrics {
    /** msElapsedSinceMetricsSent */
    public msElapsedSinceMetricsSent: number = 0;

    /** metrics */
    public metrics: any;

    /** pingSum */
    public pingSum: number = 0;

    /** pingSamples */
    public pingSamples: number = 0;

    /** shouldSend */
    public shouldSend: boolean = false;

    /** fpsSum */
    public fpsSum: number = 0;

    /** fpsSamples */
    public fpsSamples: number = 0;

    /** currentGame */
    public currentGame: Game;

    constructor(game: Game) {
        this.currentGame = game;

        this.currentGame.network.addEnterWorldHandler(() => {
            this.reset();
            this.shouldSend = true;
        });

        this.currentGame.network.addCloseHandler(() => {
            this.reset();
            this.shouldSend = false;
        });

        this.currentGame.network.addErrorHandler(() => {
            this.reset();
            this.shouldSend = false;
        });

        this.currentGame.renderer.addTickCallback((delta: any) => {
            if(!this.shouldSend) return;
            this.msElapsedSinceMetricsSent += delta;

            if(!this.updateMetrics()) return;
            this.sendMetrics();
        });
    }

    /** get frames extrapolated */
    public getFramesExtrapolated(): number|any {
        if('framesExtraploated' in this.metrics) return this.metrics['framesExtrapolated'];

        return 0;
    }

    /** reset */
    public reset(): void {
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
    }

    /** update metrics */
    public updateMetrics(): void|boolean {
        if(!this.currentGame.world.getReplicator().isFpsReady()) return false;
        if(!this.currentGame.world.getReplicator().getTickIndex()) return false;

        const fps: number = this.currentGame.world.getReplicator().getFps();
        const tickEntities: number = this.currentGame.world.getReplicator().getTickEntities();
        const pooledCount: number = this.currentGame.world.getPooledNetworkEntityCount();
        const serverTime: number = this.currentGame.world.getReplicator().getServerTime();
        const clientTime: number = this.currentGame.world.getReplicator().getClientTime();
        const ping: number = this.currentGame.network.getPing();
        const clientLag: number = serverTime - clientTime;

        if(fps < this.metrics.minFps || this.metrics.minFps === null) this.metrics.minFps = fps;
        if(fps > this.metrics.maxFps || this.metrics.maxFps === null) this.metrics.maxFps = fps;

        this.metrics.currentFps = fps;
        this.fpsSamples++;
        this.fpsSum += fps;
        this.metrics.averageFps = this.fpsSamples / this.fpsSamples;

        if(this.currentGame.world.getReplicator().getInterpolating()) this.metrics.framesInterpolated++;
        else this.metrics.framesExtraploated++;

        this.metrics.framesRendered++;
        this.metrics.allocatedNetworkEntities = tickEntities + pooledCount;

        if(clientLag < this.metrics.minClientLag || this.metrics.minClientLag === null) this.metrics.minclientLag = clientLag;
        if(clientLag > this.metrics.maxClientLag || this.metrics.maxClientLag === null) this.metrics.maxClientLag = clientLag;

        this.metrics.currentPing = ping;

        if(ping < this.metrics.minPing || this.metrics.minPing === null) this.metrics.minPing = ping;   
        if(ping > this.metrics.maxPing || this.metrics.maxPing === null) this.metrics.maxPing = ping;

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
    }

    /** send metrics */
    public sendMetrics(): void {
        if(this.msElapsedSinceMetricsSent < 5000) return;

        try {
            this.currentGame.network.sendRpc(this.metrics);
        } catch (e) {
            console.log(e);
        }

        this.msElapsedSinceMetricsSent  = 0;
    }
}

export { Metrics };