import {
    Camera,
    Context,
    DefaultFramebuffer,
    EventProvider,
    Invalidate,
    Navigation,
    Renderer,
    vec3,
} from 'webgl-operate';
import { FragmentLocation } from './buffers/locations';
import { Geometry } from './geometry/geometry';
import { GeometryPass } from './passes/geometryPass';
import { IntermediateFramebuffer } from './buffers/intermediateFramebuffer';
import { createTriangle } from './geometry/triangle';
import { drawBuffer } from './util/drawBuffer';

export class DeferredRenderer extends Renderer {
    protected _gl: WebGL2RenderingContext;

    protected _iFBO: IntermediateFramebuffer;
    protected _dFBO: DefaultFramebuffer;

    protected _geometryPass: GeometryPass;

    protected _camera: Camera;
    protected _navigation: Navigation;

    protected _geometries: Geometry[];

    protected onInitialize(
        context: Context, invalidate: Invalidate, eventProvider: EventProvider,
    ): boolean {
        this._gl = context.gl as WebGL2RenderingContext;

        let valid = true;

        this._iFBO = new IntermediateFramebuffer(context);
        valid &&= this._iFBO.initialize();

        this._dFBO = new DefaultFramebuffer(context);
        valid &&= this._dFBO.initialize();

        this._geometryPass = new GeometryPass(context);
        valid &&= this._geometryPass.initialize();
        this._geometryPass.target = this._iFBO.fbo;

        this._camera = new Camera();
        this._camera.center = vec3.fromValues(0, 0, 0);
        this._camera.up = vec3.fromValues(0, 1, 0);
        this._camera.eye = vec3.fromValues(0, 0, 5);
        this._camera.near = 0.125;
        this._camera.far = 32.0;

        this._navigation = new Navigation(invalidate, eventProvider);
        this._navigation.camera = this._camera;
        // // @ts-expect-error: webgl-operate mouse wheel zoom is broken
        // this._navigation._wheelZoom = { process: () => { } };

        this._geometries = [];
        this._geometries.push({ base: createTriangle(context) });

        return valid;
    }

    protected onUninitialize(): void {
    }

    protected onDiscarded(): void {
    }

    protected onUpdate(): boolean {
        return this._altered.any ||
            this._camera.altered ||
            this._geometryPass.altered;
    }

    protected onPrepare(): void {
        if (this._altered.frameSize) {
            this._iFBO.resize(...this._frameSize);
            this._camera.viewport = [this._frameSize[0], this._frameSize[1]];
        }

        if (this._altered.canvasSize)
            this._camera.aspect = this._canvasSize[0] / this._canvasSize[1];

        if (this._geometryPass.altered)
            this._geometryPass.prepare();

        this._altered.reset();
        this._camera.altered = false;
        this._geometryPass.altered = false;
    }

    protected onFrame(): void {
        this._geometries.forEach((g) =>
            this._geometryPass.draw(g));
    }

    protected onSwap(): void {
        this._gl.bindFramebuffer(this._gl.READ_FRAMEBUFFER, this._iFBO.fbo.object);
        this._gl.bindFramebuffer(this._gl.DRAW_FRAMEBUFFER, null);
        this._gl.readBuffer(this._gl.COLOR_ATTACHMENT0 + FragmentLocation.Color);
        drawBuffer(this._gl, this._gl.BACK);
        this._gl.blitFramebuffer(
            0, 0, this._frameSize[0], this._frameSize[1],
            0, 0, this._frameSize[0], this._frameSize[1],
            this._gl.COLOR_BUFFER_BIT, this._gl.NEAREST);
        this._gl.bindFramebuffer(this._gl.READ_FRAMEBUFFER, null);
    }
}
