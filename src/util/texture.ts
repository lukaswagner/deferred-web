export function createTexture(
    gl: WebGL2RenderingContext,
    internalFormat: number, format: number, type: number,
    width = 0, height = 0,
) {
    const texture = gl.createTexture();
    gl.bindTexture(gl.TEXTURE0, texture);
    gl.texImage2D(gl.TEXTURE0, 0, internalFormat, width, height, 0, format, type, undefined);
    gl.bindTexture(gl.TEXTURE0, null);
    return texture;
}
