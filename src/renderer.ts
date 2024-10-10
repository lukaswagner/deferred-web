import { Camera, CanvasFramebuffer, Dirty, drawBuffers, TextureFormats, Framebuffer, halton2d, Texture2D, TextureFormat, AccumulatePass, BlitPass, isCameraPass, isJitterPass, RenderPass } from '@lukaswagner/webgl-toolkit';
import { GeometryPass, FragmentLocation as GeomLocations } from './passes/geometryPass';
import { mat4, vec2 } from 'gl-matrix';
import { Geometry } from './geometry/geometry';
import { DirectionalLightPass } from './passes/light/directionalLightPass';
import { BaseLightPass, FragmentLocation as LightLocations } from './passes/light/baseLightPass';
import { Scene, SceneChange } from './scene';
import { AmbientLightPass } from './passes/light/ambientLightPass';
import { LightMergePass } from './passes/light/lightMergePass';
import { PointLightPass } from './passes/light/pointLightPass';

const TrackedMembers = {
    Size: true,
    TaaEnabled: true,
    TaaFrame: true,
    TaaNumFrames: true,
    TaaHaltonBase1: true,
    TaaHaltonBase2: true,
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
    protected _sizeFactor = 1;

    protected _dirty = new Dirty(TrackedMembers);
    protected _camera: Camera;
    protected _lastFrame = 0;
    protected _scene: Scene;
    protected _updateScene = true;

    protected _framebuffers: Framebuffer[] = [];
    protected _accumulateBuffer: Framebuffer;

    protected _passes: RenderPass<any>[] = [];
    protected _geometryPass: GeometryPass;
    protected _ambientLightPass: AmbientLightPass;
    protected _directionalLightPass: DirectionalLightPass;
    protected _pointLightPass: PointLightPass;
    protected _accumulatePass: AccumulatePass;
    protected _blitPass: BlitPass;

    protected _taaEnabled = true;
    protected _taaFrame = 0;
    protected _taaNumFrames = 64;
    protected _taaHaltonBase1 = 2;
    protected _taaHaltonBase2 = 3;
    protected _taaKernel: vec2[];

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

        const ambient = this.setupSingleChannelBuffer('Ambient Light', TextureFormats.RGBA16F);
        this._ambientLightPass = new AmbientLightPass(this._gl, 'Ambient Light');
        this.setupLightPass(this._ambientLightPass, ambient.fbo);

        const directional = this.setupSingleChannelBuffer('Directional Light', TextureFormats.RGBA16F);
        this._directionalLightPass = new DirectionalLightPass(this._gl, 'Directional Light');
        this.setupLightPass(this._directionalLightPass, directional.fbo);
        this._directionalLightPass.normal = geom.normal;

        const point = this.setupSingleChannelBuffer('Point Light', TextureFormats.RGBA16F);
        this.setupPointLightPass(point.fbo, geom.position, geom.normal);

        const merge = this.setupSingleChannelBuffer('Light Merge');
        this.setupLightMergePass(merge.fbo, ambient.texture, directional.texture, point.texture, geom.color);

        const accumulate = this.setupSingleChannelBuffer('TAA');
        this._accumulateBuffer = accumulate.fbo;
        this.setupAccumulatePass(accumulate.fbo, merge.texture);

        this.setupBlitPass(
            accumulate.fbo, this._gl.COLOR_ATTACHMENT0 + LightLocations.Color,
            canvasFbo, this._gl.BACK
        );

        this._resize();
        this._watchResize();

        this._gl.enable(this._gl.DEPTH_TEST);
    }

    private setupGeometryBuffer() {
        const fbo = new Framebuffer(this._gl, 'Forward');
        const c0 = this._gl.COLOR_ATTACHMENT0;

        const color = this.createTex(TextureFormats.RGBA);
        color.minFilter = this._gl.NEAREST;
        color.magFilter = this._gl.NEAREST;

        const position = this.createTex(TextureFormats.RGBA16F);
        position.minFilter = this._gl.NEAREST;
        position.magFilter = this._gl.NEAREST;

        const normal = this.createTex(TextureFormats.RGBA16F);
        normal.minFilter = this._gl.NEAREST;
        normal.magFilter = this._gl.NEAREST;

        fbo.initialize([
            { slot: c0 + GeomLocations.Color, texture: color },
            { slot: c0 + GeomLocations.WorldPosition, texture: position },
            { slot: c0 + GeomLocations.WorldNormal, texture: normal },
            { slot: c0 + GeomLocations.ViewPosition, texture: this.createTex(TextureFormats.RGBA16F) },
            { slot: c0 + GeomLocations.ViewNormal, texture: this.createTex(TextureFormats.RGBA16F) },
            { slot: this._gl.DEPTH_ATTACHMENT, texture: this.createTex(TextureFormats.Depth) },
        ]);
        this._framebuffers.push(fbo);
        return { fbo, color, position, normal };
    }

    private setupGeometryPass(target: Framebuffer) {
        const pass = new GeometryPass(this._gl, 'Geometry Forward');
        pass.initialize();
        pass.target = target;
        pass.preDraw = () => {
            drawBuffers(this._gl, 0b11111);
            target.clear(false, false);
        };
        this._passes.push(pass);
        this._geometryPass = pass;
    }

    private setupSingleChannelBuffer(name: string, format = TextureFormats.RGBA) {
        const fbo = new Framebuffer(this._gl, name);
        const texture = this.createTex(format);
        texture.minFilter = this._gl.NEAREST;
        texture.magFilter = this._gl.NEAREST;
        const c0 = this._gl.COLOR_ATTACHMENT0;
        fbo.initialize([
            { slot: c0 + LightLocations.Color, texture },
        ]);
        this._framebuffers.push(fbo);
        return { fbo, texture };
    }

    private setupLightPass(pass: BaseLightPass, target: Framebuffer) {
        pass.initialize();
        pass.target = target;

        pass.preDraw = () => drawBuffers(this._gl, 0b1);
        this._passes.push(pass);
    }

    private setupPointLightPass(target: Framebuffer, position: Texture2D, normal: Texture2D) {
        const pass = new PointLightPass(this._gl, 'Directional Light');

        pass.initialize();
        pass.target = target;
        pass.position = position;
        pass.normal = normal;

        pass.preDraw = () => {
            drawBuffers(this._gl, 0b1);
            target.clear(false, false);
            this._gl.enable(this._gl.BLEND);
            this._gl.blendFuncSeparate(this._gl.SRC_ALPHA, this._gl.ONE, this._gl.ONE, this._gl.ONE);
        };
        pass.postDraw = () => {
            this._gl.disable(this._gl.BLEND);
            this._gl.blendFuncSeparate(this._gl.ONE, this._gl.ZERO, this._gl.ONE, this._gl.ZERO);
        };

        this._passes.push(pass);
        this._pointLightPass = pass;
    }

    private setupLightMergePass(
        target: Framebuffer,
        ambient: Texture2D, directional: Texture2D, point: Texture2D,
        color: Texture2D
    ) {
        const pass = new LightMergePass(this._gl, 'Light Merge');
        pass.initialize();
        pass.target = target;

        pass.ambient = ambient;
        pass.directional = directional;
        pass.point = point;
        pass.color = color;

        this._passes.push(pass);
    }

    private setupAccumulatePass(target: Framebuffer, input: Texture2D) {
        const pass = new AccumulatePass(this._gl, 'TAA Accumulate');
        pass.initialize();
        pass.target = target;

        input.minFilter = this._gl.NEAREST;
        input.magFilter = this._gl.NEAREST;
        pass.input = input;

        pass.preDraw = () => {
            this._gl.enable(this._gl.BLEND);
            this._gl.blendFunc(this._gl.SRC_ALPHA, this._gl.ONE_MINUS_SRC_ALPHA);
        };
        pass.postDraw = () => {
            this._gl.disable(this._gl.BLEND);
        };

        this._passes.push(pass);
        this._accumulatePass = pass;
    }

    private setupBlitPass(srcFbo: Framebuffer, srcBuffer: GLenum, dstFbo: Framebuffer, dstBuffer: GLenum) {
        const pass = new BlitPass(this._gl);
        pass.readTarget = srcFbo;
        pass.readBuffer = srcBuffer;
        pass.drawTarget = dstFbo;
        pass.drawBuffer = dstBuffer;
        this._passes.push(pass);
        this._blitPass = pass;
    }

    protected createTex(format: TextureFormat) {
        const tex = new Texture2D(this._gl);
        tex.initialize(format);
        return tex;
    }

    public prepare(time: number): boolean {
        let shouldRun = this._dirty.any();

        let sceneChange = SceneChange.None;
        if(this._updateScene) {
            sceneChange = this._scene.update(time);
            if(sceneChange !== SceneChange.None) shouldRun = true;
            this._applyScene(sceneChange);
        }

        if (this._dirty.get('Size')) {
            this._gl.viewport(0, 0, this._size[0], this._size[1]);
            for (const fbo of this._framebuffers) {
                fbo.size = this._size;
            }
        }

        const cameraChanged = this._camera.timestamp > this._lastFrame;
        if (this._taaEnabled) {
            const taaSettingsChanged =
                this._dirty.get('TaaEnabled') ||
                this._dirty.get('TaaNumFrames') ||
                this._dirty.get('TaaHaltonBase1') ||
                this._dirty.get('TaaHaltonBase2');
            if(taaSettingsChanged) {
                this._taaKernel = halton2d(
                    this._taaHaltonBase1,
                    this._taaHaltonBase2,
                    this._taaNumFrames);
            }

            if(taaSettingsChanged || cameraChanged || sceneChange !== SceneChange.None)
            {
                this._taaFrame = 0;
                this._dirty.set('TaaFrame');
                this._accumulateBuffer.clear();
            }

            if(this._dirty.get('TaaFrame')) {
                let ndcOffset = this._taaFrame === 0 ?
                    vec2.create() :
                    vec2.clone(this._taaKernel[this._taaFrame - 1]);

                // loop around at 0.5 to -0.5
                if(ndcOffset[0] > 0.5) ndcOffset[0] -= 1;
                if(ndcOffset[1] > 0.5) ndcOffset[1] -= 1;

                for (const pass of this._passes) {
                    if (isJitterPass(pass)) {
                        pass.ndcOffset = ndcOffset;
                    }
                }

                this._accumulatePass.frame = this._taaFrame;
            }
        }

        if (cameraChanged) {
            const view = this._camera.view;
            const projection = this._camera.projection;
            const viewProjection = mat4.mul(mat4.create(), projection, view);
            const viewInverse = mat4.invert(mat4.create(), view);
            const projectionInverse = mat4.invert(mat4.create(), projection);
            const viewProjectionInverse = mat4.invert(mat4.create(), viewProjection);
            for (const pass of this._passes) {
                if (isCameraPass(pass)) {
                    pass.view = view;
                    pass.projection = projection;
                    pass.viewProjection = viewProjection;
                    pass.viewInverse = viewInverse;
                    pass.projectionInverse = projectionInverse;
                    pass.viewProjectionInverse = viewProjectionInverse;
                }
            }
            shouldRun = true;
        }

        for (const pass of this._passes) {
            if (pass.prepare()) shouldRun = true;
        }

        this._dirty.reset();
        return shouldRun;
    }

    public draw(time: number) {
        for (const pass of this._passes) {
            pass.draw();
        }

        this._lastFrame = time;
        if(this._taaEnabled) {
            this._taaFrame++;
            if(this._taaFrame < this._taaNumFrames)
                this._dirty.set('TaaFrame');
        }
    }

    protected _resize() {
        const newSize = vec2.fromValues(
            Math.floor(this._canvas.clientWidth * window.devicePixelRatio * this._sizeFactor),
            Math.floor(this._canvas.clientHeight * window.devicePixelRatio * this._sizeFactor)
        );

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

    public set scene(v: Scene) {
        this._scene = v;
        this._applyScene(SceneChange.Full);
    }

    public set updateScene(v: boolean) {
        this._updateScene = v;
    }

    protected _applyScene(sceneChange: number) {
        if(sceneChange & SceneChange.Geometry) {
            this._geometryPass.clear();
            this._scene.geometry?.forEach((g) => this._geometryPass.addGeometry(g));
        }

        if(sceneChange & SceneChange.Ambient) {
            this._ambientLightPass.data = this._scene.light.ambient ?? [];
        }

        if(sceneChange & SceneChange.Directional) {
            this._directionalLightPass.data = this._scene.light.directional ?? [];
        }

        if(sceneChange & SceneChange.Point) {
            this._pointLightPass.data = this._scene.light.point ?? [];
        }
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

    public set debugView(v: DebugView) {
        this._blitPass.readTarget = v.target;
        this._blitPass.readBuffer = v.buffer;
    }

    public set sizeFactor(v: number) {
        this._sizeFactor = v;
        this._resize();
    }

    public set taaEnabled(v: boolean) {
        this._taaEnabled = v;
        this._dirty.set('TaaEnabled');
    }

    public set taaNumFrames(v: number) {
        this._taaNumFrames = v;
        this._dirty.set('TaaNumFrames');
    }

    public set taaHaltonSequence(v: [number, number]) {
        this._taaHaltonBase1 = v[0];
        this._dirty.set('TaaHaltonBase1');
        this._taaHaltonBase2 = v[1];
        this._dirty.set('TaaHaltonBase2');
    }

    public get taaFrame() {
        return this._taaFrame;
    }
}
