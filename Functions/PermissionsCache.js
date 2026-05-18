const config = require('../config.json');
const { perms } = require('../Database');

const ROLE_PREFIX = 'role_';

// ── Usuários ──────────────────────────────────────────────────────────────────

function getPermissions() {
    return perms.all()
        .map(e => String(e.id))
        .filter(id => !id.startsWith(ROLE_PREFIX));
}

function addPermission(userId) {
    perms.set(String(userId), String(userId));
}

function removePermission(userId) {
    perms.delete(String(userId));
}

// ── Cargos ────────────────────────────────────────────────────────────────────

function getRolePermissions() {
    return perms.all()
        .map(e => String(e.id))
        .filter(id => id.startsWith(ROLE_PREFIX))
        .map(id => id.slice(ROLE_PREFIX.length));
}

function addRolePermission(roleId) {
    perms.set(`${ROLE_PREFIX}${roleId}`, String(roleId));
}

function removeRolePermission(roleId) {
    perms.delete(`${ROLE_PREFIX}${roleId}`);
}

// ── Verificação ───────────────────────────────────────────────────────────────

// member é opcional (GuildMember do Discord.js) — necessário para checar cargos
function hasPermission(userId, member) {
    if (String(userId) === String(config.owner)) return true;
    if (perms.get(String(userId)) !== null) return true;
    if (member) {
        const allowedRoles = getRolePermissions();
        if (allowedRoles.some(roleId => member.roles.cache.has(roleId))) return true;
    }
    return false;
}

module.exports = {
    getPermissions,
    addPermission,
    removePermission,
    getRolePermissions,
    addRolePermission,
    removeRolePermission,
    hasPermission,
};
