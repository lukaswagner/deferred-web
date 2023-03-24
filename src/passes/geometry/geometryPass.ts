import { ColorMode, Geometry } from '../../geometry/geometry';
import { CameraPass } from '../cameraPass';
import { RenderPass } from '../renderPass';
import { Uniforms } from '../../util/uniforms';
import { mat4 } from 'gl-matrix';

enum Dirty {
    Target,
    View,
    Projection,
}

export class PointPass extends RenderPass<typeof Dirty> implements CameraPass {
    protected _count: number;

    protected _buffer: WebGLBuffer;
    protected _program: WebGLProgram;
    protected _target: WebGLFramebuffer;

    protected _uniforms: Uniforms;

    protected _model: mat4;
    protected _view: mat4;
    protected _projection: mat4;
    protected _instanced: boolean;
    protected _colorMode: ColorMode;

    public initialize() {
        const vert = this._gl.createShader(this._gl.VERTEX_SHADER);
        const vertSrc = require('./geometry.vert') as string;
        this._gl.shaderSource(vert, vertSrc);

        const frag = this._gl.createShader(this._gl.FRAGMENT_SHADER);
        const fragSrc = require('./geometry.frag') as string;
        this._gl.shaderSource(frag, fragSrc);

        this._program = this._gl.createProgram();
        this._gl.attachShader(this._program, vert);
        this._gl.attachShader(this._program, frag);
        this._gl.linkProgram(this._program);

        this._uniforms = new Uniforms(this._gl, this._program);

        this._dirty.setAll();
        return true;
    }

    public prepare(): boolean {
        if (this._dirty.get(Dirty.View)) {
            this._gl.useProgram(this._program);
            this._gl.uniformMatrix4fv(this._uniforms.get('u_view'), false, this._view);
        }

        if (this._dirty.get(Dirty.Projection)) {
            this._gl.useProgram(this._program);
            this._gl.uniformMatrix4fv(this._uniforms.get('u_projection'), false, this._projection);
        }

        this._gl.useProgram(null);

        return super.prepare();
    }

    public draw(geom: Geometry): void {
        this._gl.bindFramebuffer(this._gl.DRAW_FRAMEBUFFER, this._target);
        this._gl.useProgram(this._program);

        const indexed = geom.base.index !== undefined;
        const instanced = geom.instance !== undefined;

        if (instanced !== this._instanced) {
            this._instanced = instanced;
            this._gl.uniform1i(this._uniforms.get('u_instanced'), +this._instanced);
        }

        if (instanced) {
            const colorMode = geom.colorMode ?? ColorMode.BaseOnly;
            if (colorMode !== this._colorMode) {
                this._colorMode = colorMode;
                this._gl.uniform1i(this._uniforms.get('u_colorMode'), this._colorMode);
            }
        }

        const model = geom.model ?? mat4.create();
        if (!mat4.equals(model, this._model)) {
            this._model = model;
            this._gl.uniformMatrix4fv(this._uniforms.get('u_model'), false, this._model);
        }

        const base = geom.base;
        const inst = geom.instance!;

        if (indexed) this._gl.bindBuffer(this._gl.ELEMENT_ARRAY_BUFFER, base.index);

        base.buffers.forEach((b) => {
            this._gl.bindBuffer(this._gl.ARRAY_BUFFER, b.buffer);
            this._gl.vertexAttribPointer(b.location, b.size, b.type, false, b.stride, b.offset);
            this._gl.enableVertexAttribArray(b.location);
            this._gl.bindBuffer(this._gl.ARRAY_BUFFER, null);
        });
        if (instanced) {
            base.buffers.forEach((b) => this._gl.vertexAttribDivisor(b.location, b.divisor));
            inst.buffers.forEach((b) => {
                this._gl.bindBuffer(this._gl.ARRAY_BUFFER, b.buffer);
                this._gl.vertexAttribPointer(b.location, b.size, b.type, false, b.stride, b.offset);
                this._gl.enableVertexAttribArray(b.location);
                this._gl.vertexAttribDivisor(b.location, b.divisor);
                this._gl.bindBuffer(this._gl.ARRAY_BUFFER, null);
            });
        }

        if (indexed) {
            if (instanced) this._gl.drawElementsInstanced(
                base.mode, base.count, base.indexType!, 0, inst.count);
            else this._gl.drawElements(
                base.mode, base.count, base.indexType!, 0);
        } else {
            if (instanced) this._gl.drawArraysInstanced(
                base.mode, 0, base.count, inst.count);
            else this._gl.drawArrays(
                base.mode, 0, base.count);
        }

        if (instanced) inst.buffers.forEach((b) => {
            this._gl.bindBuffer(this._gl.ARRAY_BUFFER, b.buffer);
            this._gl.disableVertexAttribArray(b.location);
            this._gl.bindBuffer(this._gl.ARRAY_BUFFER, null);
        });
        base.buffers.forEach((b) => {
            this._gl.bindBuffer(this._gl.ARRAY_BUFFER, b.buffer);
            this._gl.disableVertexAttribArray(b.location);
            this._gl.bindBuffer(this._gl.ARRAY_BUFFER, null);
        });


        this._gl.bindFramebuffer(this._gl.DRAW_FRAMEBUFFER, null);
        this._gl.useProgram(null);
    }

    public set target(v: WebGLFramebuffer) {
        this._target = v;
        this._dirty.set(Dirty.Target);
    }

    public set view(v: mat4) {
        this._view = v;
        this._dirty.set(Dirty.View);
    }

    public set projection(v: mat4) {
        this._projection = v;
        this._dirty.set(Dirty.Projection);
    }
}
