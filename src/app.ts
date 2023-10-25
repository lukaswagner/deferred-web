import { Camera } from './util/camera';
import { Renderer } from './renderer';
import { Navigation } from './util/navigation';

const canvas = document.getElementById('canvas') as HTMLCanvasElement;
const contextAttributes: WebGLContextAttributes = { antialias: false, alpha: false };
const gl = canvas.getContext('webgl2', contextAttributes);
if (!gl) throw new Error('Could not acquire WebGL context');

const camera = new Camera();
new Navigation(canvas, camera);

const renderer = new Renderer(gl);
renderer.camera = camera;
renderer.initialize();
renderer.spawnDebugScene();

function drawLoop(time: number) {
    const shouldDraw = renderer.prepare();
    if (shouldDraw) renderer.draw(time);
    requestAnimationFrame(drawLoop);
}
requestAnimationFrame(drawLoop);

// protected setupUI(): void {
//     const uiId = 'ui';
//     const ui = document.getElementById(uiId) as HTMLCanvasElement;
//     this._ui = new UI(ui, true);

//     this._ui.input.select({
//         label: 'output',
//         optionValues: Object.keys(FragmentLocation).filter((v) => isNaN(Number(v))),
//         value: 'Color',
//         handler: (v) =>
//             this._renderer.output = FragmentLocation[v.value as keyof typeof FragmentLocation],
//     });
// }
