import { Texture } from './texture'

/**
 * The GL shader program used to display 2D sprites.
 *
 * Currently, only one program is ever used as it's flexible enough to
 * handle sprites of various sizes.
 */
export interface Program {
    vertex: number;
    model: WebGLUniformLocation;
    projection: WebGLUniformLocation;
    size: WebGLUniformLocation;
    texture_scale: WebGLUniformLocation;
    sampler: WebGLUniformLocation;
    blend: WebGLUniformLocation;
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
          "varying highp vec2 texture_coord;\n" +
          "uniform sampler2D sampler;\n" +
          "uniform mediump vec4 blend;\n" +
          "void main(void) {\n" +
          "  gl_FragColor = texture2D(sampler, texture_coord) * blend;\n" +
          "}";
    const frag_shader = gl.createShader(gl.FRAGMENT_SHADER);
    gl.shaderSource(frag_shader, frag);
    gl.compileShader(frag_shader);

    const vert =
          "attribute vec2 vertex;\n" +
          "varying highp vec2 texture_coord;\n" +
          "uniform mat4 model;\n" +
          "uniform mat4 projection;\n" +
          "uniform highp vec2 size;\n" +
          "uniform highp vec2 texture_scale;\n" +
          "void main(void) {\n" +
          "  gl_Position = projection * model * vec4(vertex * size, 0, 1);\n" +
          "  texture_coord = vertex * texture_scale;\n" +
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
        model: gl.getUniformLocation(program, "model"),
        projection: gl.getUniformLocation(program, "projection"),
        size: gl.getUniformLocation(program, "size"),
        texture_scale: gl.getUniformLocation(program, "texture_scale"),
        sampler: gl.getUniformLocation(program, "sampler"),
        blend: gl.getUniformLocation(program, "blend"),
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
    program: Program;

    // Track currently bound texture to avoid extraneous draw calls
    private bound_texture: Texture;

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
        this.raf_id = null;
    }

    /**
     * Create a new WebGL texture with the specified width and height (in pixels).
     */
    createTexture(width: number, height: number): Texture {
        return new Texture(this.gl, width, height);
    }

    /**
     * Bind a texture to the current context.
     */
    bindTexture(texture: Texture) {
        if (texture === this.bound_texture) { return };
        this.bound_texture = texture;
        this.gl.bindTexture(this.gl.TEXTURE_2D, texture.texture_id);
    }

    /**
     * Resizes the WebGL canvas to full screen. Automatically resizes
     * when the browser window resize and then emits a 'contextResize'
     * event on the window.
     */
    fullscreen() {
        throttledResizeHandler(this.resize.bind(this))
        this.resize();
    }

    resize() {
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
    runAnimation(draw: DrawCallback) {
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
    stopAnimation() {
        if (this.raf_id !== null) {
            cancelAnimationFrame(this.raf_id);
            this.raf_id = null;
        }
    }
}
