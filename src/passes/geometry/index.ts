import { ColorMode, Geometry } from '../../geometry/geometry';
import { CameraPass } from '../cameraPass';
import { RenderPass } from '../renderPass';
import { Uniforms } from '../../util/uniforms';
import { mat4 } from 'gl-matrix';
import { Framebuffer } from '../../framebuffers/framebuffer';
import { drawBuffers } from '../../util/gl/drawBuffers';

interface Tracked {
    Target: any;
    View: any;
    Projection: any;
    Geometry: any;
}

export enum FragmentLocation {
    Color,
    WorldPosition,
    WorldNormal,
    ViewPosition,
    ViewNormal,
}

export class GeometryPass extends RenderPass<Tracked> implements CameraPass {
    protected _program: WebGLProgram;
    protected _target: Framebuffer;

    protected _uniforms: Uniforms;

    protected _model: mat4;
    protected _view: mat4;
    protected _projection: mat4;
    protected _instanced: boolean;
    protected _colorMode: ColorMode;

    protected _geometries: Geometry[] = [];

    public initialize() {
        const vert = this._gl.createShader(this._gl.VERTEX_SHADER);
        const vertSrc = require('./geometry.vert') as string;
        this._gl.shaderSource(vert, vertSrc);
        this._gl.compileShader(vert);
        if(!this._gl.getShaderParameter(vert, this._gl.COMPILE_STATUS))
            console.log(this._gl.getShaderInfoLog(vert));

        const frag = this._gl.createShader(this._gl.FRAGMENT_SHADER);
        let fragSrc = require('./geometry.frag') as string;
        fragSrc = fragSrc.replaceAll('WORLD_POSITION_LOCATION', FragmentLocation.WorldPosition.toString());
        fragSrc = fragSrc.replaceAll('WORLD_NORMAL_LOCATION', FragmentLocation.WorldNormal.toString());
        fragSrc = fragSrc.replaceAll('VIEW_POSITION_LOCATION', FragmentLocation.ViewPosition.toString());
        fragSrc = fragSrc.replaceAll('VIEW_NORMAL_LOCATION', FragmentLocation.ViewNormal.toString());
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

        this._dirty.setAll();
        return true;
    }

    public prepare(): boolean {
        if (this._dirty.get('View')) {
            this._gl.useProgram(this._program);
            this._gl.uniformMatrix4fv(this._uniforms.get('u_view'), false, this._view);
        }

        if (this._dirty.get('Projection')) {
            this._gl.useProgram(this._program);
            this._gl.uniformMatrix4fv(this._uniforms.get('u_projection'), false, this._projection);
        }

        this._gl.useProgram(null);

        return super.prepare();
    }

    protected _setup(): void {
        this._target.bind();
        this._gl.useProgram(this._program);
    }

    protected _draw(): void {
        this._geometries.forEach((g) => this._drawGeometry(g));
    }

    protected _tearDown(): void {
        this._target.unbind();
        this._gl.useProgram(null);
    }

    private _drawGeometry(geometry: Geometry) {
        if(!geometry.vao) this._setupRenderData(geometry);
        this._gl.bindVertexArray(geometry.vao);

        const indexed = geometry.base.index !== undefined;
        const instanced = geometry.instance !== undefined;
        const base = geometry.base;
        const instance = geometry.instance!;

        if (indexed) {
            if (instanced) this._gl.drawElementsInstanced(
                base.mode, base.count, base.indexType!, 0, instance.count);
            else this._gl.drawElements(
                base.mode, base.count, base.indexType!, 0);
        } else {
            if (instanced) this._gl.drawArraysInstanced(
                base.mode, 0, base.count, instance.count);
            else this._gl.drawArrays(
                base.mode, 0, base.count);
        }

        this._gl.bindVertexArray(undefined);
    }

    private _setupRenderData(geometry: Geometry) {
        const vao = this._gl.createVertexArray();
        this._gl.bindVertexArray(vao);

        const indexed = geometry.base.index !== undefined;
        const instanced = geometry.instance !== undefined;

        if (instanced !== this._instanced) {
            this._instanced = instanced;
            this._gl.uniform1i(this._uniforms.get('u_instanced'), +this._instanced);
        }

        const colorMode = instanced && geometry.colorMode ? geometry.colorMode : ColorMode.BaseOnly;
        if (colorMode !== this._colorMode) {
            this._colorMode = colorMode;
            this._gl.uniform1i(this._uniforms.get('u_colorMode'), this._colorMode);
        }

        const model = geometry.model ?? mat4.create();
        if (!this._model || !mat4.equals(model, this._model)) {
            this._model = model;
            this._gl.uniformMatrix4fv(this._uniforms.get('u_model'), false, this._model);
        }

        const base = geometry.base;
        const instance = geometry.instance!;

        if (indexed) this._gl.bindBuffer(this._gl.ELEMENT_ARRAY_BUFFER, base.index);

        base.buffers.forEach((b) => {
            this._gl.bindBuffer(this._gl.ARRAY_BUFFER, b.buffer);
            this._gl.vertexAttribPointer(b.location, b.size, b.type, false, b.stride, b.offset);
            this._gl.enableVertexAttribArray(b.location);
            this._gl.bindBuffer(this._gl.ARRAY_BUFFER, null);
        });
        if (instanced) {
            base.buffers.forEach((b) => this._gl.vertexAttribDivisor(b.location, b.divisor));
            instance.buffers.forEach((b) => {
                this._gl.bindBuffer(this._gl.ARRAY_BUFFER, b.buffer);
                this._gl.vertexAttribPointer(b.location, b.size, b.type, false, b.stride, b.offset);
                this._gl.enableVertexAttribArray(b.location);
                this._gl.vertexAttribDivisor(b.location, b.divisor);
                this._gl.bindBuffer(this._gl.ARRAY_BUFFER, null);
            });
        }

        geometry.vao = vao;
        this._gl.bindVertexArray(undefined);
    }

    public set target(v: Framebuffer) {
        this._target = v;
        this._dirty.set('Target');
    }

    public set view(v: mat4) {
        this._view = v;
        this._dirty.set('View');
    }

    public set projection(v: mat4) {
        this._projection = v;
        this._dirty.set('Projection');
    }

    public addGeometry(v: Geometry) {
        this._geometries.push(v);
        this._dirty.set('Geometry');
    }

    public clear() {
        this._geometries = [];
        this._dirty.set('Geometry');
    }
}
