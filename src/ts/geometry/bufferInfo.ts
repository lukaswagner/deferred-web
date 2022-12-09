import { Buffer } from 'webgl-operate';

export interface BufferInfo {
    buffer: Buffer;
    location: number;
    size: number;
    type: number;
    divisor: number;
    stride?: number;
    offset?: number;
}
