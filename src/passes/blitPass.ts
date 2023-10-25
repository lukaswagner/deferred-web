import { Framebuffer } from '../framebuffers/framebuffer';
import { RenderPass } from './renderPass';
import { drawBuffer } from '../util/gl/drawBuffers';

enum TrackedMembers {
    ReadTarget,
    ReadBuffer,
    DrawTarget,
    DrawBuffer,
}

export class BlitPass extends RenderPass<typeof TrackedMembers> {
    protected _readTarget: Framebuffer;
    public set readTarget(value: Framebuffer) {
        this._readTarget = value;
        this._dirty.set(TrackedMembers.ReadTarget);
    }

    protected _readBuffer: number;
    public set readBuffer(value: number) {
        this._readBuffer = value;
        this._dirty.set(TrackedMembers.ReadBuffer);
    }

    protected _drawTarget: Framebuffer;
    public set drawTarget(value: Framebuffer) {
        this._drawTarget = value;
        this._dirty.set(TrackedMembers.DrawTarget);
    }

    protected _drawBuffer: number;
    public set drawBuffer(value: number) {
        this._drawBuffer = value;
        this._dirty.set(TrackedMembers.DrawBuffer);
    }

    public override initialize(): void { }

    protected override _draw(): void {
        this._readTarget.bind(this._gl.READ_FRAMEBUFFER);
        this._gl.readBuffer(this._readBuffer);

        this._drawTarget.bind(this._gl.DRAW_FRAMEBUFFER);
        drawBuffer(this._gl, this._drawBuffer);

        const readSize = this._readTarget.size;
        const writeSize = this._readTarget.size;
        this._gl.blitFramebuffer(
            0, 0, readSize[0], readSize[1],
            0, 0, writeSize[0], writeSize[1],
            this._gl.COLOR_BUFFER_BIT, this._gl.NEAREST);

        this._readTarget.unbind(this._gl.READ_FRAMEBUFFER);
        this._drawTarget.unbind(this._gl.DRAW_FRAMEBUFFER);
    }
}
