import { Dirty } from '../util/dirty';
import { GL } from '../util/gl/gl';

export abstract class RenderPass<T> {
    protected _gl: GL;
    protected _dirty: Dirty<T>;
    protected _name: string;

    public constructor(gl: GL, name?: string) {
        this._gl = gl;
        this._dirty = new Dirty();
        this._name = name;
    }

    public get name() {
        return this._name;
    }

    public prepare(): boolean {
        const shouldDraw = this._dirty.any();
        this._dirty.reset();
        return shouldDraw;
    }

    public abstract initialize(options?: {}): void;

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
