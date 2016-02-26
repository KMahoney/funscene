function nearest_pow2(x : number) {
    var p = 1;
    while (p < x) { p *= 2 };
    return p;
}

/**
 * A WebGL Texture
 */
export class Texture {
    texture_id: WebGLTexture;
    private texture_width: number;
    private texture_height: number;
    texture_scale_x: number;
    texture_scale_y: number;

    constructor(private gl: WebGLRenderingContext, public width: number, public height: number) {
        this.texture_id = gl.createTexture();
        this.texture_width = nearest_pow2(width);
        this.texture_height = nearest_pow2(height);
        this.texture_scale_x = this.width / this.texture_width;
        this.texture_scale_y = this.height / this.texture_height;
    }

    /**
     * Draw to the texture using a canvas.
     */
    make(callback: (context: CanvasRenderingContext2D) => void) {
        const gl = this.gl;
        const canvas = document.createElement('canvas');
        canvas.width = this.texture_width;
        canvas.height = this.texture_height;
        const context = canvas.getContext('2d');
        callback(context);
        gl.bindTexture(gl.TEXTURE_2D, this.texture_id);
        gl.texImage2D(gl.TEXTURE_2D, 0, gl.RGBA, gl.RGBA, gl.UNSIGNED_BYTE, canvas);
        gl.generateMipmap(gl.TEXTURE_2D);
        gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_WRAP_S, gl.CLAMP_TO_EDGE);
        gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_WRAP_T, gl.CLAMP_TO_EDGE);
    }
}
