import { Camera } from './util/camera';
import { Renderer } from './renderer';
import { Navigation } from './util/navigation';
import { UI } from '@lukaswagner/web-ui';
import { createDebugScene } from './scene';

class App {
    protected _canvas: HTMLCanvasElement;
    protected _renderer: Renderer;
    protected _camera: Camera;

    constructor(canvasId: string, uiId: string, containerId?: string) {
        this._canvas = document.getElementById(canvasId) as HTMLCanvasElement;
        const contextAttributes: WebGLContextAttributes = { antialias: false, alpha: false };
        const gl = this._canvas.getContext('webgl2', contextAttributes);
        if (!gl) throw new Error('Could not acquire WebGL context');

        this._camera = new Camera();
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
        const ui = new UI(element, true);

        ui.input.numberRange({
            label: 'fov',
            min: 5,
            max: 135,
            step: 1,
            value: this._camera.fovY,
            handler: (v) => this._camera.fovY = v,
            triggerHandlerOnMove: true
        });

        ui.input.numberRange({
            label: 'near (2^x)',
            min: -5,
            max: 0,
            step: 1,
            value: Math.log2(this._camera.near),
            handler: (v) => this._camera.near = 2**v,
            triggerHandlerOnMove: true
        });

        ui.input.numberRange({
            label: 'far (2^x)',
            min: 1,
            max: 10,
            step: 1,
            value: Math.log2(this._camera.far),
            handler: (v) => this._camera.far = 2**v,
            triggerHandlerOnMove: true
        });

        const debugViews = this._renderer.getDebugViews();
        ui.input.select({
            label: 'output',
            optionValues: debugViews.map((d) => d.name),
            handler: (v) => this._renderer.setDebugView(debugViews[v.index]),
            handleOnInit: false,
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
        const shouldDraw = this._renderer.prepare();
        if (shouldDraw) this._renderer.draw(time);
        requestAnimationFrame((t) => this.draw(t));
    }
}

new App('canvas', 'ui', 'container');
