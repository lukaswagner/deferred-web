import { Buffer, Context, mat4, vec2, vec3 } from 'webgl-operate';
import { BufferInfo } from '../bufferInfo';
import { Instance } from '../instance';
import { VertexLocations } from '../locations';

type Direction = 'xy' | 'xz' | 'yz';

interface Options {
    count?: vec2;
    step?: vec2;
    center?: vec2;
    direction?: Direction;
    colors?: boolean;
}

const defaults: Options = {
    count: [5, 5],
    step: [1, 1],
    center: [0, 0],
    direction: 'xy',
    colors: false,
};

export function create2dGrid(context: Context, options?: Options): Instance {
    const gl = context.gl as WebGL2RenderingContext;
    const opt = Object.assign({}, defaults, options);

    const axis0: vec3 = opt.direction!.startsWith('x') ? [1, 0, 0] : [0, 1, 0];
    const axis1: vec3 = opt.direction!.endsWith('y') ? [0, 1, 0] : [0, 0, 1];

    // halfWidth = step * (count - 1) / 2
    const halfGrid = vec2.create();
    vec2.sub(halfGrid, opt.count!, [1, 1]);
    vec2.mul(halfGrid, halfGrid, opt.step!);
    vec2.scale(halfGrid, halfGrid, 0.5);

    // base = center - halfWidth
    const base = vec2.create();
    vec2.sub(base, opt.center!, halfGrid);

    const base0: vec3 = vec3.multiply(vec3.create(), [base[0], base[0], base[0]], axis0);
    const base1: vec3 = vec3.multiply(vec3.create(), [base[1], base[1], base[1]], axis1);

    const step = opt.step!;
    const step0: vec3 = vec3.multiply(vec3.create(), [step[0], step[0], step[0]], axis0);
    const step1: vec3 = vec3.multiply(vec3.create(), [step[1], step[1], step[1]], axis1);

    const getPos = (i: number, j: number): vec3 => {
        const a = vec3.scaleAndAdd(vec3.create(), base0, step0, i);
        const b = vec3.scaleAndAdd(vec3.create(), base1, step1, j);
        return vec3.add(vec3.create(), a, b);
    };

    const count = opt.count!;

    const matrix = new Buffer(context, 'buf:2dGridMatrix');
    matrix.initialize(gl.ARRAY_BUFFER);
    const matrixData = new Float32Array(16 * count[0] * count[1]);

    let color: Buffer;
    let colorData: Float32Array;
    const colors = opt.colors !== undefined;
    if (colors) {
        color = new Buffer(context, 'buf:2dGridColor');
        color.initialize(gl.ARRAY_BUFFER);
        colorData = new Float32Array(3 * count[0] * count[1]);
    }

    for (let i = 0; i < count[0]; i++) {
        for (let j = 0; j < count[1]; j++) {
            const pos = getPos(i, j);
            const mat = mat4.fromTranslation(mat4.create(), pos);
            const index = i * count[1] + j;
            matrixData.set(mat, index * 16);
            // @ts-expect-error ts(2454) is reported incorrectly
            if (colors) colorData.set([i / (count[0] - 1), j / (count[1] - 1), 0], index * 3);
        }
    }

    matrix.data(matrixData.buffer, gl.STATIC_DRAW);
    // @ts-expect-error ts(2454) is reported incorrectly
    if (colors) color.data(colorData.buffer, gl.STATIC_DRAW);

    const baseBuffer: BufferInfo = {
        buffer: matrix,
        location: VertexLocations.instanceMatrix,
        size: 4,
        type: gl.FLOAT,
        divisor: 1,
    };

    const buffers: BufferInfo[] = [0, 1, 2, 3].map((i) =>
        Object.assign(
            {}, baseBuffer,
            { stride: 64, offset: i * 16, location: VertexLocations.instanceMatrix + i }),
    );
    if (colors) buffers.push({
    // @ts-expect-error ts(2454) is reported incorrectly
        buffer: color,
        location: VertexLocations.instanceColor,
        size: 3,
        type: gl.FLOAT,
        divisor: 1,
    });

    return {
        buffers,
        count: count[0] * count[1],
    };
}
