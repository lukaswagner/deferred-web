export function concatArrayBuffers(views: ArrayBufferView[]) {
    let length = 0;
    for (const view of views) length += view.byteLength;

    const buffer = new ArrayBuffer(length);
    const byteView = new Uint8Array(buffer);
    let offset = 0;
    for (const view of views) {
        byteView.set(new Uint8Array(view.buffer), offset);
        offset += view.byteLength;
    }
    return buffer;
}
