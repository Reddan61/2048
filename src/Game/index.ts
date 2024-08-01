import { vec2 } from "gl-matrix";
import { generateRandomInt } from "./Utils";
import { Cell } from "./Cell";
import { Object, Weight } from "./Object";

type Map = Cell[][];

type OnChangeScoreCallback = (score: number) => void;

export class Game {
    private MAX_WEIGHT: Weight = 2048;
    private MIN_MOUSE_MOVE = 100;

    private canvas: HTMLCanvasElement;
    private ctx: CanvasRenderingContext2D;
    private score = 0;
    private moving = false;
    private map: Map = [];
    private freeCells: vec2[] = [];
    private objects: Object[] = [];
    private lastMousePos = vec2.fromValues(0, 0);
    private _onChangeScore: OnChangeScoreCallback | null = null;

    private canvasSize = {
        x: 0,
        y: 0,
    };
    private mapSize = {
        x: 4,
        y: 4,
    };
    private sides = [
        // left
        {
            side: [-1, 0],
            can: false,
        },
        //right
        {
            side: [1, 0],
            can: false,
        },
        // down
        {
            side: [0, 1],
            can: false,
        },
        // up
        {
            side: [0, -1],
            can: false,
        },
    ];

    constructor(canvasId: string) {
        const canvas = document.getElementById(
            canvasId
        ) as HTMLCanvasElement | null;

        if (!canvas) {
            throw new Error("Wrong canvasID");
        }

        this.canvas = canvas;
        this.normalizeCanvas(this.canvas);

        const ctx = canvas.getContext("2d");

        if (!ctx) {
            throw new Error("Context error");
        }

        this.ctx = ctx;
        this.reset();
        this.subscribe();
    }

    public onChangeScore(callback: OnChangeScoreCallback) {
        this._onChangeScore = callback;
    }

    public run = () => {
        requestAnimationFrame(this.tick);
    };

    private setScore(score: number) {
        this.score = score;
        this._onChangeScore?.(this.score);
    }

    private update() {
        this.objects.forEach((object) => object.update());
    }

    private checkWin() {
        for (let i = 0; i < this.objects.length; i++) {
            const object = this.objects[i];

            if (object.getWeight() === this.MAX_WEIGHT) {
                return true;
            }
        }

        return false;
    }

    private onWin() {
        alert("Уровень пройден");
        this.reset();
    }

    private checkAnimations() {
        for (let i = 0; i < this.objects.length; i++) {
            const object = this.objects[i];
            const animation = object.getAnimation();

            if (animation) {
                return true;
            }
        }

        return false;
    }

    private tick = () => {
        // после всех анимаций
        if (!this.checkAnimations()) {
            // спавн нового объекта после движения
            if (this.moving) {
                this.spawn();
                this.moving = false;
            }

            const isWin = this.checkWin();

            if (isWin) {
                this.onWin();
            }

            const gameOver = this.checkGameOver();

            if (gameOver) {
                this.gameOver();
            }
        }

        this.update();

        this.clear();

        this.calculateCanMoveDirections();

        this.draw();

        requestAnimationFrame(this.tick);
    };

    private reset() {
        this.initMap();
        this.spawn(2);
        this.spawn(2);
        this.calculateCanMoveDirections();
        this.setScore(0);
    }

    private draw() {
        for (let i = 0; i < this.objects.length; i++) {
            const object = this.objects[i];

            const objectDrawPos = object.getPosition();
            const objectSize = object.getSize();
            const objectColor = object.getColor();
            // получаем центр roundRect
            const drawTextPos = vec2.fromValues(
                objectDrawPos[0] + objectSize[0] / 2,
                objectDrawPos[1] + objectSize[1] / 2
            );

            this.ctx.strokeStyle = objectColor;
            this.ctx.fillStyle = objectColor;

            this.ctx.beginPath();
            this.ctx.roundRect(
                objectDrawPos[0],
                objectDrawPos[1],
                objectSize[0],
                objectSize[1],
                12
            );
            this.ctx.fill();
            this.ctx.stroke();
            this.ctx.fillStyle = "#000000";
            this.ctx.font = "28px serif";
            this.ctx.textAlign = "center";
            this.ctx.textBaseline = "middle";
            this.ctx.fillText(
                String(object.getWeight()),
                drawTextPos[0],
                drawTextPos[1]
            );
        }
    }

