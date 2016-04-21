import { ITexture } from './texture'
import { Transformer } from './transformers'
import { BatchBuilder } from './batch'

export interface SceneObject {
    build(builder: BatchBuilder): void;
}

/**
 * An animated object in a scene, consisting of a texture and a tranformer.
 */
export class Sprite {
    constructor(private texture: ITexture, private transformer: Transformer) {}

    build(builder: BatchBuilder): void {
        builder.addSprite(this.texture, this.transformer);
    }
};

/**
 * A collection of scene objects.
 *
 * A group is applies its transform to all sub-objects. You can create
 * a tree of transformations with groups and sprites.
 *
 */
export class Group {
    constructor(private objects: SceneObject[], private transformer: Transformer) {}

    build(builder: BatchBuilder): void {
        builder.pushTransformer(this.transformer);
        this.objects.forEach(function (object) { object.build(builder); });
        builder.popTransformer();
    }
}
