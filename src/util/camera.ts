import { mat4, vec3 } from 'gl-matrix';

export class Camera {
    protected _timestamp = performance.now();
    public get timestamp(): number {
        return this._timestamp;
    }
    protected _updateTimestamp() {
        this._timestamp = performance.now();
    }

    protected _eye = vec3.fromValues(0, 0, 5);
    public get eye() {
        return this._eye;
    }
    public set eye(v) {
        this._eye = v;
        this._updateTimestamp();
    }

    protected _up = vec3.fromValues(0, 1, 0);
    public get up() {
        return this._up;
    }
    public set up(v) {
        this._up = v;
        this._updateTimestamp();
    }

    protected _center = vec3.create();
    public get center() {
        return this._center;
    }
    public set center(v) {
        this._center = v;
        this._updateTimestamp();
    }

    protected _fovY = 60;
    public get fovY() {
        return this._fovY;
    }
    public set fovY(v) {
        this._fovY = v;
        this._updateTimestamp();
    }

    protected _aspect = 1;
    public get aspect() {
        return this._aspect;
    }
    public set aspect(v) {
        this._aspect = v;
        this._updateTimestamp();
    }

    protected _near = 0.25;
    public get near() {
        return this._near;
    }
    public set near(v) {
        this._near = v;
        this._updateTimestamp();
    }

    protected _far = 16;
    public get far() {
        return this._far;
    }
    public set far(v) {
        this._far = v;
        this._updateTimestamp();
    }

    public get view(): mat4 {
        return mat4.lookAt(mat4.create(), this._eye, this._center, this._up);
    }

    public get projection(): mat4 {
        return mat4.perspective(mat4.create(), this._fovY * Math.PI / 180, this._aspect, this._near, this._far);
    }
}
