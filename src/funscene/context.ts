import { Texture, loadTexture } from './texture'

/**
 * The GL shader program used to display 2D sprites.
 *
 * Currently, only one program is ever used as it's flexible enough to
 * handle sprites of various sizes.
 */
export interface Program {
    vertex: number;
    model: number;
    blend: number;
    size: number;
    texture_offset: number;
    texture_scale: number;

    projection: WebGLUniformLocation;
    sampler: WebGLUniformLocation;
};

/**
 * A draw callback should take the current context and a timestamp,
 * render its scene and return true if the animation should continue
 * (i.e. that it should request the next animation frame).
 */
export interface DrawCallback {
    (context: Context, t: number): boolean
};

function initProgram(gl: WebGLRenderingContext): Program {
    const frag =
          "precision lowp float;\n" +
          "varying vec2 texture_coord;\n" +
          "varying vec4 v_blend;\n" +
          "uniform sampler2D sampler;\n" +
          "void main(void) {\n" +
          "  gl_FragColor = texture2D(sampler, texture_coord) * v_blend;\n" +
          "}";
    const frag_shader = gl.createShader(gl.FRAGMENT_SHADER);
    gl.shaderSource(frag_shader, frag);
    gl.compileShader(frag_shader);

    const vert =
          "precision lowp float;\n" +
          "uniform mat4 projection;\n" +

          "varying vec2 texture_coord;\n" +
          "varying vec4 v_blend;\n" +

          "attribute vec2 vertex;\n" +
          "attribute mat3 model;\n" +
          "attribute vec4 blend;\n" +
          "attribute vec2 size;\n" +
          "attribute vec2 texture_offset;\n" +
          "attribute vec2 texture_scale;\n" +

          "void main(void) {\n" +
          "  gl_Position = projection * vec4((model * vec3(vertex * size, 1)).xy, 0, 1);\n" +
          "  texture_coord = (vertex * texture_scale) + texture_offset;\n" +
          "  v_blend = blend;\n" +
          "}";
    const vert_shader = gl.createShader(gl.VERTEX_SHADER);
    gl.shaderSource(vert_shader, vert);
    gl.compileShader(vert_shader);

    const program = gl.createProgram();
    gl.attachShader(program, vert_shader);
    gl.attachShader(program, frag_shader);
    gl.linkProgram(program);    
    gl.useProgram(program);

    return {
        vertex: gl.getAttribLocation(program, "vertex"),
        model: gl.getAttribLocation(program, "model"),
        blend: gl.getAttribLocation(program, "blend"),
        size: gl.getAttribLocation(program, "size"),
        texture_offset: gl.getAttribLocation(program, "texture_offset"),
        texture_scale: gl.getAttribLocation(program, "texture_scale"),
        sampler: gl.getUniformLocation(program, "sampler"),
        projection: gl.getUniformLocation(program, "projection"),
    };
}

function throttledResizeHandler(callback: () => void): void {
    var resize_throttled = false;
    function resize() {
        if (resize_throttled) { return; }
        resize_throttled = true;
        requestAnimationFrame(function () {
            callback();
            resize_throttled = false;
        });
    }
    window.addEventListener("resize", resize);
}

function initGL(gl: WebGLRenderingContext, program: Program): void {
    gl.disable(gl.CULL_FACE);
    gl.disable(gl.DEPTH_TEST);
    gl.enable(gl.BLEND);
    gl.blendFunc(gl.SRC_ALPHA, gl.ONE_MINUS_SRC_ALPHA);
    gl.clearColor(0.0, 0.0, 0.0, 1.0);

    // We only ever use a rectangle for sprites. This is used for
    // vertex position and texture coordiantes, which are scaled to
    // size by the program.size and program.texture_scale uniforms.
    gl.enableVertexAttribArray(program.vertex);
    const vertex_buffer = gl.createBuffer();
    gl.bindBuffer(gl.ARRAY_BUFFER, vertex_buffer);
    gl.bufferData(gl.ARRAY_BUFFER, new Float32Array([0,1, 0,0, 1,1, 1,0]), gl.STATIC_DRAW);
    gl.vertexAttribPointer(program.vertex, 2, gl.FLOAT, false, 0, 0);

    // We only use one texture at a time, so only use slot 0
    gl.activeTexture(gl.TEXTURE0);
    gl.uniform1i(program.sampler, 0);
}

