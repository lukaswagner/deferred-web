import { GL } from './gl';
import { TextureFormat } from './formats';
import { vec2 } from 'gl-matrix';

export enum BufferMode {
    Single,
    Double, // for ping-pong rendering
}

export class Texture {
    protected _gl: GL;
    protected _format: TextureFormat;
    protected _bufferMode: BufferMode;
    protected _handle: WebGLTexture;
    protected _double: WebGLTexture;

    public constructor(gl: GL) {
        this._gl = gl;
    }

    public initialize(format: TextureFormat, bufferMode = BufferMode.Single) {
        this._format = format;
        this._bufferMode = bufferMode;
        this._handle = this._gl.createTexture();
        if (this._bufferMode === BufferMode.Double)
            this._double = this._gl.createTexture();
        this.resize([1, 1]);
    }

    protected _resize(handle: WebGLTexture, size: vec2) {
        this._gl.bindTexture(this._gl.TEXTURE_2D, handle);
        this._gl.texImage2D(
            this._gl.TEXTURE_2D, 0, this._format.internalFormat,
            size[0], size[1],
            0, this._format.format, this._format.type, undefined);
        this._gl.bindTexture(this._gl.TEXTURE_2D, null);
    }

    public resize(size: vec2) {
        this._resize(this._handle, size);
        if (this._bufferMode === BufferMode.Double)
            this._resize(this._double, size);
    }

    public get readHandle() {
        return this._handle;
    }

    public get writeHandle() {
        if (this._bufferMode === BufferMode.Double)
            return this._double;
        return this._handle;
    }

    public swap() {
        if (this._bufferMode === BufferMode.Single) return;
        [this._handle, this._double] = [this._double, this._handle];
    }

    public get bufferMode() {
        return this._bufferMode;
    }

    public get format(): TextureFormat {
        return this._format;
    }

    public bind(target = this._gl.TEXTURE0) {
        this._gl.activeTexture(target);
        this._gl.bindTexture(this._gl.TEXTURE_2D, this.readHandle);
    }

    public unbind(target = this._gl.TEXTURE0) {
        this._gl.activeTexture(target);
        this._gl.bindTexture(this._gl.TEXTURE_2D, null);
    }
}
