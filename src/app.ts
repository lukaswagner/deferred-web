import { Camera } from './util/camera';
import { Renderer } from './renderer';
import { Navigation } from './util/navigation';
import { UI } from '@lukaswagner/web-ui';
import { createDebugScene } from './scene';

const canvas = document.getElementById('canvas') as HTMLCanvasElement;
const contextAttributes: WebGLContextAttributes = { antialias: false, alpha: false };
const gl = canvas.getContext('webgl2', contextAttributes);
if (!gl) throw new Error('Could not acquire WebGL context');

const camera = new Camera();
new Navigation(canvas, camera);

const renderer = new Renderer(gl);
renderer.camera = camera;
renderer.initialize();
setupUI();
const scene = createDebugScene(gl);
renderer.scene = scene;

function drawLoop(time: number) {
    const shouldDraw = renderer.prepare();
    if (shouldDraw) renderer.draw(time);
    requestAnimationFrame(drawLoop);
}
requestAnimationFrame(drawLoop);

function setupUI() {
    const uiId = 'ui';
    const element = document.getElementById(uiId) as HTMLCanvasElement;
    const ui = new UI(element, true);

    const debugViews = renderer.getDebugViews();
    ui.input.select({
        label: 'output',
        optionValues: debugViews.map((d) => d.name),
        handler: (v) => renderer.setDebugView(debugViews[v.index]),
        handleOnInit: false,
    });
}
