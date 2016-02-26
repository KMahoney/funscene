/**
 * Utility class for mutating a matrix in-place.
 */
export class Matrix {
    array: Float32Array;

    constructor() {
        this.array = new Float32Array(16);
        this.setIdentity();
    }

    setIdentity() {
        var m = this.array;
        m[0] = 1;
        m[1] = 0;
        m[2] = 0;
        m[3] = 0;
        m[4] = 0;
        m[5] = 1;
        m[6] = 0;
        m[7] = 0;
        m[8] = 0;
        m[9] = 0;
        m[10] = 1;
        m[11] = 0;
        m[12] = 0;
        m[13] = 0;
        m[14] = 0;
        m[15] = 1;
    }

    translate(x: number, y: number, z: number) {
        var m = this.array;
        m[12] = m[0] * x + m[4] * y + m[8] * z + m[12];
        m[13] = m[1] * x + m[5] * y + m[9] * z + m[13];
        m[14] = m[2] * x + m[6] * y + m[10] * z + m[14];
        m[15] = m[3] * x + m[7] * y + m[11] * z + m[15];
    }

    rotateZ(rad: number) {
        var m = this.array;
        const s = Math.sin(rad);
        const c = Math.cos(rad);
        const m0 = m[0];
        const m1 = m[1];
        const m2 = m[2];
        const m3 = m[3];
        const m4 = m[4];
        const m5 = m[5];
        const m6 = m[6];
        const m7 = m[7];

        m[0] = m0 * c + m4 * s;
        m[1] = m1 * c + m5 * s;
        m[2] = m2 * c + m6 * s;
        m[3] = m3 * c + m7 * s;
        m[4] = m4 * c - m0 * s;
        m[5] = m5 * c - m1 * s;
        m[6] = m6 * c - m2 * s;
        m[7] = m7 * c - m3 * s;
    }

    setOrtho(left: number , right: number, bottom: number, top: number, near: number, far: number) {
        var m = this.array;
        const leftright = 1 / (left - right);
        const bottomtop = 1 / (bottom - top);
        const nearfar = 1 / (near - far);
        m[0] = -2 * leftright;
        m[1] = 0;
        m[2] = 0;
        m[3] = 0;
        m[4] = 0;
        m[5] = -2 * bottomtop;
        m[6] = 0;
        m[7] = 0;
        m[8] = 0;
        m[9] = 0;
        m[10] = 2 * nearfar;
        m[11] = 0;
        m[12] = (left + right) * leftright;
        m[13] = (top + bottom) * bottomtop;
        m[14] = (far + near) * nearfar;
        m[15] = 1;
    }
};
