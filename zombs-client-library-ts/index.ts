import { Game } from './src/Engine/game';

const client = new Game();

(async() => {
    await client.preload();

    client.network.connect("v4003");

    client.network.addEnterWorldHandler(() => {
        console.log("enter world");
    });

    client.network.addCloseHandler(() => {
        console.log("close");
    });
})();