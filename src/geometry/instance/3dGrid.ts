import { mat4, vec3 } from 'gl-matrix';
import { BufferInfo } from '../bufferInfo';
import { Instance } from '../instance';
import { VertexLocations } from '../locations';

interface Options {
    count?: vec3;
    step?: vec3;
    center?: vec3;
    colors?: boolean;
}

const defaults: Options = {
    count: [5, 5, 5],
    step: [1, 1, 1],
    center: [0, 0, 0],
    colors: false,
};

export function create3dGrid(gl: WebGL2RenderingContext, options?: Options): Instance {
    const opt = Object.assign({}, defaults, options);

    // halfWidth = step * (count - 1) / 2
    const halfGrid = vec3.create();
    vec3.sub(halfGrid, opt.count!, [1, 1, 1]);
    vec3.mul(halfGrid, halfGrid, opt.step!);
    vec3.scale(halfGrid, halfGrid, 0.5);

    // base = center - halfWidth
    const base = vec3.create();
    vec3.sub(base, opt.center!, halfGrid);

    const step = opt.step!;
    const getPos = (indices: vec3): vec3 => {
        const temp = vec3.create();
        vec3.mul(temp, step, indices);
        vec3.add(temp, temp, base);
        return temp;
    };

    const count = opt.count!;
    const total = count[0] * count[1] * count[2];

    const matrix = gl.createBuffer();
    const matrixData = new Float32Array(16 * total);

    let color: WebGLBuffer;
    let colorData: Float32Array;
    const colors = opt.colors;
    if (colors) {
        color = gl.createBuffer();
        colorData = new Float32Array(3 * total);
    }

    for (let x = 0; x < count[0]; x++) {
        for (let y = 0; y < count[1]; y++) {
            for (let z = 0; z < count[2]; z++) {
                const pos: vec3 = getPos([x, y, z]);
                const mat = mat4.fromTranslation(mat4.create(), pos);
                const index = x * count[1] * count[2] + y * count[2] + z;
                matrixData.set(mat, index * 16);
                if (colors) colorData.set(
                    [x / (count[0] - 1), y / (count[1] - 1), z / (count[2] - 1)],
                    index * 3);
            }
        }
    }

    gl.bindBuffer(gl.ARRAY_BUFFER, matrix);
    gl.bufferData(gl.ARRAY_BUFFER, matrixData.buffer, gl.STATIC_DRAW);

    if (colors) {
        gl.bindBuffer(gl.ARRAY_BUFFER, color);
        gl.bufferData(gl.ARRAY_BUFFER, colorData.buffer, gl.STATIC_DRAW);
    }

    gl.bindBuffer(gl.ARRAY_BUFFER, null);

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
        buffer: color,
        location: VertexLocations.instanceColor,
        size: 3,
        type: gl.FLOAT,
        divisor: 1,
    });


    return {
        buffers,
        count: total,
    };
}