function initSpriteBuffer(gl: WebGLRenderingContext, instanced_arrays: any, program: Program): WebGLBuffer {
    const buffer = gl.createBuffer();
    gl.bindBuffer(gl.ARRAY_BUFFER, buffer);

    const stride = 19;
    const byte_stride = stride * 4;
    const offset = byte_stride * i;
    const blend_offset = 9 * 4;
    const size_offset = 13 * 4;
    const texture_xy_offset = 15 * 4;
    const texture_scale_offset = 17 * 4;

    function repeated_attrib(attrib: number, offset: number, length: number) {
        gl.enableVertexAttribArray(attrib);
        gl.vertexAttribPointer(attrib, length, gl.FLOAT, false, byte_stride, offset);
        instanced_arrays.vertexAttribDivisorANGLE(attrib, 1);
    }

    for (var i = 0; i < 3; i++) { repeated_attrib(program.model + i, 3 * 4 * i, 3); }
    repeated_attrib(program.blend, blend_offset, 4);
    repeated_attrib(program.size, size_offset, 2);
    repeated_attrib(program.texture_offset, texture_xy_offset, 2);
    repeated_attrib(program.texture_scale, texture_scale_offset, 2);

    return buffer;
}

/**
 * A wrapper around the the WebGL context.
 *
 * When created, initialises WebGL and binds a shader program
 * specialised for displaying 2d sprites.
 *
 * A Context can run animations that conform to the `DrawCallback`
 * interface, such as Scene animations.
 */
export class Context {
    gl: WebGLRenderingContext;
    instanced_arrays: any;
    program: Program;
    sprite_buffer: WebGLBuffer;

    // Track the requestAnimationFrame ID so we can stop the animation
    private raf_id: number;

    // Store the width and height of the canvas so we don't have to
    // read from the DOM
    /** The current width of the WebGL canvas in pixels */
    width: number;
    /** The current height of the WebGL canvas in pixels */
    height: number;

    constructor(private canvas: HTMLCanvasElement) {
        this.width = canvas.width;
        this.height = canvas.height;
        this.gl = canvas.getContext("experimental-webgl");
        this.program = initProgram(this.gl);
        initGL(this.gl, this.program);
        this.instanced_arrays = this.gl.getExtension("ANGLE_instanced_arrays");
        this.sprite_buffer = initSpriteBuffer(this.gl, this.instanced_arrays, this.program);
        this.raf_id = null;
    }

    /**
     * Create a new WebGL texture with the specified width and height (in pixels).
     */
    createTexture(width: number, height: number): Texture {
        return new Texture(this.gl, width, height);
    }

    /**
     * Load a new WebGL texture from an image
     */
    loadTexture(src: string): Promise<Texture> {
        return loadTexture(this.gl, src);
    }

    /**
     * Load multiple WebGL texture from a images
     */
    loadTextures(srcs: [string]): Promise<[Texture]> {
        return Promise.all(srcs.map(src => loadTexture(this.gl, src)));
    }

    /**
     * Resizes the WebGL canvas to full screen. Automatically resizes
     * when the browser window resize and then emits a 'contextResize'
     * event on the window.
     */
    fullscreen(): void {
        throttledResizeHandler(this.resize.bind(this))
        this.resize();
    }

    resize(): void {
        this.width = window.innerWidth;
        this.height = window.innerHeight;
        this.canvas.width = this.width;
        this.canvas.height = this.height;
        this.gl.viewport(0, 0, this.width, this.height);
        window.dispatchEvent(new Event("contextResize"));
    }

    /**
     * Start an animation loop. Stops when the draw callback returns
     * false or `stopAnimation` is called.
     */
    runAnimation(draw: DrawCallback): void {
        this.stopAnimation();

        // I'm not sure if .bind allocates, and we wouldn't want to do
        // that every frame. To be safe close over the 'this' pointer.
        const context = this;
        const gl = this.gl;

        function loop(t: number) {
            var cont = draw(context, t);
            gl.finish();
            context.raf_id = cont ? requestAnimationFrame(loop) : null;
        }

        this.raf_id = requestAnimationFrame(loop)
    }

    /**
     * Stop a currently active animation loop.
     */
    stopAnimation(): void {
        if (this.raf_id !== null) {
            cancelAnimationFrame(this.raf_id);
            this.raf_id = null;
        }
    }
}
