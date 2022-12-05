import { Context, EventProvider, Invalidate, Renderer } from 'webgl-operate';

export class DeferredRenderer extends Renderer {
    protected onInitialize(
        // eslint-disable-next-line @typescript-eslint/no-unused-vars
        context: Context, callback: Invalidate, eventProvider: EventProvider,
    ): boolean {
        return true;
    }

    protected onUninitialize(): void {
    }

    protected onDiscarded(): void {
    }

    protected onUpdate(): boolean {
        return true;
    }

    protected onPrepare(): void {
    }

    protected onFrame(): void {
    }
}
