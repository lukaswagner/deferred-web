import { vec3 } from 'gl-matrix';
import { FullscreenPass } from '../../fullscreen';
import { UniformBlock } from '../../../util/uniformBlock';
import { Texture } from '../../../util/gl/texture';

interface Data {
    dir: vec3[];
    color: vec3[];
}

interface Tracked {
    Data: any;
    Target: any;
    Postion: any;
    Normal: any;
    Color: any;
}

type Options = {
    count: number,
    /** @deprecated ignored, only included for compatability with base class */
    fragSrc?: string,
}

export enum FragmentLocation {
    Color,
}

export class DirectionalLightPass extends FullscreenPass<Tracked> {
    protected _positionTex: Texture;
    protected _normalTex: Texture;
    protected _colorTex: Texture;

    protected _data: UniformBlock;

    public initialize(options: Options): boolean {
        let fragSrc = require('./directionalLight.frag') as string;
        fragSrc = fragSrc.replaceAll('DATA_SIZE', options.count.toString());

        const valid = super.initialize({fragSrc});

        this._data = new UniformBlock(
            this._gl, this._program, 'data', ['data.dir', 'data.color'], 0);
        this._dirty.set('Data');

        this._gl.useProgram(this._program);
        this._gl.uniform1i(this._uniforms.get('u_position'), 0);
        this._gl.uniform1i(this._uniforms.get('u_normal'), 1);
        this._gl.uniform1i(this._uniforms.get('u_color'), 2);
        this._gl.useProgram(null);

        return valid;
    }

    public prepare(): boolean {
        if (this._dirty.get('Data')) {
            this._gl.useProgram(this._program);
            this._data.upload();
            this._gl.useProgram(null);
        }
        return super.prepare();
    }

    protected _setup(): void {
        super._setup();

        this._data.bind();
        this._positionTex.bind(this._gl.TEXTURE0);
        this._normalTex.bind(this._gl.TEXTURE1);
        this._colorTex.bind(this._gl.TEXTURE2);
    }

    protected _tearDown(): void {
        this._positionTex.unbind(this._gl.TEXTURE0);
        this._normalTex.unbind(this._gl.TEXTURE1);
        this._colorTex.unbind(this._gl.TEXTURE2);
        super._tearDown();
    }

    public set position(v: Texture)
    {
        this._positionTex = v;
        this._dirty.set('Postion');
    }

    public set normal(v: Texture)
    {
        this._normalTex = v;
        this._dirty.set('Normal');
    }

    public set color(v: Texture)
    {
        this._colorTex = v;
        this._dirty.set('Color');
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
        this._dirty.set('Data');
    }
}
