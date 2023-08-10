/** Game type */
import { Game } from '../game';

class Replication {
    /** currentTick */
    public currentTick: any;

    /** ticks */
    public ticks: any = [];

    /** tickRate */
    public tickRate: any;

    /** tickUpdatedCallback */
    public tickUpdatedCallback: any;

    /** latestTickUpdatedCallback */
    public latestTickUpdatedCallback: any;

    /** shiftedGameTime */
    public shiftedGameTime: number = 0;

    /** lastShiftedGameTime */
    public lastShiftedGameTime: number = 0;

    /** receivedFirstTick */
    public receivedFirstTick: boolean = false;

    /** serverTime */
    public serverTime: number = 0;

    /** msPerTick */
    public msPerTick: number = 0;

    /** msInThisTick */
    public msInThisTick: number = 0;

    /** msElapsed */
    public msElapsed: number = 0;

    /** lastMsElapsed */
    public lastMsElapsed: number = 0;

    /** ping */
    public ping: number = 0;

    /** lastPing */
    public lastPing: number = 0;

    /** startTime */
    public startTime: any;

    /** startShiftedGameTime */
    public startShiftedGameTime: number = 0;

    /** frameStutters */
    public frameStutters: number = 0;

    /** frameTimes */
    public frameTimes: any = [];

    /** interpolating */
    public interpolating: boolean = false;

    /** ticksDesynced */
    public ticksDesynced: number = 0;

    /** ticksDesynced2 */
    public ticksDesynced2: number = 0;

    /** clientTimeResets */
    public clientTimeResets: number = 0;

    /** maxExtrapolationTime */
    public maxExtrapolationTime: number = 0;

    /** totalExtrapolationTime */
    public totalExtrapolationTime: number = 0;

    /** extrapolationIncidents */
    public extrapolationIncidents: number = 0;

    /** differenceInClientTime */
    public differenceInClientTime: number = 0;

    /** equalTimes */
    public equalTimes: number = 0;

    /** wasRendererJustUnpaused */
    public wasRendererJustUnpaused: boolean = false;

    /** currentGame */
    public currentGame: Game;

    constructor(game: Game) {
        this.currentGame = game;
    }

    /** init method */
    public init(): void {
        this.currentGame.network.addEnterWorldHandler(this.onEnterWorld.bind(this));
        this.currentGame.network.addEntityUpdateHandler(this.onEntityUpdate.bind(this));
        this.currentGame.renderer.addTickCallback(this.onTick.bind(this));
    }

    /** set target tick updated callback */
    public setTargetTickUpdatedCallback(tickUpdatedCallback: any): void {
        this.tickUpdatedCallback = tickUpdatedCallback;
    }

    /** set latest tick updated callback */
    public setLatestTickUpdatedCallback(callback: any): void {
        this.latestTickUpdatedCallback = callback;
    }

    /** get client time resets */
    public getClientTimeResets(): number {
        return this.clientTimeResets;
    }

    /** get ms in this tick */
    public getMsInThisTick(): number {
        return Math.floor(this.msInThisTick);
    }

    /** get ms per tick */
    public getMsPerTick(): number {
        return this.msPerTick;
    }

    /** get ms until tick */
    public getMsuntilTick(tick: number): number {
        return tick * this.msPerTick - this.shiftedGameTime;
    }

    /** get ms since tick */
    public getMsSinceTick(tick: number, useInterpolationOffset: boolean = true): number {
        if (useInterpolationOffset) tick += 2;
        return this.shiftedGameTime - tick * this.msPerTick;
    }

    /** get server time */
    public getServerTime(): number {
        return Math.floor(this.serverTime);
    }

    /** get client time */
    public getClientTime(): number {
        return Math.floor(this.shiftedGameTime);
    }

    /** get real client time */
    public getRealClientTime(): number {
        if (!this.startTime) return 0;

        const msElapsed: number = (new Date().getTime() - this.startTime.getTime());
        return Math.floor(this.startShiftedGameTime + msElapsed);
    }

    /** get frame stutters */
    public getFrameStutters(): number {
        return this.frameStutters;
    }

    /** get difference in client time */
    public getDifferenceInClientTime(): number {
        return this.differenceInClientTime;
    }

    /** is fps ready */
    public isFpsReady(): boolean {
        return this.frameTimes.length >= 10;
    }

    /** get fps */
    public getFps(): number {
        let time: number = 0;

        for (let i: number = 0; i < this.frameTimes.length; i++) time += this.frameTimes[i];

        return 1000 / (time / this.frameTimes.length);
    }

    /** get interpolating */
    public getInterpolating(): boolean {
        return this.interpolating;
    }

    /** get tick byte size */
    public getTickByteSize(): number {
        if (!this.currentTick) return 0;
        return this.currentTick.byteSize;
    }

    /** get tick entities */
    public getTickEntities(): number {
        if (!this.currentTick) return 0;
        return Object.keys(this.currentTick.entities).length;
    }

