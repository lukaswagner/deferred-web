import { Context, mat4 } from 'webgl-operate';
import { Base } from './base';
import { Instance } from './instance';

export interface Geometry {
    base: Base;
    instance?: Instance;
    vao?: WebGLVertexArrayObject;
    model?: mat4;
}

export function createVAO(
    context: Context, base: Base, instance: Instance,
): WebGLVertexArrayObject {
    const gl = context.gl as WebGL2RenderingContext;

    const vao = gl.createVertexArray();
    if (vao === null) throw new Error('could not create VAO');
    gl.bindVertexArray(vao);

    base.buffers.forEach((b) => {
        b.buffer.attribEnable(b.location, b.size, b.type);
        gl.vertexAttribDivisor(b.location, b.divisor);
    });

    instance.buffers.forEach((b) => {
        b.buffer.attribEnable(b.location, b.size, b.type);
        gl.vertexAttribDivisor(b.location, b.divisor);
    });

    gl.bindVertexArray(null);
    return vao;
}
