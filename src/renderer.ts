import { Camera } from './util/camera';
import { RenderPass } from './passes/renderPass';
import { isCameraPass } from './passes/cameraPass';
import { Attachment, Framebuffer } from './framebuffers/framebuffer';
import { Texture } from './util/gl/texture';
import { Formats, TextureFormat } from './util/gl/formats';
import { GeometryPass, FragmentLocation as GeomLocations } from './passes/geometry/geometryPass';
import { CanvasFramebuffer } from './framebuffers/canvasFramebuffer';
import { BlitPass } from './passes/blitPass';
import { mat4, vec2 } from 'gl-matrix';
import { ColorMode, Geometry } from './geometry/geometry';
import { createCube } from './geometry/base/cube';
import { create3dGrid } from './geometry/instance/3dGrid';
import { create2dGrid } from './geometry/instance/2dGrid';
import { createTriangle } from './geometry/base/triangle';
import { Dirty } from './util/dirty';
import { drawBuffer, drawBuffers } from './util/gl/drawBuffers';
import { FullscreenPass } from './passes/fullscreenPass/fullscreenPass';

enum TrackedMembers {
    Size,
}

export class Renderer {
    protected _gl: WebGL2RenderingContext;
    protected _canvas: HTMLCanvasElement;
    protected _resizeObserver: ResizeObserver;
    protected _size: vec2;

    protected _dirty = new Dirty<typeof TrackedMembers>();
    protected _camera: Camera;
    protected _framebuffers: Framebuffer[] = [];
    protected _lastFrame = 0;

    protected _passes: RenderPass<any>[] = [];
    protected _geometryPass: GeometryPass;

    public constructor(gl: WebGL2RenderingContext) {
        this._gl = gl;
        this._canvas = gl.canvas as HTMLCanvasElement;
    }

    public initialize() {
        if(!this._gl.getExtension('EXT_color_buffer_float')) {
            console.log('Float texture framebuffer attachments not supported!');
            return;
        }

        const canvasFbo = CanvasFramebuffer.getInstance(this._gl);
        this._framebuffers.push(canvasFbo);

        const tex = (format: TextureFormat) => {
            const tex = new Texture(this._gl);
            tex.initialize(format);
            return tex;
        }

        const intermediateFbo = new Framebuffer(this._gl);
        const c0 = this._gl.COLOR_ATTACHMENT0;
        intermediateFbo.initialize([
            { slot: c0 + GeomLocations.WorldPosition, texture: tex(Formats.RGBA16F) },
            { slot: c0 + GeomLocations.WorldNormal, texture: tex(Formats.RGBA16F) },
            { slot: c0 + GeomLocations.ViewPosition, texture: tex(Formats.RGBA16F) },
            { slot: c0 + GeomLocations.ViewNormal, texture: tex(Formats.RGBA16F) },
            { slot: c0 + GeomLocations.Color, texture: tex(Formats.RGBA) },
            { slot: this._gl.DEPTH_ATTACHMENT, texture: tex(Formats.Depth) },
        ]);
        this._framebuffers.push(intermediateFbo);

        const geomPass = new GeometryPass(this._gl);
        geomPass.initialize();
        geomPass.target = intermediateFbo;
        geomPass.preDraw = () => {
            drawBuffers(this._gl, 0b11111);
            intermediateFbo.clear(false, false);
        };
        this._passes.push(geomPass);
        this._geometryPass = geomPass;

        const blitPass = new BlitPass(this._gl);
        blitPass.initialize();
        blitPass.readTarget = intermediateFbo;
        blitPass.readBuffer = c0 + GeomLocations.Color;
        blitPass.drawTarget = canvasFbo;
        blitPass.drawBuffer = this._gl.BACK;
        this._passes.push(blitPass);

        // const fullscreenPass = new FullscreenPass(this._gl);
        // fullscreenPass.initialize();
        // fullscreenPass.target = canvasFbo;
        // fullscreenPass.preDraw = () => {
        //     drawBuffer(this._gl, this._gl.BACK);
        //     canvasFbo.clear();
        // };
        // this._passes.push(fullscreenPass);

        this._resize();
        this._watchResize();

        this._gl.enable(this._gl.DEPTH_TEST);
    }

    public prepare(): boolean {
        let shouldRun = this._dirty.any();

        if (this._dirty.get(TrackedMembers.Size)) {
            this._gl.viewport(0, 0, this._size[0], this._size[1]);
            for (const fbo of this._framebuffers) {
                fbo.size = this._size;
            }
        }
        this._dirty.reset();

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
        for (const pass of this._passes) {
            pass.draw();
        }

        this._lastFrame = time;
    }

    protected _resize() {
        const newSize = vec2.fromValues(this._canvas.clientWidth, this._canvas.clientHeight);

        this._size = newSize;
        this._camera.aspect = this._size[0] / this._size[1];
        this._dirty.set(TrackedMembers.Size);
    }

    protected _watchResize() {
        this._resizeObserver =
            new ResizeObserver(this._resize.bind(this) as ResizeObserverCallback);
        this._resizeObserver.observe(this._canvas);
    }

    public set camera(v: Camera) {
        this._camera = v;
    }

    public spawnDebugScene() {
        const cMat = mat4.create();
        mat4.scale(cMat, cMat, [0.2, 0.2, 0.2]);
        const cubes: Geometry = {
            base: createCube(this._gl),
            model: cMat,
            instance: create3dGrid(this._gl, { colors: true, step: [3, 3, 3] }),
            colorMode: ColorMode.InstanceOnly,
        };
        this.addGeometry(cubes);
    }

    public addGeometry(geometry: Geometry) {
        if(!this._geometryPass) return;
        this._geometryPass.addGeometry(geometry);
    }
}
