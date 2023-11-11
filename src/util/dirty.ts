export class Dirty<T> {
    protected _map: {[K in keyof T]: boolean};
    protected _any = false;

    constructor() {
        this._map = {} as typeof this._map;
    }

    public set(key: keyof T) {
        this._map[key] = true;
        this._any = true;
    }

    public get(key: keyof T) {
        return this._map[key] ?? false;
    }

    public any() {
        return this._any;
    }

    public reset() {
        for (const key in this._map) this._map[key] = false;
        this._any = false;
    }

    public setAll() {
        for (const key in this._map) this._map[key] = true;
        this._any = true;
    }
}
