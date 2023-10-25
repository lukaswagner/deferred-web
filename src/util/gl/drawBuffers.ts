import { GL } from './gl';

export function drawBuffer(gl: GL, buf: GLuint): void {
    if (
        buf >= gl.COLOR_ATTACHMENT1 &&
        buf <= gl.COLOR_ATTACHMENT15
    ) {
        const offset = buf - gl.COLOR_ATTACHMENT0;
        const drawBuffers = new Array<number>(offset + 1).fill(gl.NONE);
        drawBuffers[offset] = buf;
        gl.drawBuffers(drawBuffers);
    } else {
        gl.drawBuffers([buf]);
    }
}

export function drawBuffers(gl: GL, mask: number): void {
    const maxDrawBuffers = gl.getParameter(gl.MAX_DRAW_BUFFERS) as number;
    const buf = [...new Array<unknown>(maxDrawBuffers)]
        .map((_, i) => (mask >> i) & 1 ? gl.COLOR_ATTACHMENT0 + i : gl.NONE);
    gl.drawBuffers(buf);
}
