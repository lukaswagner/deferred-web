import { Context, EventProvider, Invalidate, Renderer } from 'webgl-operate';

export class DeferredRenderer extends Renderer {
    protected onInitialize(
        context: Context, callback: Invalidate, eventProvider: EventProvider
    ): boolean {
        return true
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

    protected onFrame(frameNumber: number): void {
    }
}
