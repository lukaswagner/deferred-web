import { Canvas, Initializable, viewer } from 'webgl-operate';
import { DeferredRenderer } from './renderer';
import { FragmentLocation } from './buffers/locations';
import { UI } from '@lukaswagner/web-ui';

export class App extends Initializable {
    protected _canvas: Canvas;
    protected _renderer: DeferredRenderer;
    protected _ui: UI;

    public initialize(canvas: HTMLCanvasElement): boolean {
        this._canvas = new Canvas(canvas, { antialias: false, alpha: false });
        if (!this._canvas.context.isWebGL2) alert('WebGL 2 not supported!');

        this._renderer = new DeferredRenderer();
        this._canvas.renderer = this._renderer;

        canvas.addEventListener('dblclick', () => {
            viewer.Fullscreen.toggle(this._canvas.element);
        });

        this.setupUI();

        return true;
    }

    public uninitialize(): void {
    }

    protected setupUI(): void {
        const uiId = 'ui';
        const ui = document.getElementById(uiId) as HTMLCanvasElement;
        this._ui = new UI(ui, true);

        this._ui.input.select({
            label: 'output',
            optionValues: Object.keys(FragmentLocation).filter((v) => isNaN(Number(v))),
            handler: (v) =>
                this._renderer.output = FragmentLocation[v.value as keyof typeof FragmentLocation],
        });
    }
}
