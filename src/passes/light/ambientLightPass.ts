import { vec4 } from 'gl-matrix';
import { BaseLightPass } from './baseLightPass';

type Data = {
    /** rgb and intensity */
    color: vec4
}[];

export class AmbientLightPass extends BaseLightPass {
    public initialize(): boolean {
        this._origFragSrc = require('shaders/light/ambientLight.frag') as string;
        this._dataEntries = ['data.color'];
        return super.initialize();
    }

    public set data(v: Data) {
        if(this._size !== v.length) {
            this._size = v.length;
            this.compile();
        }

        const color = new Float32Array(this._data.data, this._data.offsets[0]);

        if (v.length * 4 !== color.length) {
            console.warn('Invalid data length');
            return;
        }

        v.forEach((l, i) => {
            color.set(l.color, i * 4);
        });

        this._dirty.set('Data');
    }
}