    /** get tick index */
    public getTickIndex(): number {
        if (!this.currentTick) return 0;
        return this.currentTick.tick;
    }

    /** get last ms elapsed */
    public getLastMsElapsed(): number {
        return this.lastMsElapsed;
    }

    /** get max extrapolation time */
    public getMaxExtrapolationTime(): number {
        return this.maxExtrapolationTime;
    }

    /** get extrapolation incidents */
    public getExtrapolationIncidents(): number {
        return this.extrapolationIncidents;
    }

    /** get total extrapolation time */
    public getTotalExtrapolationTime(): number {
        return this.totalExtrapolationTime;
    }

    /** reset client lag */
    public resetClientLag(): void {
        this.shiftedGameTime = this.getRealClientTime();
    }

    /** on tick */
    public onTick(msElapsed: number): void {
        this.msElapsed += msElapsed;
        this.lastMsElapsed = msElapsed;
        this.frameTimes.push(msElapsed);

        if (this.frameTimes.length > 10) this.frameTimes.shift();

        let steps: number = 0;
        const timeStep: number = 1000 / 60;

        while (this.msElapsed >= timeStep) {
            this.msElapsed -= timeStep;
            steps++;
        }

        if (steps > 1) this.frameStutters++;

        if (this.isRendererPaused()) {
            this.wasRendererJustUnpaused = true;
            this.equalTimes = 0;

            msElapsed = 0;
        }

        this.serverTime += msElapsed;
        this.shiftedGameTime += msElapsed;
        this.msInThisTick += msElapsed;
        this.updateTick();
    }

    /** update tick */
    public updateTick(): void {
        for (let i: number = 0; i < this.ticks.length; i++) {
            const tick: any = this.ticks[i];
            const tickStart: number = this.msPerTick * tick.tick;
            if (this.shiftedGameTime >= tickStart) {
                this.currentTick = tick;
                this.msInThisTick = this.shiftedGameTime - tickStart;
                this.tickUpdatedCallback(tick);
                this.ticks.shift();
                i--;
            }
        }

        if (this.currentTick != null) {
            const nextTickStart: number = this.msPerTick * (this.currentTick.tick + 1);
            if (this.shiftedGameTime >= nextTickStart) {
                if (this.interpolating) {
                    this.interpolating = false;
                    this.extrapolationIncidents++;
                }
                this.maxExtrapolationTime = Math.max(this.shiftedGameTime - nextTickStart, this.maxExtrapolationTime);
                const extrapolationTime: number = Math.min(this.msInThisTick - this.msPerTick, this.lastMsElapsed);
                this.totalExtrapolationTime += extrapolationTime;
            } else {
                this.interpolating = true;
            }
            if (this.serverTime - this.shiftedGameTime < this.ping) {
                this.ticksDesynced++;
                if (this.ticksDesynced >= 10) {

                }
            }
        }
    }

    /** on enter world */
    public onEnterWorld(data: any): void {
        if (!data.allowed) return;


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
    }

    /** check renderer paused */
    public checkRendererPaused(): void {
        if (this.lastShiftedGameTime === this.shiftedGameTime) this.equalTimes++;
        else this.equalTimes = 0;
    }

    /** is renderer paused */
    public isRendererPaused(): boolean {
        return this.equalTimes >= 8;
    }

    /** on entity update */
    public onEntityUpdate(data: any): void {
        if (this.latestTickUpdatedCallback) this.latestTickUpdatedCallback(data);

        this.serverTime = data.tick * this.msPerTick + this.ping;
        this.ticks.push(data);

        if (!this.receivedFirstTick) {
            this.receivedFirstTick = true;
            this.startTime = new Date();
            this.shiftedGameTime = data.tick * this.msPerTick - 90;
            this.startShiftedGameTime = this.shiftedGameTime;
            this.clientTimeResets = 0;
        } else {
            this.checkRendererPaused();

            const rendererPaused: any = this.isRendererPaused();
            const differenceInClientLag: number = (data.tick * this.msPerTick - 90) - this.shiftedGameTime;

            if (!rendererPaused) this.differenceInClientTime = this.differenceInClientTime = differenceInClientLag;
            if (Math.abs(differenceInClientLag) >= 40) this.ticksDesynced2++;

            this.ticksDesynced2 = 0;
            if (this.ticksDesynced2 >= 10 || this.wasRendererJustUnpaused) {
                const last: number = this.shiftedGameTime;

                this.shiftedGameTime = data.tick * this.msPerTick - 90;
                this.msInThisTick += (this.shiftedGameTime - last);

                if (!rendererPaused && !this.wasRendererJustUnpaused) this.clientTimeResets++;

                this.ticksDesynced2 = 0;
                this.wasRendererJustUnpaused = false;
            }

            this.lastShiftedGameTime = this.shiftedGameTime;
        }
    }
}

export { Replication }