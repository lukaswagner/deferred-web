import { mat4, vec2, vec4 } from 'gl-matrix';
import { BufferInfo } from '../../geometry/bufferInfo';
import { ShaderRenderPass, CameraPass, JitterPass, Framebuffer, GL, replaceDefines, Texture2D } from '@lukaswagner/webgl-toolkit';

type Data = {
    /** position and radius */
    pos: vec4,
    /** rgb and intensity */
    color: vec4
}[];

const tracked = {
    Data: false,
    Target: false,
    ViewProjection: true,
    ViewInverse: true,
    Geometry: true,
    NdcOffset: true,
    Postion: false,
    Normal: false,
}

enum VertexLocations {
    basePosition = 0,
    instancePosition = 1,
    instanceColor = 2,
}

export enum FragmentLocation {
    Color,
}

export class PointLightPass extends ShaderRenderPass<typeof tracked> implements CameraPass, JitterPass {
    protected _origFragSrc: string;
    protected _target: Framebuffer;
    protected _vao: WebGLVertexArrayObject;

    protected _model: mat4;
    protected _viewProjection: mat4;
    protected _viewInverse: mat4;

    protected _ndcOffset = vec2.create();
    protected _renderSize = vec2.create();

    protected _positionTex: Texture2D;
    protected _normalTex: Texture2D;

    protected _buffer: WebGLBuffer;
    protected _dataSize = 1;

    public constructor(gl: GL, name?: string) {
        super(gl, tracked, name);
    }

    public initialize(): boolean {
        this._origFragSrc = require('shaders/light/pointLight.frag') as string;

        this.setupProgram();
        this.compileVert(require('shaders/light/pointLight.vert') as string);
        this.compileFrag(this.getSrc());
        this.linkProgram();

        this.setupUniforms();

        this._dirty.setAll();
        return true;
    }

    protected getSrc() {
        let src = replaceDefines(this._origFragSrc, [
            { key: 'COLOR_LOCATION', value: FragmentLocation.Color },
            { key: 'DATA_SIZE', value: Math.max(this._dataSize, 1), suffix: 'u' },
            { key: 'ENABLED', value: +(this._dataSize > 0) }
        ]);
        return src;
    }

    protected compile() {
        super.compileFrag(this.getSrc());
        super.linkProgram();
        this.setupUniforms();
    }

    protected setupUniforms() {
        this._gl.useProgram(this._program);
        this._gl.uniform1i(this._uniforms.get('u_position'), 0);
        this._gl.uniform1i(this._uniforms.get('u_normal'), 1);
        this._gl.useProgram(null);
    }

    public prepare(): boolean {
        if (this._dirty.get('ViewProjection')) {
            this._gl.useProgram(this._program);
            this._gl.uniformMatrix4fv(this._uniforms.get('u_viewProjection'), false, this._viewProjection);
        }

        if (this._dirty.get('ViewInverse')) {
            this._gl.useProgram(this._program);
            this._gl.uniformMatrix4fv(this._uniforms.get('u_viewInverse'), false, this._viewInverse);
        }

        if (this._dirty.get('NdcOffset')) {
            this._gl.useProgram(this._program);
            this._gl.uniform2fv(this._uniforms.get('u_ndcOffset'), this._ndcOffset);
        }

        if(this._target && !vec2.equals(this._renderSize, this._target.size)) {
            vec2.copy(this._renderSize, this._target.size);
            this._gl.useProgram(this._program);
            this._gl.uniform2fv(
                this._uniforms.get('u_resolutionInverse'),
                vec2.div(vec2.create(), vec2.fromValues(1, 1), this._renderSize));
        }

        this._gl.useProgram(null);

        return super.prepare();
    }

    protected _setup(): void {
        this._target.bind();
        this._gl.useProgram(this._program);
        this._positionTex?.bind(this._gl.TEXTURE0);
        this._normalTex?.bind(this._gl.TEXTURE1);
    }

    protected _draw(): void {
        if(!this._vao) this._setupRenderData();
        if(this._dataSize === 0) return;
        this._gl.bindVertexArray(this._vao);
        this._gl.drawArraysInstanced(this._gl.TRIANGLE_STRIP, 0, 4, this._dataSize);
        this._gl.bindVertexArray(undefined);
    }

    private _setupRenderData() {
        this._vao = this._gl.createVertexArray();
        this._gl.bindVertexArray(this._vao);

        const basePosition = this._gl.createBuffer();
        this._gl.bindBuffer(this._gl.ARRAY_BUFFER, basePosition);
        const basePositionData = new Float32Array([1, 0, 1, 1, 0, 0, 0, 1]);
        this._gl.bufferData(this._gl.ARRAY_BUFFER, basePositionData.buffer, this._gl.STATIC_DRAW);

        this._buffer = this._gl.createBuffer();
        this._dataSize = 0;

        const buffers: BufferInfo[] = [
            {
                buffer: basePosition,
                location: VertexLocations.basePosition,
                size: 2,
                type: this._gl.FLOAT,
                divisor: 0,
            },
            {
                buffer: this._buffer,
                location: VertexLocations.instancePosition,
                size: 4,
                type: this._gl.FLOAT,
                divisor: 1,
                stride: 8 * 4,
            }, {
                buffer: this._buffer,
                location: VertexLocations.instanceColor,
                size: 4,
                type:  this._gl.FLOAT,
                divisor: 1,
                stride: 8 * 4,
                offset: 4 * 4,
            }
        ];

        buffers.forEach((b) => {
            this._gl.bindBuffer(this._gl.ARRAY_BUFFER, b.buffer);
            this._gl.vertexAttribPointer(b.location, b.size, b.type, false, b.stride, b.offset);
            this._gl.enableVertexAttribArray(b.location);
            this._gl.vertexAttribDivisor(b.location, b.divisor);
            this._gl.bindBuffer(this._gl.ARRAY_BUFFER, null);
        });

        this._gl.bindVertexArray(undefined);
    }

    protected _tearDown(): void {
        this._positionTex?.unbind(this._gl.TEXTURE0);
        this._normalTex?.unbind(this._gl.TEXTURE1);
        this._target.unbind();
        this._gl.useProgram(null);
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

    public set viewInverse(v: mat4) {
        this._viewInverse = v;
        this._dirty.set('ViewInverse');
    }

    public set projectionInverse(v: mat4) { }
    public set viewProjectionInverse(v: mat4) { }

    public set ndcOffset(v: vec2) {
        this._ndcOffset = v;
        this._dirty.set('NdcOffset');
    }

    public set position(v: Texture2D)
    {
        this._positionTex = v;
        this._dirty.set('Postion');
    }

    public set normal(v: Texture2D)
    {
        this._normalTex = v;
        this._dirty.set('Normal');
    }

    public set data(v: Data) {
        if(!this._vao) this._setupRenderData();

        if(this._dataSize !== v.length) {
            this._dataSize = v.length;
            this.compile();
        }

        const data = new Float32Array(v.length * 8);
        v.forEach((l, i) => {
            data.set(l.pos, i * 8 + 0);
            data.set(l.color, i * 8 + 4);
        });

        this._gl.bindBuffer(this._gl.ARRAY_BUFFER, this._buffer);
        this._gl.bufferData(this._gl.ARRAY_BUFFER, data.buffer, this._gl.STATIC_DRAW);
        this._gl.bindBuffer(this._gl.ARRAY_BUFFER, null);

        this._dirty.set('Data');
    }
}
