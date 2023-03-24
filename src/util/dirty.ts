import { Enum } from './enum';

export class Dirty<T extends Enum> {
    protected _map = new Map<keyof T, boolean>();
    protected _any = false;

    public set(key: T[keyof T]) {
        this._map.set(key, true);
        this._any = true;
    }

    public get(key: T[keyof T]) {
        return this._map.get(key) ?? false;
    }

    public any() {
        return this._any;
    }

    public reset() {
        for (const key of this._map.keys()) this._map.set(key, false);
        this._any = false;
    }

    public setAll() {
        for (const key of this._map.keys()) this._map.set(key, true);
        this._any = true;
    }
}
