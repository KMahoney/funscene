import { Context } from './context'
import { ITexture, Rect } from './texture'
import { Properties, Transformer } from './transformers'

export class BatchSprite {
    constructor(
        private properties: Properties,
        private transformers: Transformer[],
        private width: number,
        private height: number,
        private texture_coord: Rect
    ) {}

    update(t: number): void {
        var properties = this.properties;
        properties.reset();
        this.transformers.forEach(function (transformer) {
            transformer.updateProperties(t, properties);
        });
    }

    draw(context: Context): void {
        const gl = context.gl;
        const program = context.program;

        // send the updated model and blend to webgl
        gl.uniform4fv(program.blend, this.properties.blend);
        gl.uniformMatrix4fv(program.model, false, this.properties.matrix.array);

        // scale the vertex position and texture coordinates
        gl.uniform2f(program.size, this.width, this.height);
        gl.uniform2f(program.texture_offset, this.texture_coord.x, this.texture_coord.y);
        gl.uniform2f(program.texture_scale, this.texture_coord.width, this.texture_coord.height);

        gl.drawArrays(gl.TRIANGLE_STRIP, 0, 4);
    }

    length(): number {
        return Math.max.apply(undefined, this.transformers.map(t => t.length));
    }
}

export class Batch {
    public length: number;

    constructor(
        private texture_id: WebGLTexture,
        private sprites: BatchSprite[]
    ) {
        this.length = Math.max.apply(undefined, sprites.map(s => s.length()));
    }

    update(t: number): void {
        this.sprites.forEach(function (sprite) { sprite.update(t); });
    }

    draw(context: Context): void {
        context.gl.bindTexture(context.gl.TEXTURE_2D, this.texture_id);
        this.sprites.forEach(function (sprite) { sprite.draw(context); });
    }
}

export class BatchBuilder {
    private transformer_stack: Transformer[];
    private current_texture_id: WebGLTexture;
    private sprites: BatchSprite[];
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

        const properties = new Properties();
        var transformers = this.transformer_stack.slice();
        transformers.push(transformer);
        this.sprites.push(new BatchSprite(properties, transformers, texture.width, texture.height, texture.texture_coord));
    }

    pushTransformer(transformer: Transformer): void {
        this.transformer_stack.push(transformer);
    }

    popTransformer(): void {
        this.transformer_stack.pop();
    }
}
