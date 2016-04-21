import { Context } from './context'
import { ITexture, Rect } from './texture'
import { Properties, Transformer } from './transformers'

export type SpriteConstants = {
    transformers: Transformer[],
    width: number,
    height: number,
    texture_coord: Rect
}

export class BatchSprite {
    public length: number;
    private complete: boolean;

    constructor(
        private properties: Properties,
        private transformers: Transformer[]
    ) {
        this.length = Math.max.apply(undefined, transformers.map(t => t.length));
        this.complete = false;
    }

    update(t: number): void {
        if (!this.complete) {
            var properties = this.properties;
            properties.reset();
            this.transformers.forEach(function (transformer) {
                transformer.updateProperties(t, properties);
            });
            this.complete = t > this.length;
        }
    }
}

export class Batch {
    public length: number;
    private buffer: Float32Array;
    private sprites: BatchSprite[];
    private complete: boolean;

    constructor(
        private texture_id: WebGLTexture,
        sprites: SpriteConstants[]
    ) {
        const stride = 19;
        const byte_stride = stride * 4;

        var buffer = new ArrayBuffer(byte_stride * sprites.length);

        this.sprites = [];
        for (var i = 0; i < sprites.length; i++) {
            const constants = sprites[i];
            const properties = new Properties(buffer, i, constants.width, constants.height, constants.texture_coord);
            this.sprites.push(new BatchSprite(properties, constants.transformers));
        }

        this.buffer = new Float32Array(buffer);

        this.length = Math.max.apply(undefined, this.sprites.map(s => s.length));
        this.complete = false;
    }

    update(t: number): void {
        if (!this.complete) {
            this.sprites.forEach(function (sprite) { sprite.update(t); });
            this.complete = t > this.length;
        }
    }

    draw(context: Context): void {
        const gl = context.gl;
        const program = context.program;
        gl.bindTexture(gl.TEXTURE_2D, this.texture_id);
        gl.bindBuffer(gl.ARRAY_BUFFER, context.sprite_buffer);
        gl.bufferData(gl.ARRAY_BUFFER, this.buffer, gl.DYNAMIC_DRAW);
        context.instanced_arrays.drawArraysInstancedANGLE(gl.TRIANGLE_STRIP, 0, 4, this.sprites.length);
    }
}

export class BatchBuilder {
    private transformer_stack: Transformer[];
    private current_texture_id: WebGLTexture;
    private sprites: SpriteConstants[];
    public batches: Batch[];

    constructor() {
        this.transformer_stack = [];
        this.current_texture_id = null;
        this.sprites = [];
        this.batches = [];
    }

    finishBatch(): void {
        if (this.sprites.length > 0) {
            const batch = new Batch(this.current_texture_id, this.sprites);
            this.sprites = [];
            this.batches.push(batch);
        }
    }

    addSprite(texture: ITexture, transformer: Transformer): void {
        if (texture.texture_id != this.current_texture_id) {
            this.finishBatch();
            this.current_texture_id = texture.texture_id;
        }

        var transformers = this.transformer_stack.slice();
        transformers.push(transformer);
        this.sprites.push({
            transformers: transformers,
            width: texture.width,
            height: texture.height,
            texture_coord: texture.texture_coord
        });
    }

    pushTransformer(transformer: Transformer): void {
        this.transformer_stack.push(transformer);
    }

    popTransformer(): void {
        this.transformer_stack.pop();
    }
}
