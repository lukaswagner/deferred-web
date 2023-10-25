import { BufferMode, Texture } from '../util/gl/texture';
import { GL } from '../util/gl/gl';
import { vec2 } from 'gl-matrix';

type ClearFunc = () => void;
export interface Attachment {
    slot: number;
    texture: Texture;
    clearFunc?: ClearFunc;
}

export class Framebuffer {
    protected _gl: GL;
    protected _handle: WebGLFramebuffer;
    protected _attachments: Attachment[];
    protected _doubleBuffered: number[] = [];
    protected _size = vec2.fromValues(1, 1);
    protected _name: string;

    public constructor(gl: GL, name?: string) {
        this._gl = gl;
        this._name = name;
    }

    public get name() {
        return this._name;
    }

    protected _attach(attachment: Attachment) {
        this._gl.framebufferTexture2D(
            this._gl.DRAW_FRAMEBUFFER, attachment.slot,
            this._gl.TEXTURE_2D, attachment.texture.writeHandle, 0);
    }

    protected _clearColor(slot: number, value: number[]) {
        this._gl.clearBufferfv(
            this._gl.COLOR, slot - this._gl.COLOR_ATTACHMENT0, value);
    }

    protected _clearDepth(value: number) {
        this._gl.clearBufferfi(this._gl.DEPTH_STENCIL, 0, value, 0);
    }

    public initialize(attachments: Attachment[]) {
        this._attachments = attachments;

        this._handle = this._gl.createFramebuffer();
        this.bind();
        for (let i = 0; i < attachments.length; i++) {
            const attachment = attachments[i];
            this._attach(attachment);

            const texture = attachment.texture;
            if (texture.bufferMode === BufferMode.Double) this._doubleBuffered.push(i);

            if (attachment.clearFunc) continue;
            switch (texture.format.format) {
                case this._gl.RED:
                case this._gl.RGBA:
                    attachment.clearFunc =
                        this._clearColor.bind(this, attachment.slot, [0, 0, 0, 0]) as ClearFunc;
                    break;
                case this._gl.DEPTH_COMPONENT:
                    attachment.clearFunc =
                        this._clearDepth.bind(this, 1) as ClearFunc;
                    break;
                default:
                    break;
            }
        }
        this.unbind();
    }

    public bind(target: number = this._gl.DRAW_FRAMEBUFFER) {
        this._gl.bindFramebuffer(target, this._handle);
    }

    public unbind(target: number = this._gl.DRAW_FRAMEBUFFER) {
        this._gl.bindFramebuffer(target, null);
    }

    public clear(bind = true, unbind = true) {
        if (bind) this.bind();
        for (const a of this._attachments) a.clearFunc?.();
        if (unbind) this.unbind();
    }

    public swap() {
        this.bind();
        if (this._doubleBuffered.length > 0) {
            for (const i of this._doubleBuffered) {
                const attachment = this._attachments[i];
                attachment.texture.swap();
                this._attach(this._attachments[i]);
            }
        }
        this.unbind();
    }

    public get size() {
        return this._size;
    }

    public set size(v) {
        this._size = v;
        for (const attachment of this._attachments)
            attachment.texture.resize(this._size);
    }

    public get attachments() {
        return this._attachments;
    }
}
