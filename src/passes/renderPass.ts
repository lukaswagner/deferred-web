import { Dirty } from '../util/dirty';
import { Enum } from '../util/enum';
import { GL } from '../util/gl/gl';

export abstract class RenderPass<T extends Enum> {
    protected _gl: GL;
    protected _dirty = new Dirty<T>();

    public constructor(gl: GL) {
        this._gl = gl;
    }

    public prepare(): boolean {
        const shouldDraw = this._dirty.any();
        this._dirty.reset();
        return shouldDraw;
    }

    public abstract initialize(...args: unknown[]): void;

    protected _setup?(): void;
    public set setup(v: () => void) {
        this._setup = v;
    }

    protected _preDraw?(): void;
    public set preDraw(v: () => void) {
        this._preDraw = v;
    }

    protected _postDraw?(): void;
    public set postDraw(v: () => void) {
        this._postDraw = v;
    }

    protected _tearDown?(): void;
    public set tearDown(v: () => void) {
        this._tearDown = v;
    }

    protected abstract _draw(): void;
    public draw(): void {
        this._setup?.();
        this._preDraw?.();
        this._draw();
        this._postDraw?.();
        this._tearDown?.();
    }
}
