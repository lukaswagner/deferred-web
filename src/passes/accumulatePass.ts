import { GL } from "../util/gl/gl";
import { Texture } from "../util/gl/texture";
import { FullscreenPass } from "./fullscreenPass";

const tracked = {
    Target: false,
    Frame: false,
    Input: false,
}

export class AccumulatePass extends FullscreenPass<typeof tracked> {
    protected _frame: number;
    protected _inputTex: Texture;

    public constructor(gl: GL, name?: string) {
        super(gl, undefined, name);
    }

    public initialize(): boolean {
        const fragSrc = require('shaders/accumulate.frag') as string;
        const valid = super.initialize({ fragSrc });

        this._gl.useProgram(this._program);
        this._gl.uniform1i(this._uniforms.get('u_input'), 0);
        this._gl.useProgram(null);

        return valid;
    }

    public prepare(): boolean {
        if (this._dirty.get('Frame')) {
            this._gl.useProgram(this._program);
            this._gl.uniform1f(this._uniforms.get("u_alpha"), 1 / (this._frame + 1));
            this._gl.useProgram(null);
        }
        return super.prepare();
    }

    protected _setup(): void {
        super._setup();

        this._inputTex.bind(this._gl.TEXTURE0);
    }

    protected _tearDown(): void {
        this._inputTex.unbind(this._gl.TEXTURE0);
        super._tearDown();
    }

    public set frame(v: number)
    {
        this._frame = v;
        this._dirty.set('Frame');
    }

    public set input(v: Texture)
    {
        this._inputTex = v;
        this._dirty.set('Input');
    }
}
