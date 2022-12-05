import { Canvas, Initializable, Renderer, viewer } from 'webgl-operate';
import { DeferredRenderer } from './renderer';

export class App extends Initializable {
    protected _canvas: Canvas;
    protected _renderer: Renderer;

    initialize(canvas: HTMLCanvasElement): boolean {
        this._canvas = new Canvas(canvas, { antialias: false, alpha: false });
        if (!this._canvas.context.isWebGL2) alert('WebGL 2 not supported!');

        this._renderer = new DeferredRenderer();
        this._canvas.renderer = this._renderer;

        canvas.addEventListener('dblclick', () => {
            viewer.Fullscreen.toggle(this._canvas.element);
        });

        return true;
    }

    uninitialize(): void {
    }
}
