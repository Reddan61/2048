import { vec2 } from "gl-matrix";
import { Animation } from "../Animation";

const OBJECT_COLORS = {
    2: "#eee4da",
    4: "#eee0c6",
    8: "#f9b377",
    16: "#ff9b60",
    32: "#cb6a49",
    64: "#ec6233",
    128: "#e8c463",
    256: "#e0ba55",
    512: "#f3c54b",
    1024: "#f2c138",
    2048: "#f3bd29",
};

export type Weight = keyof typeof OBJECT_COLORS;
type OnChangeScore = (weight: Weight) => void;

export class Object {
    // left top
    private position: vec2;
    private size: vec2;
    private weight: keyof typeof OBJECT_COLORS;
    private color: string;
    private animation: Animation | null = null;
    private _onChangeScore: OnChangeScore | null = null;

    constructor(position: vec2, size: vec2, weight: Weight) {
        this.position = position;
        this.weight = weight;
        this.color = this.generateWeightColor(weight);
        this.size = size;
    }

    public update() {
        if (this.animation?.isFinished()) {
            this.animation = null;
            return null;
        }

        if (this.animation) {
            this.setPosition(this.animation.update());
        }
    }

    public onChangeScore = (callback: OnChangeScore) => {
        this._onChangeScore = callback;
    };

    public getAnimation() {
        return this.animation;
    }

    public getPosition() {
        return this.position;
    }

    public getColor() {
        return this.color;
    }

    public getSize() {
        return this.size;
    }

    public getWeight() {
        return this.weight;
    }

    public isEqual(object: Object) {
        const currentWeight = this.getWeight();
        const nextWeight = object.getWeight();

        return currentWeight === nextWeight;
    }

    public double() {
        this.changeWeight((this.getWeight() * 2) as Weight);
    }

    public setPosition(position: vec2) {
        this.position = position;
    }

    public setAnimation(animation: Animation) {
        this.animation = animation;
    }

    private changeWeight(weight: Weight) {
        this.weight = weight;
        this.color = this.generateWeightColor(weight);
        this._onChangeScore?.(this.weight);
    }

    private generateWeightColor(weight: Weight) {
        const color = OBJECT_COLORS[weight];

        return color ?? "#00000";
    }
}
