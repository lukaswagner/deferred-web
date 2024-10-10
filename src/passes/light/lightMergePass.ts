import { Texture2D, GL, FullscreenPass } from '@lukaswagner/webgl-toolkit';

const tracked = {
    Target: false,
    Ambient: false,
    Directional: false,
    Point: false,
    Color: false,
}

export enum FragmentLocation {
    Color,
}

export class LightMergePass extends FullscreenPass<typeof tracked> {
    protected _ambientTex: Texture2D;
    protected _directionalTex: Texture2D;
    protected _pointTex: Texture2D;
    protected _colorTex: Texture2D;

    public constructor(gl: GL, name?: string) {
        super(gl, tracked, name);
    }

    public initialize(): boolean {
        const fragSrc = require('shaders/light/lightMerge.frag') as string;
        const valid = super.initialize({ fragSrc });

        this._gl.useProgram(this._program);
        this._gl.uniform1i(this._uniforms.get('u_ambient'), 0);
        this._gl.uniform1i(this._uniforms.get('u_directional'), 1);
        this._gl.uniform1i(this._uniforms.get('u_point'), 2);
        this._gl.uniform1i(this._uniforms.get('u_color'), 3);
        this._gl.useProgram(null);

        return valid;
    }

    public prepare(): boolean {
        return super.prepare();
    }

    protected _setup(): void {
        super._setup();

        this._ambientTex.bind(this._gl.TEXTURE0);
        this._directionalTex.bind(this._gl.TEXTURE1);
        this._pointTex.bind(this._gl.TEXTURE2);
        this._colorTex.bind(this._gl.TEXTURE3);
    }

    protected _tearDown(): void {
        this._ambientTex.unbind(this._gl.TEXTURE0);
        this._directionalTex.unbind(this._gl.TEXTURE1);
        this._pointTex.unbind(this._gl.TEXTURE3);
        this._colorTex.unbind(this._gl.TEXTURE2);
        super._tearDown();
    }

    public set ambient(v: Texture2D)
    {
        this._ambientTex = v;
        this._dirty.set('Ambient');
    }

    public set directional(v: Texture2D)
    {
        this._directionalTex = v;
        this._dirty.set('Directional');
    }

    public set point(v: Texture2D)
    {
        this._pointTex = v;
        this._dirty.set('Point');
    }

    public set color(v: Texture2D)
    {
        this._colorTex = v;
        this._dirty.set('Color');
    }
}
