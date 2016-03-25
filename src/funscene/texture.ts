function nearest_pow2(x : number) {
    var p = 1;
    while (p < x) { p *= 2 };
    return p;
}

export class Rect {
    constructor(public x: number, public y: number, public width: number, public height: number) {}
}

export interface ITexture {
    texture_id: WebGLTexture;
    width: number;
    height: number;
    texture_coord: Rect;
}

/**
 * A WebGL Texture
 */
export class Texture {
    texture_id: WebGLTexture;
    texture_width: number;
    texture_height: number;
    texture_coord: Rect;

    constructor(private gl: WebGLRenderingContext, public width: number, public height: number) {
        this.texture_id = gl.createTexture();
        this.texture_width = nearest_pow2(width);
        this.texture_height = nearest_pow2(height);
        this.texture_coord = new Rect(0.0, 0.0, this.width / this.texture_width, this.height / this.texture_height);
    }

    load(canvas: HTMLCanvasElement): void {
        const gl = this.gl;
        gl.bindTexture(gl.TEXTURE_2D, this.texture_id);
        gl.texImage2D(gl.TEXTURE_2D, 0, gl.RGBA, gl.RGBA, gl.UNSIGNED_BYTE, canvas);
        gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_WRAP_S, gl.CLAMP_TO_EDGE);
        gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_WRAP_T, gl.CLAMP_TO_EDGE);
        gl.generateMipmap(gl.TEXTURE_2D);
    }

    /**
     * Draw to the texture using a canvas.
     */
    draw(callback: (context: CanvasRenderingContext2D) => void): void {
        const canvas = document.createElement('canvas');
        canvas.width = this.texture_width;
        canvas.height = this.texture_height;
        const context = canvas.getContext('2d');
        callback(context);
        this.load(canvas);
    }
}

export class TextureSlice {
    texture_id: WebGLTexture;
    texture_coord: Rect;

    constructor(private texture: Texture, public x: number, public y: number, public width: number, public height: number) {
        this.texture_id = texture.texture_id;
        const tw = texture.texture_width;
        const th = texture.texture_height;
        this.texture_coord = new Rect(x / tw, y / th, width / tw, height / th);
    }
}

export function loadTexture(gl: WebGLRenderingContext, src: string): Promise<Texture> {
    return new Promise(function (resolve, reject) {
        const img = new Image();
        img.onload = function () {
            var texture = new Texture(gl, img.width, img.height);
            // The image itself may not have a power of 2 size, so
            // draw the image in to an appropriately sized canvas.
            texture.draw(function (context) { context.drawImage(img, 0, 0); });
            resolve(texture);
        };
        img.src = src;
    });
}
