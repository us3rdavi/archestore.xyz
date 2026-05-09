const config = require('../config.json');
const { perms } = require('../Database');

function getPermissions() {
    return perms.all().map(e => String(e.id));
}

function addPermission(userId) {
    perms.set(String(userId), String(userId));
}

function removePermission(userId) {
    perms.delete(String(userId));
}

function hasPermission(userId) {
    if (String(userId) === String(config.owner)) return true;
    return perms.get(String(userId)) !== null;
}

module.exports = { getPermissions, addPermission, removePermission, hasPermission };
