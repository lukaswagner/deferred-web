export class UniformBlock {
    protected _gl: WebGL2RenderingContext;
    protected _program: WebGLProgram;

    // defined by user
    public name: string;
    public members: string[];
    public binding: number;

    // derived / generated
    public data: ArrayBuffer;
    public location: number;
    public buffer: WebGLBuffer;
    public size: number;
    public indices: number[];
    public offsets: number[];

    public constructor(
        gl: WebGL2RenderingContext, program: WebGLProgram,
        name: string, members: string[], binding: number,
        log = false,
    ) {
        // store given values
        this._gl = gl;
        this._program = program;
        this.name = name;
        this.members = members;
        this.binding = binding;

        // derive / generate members
        this.location = gl.getUniformBlockIndex(program, name);

        this.size = gl.getActiveUniformBlockParameter(
            program, this.location, gl.UNIFORM_BLOCK_DATA_SIZE);

        this.data = new ArrayBuffer(this.size);

        const b = gl.createBuffer();
        if (b === null) throw new Error('Could not create buffer.');
        this.buffer = b;

        const i = gl.getUniformIndices(program, members);
        if (i === null) throw new Error('Could not fetch indices.');
        this.indices = i;

        const o = gl.getActiveUniforms(program, i, gl.UNIFORM_OFFSET);
        if (o === null) throw new Error('Could not fetch offsets.');
        this.offsets = o;

        // configure
        this._gl.uniformBlockBinding(program, this.location, binding);

        if (log) {
            console.log('name:', name);
            console.log('members:', members);
            console.log('binding:', binding);
            console.log('location:', this.location);
            console.log('size:', this.size);
            console.log('data:', this.data);
            console.log('buffer:', this.buffer);
            console.log('indices:', this.indices);
            console.log('offsets:', this.offsets);
        }
    }

    public upload(): void {
        if (this.data.byteLength !== this.size) {
            console.warn('Invalid data length');
            return;
        }

        this._gl.bindBuffer(this._gl.UNIFORM_BUFFER, this.buffer);
        this._gl.bufferData(this._gl.UNIFORM_BUFFER, this.data, this._gl.STATIC_DRAW);
        this._gl.bindBuffer(this._gl.UNIFORM_BUFFER, null);
    }

    public bind(): void {
        this._gl.bindBufferBase(this._gl.UNIFORM_BUFFER, this.binding, this.buffer);
    }

    public unbind(): void {
        this._gl.bindBufferBase(this._gl.UNIFORM_BUFFER, this.binding, null);
    }
}
