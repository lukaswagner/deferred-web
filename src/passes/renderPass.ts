import { Dirty } from '../util/dirty';
import { Enum } from '../util/enum';

export abstract class RenderPass<T extends Enum> {
    protected _gl: WebGL2RenderingContext;
    protected _dirty = new Dirty<T>();

    public constructor(gl: WebGL2RenderingContext) {
        this._gl = gl;
    }

    public prepare(): boolean {
        const shouldDraw = this._dirty.any();
        this._dirty.reset();
        return shouldDraw;
    }

    public abstract initialize(...args: unknown[]): void;
    public abstract draw(...args: unknown[]): void;
}
