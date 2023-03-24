import { Base } from '../base';
import { VertexLocations } from '../locations';

export function createTriangle(gl: WebGL2RenderingContext): Base {
    const position = gl.createBuffer();
    gl.bindBuffer(gl.ARRAY_BUFFER, position);
    const positionData = new Float32Array([0, 0, 0, 1, 0, 0, 0, 1, 0]);
    gl.bufferData(gl.ARRAY_BUFFER, positionData.buffer, gl.STATIC_DRAW);

    const normal = gl.createBuffer();
    gl.bindBuffer(gl.ARRAY_BUFFER, normal);
    const normalData = new Float32Array([0, 0, 1, 0, 0, 1, 0, 0, 1]);
    gl.bufferData(gl.ARRAY_BUFFER, normalData.buffer, gl.STATIC_DRAW);

    const color = gl.createBuffer();
    gl.bindBuffer(gl.ARRAY_BUFFER, color);
    const colorData = new Float32Array([0, 0, 0, 1, 0, 0, 0, 1, 0]);
    gl.bufferData(gl.ARRAY_BUFFER, colorData.buffer, gl.STATIC_DRAW);

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

export function createIndexedTriangle(gl: WebGL2RenderingContext): Base {
    const triangle = createTriangle(gl);

    const index = gl.createBuffer();
    gl.bindBuffer(gl.ELEMENT_ARRAY_BUFFER, index);
    const indexData = new Uint8Array([0, 1, 2]);
    gl.bufferData(gl.ELEMENT_ARRAY_BUFFER, indexData.buffer, gl.STATIC_DRAW);

    return Object.assign(triangle, { index, indexType: gl.UNSIGNED_BYTE });
}