    private spawn(priorityWeight: Weight | null = null) {
        this.generateMapFreeCells();

        if (this.freeCells.length === 0) {
            return;
        }

        const randomIndex = generateRandomInt(0, this.freeCells.length);
        const currentCell = this.freeCells[randomIndex];
        const chance = Math.random();
        let weight = priorityWeight ?? 2;

        if (!priorityWeight && chance <= 0.1) {
            weight = 4;
        }

        const object = this.map[currentCell[1]][currentCell[0]].spawn(weight);
        object.onChangeScore((weight) => {
            this.setScore(this.score + weight);
        });

        this.objects.push(object);

        this.generateMapFreeCells();
    }

    private gameOver() {
        alert("Нельзя сделать ход");
        this.reset();
    }

    // ищет пустые клетки
    private generateMapFreeCells() {
        const freeCells: vec2[] = [];

        for (let y = 0; y < this.mapSize.y; y++) {
            for (let x = 0; x < this.mapSize.x; x++) {
                const cell = this.map[y][x];

                if (cell.isEmpty()) {
                    freeCells.push(cell.getMapPosition());
                }
            }
        }

        this.freeCells = freeCells;
    }

    // на поле нет пустых клеток
    private isFull() {
        return this.freeCells.length === 0;
    }

    private initMap() {
        for (let y = 0; y < this.mapSize.y; y++) {
            this.map[y] = [];
            for (let x = 0; x < this.mapSize.x; x++) {
                const cellOffset = vec2.fromValues(
                    this.canvasSize.x / this.mapSize.x,
                    this.canvasSize.y / this.mapSize.y
                );

                this.map[y][x] = new Cell(
                    cellOffset,
                    vec2.fromValues(x, y),
                    (object) => {
                        this.deleteObject(object);
                    }
                );
            }
        }

        this.objects = [];
    }

    // расчет направлений по которым можно сместить блоки
    private calculateCanMoveDirections() {
        const sides = [
            // left
            {
                side: [-1, 0],
                can: false,
            },
            //right
            {
                side: [1, 0],
                can: false,
            },
            // down
            {
                side: [0, 1],
                can: false,
            },
            // up
            {
                side: [0, -1],
                can: false,
            },
        ];

        for (let y = 0; y < this.mapSize.y; y++) {
            for (let x = 0; x < this.mapSize.x; x++) {
                const cell = this.map[y][x];

                if (cell.isEmpty()) continue;

                const cells: (Cell | null)[] = sides.map(
                    ({ side: [xSide, ySide] }) => {
                        const current = this.map[y + ySide]?.[x + xSide];

                        return current ?? null;
                    }
                );

                const currentWeight = cell.getObject().getWeight();

                for (let i = 0; i < sides.length; i++) {
                    const side = sides[i];
                    const sideCell = cells[i];

                    if (!sideCell) continue;

                    if (side.can) continue;

                    if (
                        sideCell.isEmpty() ||
                        currentWeight === sideCell.getObject().getWeight()
                    )
                        side.can = true;
                }
            }
        }

        this.sides = sides;
    }

    private checkGameOver() {
        if (!this.isFull()) {
            return false;
        }

        let canMove = false;

        for (let i = 0; i < this.sides.length; i++) {
            const { can } = this.sides[i];

            if (can) {
                canMove = can;
                break;
            }
        }

        return !canMove;
    }

    private clear() {
        this.ctx.clearRect(0, 0, this.canvasSize.x, this.canvasSize.y);
    }

    private normalizeCanvas(canvas: HTMLCanvasElement) {
        const size = 500;

        canvas.width = size;
        canvas.height = size;

        this.canvasSize.x = size;
        this.canvasSize.y = size;
    }

