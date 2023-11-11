import { RenderPass } from '../renderPass';
import { Uniforms } from '../../util/uniforms';
import { Framebuffer } from '../../framebuffers/framebuffer';

interface Tracked {
    Target: any
}

export enum FragmentLocation {
    Color,
}

export class FullscreenPass<T extends Tracked = Tracked> extends RenderPass<T> {
    protected _buffer: WebGLBuffer;
    protected _program: WebGLProgram;
    protected _target: Framebuffer;

    protected _uniforms: Uniforms;

    public constructor(gl: WebGL2RenderingContext, name?: string) {
        super(gl, name);
    }

    public initialize(fragSrc?: string) {
        const vert = this._gl.createShader(this._gl.VERTEX_SHADER);
        const vertSrc = require('./fullscreen.vert') as string;
        this._gl.shaderSource(vert, vertSrc);
        this._gl.compileShader(vert);
        if(!this._gl.getShaderParameter(vert, this._gl.COMPILE_STATUS))
            console.log(this._gl.getShaderInfoLog(vert));

        const frag = this._gl.createShader(this._gl.FRAGMENT_SHADER);
        if(!fragSrc) fragSrc = require('./fullscreen.frag') as string;
        fragSrc = fragSrc.replaceAll('COLOR_LOCATION', FragmentLocation.Color.toString());
        this._gl.shaderSource(frag, fragSrc);
        this._gl.compileShader(frag);
        if(!this._gl.getShaderParameter(frag, this._gl.COMPILE_STATUS))
            console.log(this._gl.getShaderInfoLog(frag));

        this._program = this._gl.createProgram();
        this._gl.attachShader(this._program, vert);
        this._gl.attachShader(this._program, frag);
        this._gl.linkProgram(this._program);
        if(!this._gl.getProgramParameter(this._program, this._gl.LINK_STATUS))
            console.log(this._gl.getProgramInfoLog(this._program));

        this._uniforms = new Uniforms(this._gl, this._program);

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
