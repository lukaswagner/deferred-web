import { mat4, vec3, vec4 } from "gl-matrix"
import { ColorMode, Geometry } from "./geometry/geometry"
import { createCube } from "./geometry/base/cube"
import { create3dGrid } from "./geometry/instance/3dGrid"

export type Scene = {
    geometry?: Geometry[],
    light?: {
        ambient?: {
            color: vec4,
        }[],
        directional?: {
            dir: vec3,
            color: vec4,
        }[]
    }
}

export function createDebugScene(gl: WebGL2RenderingContext): Scene {
    const cubesMat = mat4.create();
    mat4.scale(cubesMat, cubesMat, [0.2, 0.2, 0.2]);
    const cubes: Geometry = {
        base: createCube(gl),
        model: cubesMat,
        instance: create3dGrid(gl, { colors: true, step: [3, 3, 3] }),
        colorMode: ColorMode.InstanceOnly,
    };

    const whiteCubeMat = mat4.create();
    mat4.translate(whiteCubeMat, whiteCubeMat, [0, 2, 0]);
    mat4.scale(whiteCubeMat, whiteCubeMat, [0.4, 0.4, 0.4]);
    const whiteCube: Geometry = {
        base: createCube(gl),
        model: whiteCubeMat,
    };

    return {
        geometry: [cubes, whiteCube],
        light: {
            ambient: [
                { color: [1, 1, 1, 0.2] }
            ],
            directional: [
                { dir: [-2, -5, -1], color: [0.5, 1, 1, 1] },
                { dir: [3, -2, -3], color: [1, 0, 1, 0.5] },
            ]
        }
    };
}
