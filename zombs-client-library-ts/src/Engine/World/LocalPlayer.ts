/** Game type */
import { Game } from '../game';

class LocalPlayer {
  /** entity */
  public entity: any;

  /** currentGame */
  public currentGame: Game;

  constructor(game: Game) {
    this.currentGame = game;
  }

  /** set entity method */
  public setEntity(entity: any): void {
    this.entity = entity;
  }

  /** get entity method */
  public getEntity(): any {
    return this.entity;
  }

  /** get party id method */
  public getMyPartyId(): number {
    const myNetworkEntity: any = this.currentGame.world.getEntityByUid(this.currentGame.world.getMyUid());
    if(!myNetworkEntity) return 0;

    const target: any = myNetworkEntity.getTargetTick();
    if(!target) return 0;

    return target.partyId;
  }

  /** set target tick method */
  public setTargetTick(tick: any): void {
    
  }
}

export { LocalPlayer };