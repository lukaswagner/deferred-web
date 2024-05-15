import { Dirty, DirtyInit } from '../util/dirty';
import { GL } from '../util/gl/gl';
import { Uniforms } from '../util/uniforms';
import { RenderPass } from './renderPass';

export abstract class ShaderRenderPass<T extends DirtyInit> extends RenderPass<T> {
    protected _vert: WebGLShader;
    protected _frag: WebGLShader;
    protected _program: WebGLProgram;
    protected _uniforms: Uniforms;

    public constructor(gl: GL, trackedMembers: T, name?: string) {
        super(gl, trackedMembers, name);
    }

    protected compileVert(src: string) {
        this._gl.shaderSource(this._vert, src);
        this._gl.compileShader(this._vert);
        if (!this._gl.getShaderParameter(this._vert, this._gl.COMPILE_STATUS))
            console.log(this._gl.getShaderInfoLog(this._vert));
    }

    protected compileFrag(src: string) {
        this._gl.shaderSource(this._frag, src);
        this._gl.compileShader(this._frag);
        if (!this._gl.getShaderParameter(this._frag, this._gl.COMPILE_STATUS))
            console.log(this._gl.getShaderInfoLog(this._frag));
    }

    protected setupProgram() {
        this._vert = this._gl.createShader(this._gl.VERTEX_SHADER);
        this._frag = this._gl.createShader(this._gl.FRAGMENT_SHADER);
        this._program = this._gl.createProgram();
        this._gl.attachShader(this._program, this._vert);
        this._gl.attachShader(this._program, this._frag);
    }

    protected linkProgram() {
        this._gl.linkProgram(this._program);
        if (!this._gl.getProgramParameter(this._program, this._gl.LINK_STATUS))
            console.log(this._gl.getProgramInfoLog(this._program));

        this._uniforms = new Uniforms(this._gl, this._program);
    }
}
