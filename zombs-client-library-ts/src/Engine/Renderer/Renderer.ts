/** game type */
import { Game } from '../game';

class Renderer {
    /** tickCallbacks */
    public tickCallbacks: any = [];

    /** lastMsElapsed */
    public lastMsElapsed: number = 0;

    /** firstPerformance */
    public firstPerformance: any;

    /** followingObject */
    public followingObject: any;

    /** longFrames */
    public longFrames: number = 0;

    /** currentGame */
    public currentGame: Game;

    constructor(game: Game) {
        this.currentGame = game;
    }

    /** add tick callback */
    public addTickCallback(callback: any): void {
        this.tickCallbacks.push(callback);
    }

    /** get long frames */
    public getLongFrames(): number {
        return this.longFrames;
    }

    /** update */
    public update(): void {
        if(!this.firstPerformance) {
            this.firstPerformance = performance.now();
            setImmediate(this.update.bind(this));
            return;
        }

        const currentPerformance: number = performance.now();
        const performanceDelta: number = currentPerformance - this.firstPerformance;
        const msElapsed: number = performanceDelta - this.lastMsElapsed;

        this.lastMsElapsed = performanceDelta;

        try { 
            for(let callback of this.tickCallbacks) callback(msElapsed);
        } catch(e) {
            console.log(e);
        }

        setImmediate(this.update.bind(this));
    }
}

export { Renderer };