import { mat4, vec3 } from "gl-matrix"
import { ColorMode, Geometry } from "./geometry/geometry"
import { createCube } from "./geometry/base/cube"
import { create3dGrid } from "./geometry/instance/3dGrid"

export type Scene = {
    geometry?: Geometry[],
    light?: {
        directional?: {
            dir: vec3,
            color: vec3,
        }[]
    }
}

export function createDebugScene(gl: WebGL2RenderingContext): Scene {
    const mat = mat4.create();
    mat4.scale(mat, mat, [0.2, 0.2, 0.2]);
    const cubes: Geometry = {
        base: createCube(gl),
        model: mat,
        instance: create3dGrid(gl, { colors: true, step: [3, 3, 3] }),
        colorMode: ColorMode.InstanceOnly,
    };

    return {
        geometry: [cubes],
        light: {
            directional: [
                { dir: [-2, -5, -1], color: [1, 1, 1] },
            ]
        }
    };
}
