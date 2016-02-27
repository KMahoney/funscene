import { Context, DrawCallback } from './context'
import { Properties, Transformer } from './transformers'
import { Sprite } from './sprite'

/**
 * A scene consists of a world transformation and an array of sprites.
 */
export function createScene(world_transform: Transformer, sprites: Sprite[]): DrawCallback {
    const start = performance.now();

    // Pre-allocate sprite properties. These will be mutated in
    // place to avoid allocations.
    var properties = new Properties();
    var world_properties = new Properties();

    return function(context: Context, t: number) {
        const gl = context.gl;
        const program = context.program;
        const scene_t = Math.max(t - start, 0);
        var incomplete = false;

        gl.clear(gl.COLOR_BUFFER_BIT);

        world_properties.matrix.setOrtho(0, context.width, context.height, 0, 0, 1);
        world_transform.updateProperties(scene_t, world_properties);
        incomplete = incomplete || (scene_t < world_transform.length);
        gl.uniformMatrix4fv(program.projection, false, world_properties.matrix.array);

        // We currently do a series of WebGL calls for each
        // sprite. This could be sped up considerably by using
        // fewer draw calls with the instance rendering extension.
        sprites.forEach(function (sprite) {
            const texture = sprite.texture;

            // mutate model and blend in place
            sprite.updateProperties(scene_t, properties);
            incomplete = incomplete || (scene_t < sprite.length);

            // send the updated model and blend to webgl
            gl.uniform4fv(program.blend, properties.blend);
            gl.uniformMatrix4fv(program.model, false, properties.matrix.array);

            // scale the vertex position and texture coordinates
            gl.uniform2f(program.size, texture.width, texture.height);
            gl.uniform2f(program.texture_scale, texture.texture_scale_x, texture.texture_scale_y);

            context.bindTexture(texture);
            gl.drawArrays(gl.TRIANGLE_STRIP, 0, 4);
        });

        return incomplete;
    };
}
