import {
    ChangeLookup,
    Context,
    Framebuffer,
    Initializable,
    Program,
    Shader,
    mat4,
} from 'webgl-operate';
import { FragmentLocation } from '../buffers/locations';
import { Geometry } from '../geometry/geometry';
import { Uniform } from './uniform';

export class GeometryPass extends Initializable {
    protected readonly _altered = Object.assign(new ChangeLookup(), {
        any: false,
        viewProjection: false,
    });

    protected _context: Context;
    protected _gl: WebGL2RenderingContext;
    protected _program: Program;

    protected _target: Framebuffer;

    protected _viewProjection: Uniform<mat4>;

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
        frag.replace('COLOR_LOCATION', FragmentLocation.Color.toString());
        frag.compile();
        valid &&= frag.compiled;

        this._program = new Program(this._context);
        valid &&= this._program.initialize([vert, frag], false);
        valid &&= this._program.link();

        this._viewProjection = {
            value: mat4.create(),
            location: this._program.uniform('u_viewProjection'),
        };

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
        this._target.bind();
        this._program.bind();

        const indexed = geometry.base.index !== undefined;
        const instanced = geometry.vao !== undefined;

        if (indexed) geometry.base.index!.bind();

        if (instanced) {
            // vao already prepared
            this._gl.bindVertexArray(geometry.vao!);
        } else {
            // bind base buffers individually
            geometry.base.buffers.forEach((b) => {
                b.buffer.attribEnable(b.location, b.size, b.type);
            });
        }

        if (indexed) {
            if (instanced) {
                console.log('drawElementsInstanced');
                // this._gl.drawElementsInstanced();
            } else {
                console.log('drawElements');
                // this._gl.drawElements();
            }
        } else {
            if (instanced) {
                console.log('drawArraysInstanced');
                // this._gl.drawArraysInstanced();
            } else {
                this._gl.drawArrays(geometry.base.mode, 0, geometry.base.count);
            }
        }

        if (instanced) {
            this._gl.bindVertexArray(null);
        } else {
            // bind base buffers individually
            geometry.base.buffers.forEach((b) => {
                b.buffer.attribDisable(b.location);
            });
        }

        this._program.unbind();
        this._target.unbind();
    }

    public set target(target: Framebuffer) {
        this._target = target;
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
