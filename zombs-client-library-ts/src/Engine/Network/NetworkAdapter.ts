/** misc */
import { Packets } from './packets';
import { Codec } from './Codec.js';

/** game */
import { Game } from '../game';

/** imports */
import { WebSocket } from 'ws';
import { EventEmitter } from 'events';

/** servers */
import { Servers } from '../../utils/servers';

class NetworkAdapter {
  /** ping */
  public ping: number = 0;

  /** ping start/completion */
  public pingStart: any;
  public pingCompletion: any;

  /** connecting */
  public connected: boolean = false;
  public connecting: boolean = false;

  /** websocket */
  public socket: any;

  /** connections options */
  public connectionOptions: any;

  /** network methods */
  public codec: Codec;
  public emitter: EventEmitter;

  constructor(game: Game) {
      this.codec = new Codec(game);
      this.emitter = new EventEmitter();

      this.emitter.setMaxListeners(50);

      /** ping handlers */
      this.addConnectHandler(this.sendPingIfNecessary.bind(this));
      this.addPingHandler(this.onPing.bind(this));

      /** connect handlers */
      this.addConnectHandler(() => {
          this.connected = true;
          this.connecting = false;
      });

      this.addCloseHandler(() => {
          this.connected = false;
          this.connecting = false;
      });
  }

  /** connect method */
  public connect(server: string): void {
      const parsedServer: any = Servers[server];
      this.connectionOptions = parsedServer;
    
      this.connected = false;
      this.connecting = true;

      const options: any = {
        headers: {
            'Accept-Encoding': 'gzip, deflate, br',
            'Accept-Language': 'en-US,en;q=0.9',
            'Cache-Control': 'no-cache',
            'Origin': "https://zombs.io/",
            'Host': this.connectionOptions.hostname,
            'User-Agent': "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/112.0.0.0 Safari/537.36"
        }
      };

      if(this.agent != null) options.headers.agent = this.agent;

      /** websocket */
      this.socket = new WebSocket(`wss://${this.connectionOptions.hostname}`, options)

      /** bind event listeners */
      this.bindEventListeners();
  }

  /** bind event listeners method */
  public bindEventListeners(): void {
      this.socket.addEventListener('open', this.emitter.emit.bind(this.emitter, 'connected'));
      this.socket.addEventListener('message', this.onMessage.bind(this));
      this.socket.addEventListener('close', this.emitter.emit.bind(this.emitter, 'close'));
      this.socket.addEventListener('error', this.emitter.emit.bind(this.emitter, 'error'));

      /** send enter world2 on enter world */
      this.addPreEnterWorldHandler(this.onConnectionStart.bind(this));
      this.addEnterWorldHandler(this.sendEnterWorld2.bind(this));
  }

  /** disconnect method */
  public disconnect(): void {
      this.emitter.removeAllListeners();
      this.socket.close();

      this.socket = null;
  }

  /** get ping method */
  public getPing(): number {
      return this.ping;
  }

  /** encode + send packets method */
  public sendPacket(event: any, data: any): void {
      if (!event || !data) return;

      this.socket.send(this.codec.encode(event, data));
  }

  /** on message method */
  public onMessage(msg: any): void {
      const message: any = this.codec.decode(msg.data);
      const opcode: number = message.opcode;
      console.log(message);
      this.emitter.emit(Packets[opcode], message);
  }

  /** send ping if necessary method */
  public sendPingIfNecessary(): void {
      this.connecting = false;
      this.connected = true;

      const pingInProgress: boolean = (this.pingStart != null);
      if (pingInProgress) return;

      if (this.pingCompletion != null) {
          const msSinceLastPing: number = (new Date().getTime() - this.pingCompletion.getTime());
          if (msSinceLastPing <= 5000) return;
      }

      this.pingStart = new Date();

      this.sendPing({
          nonce: 0
      });
  }

  /** on ping method */
  public onPing(): void {
      this.ping = (new Date().getTime() - this.pingStart.getTime()) / 2;
      this.pingStart = new Date();
      this.pingCompletion = new Date();
  }

  /** on connection start method */
  public onConnectionStart(data: any): void {
      this.sendEnterWorld({
          displayName: "null",
          extra: data.extra
      });
  }

  /** NetworkAdapter methods */

  /** send enter world */
  public sendEnterWorld(data: any): void {
      this.sendPacket(Packets.PACKET_ENTER_WORLD, data);
  }

  /** send neter world2 */
  public sendEnterWorld2(): void {
      this.sendPacket(Packets.PACKET_ENTER_WORLD2, {});
  }

  /** send input */
  public sendInput(data: any): void {
      this.sendPacket(Packets.PACKET_INPUT, data);
  }

  /** send ping */
  public sendPing(data: any): void {
      this.sendPacket(Packets.PACKET_PING, data);
  }

  /** send rpc */
  public sendRpc(data: any): void {
      this.sendPacket(Packets.PACKET_RPC, data);
  }

  /** add pre enter world handler */
  public addPreEnterWorldHandler(callback: any): void {
      this.addPacketHandler(Packets.PACKET_PRE_ENTER_WORLD, (response: any) => callback(response));
  }

  /** add enter world handler */
  public addEnterWorldHandler(callback: any): void {
      this.addPacketHandler(Packets.PACKET_ENTER_WORLD, (response: any) => callback(response));
  }

  /** add entity update handler */
  public addEntityUpdateHandler(callback: any): void {
      this.addPacketHandler(Packets.PACKET_ENTITY_UPDATE, (response: any) => callback(response))
  }

  /** add ping handler */
  public addPingHandler(callback: any): void {
      this.addPacketHandler(Packets.PACKET_PING, (response: any) => callback(response));
  }

  /** add rpc handler */
  public addRpcHandler(rpcName: string, callback: any): void {
      this.addPacketHandler(Packets.PACKET_RPC, (rpc: any) => {
          if (rpc.name == rpcName) {
              callback(rpc.response);
          }
      })
  }

  /** connect handler */
  public addConnectHandler(callback: any): void {
      this.emitter.on('connect', callback);
  }

  /** close handler */
  public addCloseHandler(callback: any): void {
      this.emitter.on('close', callback);
  }

  /** error handler */
  public addErrorHandler(callback: any): void {
      this.emitter.on('error', callback);
  }

  /** add packet handler */
  public addPacketHandler(opcode: number, callback: any): void {
      this.emitter.on(Packets[opcode], callback);
  }
}

export { NetworkAdapter };
