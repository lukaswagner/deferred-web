import { BufferInfo } from './bufferInfo';

export interface Base {
    index?: WebGLBuffer;
    indexType?: number;
    buffers: BufferInfo[];
    mode: number;
    count: number;
}
