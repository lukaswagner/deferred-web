import { GL } from './gl';

export interface TextureFormat {
    format: number;
    type: number;
    internalFormat: number;
}

export namespace Formats {
    export const R: TextureFormat = {
        format: WebGL2RenderingContext.RED,
        type: WebGL2RenderingContext.UNSIGNED_BYTE,
        internalFormat: WebGL2RenderingContext.R8,
    }
    export const RGBA: TextureFormat = {
        format: WebGL2RenderingContext.RGBA,
        type: WebGL2RenderingContext.UNSIGNED_BYTE,
        internalFormat: WebGL2RenderingContext.RGBA8,
    };
    export const RGBA16F: TextureFormat = {
        format: WebGL2RenderingContext.RGBA,
        type: WebGL2RenderingContext.HALF_FLOAT,
        internalFormat: WebGL2RenderingContext.RGBA16F,
    };
    export const RGBA32F: TextureFormat = {
        format: WebGL2RenderingContext.RGBA,
        type: WebGL2RenderingContext.FLOAT,
        internalFormat: WebGL2RenderingContext.RGBA32F,
    };
    export const Depth: TextureFormat = {
        format: WebGL2RenderingContext.DEPTH_COMPONENT,
        type: WebGL2RenderingContext.FLOAT,
        internalFormat: WebGL2RenderingContext.DEPTH_COMPONENT32F,
    };
    export const DepthStencil: TextureFormat = {
        format: WebGL2RenderingContext.DEPTH_STENCIL,
        type: WebGL2RenderingContext.UNSIGNED_INT_24_8,
        internalFormat: WebGL2RenderingContext.DEPTH24_STENCIL8,
    };
}
