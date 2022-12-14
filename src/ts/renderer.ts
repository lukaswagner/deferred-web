import {
    Camera,
    ChangeLookup,
    Context,
    DefaultFramebuffer,
    EventHandler,
    EventProvider,
    Framebuffer,
    Invalidate,
    Navigation,
    Renderer,
    Texture2D,
    mat4,
    vec3,
} from 'webgl-operate';
import { ColorMode, Geometry } from './geometry/geometry';
import { createIndexedTriangle, createTriangle } from './geometry/base/triangle';
import { drawBuffer, drawBuffers } from './util/drawBuffer';
import { DirectionalLightPass } from './passes/directionalLightPass';
import { FragmentLocation } from './buffers/locations';
import { GeometryPass } from './passes/geometryPass';
import { IntermediateFramebuffer } from './buffers/intermediateFramebuffer';
import { LightPass } from './passes/lightPass';
import { create2dGrid } from './geometry/instance/2dGrid';
import { create3dGrid } from './geometry/instance/3dGrid';
import { createCube } from './geometry/base/cube';

interface LightData {
    tex: Texture2D;
    fbo: Framebuffer;
    pass: LightPass;
}

export class DeferredRenderer extends Renderer {
    protected readonly _additionalAltered = Object.assign(new ChangeLookup(), {
        any: false,
        output: false,
    });


    protected _gl: WebGL2RenderingContext;

    protected _iFBO: IntermediateFramebuffer;
    protected _dFBO: DefaultFramebuffer;

    protected _geometryPass: GeometryPass;

    protected _lights: LightData[] = [];

    protected _camera: Camera;
    protected _navigation: Navigation;
    protected _eventHandler: EventHandler;
    protected _scale = 0.25;

    protected _geometries: Geometry[];

    protected _output: FragmentLocation;

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

        this._lights.push(this.setupLightPass(DirectionalLightPass));

        this._camera = new Camera();
        this._camera.center = vec3.fromValues(0, 0, 0);
        this._camera.up = vec3.fromValues(0, 1, 0);
        this._camera.eye = vec3.fromValues(0, 0, 1);
        this._camera.fovy = 65;
        this._camera.near = 0.125;
        this._camera.far = 32.0;
        this.updateCameraFromScale();

        this._navigation = new Navigation(invalidate, eventProvider);
        this._navigation.camera = this._camera;
        // @ts-expect-error: webgl-operate mouse wheel zoom is broken
        this._navigation._wheelZoom = { process: () => { } };

        this._eventHandler = new EventHandler(invalidate, eventProvider);
        this._eventHandler.pushMouseWheelHandler((ev) => this.mouseWheel(ev as WheelEvent[]));

        this._geometries = [];

        this._gl.enable(this._gl.CULL_FACE);
        this._gl.enable(this._gl.DEPTH_TEST);

