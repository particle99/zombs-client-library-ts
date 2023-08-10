/** Game type */
import { Game } from '../game';

class NetworkEntity {
  /** uid */
  public uid: any;

  /** currentModel */
  public currentModel: any;

  /** entityClass */
  public entityClass: any;

  /** fromTick */
  public fromTick: any;

  /** targetTick */
  public targetTick: any;

  /** currentGame */
  public currentGame: Game;

  constructor(game: Game, tick: any) {
    this.currentGame = game;
    this.uid = tick.uid;

    this.setTargetTick(tick);
  }

  /** reset method */
  public reset(): void {
    this.uid = null;
    this.currentModel = null;
    this.entityClass = null;
    this.fromTick = null;
    this.targetTick = null;
  }

  /** is local method */
  public isLocal(): boolean {
    const local: any = this.currentGame.world.getLocalPlayer();

    if (!local || !local.getEntity()) return false;
    return this.uid === local.getEntity().uid;
  }

  /** get target tick method */
  public getTargetTick(): any {
    return this.targetTick;
  }

  /** get from tick method */
  public getFromTick(): any {
    return this.fromTick;
  }

  /** set target tick method */
  public setTargetTick(tick: any): void {
    if(!this.targetTick) {
      this.entityClass = tick.entityClass;
      this.targetTick = tick;
    }

    this.addMissingTickFields(tick, this.targetTick);
    this.fromTick = this.targetTick;
    this.targetTick = tick;

    if(this.fromTick.model !== this.targetTick.model) {
      this.refreshModel(this.targetTick.model);
    }

    this.entityClass = this.targetTick.entityClass;
  }

  /** override from tick method */
  public overrideFromTick(tick: any): void {
    this.fromTick = tick;
  } 

  /** override target tick */
  public overrideTargetTick(tick: any): void {
    this.targetTick = tick;
  }

  /** tick method */
  public tick(msInThisTick: number, msPerTick: number): void {
    if(!this.fromTick) return;
  }

  /** update method */
  public update(arg: any, args: any): void {
    
  }

  /** refreshModel */
  public refreshModel(networkModelName: any): void {
    
  }

  /** add missing tick fields method */
  public addMissingTickFields(tick: any, lastTick: any): void {
    let fieldName: any;
    for(fieldName in lastTick) {
      const fieldValue: any = lastTick[fieldName];

      if (!(fieldName in tick))
        tick[fieldName] = fieldValue;
    }
  }
}

export { NetworkEntity };