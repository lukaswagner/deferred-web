import { Camera } from './util/camera';
import { Renderer } from './renderer';
import { Navigation } from './util/navigation';
import { NumberInput, ProgressOutput, TextOutput, UI } from '@lukaswagner/web-ui';
import { createDebugScene } from './scene';

class App {
    protected _canvas: HTMLCanvasElement;
    protected _renderer: Renderer;
    protected _camera: Camera;
    protected _ui: UI;

    protected _isDrawingOutput: TextOutput;
    protected _taaFrameOutput: ProgressOutput;
    protected _taaFramesInput: NumberInput;

    constructor(canvasId: string, uiId: string, containerId?: string) {
        this._canvas = document.getElementById(canvasId) as HTMLCanvasElement;
        const contextAttributes: WebGLContextAttributes = { antialias: false, alpha: false };
        const gl = this._canvas.getContext('webgl2', contextAttributes);
        if (!gl) throw new Error('Could not acquire WebGL context');

        this._camera = new Camera();
        this._camera.eye = [1, 1, 2];
        new Navigation(this._canvas, this._camera);

        this._renderer = new Renderer(gl);
        this._renderer.camera = this._camera;
        this._renderer.initialize();

        const scene = createDebugScene(gl);
        this._renderer.scene = scene;

        this.setupUI(uiId);
        this.setupFullscreen(containerId ?? canvasId);

        requestAnimationFrame((t) => this.draw(t));
    }

    protected setupUI(uiId: string) {
        const element = document.getElementById(uiId) as HTMLCanvasElement;
        this._ui = new UI(element, true);

        this._ui.input.checkbox({
            label: 'update scene',
            value: true,
            handler: (v) => this._renderer.updateScene = v
        })

        this._ui.input.number({
            label: 'resolution scale (1 / 2^x)',
            value: 0,
            handler: (v) => this._renderer.sizeFactor = 1 / 2**v
        });

        this._ui.input.numberRange({
            label: 'fov',
            min: 5,
            max: 135,
            step: 1,
            value: this._camera.fovY,
            handler: (v) => this._camera.fovY = v,
            triggerHandlerOnMove: true
        });

        this._ui.input.numberRange({
            label: 'near (2^x)',
            min: -5,
            max: 0,
            step: 1,
            value: Math.log2(this._camera.near),
            handler: (v) => this._camera.near = 2**v,
            triggerHandlerOnMove: true
        });

        this._ui.input.numberRange({
            label: 'far (2^x)',
            min: 1,
            max: 10,
            step: 1,
            value: Math.log2(this._camera.far),
            handler: (v) => this._camera.far = 2**v,
            triggerHandlerOnMove: true
        });

        const debugViews = this._renderer.getDebugViews();
        this._ui.input.select({
            label: 'output',
            optionValues: debugViews.map((d) => d.name),
            handler: (v) => this._renderer.debugView = debugViews[v.index],
            handleOnInit: false,
        });

        this._isDrawingOutput = this._ui.output.text({
            label: 'drawing',
            id: 'isDrawing'
        });

        this._ui.input.checkbox({
            label: 'taa enabled',
            value: true,
            handler: (v) => this._renderer.taaEnabled = v
        });

        this._taaFramesInput = this._ui.input.number({
            label: 'taa frames',
            value: 64,
            handler: (v) => this._renderer.taaNumFrames = v
        });

        this._ui.input.array({
            label: 'taa halton sequence',
            length: 2,
            value: [2, 3],
            handler: (v) => this._renderer.taaHaltonSequence = v as [number, number]
        });

        this._taaFrameOutput = this._ui.output.progress({
            label: 'taa progress',
        });
    }

    protected setupFullscreen(id: string) {
        const element = document.getElementById(id);
        element.ondblclick = () => {
            if(document.fullscreenElement === element)
                document.exitFullscreen();
            else
                element.requestFullscreen();
        }
    }

    protected draw(time: number) {
        const shouldDraw = this._renderer.prepare(time);
        if (shouldDraw) this._renderer.draw(time);
        this._isDrawingOutput.value = shouldDraw ? 'true' : 'false';
        this._taaFrameOutput.value = this._renderer.taaFrame / this._taaFramesInput.value;
        requestAnimationFrame((t) => this.draw(t));
    }
}

new App('canvas', 'ui');
