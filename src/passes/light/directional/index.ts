import { vec3, vec4 } from 'gl-matrix';
import { BaseLightPass } from '../base';

type Data = {
    /** direction */
    dir: vec3,
    /** rgb and intensity */
    color: vec4
}[];

export class DirectionalLightPass extends BaseLightPass {
    public initialize(): boolean {
        this._origFragSrc = require('./directionalLight.frag') as string;
        this._dataEntries = ['data.dir', 'data.color'];
        return super.initialize();
    }

    public set data(v: Data) {
        if(this._size !== v.length) {
            this._size = v.length;
            this.compile();
        }

        const dir = new Float32Array(
            this._data.data, this._data.offsets[0], this._data.offsets[1] / 4);
        const color = new Float32Array(
            this._data.data, this._data.offsets[1]);

        if (v.length * 4 !== dir.length || v.length * 4 !== color.length) {
            console.warn('Invalid data length');
            return;
        }

        v.forEach((l, i) => {
            dir.set(l.dir, i * 4);
            color.set(l.color, i * 4);
        });

        this._dirty.set('Data');
    }
}
