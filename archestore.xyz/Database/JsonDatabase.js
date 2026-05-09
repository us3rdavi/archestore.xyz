'use strict';

const { MongoClient } = require('mongodb');

function _getPath(key) {
    const dot = key.indexOf('.');
    if (dot === -1) return { root: key, sub: null };
    return { root: key.slice(0, dot), sub: key.slice(dot + 1) };
}

function _deepGet(obj, path) {
    return path.split('.').reduce((cur, k) => (cur != null ? cur[k] : null), obj) ?? null;
}

function _deepSet(obj, path, value) {
    const keys = path.split('.');
    let cur = obj;
    for (let i = 0; i < keys.length - 1; i++) {
        if (cur[keys[i]] == null || typeof cur[keys[i]] !== 'object') cur[keys[i]] = {};
        cur = cur[keys[i]];
    }
    cur[keys[keys.length - 1]] = value;
}

function _deepDelete(obj, path) {
    const keys = path.split('.');
    let cur = obj;
    for (let i = 0; i < keys.length - 1; i++) {
        if (cur[keys[i]] == null) return;
        cur = cur[keys[i]];
    }
    delete cur[keys[keys.length - 1]];
}

class JsonDatabase {
    constructor(collectionName) {
        this.collectionName = collectionName;
        this._cache = {};
        this._col = null;
    }

    async _init(db) {
        this._col = db.collection(this.collectionName);
        const docs = await this._col.find({}).toArray();
        for (const doc of docs) {
            this._cache[doc._id] = doc.value;
        }
    }

    _persist(rootKey) {
        if (!this._col) return;
        const value = this._cache[rootKey];
        if (value === undefined) {
            this._col.deleteOne({ _id: rootKey }).catch(() => {});
        } else {
            this._col.replaceOne({ _id: rootKey }, { _id: rootKey, value }, { upsert: true }).catch(() => {});
        }
    }

    get(key) {
        if (key == null) return null;
        const { root, sub } = _getPath(String(key));
        const val = this._cache[root];
        if (val === undefined) return null;
        if (!sub) return val;
        return _deepGet(val, sub);
    }

    set(key, value) {
        if (key == null) return value;
        const { root, sub } = _getPath(String(key));
        if (!sub) {
            this._cache[root] = value;
        } else {
            if (this._cache[root] == null || typeof this._cache[root] !== 'object') {
                this._cache[root] = {};
            }
            _deepSet(this._cache[root], sub, value);
        }
        this._persist(root);
        return value;
    }

    delete(key) {
        if (key == null) return;
        const { root, sub } = _getPath(String(key));
        if (!sub) {
            delete this._cache[root];
            this._col?.deleteOne({ _id: root }).catch(() => {});
        } else {
            if (this._cache[root] != null) {
                _deepDelete(this._cache[root], sub);
                this._persist(root);
            }
        }
    }

    has(key) {
        return this.get(key) !== null;
    }

    all() {
        return Object.entries(this._cache).map(([id, value]) => ({ id, value }));
    }

    // Compatibilidade com wio.db/quick.db: retorna [{id, data: value}]
    fetchAll() {
        return Object.entries(this._cache).map(([id, value]) => ({ id, data: value }));
    }
}

module.exports = JsonDatabase;
