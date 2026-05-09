const fs   = require('fs');
const path = require('path');
const config = require('../config.json');

const PERMS_FILE = path.join(__dirname, '../DataBaseJson/perms.json');

function readPerms() {
    try {
        return JSON.parse(fs.readFileSync(PERMS_FILE, 'utf8'));
    } catch {
        return { [config.owner]: config.owner };
    }
}

function writePerms(obj) {
    fs.writeFileSync(PERMS_FILE, JSON.stringify(obj, null, 2));
}

function getPermissions() {
    return Object.values(readPerms()).map(String);
}

function addPermission(userId) {
    const p = readPerms();
    p[String(userId)] = String(userId);
    writePerms(p);
}

function removePermission(userId) {
    const p = readPerms();
    delete p[String(userId)];
    writePerms(p);
}

function hasPermission(userId) {
    if (String(userId) === String(config.owner)) return true;
    return getPermissions().includes(String(userId));
}

module.exports = { getPermissions, addPermission, removePermission, hasPermission };
