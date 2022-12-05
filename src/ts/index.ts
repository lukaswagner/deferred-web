import { App } from './app';

const canvasId = 'canvas';
const canvas = document.getElementById(canvasId) as HTMLCanvasElement;
const app = new App();
app.initialize(canvas);