    private deleteObject(object: Object) {
        this.objects = this.objects.filter((item) => item !== object);
    }

    private move(line: Map[number]) {
        let index = 0;

        while (index < line.length) {
            const cell = line[index];

            const nextNotEmptyCell = line
                .slice(index + 1, line.length)
                .find((item) => !item.isEmpty());

            if (!nextNotEmptyCell) break;

            if (cell.isEmpty()) {
                cell.swapObjects(nextNotEmptyCell);

                continue;
            } else {
                cell.mergeObjects(nextNotEmptyCell);
            }

            index++;
        }

        this.moving = true;
    }

    private moveLeft() {
        if (!this.canMoveLeft()) {
            return;
        }

        for (let y = 0; y < this.mapSize.y; y++) {
            this.move(this.map[y]);
        }
    }

    private moveRight() {
        if (!this.canMoveRight()) {
            return;
        }

        for (let y = 0; y < this.mapSize.y; y++) {
            const line = this.map[y].reverse();
            this.move(line);
            line.reverse();

            this.map[y] = line;
        }
    }

    private moveUp() {
        if (!this.canMoveUp()) {
            return;
        }

        for (let x = 0; x < this.mapSize.x; x++) {
            const line = [];
            for (let y = 0; y < this.mapSize.y; y++) {
                line.push(this.map[y][x]);
            }

            this.move(line);

            for (let y = 0; y < this.mapSize.y; y++) {
                this.map[y][x] = line[y];
            }
        }
    }

    private moveDown() {
        if (!this.canMoveDown()) {
            return;
        }

        for (let x = 0; x < this.mapSize.x; x++) {
            const line = [];

            for (let y = 0; y < this.mapSize.y; y++) {
                line.push(this.map[y][x]);
            }

            line.reverse();
            this.move(line);
            line.reverse();

            for (let y = 0; y < this.mapSize.y; y++) {
                this.map[y][x] = line[y];
            }
        }
    }

    private canMoveUp() {
        return this.sides[3].can;
    }

    private canMoveDown() {
        return this.sides[2].can;
    }

    private canMoveLeft() {
        return this.sides[0].can;
    }

    private canMoveRight() {
        return this.sides[1].can;
    }

    private subscribe() {
        document.addEventListener("keydown", (e) => {
            if (this.moving) {
                return null;
            }

            switch (e.code) {
                case "ArrowUp":
                    this.moveUp();
                    break;
                case "ArrowDown":
                    this.moveDown();
                    break;
                case "ArrowRight":
                    this.moveRight();
                    break;
                case "ArrowLeft":
                    this.moveLeft();
                    break;
            }
        });

        document.addEventListener("mousedown", (e) => {
            const rect = this.canvas.getBoundingClientRect();
            this.lastMousePos[0] = e.clientX - rect.left;
            this.lastMousePos[1] = e.clientY - rect.top;
        });

        document.addEventListener("mouseup", (e) => {
            const rect = this.canvas.getBoundingClientRect();
            const currentPos = vec2.fromValues(
                e.clientX - rect.left,
                e.clientY - rect.top
            );

            const dir = vec2.create();
            vec2.subtract(dir, currentPos, this.lastMousePos);

            this.lastMousePos = currentPos;

            const dirAbs = vec2.fromValues(Math.abs(dir[0]), Math.abs(dir[1]));

            if (
                dirAbs[0] < this.MIN_MOUSE_MOVE &&
                dirAbs[1] < this.MIN_MOUSE_MOVE
            ) {
                return;
            }

            // x > y
            if (dirAbs[0] > dirAbs[1]) {
                // right
                if (dir[0] > 0) {
                    this.moveRight();
                    // left
                } else {
                    this.moveLeft();
                }
            } else {
                // down
                if (dir[1] > 0) {
                    this.moveDown();
                    // up
                } else {
                    this.moveUp();
                }
            }
        });
    }
}