        return valid;
    }

    protected onUninitialize(): void {
    }

    protected onDiscarded(): void {
    }

    protected onUpdate(): boolean {
        this._navigation.update();
        this._eventHandler.update();

        return this._altered.any ||
            this._additionalAltered.any ||
            this._camera.altered ||
            this._geometryPass.altered ||
            this._lights.some((l) => l.pass.altered);
    }

    protected onPrepare(): void {
        if (this._altered.frameSize) {
            this._iFBO.resize(...this._frameSize);
            this._lights.forEach((l) => l.fbo.resize(...this._frameSize));
            this._camera.viewport = [this._frameSize[0], this._frameSize[1]];
        }

        if (this._altered.canvasSize)
            this._camera.aspect = this._canvasSize[0] / this._canvasSize[1];

        if (this._camera.altered)
            this._geometryPass.viewProjection = this._camera.viewProjection;

        if (this._geometryPass.altered)
            this._geometryPass.prepare();

        this._lights.forEach((l) => {
            if (l.pass.altered) l.pass.prepare();
        });

        this._altered.reset();
        this._camera.altered = false;
        this._geometryPass.altered = false;
        this._lights.forEach((l) => l.pass.altered = false);
    }

    protected onFrame(): void {
        this._gl.viewport(0, 0, this._frameSize[0], this._frameSize[1]);

        this._iFBO.fbo.bind();
        drawBuffers(this._gl, 0b11111);

        const black = [0, 0, 0, 0];
        for (let i = 0; i < this._iFBO.fbo.drawBuffers.length; i++)
            this._gl.clearBufferfv(this._gl.COLOR, i, black);
        this._gl.clearBufferfi(this._gl.DEPTH_STENCIL, 0, 1, 0);

        this._geometries.forEach((g) =>
            this._geometryPass.draw(g));

        this._iFBO.fbo.unbind();

        this._lights.forEach((l) => {
            l.fbo.bind();
            l.pass.draw();
            l.fbo.unbind();
        });
    }

    protected onSwap(): void {
        // this._gl.bindFramebuffer(this._gl.READ_FRAMEBUFFER, this._iFBO.fbo.object);
        this._gl.bindFramebuffer(this._gl.READ_FRAMEBUFFER, this._lights[0].fbo.object);
        this._gl.bindFramebuffer(this._gl.DRAW_FRAMEBUFFER, null);
        // this._gl.readBuffer(this._gl.COLOR_ATTACHMENT0 + this._output);
        this._gl.readBuffer(this._gl.COLOR_ATTACHMENT0);
        drawBuffer(this._gl, this._gl.BACK);
        this._gl.blitFramebuffer(
            0, 0, this._frameSize[0], this._frameSize[1],
            0, 0, this._frameSize[0], this._frameSize[1],
            this._gl.COLOR_BUFFER_BIT, this._gl.NEAREST);
        this._gl.bindFramebuffer(this._gl.READ_FRAMEBUFFER, null);
    }

    protected mouseWheel(events: WheelEvent[]) {
        const event = events[events.length - 1];
        const delta = event.deltaY;

        const base = 1.15;
        const inv = 1 / base;
        const factor = delta > 0 ? inv : base;
        this._scale = Math.max(this._scale * factor, 0.01);

        this.updateCameraFromScale();
    }

    protected updateCameraFromScale() {
        const temp = vec3.create();
        vec3.normalize(temp, this._camera.eye);
        vec3.scale(temp, temp, 1 / this._scale);
        this._camera.eye = temp;
    }

    public spawnDebugScene() {
        const triangle: Geometry = {
            base: createTriangle(this._context),
            model: mat4.fromTranslation(mat4.create(), [-1, 0, 0]),
        };
        this._geometries.push(triangle);

        const triangleIndexed: Geometry = {
            base: createIndexedTriangle(this._context),
            model: mat4.create(),
        };
        this._geometries.push(triangleIndexed);

        const tiMat = mat4.create();
        mat4.translate(tiMat, tiMat, [-1, -1, 0]);
        mat4.scale(tiMat, tiMat, [0.2, 0.2, 0.2]);
        const triangleInstanced: Geometry = {
            base: createTriangle(this._context),
            model: tiMat,
            instance: create2dGrid(this._context, { colors: true, center: [2, 2] }),
            colorMode: ColorMode.InstanceOnly,
        };
        this._geometries.push(triangleInstanced);

        const tiiMat = mat4.create();
        mat4.translate(tiiMat, tiiMat, [0, -1, 0]);
        mat4.scale(tiiMat, tiiMat, [0.2, 0.2, 0.2]);
        const triangleIndexedInstanced: Geometry = {
            base: createIndexedTriangle(this._context),
            model: tiiMat,
            instance: create2dGrid(this._context, { colors: true, center: [2, 2] }),
            colorMode: ColorMode.InstanceOnly,
        };
        this._geometries.push(triangleIndexedInstanced);

        const cMat = mat4.create();
        mat4.translate(cMat, cMat, [0.7, 0.7, -0.9]);
        mat4.scale(cMat, cMat, [0.1, 0.1, 0.1]);
        const cubes: Geometry = {
            base: createCube(this._context),
            model: cMat,
            instance: create3dGrid(this._context, { colors: true, step: [3, 3, 3] }),
            colorMode: ColorMode.InstanceOnly,
        };
        this._geometries.push(cubes);
    }

    protected setupLightPass<T extends LightPass>(ctor: new (context: Context) => T): LightData {
        const tex = new Texture2D(this._context);
        tex.initialize(1, 1, this._gl.RGBA, this._gl.RGBA, this._gl.UNSIGNED_BYTE);

        const fbo = new Framebuffer(this._context);
        fbo.initialize([[this._gl.COLOR_ATTACHMENT0, tex]]);

        const pass = new ctor(this._context);
        pass.initialize();
        pass.textures = this._iFBO;

        return { tex, fbo, pass };
    }

    public set output(value: FragmentLocation) {
        this._output = value;
        this._additionalAltered.alter('output');
        this._invalidate(false);
    }
}
