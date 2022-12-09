import { Buffer, Context } from 'webgl-operate';
import { Base } from '../base';
import { VertexLocations } from '../locations';

export function createTriangle(context: Context): Base {
    const gl = context.gl as WebGL2RenderingContext;

    const position = new Buffer(context, 'buf:trianglePosition');
    position.initialize(gl.ARRAY_BUFFER);
    const positionData = new Float32Array([0, 0, 0, 1, 0, 0, 0, 1, 0]);
    position.data(positionData.buffer, gl.STATIC_DRAW);

    const normal = new Buffer(context, 'buf:triangleNormal');
    normal.initialize(gl.ARRAY_BUFFER);
    const normalData = new Float32Array([0, 0, 1, 0, 0, 1, 0, 0, 1]);
    normal.data(normalData.buffer, gl.STATIC_DRAW);

    const color = new Buffer(context, 'buf:triangleColor');
    color.initialize(gl.ARRAY_BUFFER);
    const colorData = new Float32Array([0, 0, 0, 1, 0, 0, 0, 1, 0]);
    color.data(colorData.buffer, gl.STATIC_DRAW);

    return {
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
        }, {
            buffer: color,
            location: VertexLocations.baseColor,
            size: 3,
            type: gl.FLOAT,
            divisor: 0,
        }],
        mode: gl.TRIANGLES,
        count: 3,
    };
}

export function createIndexedTriangle(context: Context): Base {
    const gl = context.gl as WebGL2RenderingContext;

    const triangle = createTriangle(context);

    const index = new Buffer(context, 'buf:triangleIndex');
    index.initialize(gl.ELEMENT_ARRAY_BUFFER);
    const indexData = new Uint8Array([0, 1, 2]);
    index.data(indexData.buffer, gl.STATIC_DRAW);

    return Object.assign(triangle, { index, indexType: gl.UNSIGNED_BYTE });
}
