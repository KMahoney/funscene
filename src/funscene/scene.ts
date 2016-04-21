import { Context, DrawCallback } from './context'
import { Properties, Transformer } from './transformers'
import { Sprite, Group, SceneObject } from './sprite'
import { Matrix } from './matrix'
import { Batch, BatchBuilder } from './batch'

/**
 * A scene consists of a world transformation and an array of sprites.
 */
export function createScene(objects: SceneObject[]): DrawCallback {
    const start = performance.now();

    var builder = new BatchBuilder();
    objects.forEach(function (object) { object.build(builder); });
    builder.finishBatch();
    const batches = builder.batches;

    var projection_matrix = new Matrix();

    return function(context, t) {
        const gl = context.gl;
        const program = context.program;

        const scene_t = Math.max(t - start, 0);
        var incomplete = false;
        batches.forEach(function (batch) {
            batch.update(scene_t);
            incomplete = incomplete || (scene_t < batch.length);
        });

        gl.clear(gl.COLOR_BUFFER_BIT);

        projection_matrix.setOrtho(0, context.width, context.height, 0, 0, 1);
        gl.uniformMatrix4fv(program.projection, false, projection_matrix.array);

        batches.forEach(function (batch) { batch.draw(context); });

        return incomplete;
    };
}
