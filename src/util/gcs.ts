import { vec3 } from 'gl-matrix';

export function clampLongitude(longitude: number) {
    return longitude % (Math.PI * 2);
}

export function clampLatitude(latitude: number) {
    latitude = Math.min(latitude, Math.PI / 2);
    latitude = Math.max(latitude, -Math.PI / 2);
    return latitude;
}

export function gcsToCartesian(longitude: number, latitude: number) {
    const sinLon = Math.sin(longitude);
    const cosLon = Math.cos(longitude);

    const sinLat = Math.sin(latitude);
    const cosLat = Math.cos(latitude);

    return vec3.fromValues(sinLon * cosLat, sinLat, cosLon * cosLat);
}

export function cartesianToGcs(pos: vec3) {
    const longitude = Math.atan(pos[0] / pos[2]);
    const latitude = Math.asin(pos[1] / vec3.length(pos));
    return { longitude, latitude };
}
