'use strict';

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

function _getPath(key) {
    const dot = key.indexOf('.');
    if (dot === -1) return { root: key, sub: null };
    return { root: key.slice(0, dot), sub: key.slice(dot + 1) };
}

const _store = new Map();

const quickStore = {
    async get(key) {
        if (key == null) return null;
        const { root, sub } = _getPath(String(key));
        const val = _store.get(root) ?? null;
        if (!sub) return val;
        if (val == null) return null;
        return _deepGet(val, sub);
    },

    async set(key, value) {
        if (key == null) return value;
        const { root, sub } = _getPath(String(key));
        if (!sub) {
            _store.set(root, value);
        } else {
            let cur = _store.get(root);
            if (cur == null || typeof cur !== 'object') cur = {};
            _deepSet(cur, sub, value);
            _store.set(root, cur);
        }
        return value;
    },

    async delete(key) {
        if (key == null) return;
        const { root } = _getPath(String(key));
        _store.delete(root);
    },
};

module.exports = quickStore;
