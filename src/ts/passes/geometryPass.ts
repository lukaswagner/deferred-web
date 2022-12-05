import { Context, Framebuffer, Initializable, Shader } from 'webgl-operate';
import { FragmentLocation } from '../storage/locations';
import { Geometry } from '../geometry/geometry';

export class GeometryPass extends Initializable {
    protected _context: Context;
    protected _gl: WebGL2RenderingContext;

    protected _target: Framebuffer;

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

        return valid;
    }

    public uninitialize(): void { }

    public draw(geometry: Geometry): void {
        this._target.bind();

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
                b.buffer.attribEnable(b.location, b.size, b.type);
            });
        }

        if (indexed) {
            if (instanced) {
                // this._gl.drawArraysInstanced();
            } else {
                // this._gl.drawArrays();
            }
        } else {
            if (instanced) {
                // this._gl.drawElementsInstanced();
            } else {
                // this._gl.drawElements();
            }
        }
    }

    public set target(target: Framebuffer) {
        this._target = target;
    }
}
