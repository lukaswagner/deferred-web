import { Framebuffer } from '../framebuffers/framebuffer';
import { GL } from '../util/gl/gl';
import { replaceDefines } from '../util/defines';
import { ShaderRenderPass } from './shaderRenderPass';

const tracked = {
    Target: true,
}
type Tracked = typeof tracked;

export enum FragmentLocation {
    Color,
}

type Options = {
    fragSrc?: string,
}

export class FullscreenPass<T extends Tracked = Tracked> extends ShaderRenderPass<T> {
    protected _buffer: WebGLBuffer;
    protected _target: Framebuffer;

    public constructor(gl: GL, trackedMembers: T = tracked as any as T, name?: string) {
        super(gl, trackedMembers, name);
    }

    public initialize(options?: Options) {
        this.setupProgram();
        this.compileVert(require('shaders/fullscreen.vert') as string);
        this.compileFrag(options?.fragSrc);
        this.linkProgram();

        this._buffer = this._gl.createBuffer();
        this._gl.bindBuffer(this._gl.ARRAY_BUFFER, this._buffer);
        const positionData = new Float32Array([0, 0, 0, 2, 2, 0]);
        this._gl.bufferData(this._gl.ARRAY_BUFFER, positionData.buffer, this._gl.STATIC_DRAW);
        this._gl.vertexAttribPointer(0, 2, this._gl.FLOAT, false, 0, 0);
        this._gl.enableVertexAttribArray(0);
        this._gl.bindBuffer(this._gl.ARRAY_BUFFER, null);

        this._dirty.setAll();
        return true;
    }

    protected compileFrag(src?: string) {
        if(!src) src = require('shaders/fullscreen.frag') as string;
        src = replaceDefines(src, [
            { key: 'COLOR_LOCATION', value: FragmentLocation.Color }
        ]);
        super.compileFrag(src);
    }

    public prepare(): boolean {
        return super.prepare();
    }

    protected _setup(): void {
        this._target.bind();
        this._gl.useProgram(this._program);
    }

    protected _draw(): void {
        this._gl.bindBuffer(this._gl.ARRAY_BUFFER, this._buffer);
        this._gl.drawArrays(this._gl.TRIANGLES, 0, 3);
        this._gl.bindBuffer(this._gl.ARRAY_BUFFER, null);
    }

    protected _tearDown(): void {
        this._target.unbind();
        this._gl.useProgram(null);
    }

    public set target(v: Framebuffer) {
        this._target = v;
        this._dirty.set('Target');
    }
}
