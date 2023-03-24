import { mat4 } from 'gl-matrix';

export interface CameraPass {
    set view(v: mat4);
    set projection(v: mat4);
}

export function isCameraPass(obj: object): obj is CameraPass {
    return 'view' in obj && 'projection' in obj;
}
