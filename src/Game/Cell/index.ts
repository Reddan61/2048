import { vec2 } from "gl-matrix";
import { Object, Weight } from "../Object";
import { Animation } from "../Animation";

type OnDelete = (object: Object) => void;

export class Cell {
    private worldPosition: vec2;
    private mapPosition: vec2;
    private object: Object | null = null;
    private onDelete: OnDelete;

    constructor(
        worldPosition: vec2,
        mapPosition: vec2,
        onDeleteObject: OnDelete
    ) {
        this.worldPosition = worldPosition;
        this.mapPosition = mapPosition;
        this.onDelete = onDeleteObject;
    }

    public isEmpty() {
        return !this.object;
    }
    // только после isEmpty
    public getObject(): Object {
        return this.object as Object;
    }

    public getMapPosition() {
        return this.mapPosition;
    }

    public deleteObject() {
        this.object = null;
    }

    // cell merge to current
    public mergeObjects(cell: Cell) {
        if (this.isEmpty() || cell.isEmpty()) return;

        const current = this.getObject();
        const next = cell.getObject();

        const isEqual = current.isEqual(next);

        if (isEqual) {
            current.double();
            const currentAnimation = current.getAnimation();

            cell.deleteObject();

            // нужна актуальная позиция объекта в конце анимации
            if (currentAnimation) {
                next.setAnimation(
                    new Animation(
                        next.getPosition(),
                        currentAnimation.getEnd(),
                        () => {
                            this.onDelete(next);
                        }
                    )
                );
            } else {
                next.setAnimation(
                    new Animation(
                        next.getPosition(),
                        current.getPosition(),
                        () => {
                            this.onDelete(next);
                        }
                    )
                );
            }
        }
    }

    private setObject(object: Object) {
        this.object = object;
    }

    // swap objects in cells
    public swapObjects(newCell: Cell) {
        const next = newCell.getObject();

        if (this.isEmpty() && !newCell.isEmpty()) {
            const { objectPos } = this.calculateObjectOptions();

            this.setObject(next);
            newCell.deleteObject();

            next.setAnimation(new Animation(next.getPosition(), objectPos));
        }
    }

    public calculateObjectOptions() {
        const scale = 0.7;
        const objectSize = vec2.create();

        vec2.scale(objectSize, this.worldPosition, scale);

        const gap = vec2.create();
        vec2.subtract(gap, this.worldPosition, objectSize);
        vec2.scale(gap, gap, 1 / 2);

        const objectPos = vec2.create();
        vec2.multiply(objectPos, this.worldPosition, this.mapPosition);
        vec2.add(objectPos, objectPos, gap);

        return {
            objectSize,
            objectPos,
        };
    }

    public spawn(weight: Weight) {
        const { objectPos, objectSize } = this.calculateObjectOptions();
        this.object = new Object(objectPos, objectSize, weight);

        return this.object;
    }
}
