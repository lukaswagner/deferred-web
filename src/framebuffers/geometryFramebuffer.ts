import { createTexture } from '../util/texture';
import { FragmentLocation } from './locations';

export class GeometryFramebuffer {
    protected _gl: WebGL2RenderingContext;

    public depthStencil: WebGLTexture;
    public worldPosition: WebGLTexture;
    public worldNormal: WebGLTexture;
    public viewPosition: WebGLTexture;
    public viewNormal: WebGLTexture;
    public color: WebGLTexture;

    public fbo: WebGLFramebuffer;

    public constructor(gl: WebGL2RenderingContext) {
        this._gl = gl;
    }

    public initialize(): boolean {
        let valid = true;

        this.depthStencil = createTexture(this._gl, ...depthConfig);

        this.depthStencil = this._gl.createTexture();
        this._gl.bindTexture(this._gl.TEXTURE0, this.depthStencil);
        this._gl.texStorage2D();

        this.depthStencil = new Texture2D(this._context, 'tex:depthStencil');
        valid &&= this.depthStencil.initialize(
            1, 1, this._gl.DEPTH24_STENCIL8, this._gl.DEPTH_STENCIL, this._gl.UNSIGNED_INT_24_8);

        this.worldPosition = new Texture2D(this._context, 'tex:worldPosition');
        valid &&= this.worldPosition.initialize(
            1, 1, this._gl.RGBA16F, this._gl.RGBA, this._gl.HALF_FLOAT);

        this.worldNormal = new Texture2D(this._context, 'tex:worldNormal');
        valid &&= this.worldNormal.initialize(
            1, 1, this._gl.RGBA16F, this._gl.RGBA, this._gl.HALF_FLOAT);

        this.viewPosition = new Texture2D(this._context, 'tex:viewPosition');
        valid &&= this.viewPosition.initialize(
            1, 1, this._gl.RGBA16F, this._gl.RGBA, this._gl.HALF_FLOAT);

        this.viewNormal = new Texture2D(this._context, 'tex:viewNormal');
        valid &&= this.viewNormal.initialize(
            1, 1, this._gl.RGBA16F, this._gl.RGBA, this._gl.HALF_FLOAT);

        this.color = new Texture2D(this._context, 'tex:color');
        valid &&= this.color.initialize(
            1, 1, this._gl.RGBA, this._gl.RGBA, this._gl.UNSIGNED_BYTE);

        this.fbo = new Framebuffer(this._context, 'fbo:intermediate');
        valid &&= this.fbo.initialize([
            [this._gl.COLOR_ATTACHMENT0 + FragmentLocation.WorldPosition, this.worldPosition],
            [this._gl.COLOR_ATTACHMENT0 + FragmentLocation.WorldNormal, this.worldNormal],
            [this._gl.COLOR_ATTACHMENT0 + FragmentLocation.ViewPosition, this.viewPosition],
            [this._gl.COLOR_ATTACHMENT0 + FragmentLocation.ViewNormal, this.viewNormal],
            [this._gl.COLOR_ATTACHMENT0 + FragmentLocation.Color, this.color],
            [this._gl.DEPTH_STENCIL_ATTACHMENT, this.depthStencil],
        ]);

        return valid;
    }

    public uninitialize(): void { }

    public resize(width: number, height: number) {
        this.fbo.resize(width, height);
    }
}
