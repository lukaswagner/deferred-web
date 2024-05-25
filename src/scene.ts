import { mat4, vec3, vec4 } from "gl-matrix"
import { ColorMode, Geometry } from "./geometry/geometry"
import { createCube } from "./geometry/base/cube"
import { create3dGrid } from "./geometry/instance/3dGrid"
import { createSphere } from "./geometry/base/sphere"

export type Scene = {
    geometry?: Geometry[],
    light?: {
        ambient?: {
            color: vec4,
        }[],
        directional?: {
            dir: vec3,
            color: vec4,
        }[],
        point?: {
            pos: vec4,
            color: vec4,
        }[],
    }
}

export function createDebugScene(gl: WebGL2RenderingContext): Scene {
    const cubesMat = mat4.create();
    mat4.translate(cubesMat, cubesMat, [0, -0.75, 0]);
    mat4.scale(cubesMat, cubesMat, [0.1, 0.1, 0.1]);
    const cubes: Geometry = {
        base: createCube(gl),
        model: cubesMat,
        instance: create3dGrid(gl, { colors: true, step: [3, 3, 3] }),
        colorMode: ColorMode.InstanceOnly,
    };

    const sphereMat = mat4.create();
    mat4.translate(sphereMat, sphereMat, [0, 0.75, 0]);
    mat4.scale(sphereMat, sphereMat, [0.5, 0.5, 0.5]);
    const sphere: Geometry = {
        base: createSphere(gl),
        model: sphereMat,
    };

    const pointOffset = 0.45;
    return {
        geometry: [cubes, sphere],
        light: {
            ambient: [
                { color: [1, 1, 1, 0.2] }
            ],
            directional: [
                { dir: [-2, -5, -1], color: [0.3, 1, 1, 0.5] },
                { dir: [3, -2, -3], color: [1, 0, 1, 0.5] },
            ],
            point: [
                { pos: [pointOffset, 0, 0, 0.5], color: [1, 1, 1, 1] },
                { pos: [pointOffset, 0, pointOffset, 0.5], color: [1, 1, 1, 1] },
                { pos: [0, 0, pointOffset, 0.5], color: [1, 1, 1, 1] },
                { pos: [-pointOffset, 0, pointOffset, 0.5], color: [1, 1, 1, 1] },
                { pos: [-pointOffset, 0, 0, 0.5], color: [1, 1, 1, 1] },
                { pos: [-pointOffset, 0, -pointOffset, 0.5], color: [1, 1, 1, 1] },
                { pos: [0, 0, -pointOffset, 0.5], color: [1, 1, 1, 1] },
                { pos: [pointOffset, 0, -pointOffset, 0.5], color: [1, 1, 1, 1] },
            ]
        }
    };
}
