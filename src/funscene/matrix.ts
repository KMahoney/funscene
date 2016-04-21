/**
 * Utility class for mutating a matrix in-place.
 */
export class Matrix4 {
    array: Float32Array;

    constructor(array?: Float32Array) {
        this.array = array || new Float32Array(16);
    }

    setOrtho(left: number , right: number, bottom: number, top: number, near: number, far: number): void {
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

/**
 * Utility class for mutating a matrix in-place.
 */
export class Matrix3 {
    array: Float32Array;

    constructor(array?: Float32Array) {
        this.array = array || new Float32Array(9);
        this.setIdentity();
    }

    setIdentity(): void {
        var m = this.array;
        m[0] = 1;
        m[1] = 0;
        m[2] = 0;

        m[3] = 0;
        m[4] = 1;
        m[5] = 0;

        m[6] = 0;
        m[7] = 0;
        m[8] = 1;
    }

    copy(other: Matrix3): void {
        var m = this.array;
        var m2 = other.array;
        m[0] = m2[0];
        m[1] = m2[1];
        m[2] = m2[2];
        m[3] = m2[3];
        m[4] = m2[4];
        m[5] = m2[5];
        m[6] = m2[6];
        m[7] = m2[7];
        m[8] = m2[8];
    }

    translate(x: number, y: number): void {
        var m = this.array;
        m[6] = m[0] * x + m[3] * y + m[6];
        m[7] = m[1] * x + m[4] * y + m[7];
        m[8] = m[2] * x + m[5] * y + m[8];
    }

    rotate(rad: number): void {
        var m = this.array;
        const s = Math.sin(rad);
        const c = Math.cos(rad);

        const m0 = m[0];
        const m1 = m[1];
        const m2 = m[2];
        const m3 = m[3];
        const m4 = m[4];
        const m5 = m[5];

        m[0] = c * m0 + s * m3;
        m[1] = c * m1 + s * m4;
        m[2] = c * m2 + s * m5;

        m[3] = c * m3 - s * m0;
        m[4] = c * m4 - s * m1;
        m[5] = c * m5 - s * m2;
    }
};
