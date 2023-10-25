import { Base } from './base';
import { Instance } from './instance';
import { mat4 } from 'gl-matrix';

export enum ColorMode {
    BaseOnly = 0,
    InstanceOnly = 1,
    Additive = 2,
    Multiplicative = 3,
}

export interface Geometry {
    base: Base;
    instance?: Instance;
    colorMode?: ColorMode;
    model?: mat4;
    vao?: WebGLVertexArrayObject;
}
