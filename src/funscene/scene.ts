import { Context, DrawCallback } from './context'
import { Properties, Transformer } from './transformers'
import { Sprite, Group, SceneObject } from './sprite'
import { Matrix } from './matrix'

/**
 * A scene consists of a world transformation and an array of sprites.
 */
export function createScene(objects: SceneObject[]): DrawCallback {
    const start = performance.now();

    // Pre-allocate sprite properties. These will be mutated in
    // place to avoid allocations.
    var properties = new Properties();
    var projection_matrix = new Matrix();

    return function(context, t) {
        const gl = context.gl;
        const program = context.program;

        const scene_t = Math.max(t - start, 0);
        var incomplete = false;

        gl.clear(gl.COLOR_BUFFER_BIT);

        projection_matrix.setOrtho(0, context.width, context.height, 0, 0, 1);
        gl.uniformMatrix4fv(program.projection, false, projection_matrix.array);

        // We currently do a series of WebGL calls for each
        // sprite. This could be sped up considerably by using
        // fewer draw calls with the instance rendering extension.
        objects.forEach(function (object) {
            properties.reset();
            object.update(context, scene_t, properties);
            incomplete = incomplete || (scene_t < object.length);
        });

        return incomplete;
    };
}
