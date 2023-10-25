import { GL } from './gl';

export class Attributes {
    protected _gl: GL;
    protected _program: WebGLProgram;
    protected _map = new Map<string, number>();

    public constructor(gl: GL, program: WebGLProgram) {
        this._gl = gl;
        this._program = program;
    }

    public get(key: string): number {
        let location = this._map.get(key);
        if (location === undefined) {
            location = this._gl.getAttribLocation(this._program, key);
            this._map.set(key, location);
        }
        return location;
    }
}
