import { Texture } from './texture'
import { Properties, Transformer } from './transformers'

/**
 * An animated object in a scene, consisting of a texture and a tranformer.
 */
export class Sprite {
    constructor(public texture: Texture, public transform: Transformer) {}

    updateProperties(t: number, properties: Properties) {
        properties.reset();
        this.transform.updateProperties(t, properties);
    }

    get length() {
        return this.transform.length;
    }
};
