import { vec2 } from "gl-matrix";

type OnAnimationEnd = ((...args: any) => any) | null;

export class Animation {
    private start: vec2;
    private end: vec2;
    // ms
    private TIME = 250;
    private startTime = 0;
    private finish = false;
    private onAnimationEnd: OnAnimationEnd = null;

    constructor(start: vec2, end: vec2, onAnimationEnd: OnAnimationEnd = null) {
        this.start = start;
        this.end = end;
        this.startTime = performance.now();
        this.onAnimationEnd = onAnimationEnd;
    }

    public isFinished() {
        return this.finish;
    }

    public update() {
        if (this.isFinished()) {
            return this.end;
        }

        const currentTime = performance.now();
        const elapsed = currentTime - this.startTime;
        const progress = Math.min(elapsed / this.TIME, 1);
        const nextPos = vec2.create();
        vec2.subtract(nextPos, this.end, this.start);
        vec2.scale(nextPos, nextPos, progress);
        vec2.add(nextPos, nextPos, this.start);

        if (progress >= 1) {
            this.finish = true;
            this.onAnimationEnd?.();
        }

        return nextPos;
    }

    public getEnd() {
        return this.end;
    }
}
