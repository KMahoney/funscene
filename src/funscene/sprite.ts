import { Context } from './context'
import { ITexture } from './texture'
import { Properties, Transformer } from './transformers'

export interface SceneObject {
    length: number;
    update(context: Context, t: number, properties: Properties): void;
}

/**
 * An animated object in a scene, consisting of a texture and a tranformer.
 */
export class Sprite {
    length: number;

    constructor(public texture: ITexture, public transform: Transformer) {
        this.length = this.transform.length;
    }

    update(context: Context, t: number, properties: Properties): void {
        const texture = this.texture;
        const gl = context.gl;
        const program = context.program;

        this.transform.updateProperties(t, properties);

        // send the updated model and blend to webgl
        gl.uniform4fv(program.blend, properties.blend);
        gl.uniformMatrix4fv(program.model, false, properties.matrix.array);

        // scale the vertex position and texture coordinates
        gl.uniform2f(program.size, texture.width, texture.height);
        gl.uniform2f(program.texture_offset, texture.texture_coord.x, texture.texture_coord.y);
        gl.uniform2f(program.texture_scale, texture.texture_coord.width, texture.texture_coord.height);

        context.bindTexture(texture);
        gl.drawArrays(gl.TRIANGLE_STRIP, 0, 4);
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
    length: number;
    private saved_properties: Properties;

    constructor(public objects: SceneObject[], public transform: Transformer) {
        const sprite_max = Math.max.apply(undefined, this.objects.map(t => t.length));
        this.length = Math.max(this.transform.length, sprite_max);

        // Allocate a new set of properties to restore the transform
        // before each sprite update
        this.saved_properties = new Properties();
    }

    update(context: Context, t: number, properties: Properties): void {
        var saved = this.saved_properties;
        this.transform.updateProperties(t, properties);
        saved.copy(properties);
        this.objects.forEach(function (object) {
            properties.copy(saved);
            object.update(context, t, properties);
        });
    }
}
