import { Buffer } from 'webgl-operate';
import { BufferInfo } from './bufferInfo';

export interface Base {
    index?: Buffer;
    indexType?: number;
    buffers: BufferInfo[];
    mode: number;
}
