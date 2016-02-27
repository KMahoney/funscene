import { Matrix } from './matrix'

/**
 * A mutable set of properties for objects in a scene.
 */
export class Properties {
    matrix: Matrix;
    blend: Float32Array;

    constructor() {
        this.matrix = new Matrix();
        this.blend = new Float32Array([1, 1, 1, 1]);
    }

    reset() {
        this.matrix.setIdentity();
        const b = this.blend;
        b[0] = b[1] = b[2] = b[3] = 1;
    }
}

// Use a 'null' length for constant transformers. This works as you'd
// expect for Math.max and summing.
export interface Transformer {
    length: number;
    updateProperties(t: number, properties: Properties): void;
}

export type Interpolator = (t: number, a: number, b: number) => number;

export namespace interpolators {
    export function linear(t: number, a: number, b: number): number {
        return (b - a) * Math.min(t, 1) + a;
    }

    export function cubic(t: number, a: number, b: number): number {
        return (b - a) * Math.pow(Math.min(t, 1), 3) + a;
    }

    export function inverseCubic(t: number, a: number, b: number): number {
        return (b - a) * (1.0 - Math.pow(1.0 - Math.min(t, 1), 3)) + a;
    }
}

export namespace transformers {
    export const noOp: Transformer = {
        length: null,
        updateProperties: function(t, prop) {}
    };

    /**
     * Translate a scene object by (x, y)
     */
    export function translate(x: number, y: number): Transformer {
        return {
            length: null,
            updateProperties: function(t, prop) {
                prop.matrix.translate(x, y, 0);
            }
        };
    }

    /**
     * Interpolate a scene object's alpha over `length` ms.
     */
    export function fade(interpolator: Interpolator, length: number, a: number, b: number): Transformer {
        return {
            length: length,
            updateProperties: function(t, prop) {
                prop.blend[3] = interpolator(t/length, a, b);
            }
        };
    }

    /**
     * Interpolate a scene object's blend modifier. `a` and `b` should be
     * an array of 4 numbers from 0 to 1.
     */
    export function blend(interpolator: Interpolator, length: number, a: number[], b: number[]): Transformer {
        return {
            length: length,
            updateProperties: function(t, prop) {
                const t2 = t/length;
                prop.blend[0] = interpolator(t2, a[0], b[0]);
                prop.blend[1] = interpolator(t2, a[1], b[1]);
                prop.blend[2] = interpolator(t2, a[2], b[2]);
                prop.blend[3] = interpolator(t2, a[3], b[3]);
            }
        };
    }

    /**
     * Do nothing for `length` ms.
     */
    export function wait(length: number): Transformer {
        return {
            length: length,
            updateProperties: function(t, prop) {}
        }
    }

    /**
     * Interpolate an object from (x1, y1) to (x2, y2) over `length` ms.
     */
    export function move(interpolator: Interpolator, length: number, x1: number, y1: number, x2: number, y2: number): Transformer {
        return {
            length: length,
            updateProperties: function(t, prop) {
                const t2 = t/length;
                const x = interpolator(t2, x1, x2);
                const y = interpolator(t2, y1, y2);
                prop.matrix.translate(x, y, 0);
            }
        };
    }

    /**
     * Rotate an object over `length` ms. 1.0 = 360deg.
     */
    export function rotate(interpolator: Interpolator, length: number, from: number, to: number): Transformer {
        return {
            length: length,
            updateProperties: function(t, prop) {
                const rad = interpolator(t/length, from, to) * Math.PI * 2;
                prop.matrix.rotateZ(rad);
            }
        };
    }

    /**
     * Combine two or more transformers in to one. The transforms are
     * applied in the declared order to the scene object.
     */
    export function combine(transformers: Transformer[]): Transformer {
        return {
            length: Math.max.apply(undefined, transformers.map(t => t.length)),
            updateProperties: function (t, prop) {
                transformers.forEach(function (i) { i.updateProperties(t, prop); });
            }
        };
    }

    /**
     * Modify the length of a transform to `length` ms.
     */
    export function stretch(length: number, transform: Transformer): Transformer {
        if (transform.length === Infinity || transform.length === null || transform.length === 0) {
            throw "Cannot stretch transform of unknown, zero or infinite length";
        }
        return {
            length: length,
            updateProperties: function(t, prop) {
                const t2 = Math.min(1, t/length) * transform.length;
                transform.updateProperties(t2, prop);
            }
        };
    }

    /**
     * Apply a series of transformers in sequence in the declared order.
     */
    export function sequence(seq: Transformer[]): Transformer {
        const n = seq.length;
        return {
            length: seq.map(s => s.length).reduce(function (a, b) { return a + b }, 0),
            updateProperties: function(t, prop) {
                var acc = 0;
                for (var i = 0; i < n; i++) {
                    const len = seq[i].length
                    if (t < acc + len) {
                        seq[i].updateProperties(t - acc, prop);
                        return;
                    }
                    acc += len;
                }
            }
        };
    }

    /**
     * Apply a series of transformers in sequence in the declared order
     * and repeat infinitely.
     */
    export function repeat(seq: Transformer[]): Transformer {
        const transform_seq = sequence(seq);
        return {
            length: Infinity,
            updateProperties: function(t, prop) {
                transform_seq.updateProperties(t % transform_seq.length, prop);
            }
        };
    }
}
