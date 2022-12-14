import { Initializable } from 'webgl-operate';
import { IntermediateFramebuffer } from '../buffers/intermediateFramebuffer';

export interface LightPass extends Initializable {
    prepare(): void;
    draw(): void;
    get altered(): boolean;
    set altered(v: boolean);
    set textures(v: IntermediateFramebuffer);
}
