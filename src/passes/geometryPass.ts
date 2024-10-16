import { ShaderRenderPass, CameraPass, JitterPass, Framebuffer, GL, replaceDefines } from '@lukaswagner/webgl-toolkit';
import { ColorMode, Geometry } from '../geometry/geometry';
import { mat4, vec2 } from 'gl-matrix';

const tracked = {
    Target: true,
    ViewProjection: true,
    Geometry: true,
    NdcOffset: true,
}

export enum FragmentLocation {
    Color,
    WorldPosition,
    WorldNormal,
    ViewPosition,
    ViewNormal,
}

export class GeometryPass extends ShaderRenderPass<typeof tracked> implements CameraPass, JitterPass {
    protected _target: Framebuffer;

    protected _model: mat4;
    protected _viewProjection: mat4;
    protected _instanced: boolean;
    protected _colorMode: ColorMode;
    protected _ndcOffset = vec2.create();
    protected _size = vec2.create();

    protected _geometries: Geometry[] = [];

    public constructor(gl: GL, name?: string) {
        super(gl, tracked, name);
    }

    public initialize() {
        this.setupProgram();
        this.compileVert(require('shaders/geometry.vert') as string);

        let fragSrc = require('shaders/geometry.frag') as string;
        fragSrc = replaceDefines(fragSrc, [
            { key: 'WORLD_POSITION_LOCATION', value: FragmentLocation.WorldPosition },
            { key: 'WORLD_NORMAL_LOCATION', value: FragmentLocation.WorldNormal },
            { key: 'VIEW_POSITION_LOCATION', value: FragmentLocation.ViewPosition },
            { key: 'VIEW_NORMAL_LOCATION', value: FragmentLocation.ViewNormal },
            { key: 'COLOR_LOCATION', value: FragmentLocation.Color },
        ]);
        this.compileFrag(fragSrc);

        this.linkProgram();

        this._dirty.setAll();
        return true;
    }

    public prepare(): boolean {
        if (this._dirty.get('ViewProjection')) {
            this._gl.useProgram(this._program);
            this._gl.uniformMatrix4fv(this._uniforms.get('u_viewProjection'), false, this._viewProjection);
        }

        if (this._dirty.get('NdcOffset')) {
            this._gl.useProgram(this._program);
            this._gl.uniform2fv(this._uniforms.get('u_ndcOffset'), this._ndcOffset);
        }

        if(this._target && !vec2.equals(this._size, this._target.size)) {
            vec2.copy(this._size, this._target.size);
            this._gl.useProgram(this._program);
            this._gl.uniform2fv(
                this._uniforms.get('u_resolutionInverse'),
                vec2.div(vec2.create(), vec2.fromValues(1, 1), this._size));
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

    public set view(v: mat4) { }
    public set projection(v: mat4) { }

    public set viewProjection(v: mat4) {
        this._viewProjection = v;
        this._dirty.set('ViewProjection');
    }

    public set viewInverse(v: mat4) { }
    public set projectionInverse(v: mat4) { }
    public set viewProjectionInverse(v: mat4) { }

    public set ndcOffset(v: vec2) {
        this._ndcOffset = v;
        this._dirty.set('NdcOffset');
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
