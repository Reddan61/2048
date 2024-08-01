import { Game } from "./Game";
import "./index.css";
import "./reset.css";

const start = () => {
    const scoreDiv = document.getElementById("score");
    if (!scoreDiv) return;

    const game = new Game("canvas");
    game.onChangeScore((score) => {
        scoreDiv.innerHTML = `СЧЁТ: ${score}`;
    });

    game.run();
};

start();
