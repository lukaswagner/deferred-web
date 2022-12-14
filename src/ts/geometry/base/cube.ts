import { Buffer, Context } from 'webgl-operate';
import { Base } from '../base';
import { VertexLocations } from '../locations';

const indexData = new Uint8Array([
    // front
    5, 17, 23,
    23, 11, 5,
    // back
    2, 8, 14,
    8, 20, 14,
    // left
    0, 3, 6,
    6, 3, 9,
    // right
    12, 18, 15,
    15, 18, 21,
    // bottom
    1, 13, 4,
    4, 13, 16,
    // top
    7, 10, 19,
    19, 10, 22,
]);

const mmm = [-1, -1, -1];
const mmp = [-1, -1, +1];
const mpm = [-1, +1, -1];
const mpp = [-1, +1, +1];
const pmm = [+1, -1, -1];
const pmp = [+1, -1, +1];
const ppm = [+1, +1, -1];
const ppp = [+1, +1, +1];

const positionData = new Float32Array([
    ...mmm, ...mmm, ...mmm, //  0  1  2
    ...mmp, ...mmp, ...mmp, //  3  4  5
    ...mpm, ...mpm, ...mpm, //  6  7  8
    ...mpp, ...mpp, ...mpp, //  9 10 11
    ...pmm, ...pmm, ...pmm, // 12 13 14
    ...pmp, ...pmp, ...pmp, // 15 16 17
    ...ppm, ...ppm, ...ppm, // 18 19 20
    ...ppp, ...ppp, ...ppp, // 21 22 23
]);

const nl = [-1, +0, +0];
const nr = [+1, +0, +0];
const nd = [+0, -1, +0];
const nu = [+0, +1, +0];
const nb = [+0, +0, -1];
const nf = [+0, +0, +1];

const normalData = new Float32Array([
    ...nl, ...nd, ...nb,
    ...nl, ...nd, ...nf,
    ...nl, ...nu, ...nb,
    ...nl, ...nu, ...nf,
    ...nr, ...nd, ...nb,
    ...nr, ...nd, ...nf,
    ...nr, ...nu, ...nb,
    ...nr, ...nu, ...nf,
]);

export function createCube(context: Context): Base {
    const gl = context.gl as WebGL2RenderingContext;

    const index = new Buffer(context);
    index.initialize(gl.ELEMENT_ARRAY_BUFFER);
    index.data(indexData.buffer, gl.STATIC_DRAW);

    const position = new Buffer(context);
    position.initialize(gl.ARRAY_BUFFER);
    position.data(positionData.buffer, gl.STATIC_DRAW);

    const normal = new Buffer(context);
    normal.initialize(gl.ARRAY_BUFFER);
    normal.data(normalData.buffer, gl.STATIC_DRAW);

    return {
        index,
        indexType: gl.UNSIGNED_BYTE,
        buffers: [{
            buffer: position,
            location: VertexLocations.basePosition,
            size: 3,
            type: gl.FLOAT,
            divisor: 0,
        }, {
            buffer: normal,
            location: VertexLocations.baseNormal,
            size: 3,
            type: gl.FLOAT,
            divisor: 0,
        }],
        mode: gl.TRIANGLES,
        count: indexData.length,
    };
}
