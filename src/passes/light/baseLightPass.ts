import { Texture2D, UniformBlock, GL, replaceDefines, FullscreenPass } from '@lukaswagner/webgl-toolkit';

const tracked = {
    Data: false,
    Target: false,
    Postion: false,
    Normal: false,
}

export enum FragmentLocation {
    Color,
}

export class BaseLightPass extends FullscreenPass<typeof tracked> {
    protected _origFragSrc: string;
    protected _dataEntries: string[];

    protected _positionTex: Texture2D;
    protected _normalTex: Texture2D;

    protected _data: UniformBlock;
    protected _size = 0;

    public constructor(gl: GL, name?: string) {
        super(gl, tracked, name);
    }

    public initialize(): boolean {
        const valid = super.initialize({fragSrc: this.getSrc()});
        this.setupUniforms();

        return valid;
    }

    protected getSrc() {
        let src = replaceDefines(this._origFragSrc, [
            { key: 'DATA_SIZE', value: Math.max(this._size, 1), suffix: 'u' },
            { key: 'ENABLED', value: +(this._size > 0) }
        ]);
        return src;
    }

    protected compile() {
        super.compileFrag(this.getSrc());
        super.linkProgram();
        this.setupUniforms();
    }

    protected setupUniforms() {
        this._data = new UniformBlock(
            this._gl, this._program, 'data', this._dataEntries, 0);
        this._dirty.set('Data');

        this._gl.useProgram(this._program);
        this._gl.uniform1i(this._uniforms.get('u_position'), 0);
        this._gl.uniform1i(this._uniforms.get('u_normal'), 1);
        this._gl.useProgram(null);
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
        this._positionTex?.bind(this._gl.TEXTURE0);
        this._normalTex?.bind(this._gl.TEXTURE1);
    }

    protected _tearDown(): void {
        this._positionTex?.unbind(this._gl.TEXTURE0);
        this._normalTex?.unbind(this._gl.TEXTURE1);
        super._tearDown();
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
}
