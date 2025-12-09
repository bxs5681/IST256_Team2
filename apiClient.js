// apiClient.js
// Shared front-end bridge for calling the Team 2 NodeJS API (team2_api.js)
// All pages (signup, products, shipping/billing, returns) should use this.

/**
 * IMPORTANT: If you end up using a hostname that matches your HTTPS cert,
 * change this to that host (e.g., "https://ist256.ist.psu.edu:3002/api").
 */
const API_BASE = "https://130.203.136.203:3002/api";

const ApiClient = {
    // Base AJAX helper
    _ajax: function (options) {
        const defaults = {
            contentType: "application/json",
            dataType: "json"
        };
        return $.ajax(Object.assign({}, defaults, options));
    },

    // ======================
    // USERS
    // ======================
    registerUser: function (user) {
        // user: { username, email, password }
        return this._ajax({
            url: API_BASE + "/users/register",
            method: "POST",
            data: JSON.stringify(user)
        });
    },

    loginUser: function (credentials) {
        // credentials: { usernameOrEmail, password }
        return this._ajax({
            url: API_BASE + "/users/login",
            method: "POST",
            data: JSON.stringify(credentials)
        });
    },

    // ======================
    // PRODUCTS
    // ======================
    createOrUpsertProduct: function (product) {
        // POST /api/products (single)
        return this._ajax({
            url: API_BASE + "/products",
            method: "POST",
            data: JSON.stringify(product)
        });
    },

    bulkSyncProducts: function (productsArray) {
        // POST /api/products/bulk
        return this._ajax({
            url: API_BASE + "/products/bulk",
            method: "POST",
            data: JSON.stringify({ products: productsArray })
        });
    },

    getProducts: function (options) {
        // options: { productId, description }
        let params = [];
        if (options && options.productId) {
            params.push("productId=" + encodeURIComponent(options.productId));
        }
        if (options && options.description) {
            params.push("description=" + encodeURIComponent(options.description));
        }
        const q = params.length ? "?" + params.join("&") : "";
        return this._ajax({
            url: API_BASE + "/products" + q,
            method: "GET"
        });
    },

    updateProduct: function (productId, updates) {
        return this._ajax({
            url: API_BASE + "/products/" + encodeURIComponent(productId),
            method: "PUT",
            data: JSON.stringify(updates)
        });
    },

    deleteProduct: function (productId) {
        return this._ajax({
            url: API_BASE + "/products/" + encodeURIComponent(productId),
            method: "DELETE"
        });
    },

    // ======================
    // ORDERS
    // ======================
    createOrder: function (orderObj) {
        // orderObj is the final order JSON from shipping/billing
        return this._ajax({
            url: API_BASE + "/orders",
            method: "POST",
            data: JSON.stringify(orderObj)
        });
    },

    getOrders: function (options) {
        // options: { orderId, email }
        let params = [];
        if (options && options.orderId) {
            params.push("orderId=" + encodeURIComponent(options.orderId));
        }
        if (options && options.email) {
            params.push("email=" + encodeURIComponent(options.email));
        }
        const q = params.length ? "?" + params.join("&") : "";
        return this._ajax({
            url: API_BASE + "/orders" + q,
            method: "GET"
        });
    },

    // ======================
    // RETURNS
    // ======================
    createReturn: function (returnObj) {
        // { shopperEmail, orderNumber, returnDate, items: [...] }
        return this._ajax({
            url: API_BASE + "/returns",
            method: "POST",
            data: JSON.stringify(returnObj)
        });
    },

    getReturns: function (options) {
        // options: { orderNumber, email }
        let params = [];
        if (options && options.orderNumber) {
            params.push("orderNumber=" + encodeURIComponent(options.orderNumber));
        }
        if (options && options.email) {
            params.push("email=" + encodeURIComponent(options.email));
        }
        const q = params.length ? "?" + params.join("&") : "";
        return this._ajax({
            url: API_BASE + "/returns" + q,
            method: "GET"
        });
    }
};
