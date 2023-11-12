import { Camera } from './util/camera';
import { Renderer } from './renderer';
import { Navigation } from './util/navigation';
import { UI } from '@lukaswagner/web-ui';
import { createDebugScene } from './scene';

class App {
    protected _canvas: HTMLCanvasElement;
    protected _renderer: Renderer;

    constructor(canvasId: string, uiId: string, containerId?: string) {
        this._canvas = document.getElementById(canvasId) as HTMLCanvasElement;
        const contextAttributes: WebGLContextAttributes = { antialias: false, alpha: false };
        const gl = this._canvas.getContext('webgl2', contextAttributes);
        if (!gl) throw new Error('Could not acquire WebGL context');

        const camera = new Camera();
        new Navigation(this._canvas, camera);

        this._renderer = new Renderer(gl);
        this._renderer.camera = camera;
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
