import { vec2 } from 'gl-matrix';

export interface JitterPass {
    set ndcOffset(v: vec2);
}

export function isJitterPass(obj: object): obj is JitterPass {
    return 'ndcOffset' in obj;
}
