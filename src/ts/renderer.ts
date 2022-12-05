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
import { GeometryPass } from './passes/geometryPass';
import { IntermediateFramebuffer } from './storage/intermediateFramebuffer';

export class DeferredRenderer extends Renderer {
    protected _gl: WebGL2RenderingContext;

    protected _iFBO: IntermediateFramebuffer;
    protected _dFBO: DefaultFramebuffer;

    protected _geometryPass: GeometryPass;

    protected _camera: Camera;
    protected _navigation: Navigation;

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

        return valid;
    }

    protected onUninitialize(): void {
    }

    protected onDiscarded(): void {
    }

    protected onUpdate(): boolean {
        return this._altered.any;
    }

    protected onPrepare(): void {
        if (this._altered.frameSize) {
            this._iFBO.resize(...this._frameSize);
        }
    }

    protected onFrame(): void {
    }
}
