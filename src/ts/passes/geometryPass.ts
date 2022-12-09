import {
    ChangeLookup,
    Context,
    Initializable,
    Program,
    Shader,
    mat4,
} from 'webgl-operate';
import { ColorMode, Geometry } from '../geometry/geometry';
import { FragmentLocation } from '../buffers/locations';
import { Uniform } from './uniform';

export class GeometryPass extends Initializable {
    protected readonly _altered = Object.assign(new ChangeLookup(), {
        any: false,
        viewProjection: false,
    });

    protected _context: Context;
    protected _gl: WebGL2RenderingContext;
    protected _program: Program;

    protected _model: Uniform<mat4>;
    protected _viewProjection: Uniform<mat4>;
    protected _instanced: Uniform<boolean>;
    protected _colorMode: Uniform<ColorMode>;

    public constructor(context: Context) {
        super();
        this._context = context;
        this._gl = context.gl;
    }

    public initialize(): boolean {
        let valid = true;

        const vert = new Shader(this._context, this._gl.VERTEX_SHADER, 'vert:geometry');
        valid &&= vert.initialize(require('./geometry.vert'));

        const frag = new Shader(this._context, this._gl.FRAGMENT_SHADER, 'frag:geometry');
        valid &&= frag.initialize(require('./geometry.frag'), false);
        frag.replace('WORLD_POSITION_LOCATION', FragmentLocation.WorldPosition.toString());
        frag.replace('WORLD_NORMAL_LOCATION', FragmentLocation.WorldNormal.toString());
        frag.replace('VIEW_POSITION_LOCATION', FragmentLocation.ViewPosition.toString());
        frag.replace('VIEW_NORMAL_LOCATION', FragmentLocation.ViewNormal.toString());
        frag.replace('COLOR_LOCATION', FragmentLocation.Color.toString());
        frag.compile();
        valid &&= frag.compiled;

        this._program = new Program(this._context);
        valid &&= this._program.initialize([vert, frag], false);
        valid &&= this._program.link();

        this._program.bind();

        this._model = {
            value: mat4.create(),
            location: this._program.uniform('u_model'),
        };
        this._gl.uniformMatrix4fv(this._model.location, false, this._model.value);

        this._viewProjection = {
            value: mat4.create(),
            location: this._program.uniform('u_viewProjection'),
        };
        this._gl.uniformMatrix4fv(this._viewProjection.location, false, this._viewProjection.value);

        this._instanced = {
            value: false,
            location: this._program.uniform('u_instanced'),
        };
        this._gl.uniform1i(this._instanced.location, +this._instanced.value);

        this._colorMode = {
            value: ColorMode.BaseOnly,
            location: this._program.uniform('u_colorMode'),
        };
        this._gl.uniform1i(this._colorMode.location, this._colorMode.value);

        this._program.unbind();

        return valid;
    }

    public uninitialize(): void { }

    public prepare(): void {
        this._program.bind();

        if (this._altered.viewProjection)
            this._gl.uniformMatrix4fv(
                this._viewProjection.location, false, this._viewProjection.value);

        this._program.unbind();
    }

    public draw(geometry: Geometry): void {
        this._program.bind();

        const indexed = geometry.base.index !== undefined;
        const instanced = geometry.instance !== undefined;

        if (instanced !== this._instanced.value) {
            this._instanced.value = instanced;
            this._gl.uniform1i(this._instanced.location, +this._instanced.value);
        }

        if (instanced) {
            const colorMode = geometry.colorMode ?? ColorMode.BaseOnly;
            if (colorMode !== this._colorMode.value) {
                this._colorMode.value = colorMode;
                this._gl.uniform1i(this._colorMode.location, this._colorMode.value);
            }
        }

        const model = geometry.model ?? mat4.create();

        if (!mat4.equals(model, this._model.value)) {
            this._model.value = model;
            this._gl.uniformMatrix4fv(this._model.location, false, this._model.value);
        }

        if (indexed) geometry.base.index!.bind();

        if (instanced) {
            geometry.base.buffers.forEach((b) => {
                b.buffer.attribEnable(b.location, b.size, b.type);
                this._gl.vertexAttribDivisor(b.location, b.divisor);
            });
            geometry.instance!.buffers.forEach((b) => {
                if (b.stride !== undefined && b.offset !== undefined) {
                    b.buffer.attribEnable(b.location, b.size, b.type, false, b.stride, b.offset);
                } else {
                    b.buffer.attribEnable(b.location, b.size, b.type);
                }
                this._gl.vertexAttribDivisor(b.location, b.divisor);
            });

        } else {
            // bind base buffers individually
            geometry.base.buffers.forEach((b) => {
                b.buffer.attribEnable(b.location, b.size, b.type);
            });
        }

        if (indexed) {
            if (instanced) {
                console.log('drawElementsInstanced not implemented');
                // this._gl.drawElementsInstanced();
            } else {
                this._gl.drawElements(
                    geometry.base.mode, geometry.base.count, geometry.base.indexType!, 0);
            }
        } else {
            if (instanced) {
                this._gl.drawArraysInstanced(
                    geometry.base.mode, 0, geometry.base.count, geometry.instance!.count);
            } else {
                this._gl.drawArrays(geometry.base.mode, 0, geometry.base.count);
            }
        }

        if (instanced) {
            this._gl.bindVertexArray(null);
        } else {
            geometry.base.buffers.forEach((b) => {
                b.buffer.attribDisable(b.location);
            });
        }

        this._program.unbind();
    }

    public set viewProjection(value: mat4) {
        this._viewProjection.value = value;
        this._altered.alter('viewProjection');
    }

    public get altered(): boolean {
        return this._altered.any;
    }

    public set altered(altered: boolean) {
        this._altered.any = altered;
    }
}
