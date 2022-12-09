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

    public draw(geom: Geometry): void {
        this._program.bind();

        const indexed = geom.base.index !== undefined;
        const instanced = geom.instance !== undefined;

        if (instanced !== this._instanced.value) {
            this._instanced.value = instanced;
            this._gl.uniform1i(this._instanced.location, +this._instanced.value);
        }

        if (instanced) {
            const colorMode = geom.colorMode ?? ColorMode.BaseOnly;
            if (colorMode !== this._colorMode.value) {
                this._colorMode.value = colorMode;
                this._gl.uniform1i(this._colorMode.location, this._colorMode.value);
            }
        }

        const model = geom.model ?? mat4.create();
        if (!mat4.equals(model, this._model.value)) {
            this._model.value = model;
            this._gl.uniformMatrix4fv(this._model.location, false, this._model.value);
        }

        const base = geom.base;
        const inst = geom.instance!;

        if (indexed) base.index!.bind();

        base.buffers.forEach((b) => b.buffer.attribEnable(b.location, b.size, b.type));
        if (instanced) {
            base.buffers.forEach((b) => this._gl.vertexAttribDivisor(b.location, b.divisor));
            inst.buffers.forEach((b) => {
                b.buffer.attribEnable(b.location, b.size, b.type, false, b.stride, b.offset);
                this._gl.vertexAttribDivisor(b.location, b.divisor);
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

        if (instanced) inst.buffers.forEach((b) => b.buffer.attribDisable(b.location));
        base.buffers.forEach((b) => b.buffer.attribDisable(b.location));

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
