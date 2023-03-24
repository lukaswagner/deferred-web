import { Camera } from './util/camera';
import { RenderPass } from './passes/renderPass';
import { isCameraPass } from './passes/cameraPass';

export class Renderer {
    protected _gl: WebGL2RenderingContext;
    protected _camera: Camera;
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    protected _passes: RenderPass<any>[] = [];
    protected _lastFrame = 0;

    public constructor(gl: WebGL2RenderingContext) {
        this._gl = gl;
    }

    public initialize() {
        this._gl.clearColor(1, 1, 1, 1);
    }

    public prepare(): boolean {
        let shouldRun = false;

        if (this._camera.timestamp > this._lastFrame) {
            const view = this._camera.view;
            const projection = this._camera.projection;
            for (const pass of this._passes) {
                if (isCameraPass(pass)) {
                    pass.view = view;
                    pass.projection = projection;
                }
            }
            shouldRun = true;
        }

        for (const pass of this._passes) {
            if (pass.prepare()) shouldRun = true;
        }

        return shouldRun;
    }

    public draw(time: number) {
        this._gl.viewport(0, 0, this._gl.canvas.width, this._gl.canvas.height);
        this._gl.clear(
            this._gl.COLOR_BUFFER_BIT |
            this._gl.DEPTH_BUFFER_BIT |
            this._gl.STENCIL_BUFFER_BIT);

        for (const pass of this._passes) {
            pass.draw();
        }

        this._lastFrame = time;
    }

    public set camera(v: Camera) {
        this._camera = v;
    }
}
