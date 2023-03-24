export interface BufferInfo {
    buffer: WebGLBuffer;
    location: number;
    size: number;
    type: number;
    divisor: number;
    stride?: number;
    offset?: number;
}
