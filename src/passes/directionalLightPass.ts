import {
    ChangeLookup,
    Context,
    Initializable,
    NdcFillingTriangle,
    Program,
    Shader,
    Texture2D,
    vec3,
} from 'webgl-operate';
import { Uniform, UniformBlock } from './uniform';
import { IntermediateFramebuffer } from '../buffers/intermediateFramebuffer';
import { LightPass } from './lightPass';

interface Data {
    dir: vec3[];
    color: vec3[];
}

export class DirectionalLightPass extends Initializable implements LightPass {
    protected readonly _altered = Object.assign(new ChangeLookup(), {
        any: false,
        data: false,
    });

    protected _context: Context;
    protected _gl: WebGL2RenderingContext;
    protected _program: Program;
    protected _geom: NdcFillingTriangle;

    protected _positionTex: Texture2D;
    protected _normalTex: Texture2D;
    protected _colorTex: Texture2D;

    protected _data: UniformBlock;
    protected _position: Uniform<number>;
    protected _normal: Uniform<number>;
    protected _color: Uniform<number>;

    public constructor(context: Context) {
        super();
        this._context = context;
        this._gl = context.gl;
    }

    public initialize(count: number): boolean {
        let valid = true;

        const vert = new Shader(this._context, this._gl.VERTEX_SHADER, 'vert:directionalLight');
        valid &&= vert.initialize(require('./directionalLight.vert'));

        const frag = new Shader(this._context, this._gl.FRAGMENT_SHADER, 'frag:directionalLight');
        valid &&= frag.initialize(require('./directionalLight.frag'), false);
        frag.replace('DATA_SIZE', count.toString());
        frag.compile();
        valid &&= frag.compiled;

        this._program = new Program(this._context);
        valid &&= this._program.initialize([vert, frag]);

        this._geom = new NdcFillingTriangle(this._context, 'geom:directionalLight');
        valid &&= this._geom.initialize();

        this._program.bind();

        this._data = new UniformBlock(
            this._gl, this._program.object, 'data', ['data.dir', 'data.color'], 0);
        this._altered.alter('data');

        this._position = {
            value: 0,
            location: this._program.uniform('u_position'),
        };
        this._gl.uniform1i(this._position.location, this._position.value);

        this._normal = {
            value: 1,
            location: this._program.uniform('u_normal'),
        };
        this._gl.uniform1i(this._normal.location, this._normal.value);

        this._color = {
            value: 2,
            location: this._program.uniform('u_color'),
        };
        this._gl.uniform1i(this._color.location, this._color.value);

        this._program.unbind();

        return valid;
    }

    public uninitialize(): void { }

    public prepare(): void {
        this._program.bind();

        if (this._altered.data) this._data.upload();

        this._program.unbind();
    }

    public draw(): void {
        this._program.bind();

        this._data.bind();

        this._positionTex.bind(this._gl.TEXTURE0);
        this._normalTex.bind(this._gl.TEXTURE1);
        this._colorTex.bind(this._gl.TEXTURE2);

        this._geom.bind();
        this._geom.draw();
        this._geom.unbind();

        this._positionTex.unbind(this._gl.TEXTURE0);
        this._normalTex.unbind(this._gl.TEXTURE1);
        this._colorTex.unbind(this._gl.TEXTURE2);

        this._data.unbind();

        this._program.unbind();
    }

    public get altered(): boolean {
        return this._altered.any;
    }

    public set altered(altered: boolean) {
        this._altered.any = altered;
    }

    public set textures(v: IntermediateFramebuffer) {
        this._positionTex = v.worldPosition;
        this._normalTex = v.worldNormal;
        this._colorTex = v.color;
    }

    public set data(v: Data) {
        const dir = new Float32Array(
            this._data.data, this._data.offsets[0], this._data.offsets[1] / 4);
        const color = new Float32Array(
            this._data.data, this._data.offsets[1]);

        if (v.dir.length * 4 !== dir.length || v.color.length * 4 !== color.length) {
            console.warn('Invalid data length');
            return;
        }

        v.dir.forEach((d, i) => dir.set(d, i * 4));
        v.color.forEach((c, i) => color.set(c, i * 4));
        this._altered.alter('data');
    }
}
