import { Camera } from './util/camera';
import { RenderPass } from './passes/renderPass';
import { isCameraPass } from './passes/cameraPass';
import { Framebuffer } from './framebuffers/framebuffer';
import { Texture } from './util/gl/texture';
import { Formats, TextureFormat } from './util/gl/formats';
import { GeometryPass, FragmentLocation as GeomLocations } from './passes/geometry';
import { CanvasFramebuffer } from './framebuffers/canvasFramebuffer';
import { BlitPass } from './passes/blitPass';
import { mat4, vec2 } from 'gl-matrix';
import { ColorMode, Geometry } from './geometry/geometry';
import { createCube } from './geometry/base/cube';
import { create3dGrid } from './geometry/instance/3dGrid';
import { Dirty } from './util/dirty';
import { drawBuffers } from './util/gl/drawBuffers';
import { DirectionalLightPass, FragmentLocation as DirLightLocations } from './passes/light/directional';

interface TrackedMembers {
    Size: any,
}

type DebugView = {
    name: string,
    target: Framebuffer,
    buffer: number,
}

export class Renderer {
    protected _gl: WebGL2RenderingContext;
    protected _canvas: HTMLCanvasElement;
    protected _resizeObserver: ResizeObserver;
    protected _size: vec2;

    protected _dirty = new Dirty<TrackedMembers>();
    protected _camera: Camera;
    protected _framebuffers: Framebuffer[] = [];
    protected _lastFrame = 0;

    protected _passes: RenderPass<any>[] = [];
    protected _geometryPass: GeometryPass;
    protected _blitPass: BlitPass;

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

        const geom = this.setupGeometryBuffer();
        this.setupGeometryPass(geom.fbo);
        const lightFbo = this.setupLightBuffer();
        this.setupDirLightPass(lightFbo, geom.color, geom.position, geom.normal);
        this.setupBlitPass(
            lightFbo, this._gl.COLOR_ATTACHMENT0 + DirLightLocations.Color,
            canvasFbo, this._gl.BACK
        );

        this._resize();
        this._watchResize();

        this._gl.enable(this._gl.DEPTH_TEST);
    }

    private setupGeometryBuffer() {
        const fbo = new Framebuffer(this._gl, "Forward");
        const c0 = this._gl.COLOR_ATTACHMENT0;
        const color = this.createTex(Formats.RGBA);
        const position = this.createTex(Formats.RGBA16F);
        const normal = this.createTex(Formats.RGBA16F);
        fbo.initialize([
            { slot: c0 + GeomLocations.Color, texture: color },
            { slot: c0 + GeomLocations.WorldPosition, texture: position },
            { slot: c0 + GeomLocations.WorldNormal, texture: normal },
            { slot: c0 + GeomLocations.ViewPosition, texture: this.createTex(Formats.RGBA16F) },
            { slot: c0 + GeomLocations.ViewNormal, texture: this.createTex(Formats.RGBA16F) },
            { slot: this._gl.DEPTH_ATTACHMENT, texture: this.createTex(Formats.Depth) },
        ]);
        this._framebuffers.push(fbo);
        return { fbo, color, position, normal };
    }

    private setupGeometryPass(target: Framebuffer) {
        const geomPass = new GeometryPass(this._gl, "Geometry Forward");
        geomPass.initialize();
        geomPass.target = target;
        geomPass.preDraw = () => {
            drawBuffers(this._gl, 0b11111);
            target.clear(false, false);
        };
        this._passes.push(geomPass);
        this._geometryPass = geomPass;
    }

    private setupLightBuffer() {
        const lightFbo = new Framebuffer(this._gl, "Shading");
        const c0 = this._gl.COLOR_ATTACHMENT0;
        lightFbo.initialize([
            { slot: c0 + DirLightLocations.Color, texture: this.createTex(Formats.RGBA) },
        ]);
        this._framebuffers.push(lightFbo);
        return lightFbo;
    }

    private setupDirLightPass(target: Framebuffer, color: Texture, position: Texture, normal: Texture) {
        const dirLightPass = new DirectionalLightPass(this._gl, "Directional Light");
        dirLightPass.initialize({ count: 1 });
        dirLightPass.data = {
            dir: [[-2, -5, -1]],
            color: [[1, 1, 1]],
        };
        dirLightPass.target = target;

        color.minFilter = this._gl.NEAREST;
        color.magFilter = this._gl.NEAREST;
        dirLightPass.color = color;
        position.minFilter = this._gl.NEAREST;
        position.magFilter = this._gl.NEAREST;
        dirLightPass.position = position;
        normal.minFilter = this._gl.NEAREST;
        normal.magFilter = this._gl.NEAREST;
        dirLightPass.normal = normal;

        dirLightPass.preDraw = () => drawBuffers(this._gl, 0b1);
        this._passes.push(dirLightPass);
    }

    private setupBlitPass(srcFbo: Framebuffer, srcBuffer: GLenum, dstFbo: Framebuffer, dstBuffer: GLenum) {
        const blitPass = new BlitPass(this._gl);
        blitPass.readTarget = srcFbo;
        blitPass.readBuffer = srcBuffer;
        blitPass.drawTarget = dstFbo;
        blitPass.drawBuffer = dstBuffer;
        this._passes.push(blitPass);
        this._blitPass = blitPass;
    }

    protected createTex(format: TextureFormat) {
        const tex = new Texture(this._gl);
        tex.initialize(format);
        return tex;
    }

    public prepare(): boolean {
        let shouldRun = this._dirty.any();

        if (this._dirty.get('Size')) {
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
        this._dirty.set('Size');
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

    public getDebugViews() {
        const views = new Array<DebugView>();
        views.push({
            name: 'Default',
            target: this._blitPass.readTarget,
            buffer: this._blitPass.readBuffer,
        })

        this._framebuffers
            .filter((f) => !(f instanceof CanvasFramebuffer))
            .forEach((f, fi) => {
                f.attachments
                    .filter((a) =>
                        a.slot >= this._gl.COLOR_ATTACHMENT0 &&
                        a.slot <= this._gl.COLOR_ATTACHMENT15)
                    .sort((a, b) => a.slot - b.slot)
                    .forEach((a) => {
                        views.push({
                            name: `[${fi}] ${f.name}: ${a.slot - this._gl.COLOR_ATTACHMENT0}`,
                            target: f,
                            buffer: a.slot,
                        });
                })
            });

        return views;
    }

    public setDebugView(debugView: DebugView) {
        this._blitPass.readTarget = debugView.target;
        this._blitPass.readBuffer = debugView.buffer;
    }
}
