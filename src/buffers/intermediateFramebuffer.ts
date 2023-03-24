import { Context, Framebuffer, Initializable, Texture2D } from 'webgl-operate';
import { FragmentLocation } from './locations';

export class IntermediateFramebuffer extends Initializable {
    protected _context: Context;
    protected _gl: WebGL2RenderingContext;

    public depthStencil: Texture2D;
    public worldPosition: Texture2D;
    public worldNormal: Texture2D;
    public viewPosition: Texture2D;
    public viewNormal: Texture2D;
    public color: Texture2D;

    public fbo: Framebuffer;

    public constructor(context: Context) {
        super();
        this._context = context;
        this._gl = context.gl as WebGL2RenderingContext;
    }

    public initialize(): boolean {
        let valid = true;

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
