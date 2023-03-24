export class Uniforms {
    protected _gl: WebGL2RenderingContext;
    protected _program: WebGLProgram;
    protected _map = new Map<string, WebGLUniformLocation>();

    public constructor(gl: WebGL2RenderingContext, program: WebGLProgram) {
        this._gl = gl;
        this._program = program;
    }

    public get(key: string): WebGLUniformLocation {
        let location = this._map.get(key);
        if (location === undefined) {
            location = this._gl.getUniformLocation(this._program, key);
            this._map.set(key, location);
        }
        return location;
    }
}
