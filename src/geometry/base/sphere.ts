import { vec3 } from 'gl-matrix';
import { Base } from '../base';
import { VertexLocations } from '../locations';
import { parseObj } from '../util/obj';

const obj = require('../data/sphere.obj') as string;
const { vertices, normals, faces } = parseObj(obj);

export function createSphere(gl: WebGL2RenderingContext, color: vec3 = [1, 1, 1]): Base {
    const indexBuffer = gl.createBuffer();
    gl.bindBuffer(gl.ELEMENT_ARRAY_BUFFER, indexBuffer);
    gl.bufferData(gl.ELEMENT_ARRAY_BUFFER, faces.buffer, gl.STATIC_DRAW);

    const indexType =
        faces instanceof Uint8Array ? gl.UNSIGNED_BYTE :
        faces instanceof Uint16Array ? gl.UNSIGNED_SHORT :
        gl.UNSIGNED_INT;

    const positionBuffer = gl.createBuffer();
    gl.bindBuffer(gl.ARRAY_BUFFER, positionBuffer);
    gl.bufferData(gl.ARRAY_BUFFER, vertices.buffer, gl.STATIC_DRAW);

    const normalBuffer = gl.createBuffer();
    gl.bindBuffer(gl.ARRAY_BUFFER, normalBuffer);
    gl.bufferData(gl.ARRAY_BUFFER, normals.buffer, gl.STATIC_DRAW);

    const colorData = new Float32Array(vertices.length);
    for (let i = 0; i < vertices.length; i += 3) {
        colorData.set(color, i);
    }

    const colorBuffer = gl.createBuffer();
    gl.bindBuffer(gl.ARRAY_BUFFER, colorBuffer);
    gl.bufferData(gl.ARRAY_BUFFER, colorData.buffer, gl.STATIC_DRAW);

    return {
        index: indexBuffer,
        indexType,
        buffers: [{
            buffer: positionBuffer,
            location: VertexLocations.basePosition,
            size: 3,
            type: gl.FLOAT,
            divisor: 0,
        }, {
            buffer: normalBuffer,
            location: VertexLocations.baseNormal,
            size: 3,
            type: gl.FLOAT,
            divisor: 0,
        }, {
            buffer: colorBuffer,
            location: VertexLocations.baseColor,
            size: 3,
            type: gl.FLOAT,
            divisor: 0,
        }],
        mode: gl.TRIANGLES,
        count: faces.length,
    };
}
