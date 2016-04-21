import { Context, DrawCallback } from './context'
import { Properties, Transformer } from './transformers'
import { Sprite, Group, SceneObject } from './sprite'
import { Matrix4 } from './matrix'
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
    const length = Math.max.apply(undefined, batches.map(b => b.length));

    var projection_matrix = new Matrix4();

    return function(context, t) {
        const gl = context.gl;
        const program = context.program;

        const scene_t = Math.max(t - start, 0);
        batches.forEach(function (batch) {
            batch.update(scene_t);
        });

        gl.clear(gl.COLOR_BUFFER_BIT);

        projection_matrix.setOrtho(0, context.width, context.height, 0, 0, 1);
        gl.uniformMatrix4fv(program.projection, false, projection_matrix.array);

        batches.forEach(function (batch) { batch.draw(context); });

        return scene_t < length;
    };
}
