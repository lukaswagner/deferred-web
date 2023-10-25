import { gcsToCartesian } from '../gcs';
import { vec3 } from 'gl-matrix';

class Options {
    public center: vec3 = [0, 0, 0];
    public radius: vec3 | number = [1, 1, 1];
    public count = 1000;
    public color: vec3 = [0, 0, 0];
}

// https://arxiv.org/pdf/0912.4540.pdf
export function sphere(options?: Partial<Options>) {
    options = Object.assign(new Options(), options) as Options;
    if (typeof options.radius === 'number')
        options.radius = vec3.fromValues(options.radius, options.radius, options.radius);
    const points = new Float32Array(options.count * 6);

    const phiPi = 1.61803398875 * Math.PI;
    const countInv = 1 / options.count;

    for (let i = 0; i < options.count; i++) {
        const actualI = i - 0.5 * options.count;
        const twoI = 2 * actualI;
        const lat = Math.asin(twoI * countInv);
        const lon = twoI * phiPi;

        const pos = gcsToCartesian(lon, lat);
        vec3.multiply(pos, pos, options.radius);
        vec3.add(pos, pos, options.center);

        points.set(pos, i * 6);
        points.set(options.color, i * 6 + 3);
    }

    return points;
}
