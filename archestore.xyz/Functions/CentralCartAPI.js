const fetch = require('node-fetch');

const BASE_URL = 'https://api.centralcart.com.br/v1';

function getHeaders() {
    const token = process.env.CENTRALCART_API_KEY;
    if (!token) throw new Error('CENTRALCART_API_KEY não configurada nos secrets.');
    return {
        'Authorization': `Bearer ${token}`,
        'Content-Type': 'application/json',
        'Accept': 'application/json',
    };
}

async function apiRequest(method, path, body = null) {
    const options = {
        method,
        headers: getHeaders(),
    };
    if (body) options.body = JSON.stringify(body);

    const res = await fetch(`${BASE_URL}${path}`, options);
    const json = await res.json().catch(() => null);

    if (!res.ok) {
        const msg = json?.message || json?.error || res.statusText;
        throw new Error(`CentralCart API [${res.status}]: ${msg}`);
    }
    return json;
}

// ── Loja ─────────────────────────────────────────────────────────────────────

async function getAppDetails() {
    return apiRequest('GET', '/app');
}

// ── Pacotes ───────────────────────────────────────────────────────────────────

async function listPackages({ page = 1, search = null, all = false } = {}) {
    const params = new URLSearchParams({ page });
    if (search) params.set('search', search);
    if (all) params.set('all', 'true');
    return apiRequest('GET', `/app/packages?${params}`);
}

async function getPackage(id) {
    return apiRequest('GET', `/app/packages/${id}`);
}

// ── Pedidos ───────────────────────────────────────────────────────────────────

async function listOrders({ page = 1, status = null, search = null } = {}) {
    const params = new URLSearchParams({ page });
    if (status) params.set('status', status);
    if (search) params.set('search', search);
    return apiRequest('GET', `/app/orders?${params}`);
}

async function getOrder(id) {
    return apiRequest('GET', `/app/orders/${id}`);
}

async function updateOrder(id, data) {
    return apiRequest('PUT', `/app/orders/${id}`, data);
}

// ── Relatórios ────────────────────────────────────────────────────────────────

async function getRevenueSummary() {
    return apiRequest('GET', '/app/reports/revenue-summary');
}

async function getOperations({ from, to } = {}) {
    const params = new URLSearchParams();
    if (from) params.set('from', from);
    if (to) params.set('to', to);
    return apiRequest('GET', `/app/reports/operations?${params}`);
}

async function getTopCustomers({ from, to } = {}) {
    const params = new URLSearchParams();
    if (from) params.set('from', from);
    if (to) params.set('to', to);
    return apiRequest('GET', `/app/utilities/get-top-customers?${params}`);
}

// ── Descontos ─────────────────────────────────────────────────────────────────

async function listDiscounts({ page = 1, coupon = null } = {}) {
    const params = new URLSearchParams({ page });
    if (coupon) params.set('coupon', coupon);
    return apiRequest('GET', `/app/discounts?${params}`);
}

async function createDiscount(data) {
    return apiRequest('POST', '/app/discounts', data);
}

async function deleteDiscount(id) {
    return apiRequest('DELETE', `/app/discounts/${id}`);
}

// ── Chaves de licença ─────────────────────────────────────────────────────────

async function listLicenseKeys(packageId) {
    return apiRequest('GET', `/app/packages/${packageId}/license-keys`);
}

async function addLicenseKeys(packageId, keys) {
    return apiRequest('POST', `/app/packages/${packageId}/license-keys`, { license_keys: keys });
}

// ── Checkout ──────────────────────────────────────────────────────────────────

async function createCheckout(data) {
    return apiRequest('POST', '/app/checkout', data);
}

module.exports = {
    getAppDetails,
    listPackages,
    getPackage,
    listOrders,
    getOrder,
    updateOrder,
    getRevenueSummary,
    getOperations,
    getTopCustomers,
    listDiscounts,
    createDiscount,
    deleteDiscount,
    listLicenseKeys,
    addLicenseKeys,
    createCheckout,
};
