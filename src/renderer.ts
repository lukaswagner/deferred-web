import { Camera, CanvasFramebuffer, Dirty, drawBuffers, TextureFormats, Framebuffer, halton2d, Texture2D, TextureFormat, AccumulatePass, BlitPass, isCameraPass, isJitterPass, RenderPass, TaaRenderer } from '@lukaswagner/webgl-toolkit';
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

export class Renderer extends TaaRenderer<typeof TrackedMembers> {
    protected _scene: Scene;
    protected _updateScene = true;

    protected _accumulateBuffer: Framebuffer;

    protected _geometryPass: GeometryPass;
    protected _ambientLightPass: AmbientLightPass;
    protected _directionalLightPass: DirectionalLightPass;
    protected _pointLightPass: PointLightPass;
    protected _accumulatePass: AccumulatePass;
    protected _blitPass: BlitPass;

    public constructor(gl: WebGL2RenderingContext) {
        super(gl, TrackedMembers);
    }

    public initialize() {
        if(!this._gl.getExtension('EXT_color_buffer_float')) {
            console.log('Float texture framebuffer attachments not supported!');
            return;
        }

        const canvasFbo = CanvasFramebuffer.getInstance(this._gl);
        this._framebuffers.push(canvasFbo);

        const geom = this._setupGeometryBuffer();
        this._setupGeometryPass(geom.fbo);

        const ambient = this._setupSingleTexBuffer('Ambient Light', TextureFormats.RGBA16F);
        this._ambientLightPass = new AmbientLightPass(this._gl, 'Ambient Light');
        this._setupLightPass(this._ambientLightPass, ambient.fbo);

        const directional = this._setupSingleTexBuffer('Directional Light', TextureFormats.RGBA16F);
        this._directionalLightPass = new DirectionalLightPass(this._gl, 'Directional Light');
        this._setupLightPass(this._directionalLightPass, directional.fbo);
        this._directionalLightPass.normal = geom.normal;

        const point = this._setupSingleTexBuffer('Point Light', TextureFormats.RGBA16F);
        this._setupPointLightPass(point.fbo, geom.position, geom.normal);

        const merge = this._setupSingleTexBuffer('Light Merge');
        this._setupLightMergePass(merge.fbo, ambient.texture, directional.texture, point.texture, geom.color);

        const taa = this._setupTaa(merge.texture);
        this._accumulateBuffer = taa.buffer.fbo;
        this._accumulatePass = taa.pass;
        this._passes.push(this._accumulatePass);

        this._blitPass = this._setupBlitPass(
            this._accumulateBuffer, this._gl.COLOR_ATTACHMENT0 + LightLocations.Color,
            canvasFbo, this._gl.BACK
        );
        this._passes.push(this._blitPass);

        super.initialize();
        this._gl.enable(this._gl.DEPTH_TEST);
    }

    private _setupGeometryBuffer() {
        const fbo = new Framebuffer(this._gl, 'Forward');
        const c0 = this._gl.COLOR_ATTACHMENT0;

        const color = this._createTex(TextureFormats.RGBA);
        color.minFilter = this._gl.NEAREST;
        color.magFilter = this._gl.NEAREST;

        const position = this._createTex(TextureFormats.RGBA16F);
        position.minFilter = this._gl.NEAREST;
        position.magFilter = this._gl.NEAREST;

        const normal = this._createTex(TextureFormats.RGBA16F);
        normal.minFilter = this._gl.NEAREST;
        normal.magFilter = this._gl.NEAREST;

        fbo.initialize([
            { slot: c0 + GeomLocations.Color, texture: color },
            { slot: c0 + GeomLocations.WorldPosition, texture: position },
            { slot: c0 + GeomLocations.WorldNormal, texture: normal },
            { slot: c0 + GeomLocations.ViewPosition, texture: this._createTex(TextureFormats.RGBA16F) },
            { slot: c0 + GeomLocations.ViewNormal, texture: this._createTex(TextureFormats.RGBA16F) },
            { slot: this._gl.DEPTH_ATTACHMENT, texture: this._createTex(TextureFormats.Depth) },
        ]);
        this._framebuffers.push(fbo);
        return { fbo, color, position, normal };
    }

    private _setupGeometryPass(target: Framebuffer) {
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

    private _setupLightPass(pass: BaseLightPass, target: Framebuffer) {
        pass.initialize();
        pass.target = target;

        pass.preDraw = () => drawBuffers(this._gl, 0b1);
        this._passes.push(pass);
    }

    private _setupPointLightPass(target: Framebuffer, position: Texture2D, normal: Texture2D) {
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

    private _setupLightMergePass(
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

    public prepare(time: number): boolean {
        let sceneChanged = false;
        if(this._updateScene) {
            const sceneChange = this._scene.update(time);
            if(sceneChange !== SceneChange.None) sceneChanged = true;
            this._applyScene(sceneChange);
        }

        this._prepareTaa(sceneChanged, this._accumulateBuffer, this._accumulatePass);

        return super.prepare(time) || sceneChanged;
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
}
