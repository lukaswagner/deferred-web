import { Framebuffer } from './framebuffer';
import { GL } from '../util/gl/gl';
import { vec2 } from 'gl-matrix';

export class CanvasFramebuffer extends Framebuffer {
    protected static _instance: CanvasFramebuffer;
    protected _canvas: HTMLCanvasElement | OffscreenCanvas;

    protected constructor(gl: GL) {
        super(gl);
    }

    public static getInstance(gl: GL) {
        if (!CanvasFramebuffer._instance)
            CanvasFramebuffer._instance = new CanvasFramebuffer(gl);
        CanvasFramebuffer._instance._handle = null;
        CanvasFramebuffer._instance._canvas = gl.canvas;
        return CanvasFramebuffer._instance;
    }

    public override initialize(): void { }

    public override clear(): void {
        this.bind();
        this._gl.clear(
            this._gl.COLOR_BUFFER_BIT |
            this._gl.DEPTH_BUFFER_BIT |
            this._gl.STENCIL_BUFFER_BIT);
    }

    public override swap(): void { }

    public override set size(v: vec2) {
        this._size = v;
        this._canvas.width = this._size[0];
        this._canvas.height = this._size[1];
    }
}
