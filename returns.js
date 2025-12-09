// returns.js
// Handle Returns page: build return JSON + send to Team 2 API and
// integrate with products & previous orders.

$(function () {
    const API_BASE = "https://130.203.136.203:3002/api";
    const LS_PRODUCTS = 'products';
    const LS_RETURNS = 'returnsDraft';
    let productCache = [];
    let returnItems = [];

    // Load available products (used for description lookup by productId)
    function loadProducts() {
        const fromLS = localStorage.getItem(LS_PRODUCTS);
        if (fromLS) {
            try {
                productCache = JSON.parse(fromLS);
                return;
            } catch (e) {
                productCache = [];
            }
        }

        // Try loading from MongoDB products collection via API
        $.getJSON(API_BASE + '/products')
            .done(function (data) {
                if (Array.isArray(data)) {
                    productCache = data;
                    try {
                        localStorage.setItem(LS_PRODUCTS, JSON.stringify(data));
                    } catch (e) {
                        console.warn('Unable to cache products to localStorage:', e);
                    }
                }
            })
            .fail(function () {
                console.warn('Unable to load products from API, falling back to productData.json.');
                // Fallback to static JSON if API not available
                $.getJSON('productData.json')
                    .done(function (data) {
                        if (Array.isArray(data)) {
                            productCache = data;
                        }
                    })
                    .fail(function () {
                        console.warn('Unable to load product data for returns page.');
                    });
            });
    }

    function findProductById(id) {
        if (!id) return null;
        const pid = String(id).trim().toLowerCase();

        const match = productCache.find(function (p) {
            return p && p.productId &&
                String(p.productId).trim().toLowerCase() === pid;
        });
        return match || null;
    }

    function renderReturns() {
        const $tableBody = $('#returnsTable tbody');
        const $jsonOut = $('#returnJsonOutput');

        $tableBody.empty();

        if (!returnItems.length) {
            $tableBody.append(
                '<tr><td colspan="5" class="text-center text-muted">No items added to return yet.</td></tr>'
            );
        } else {
            returnItems.forEach(function (item, idx) {
                const row = `
                    <tr data-index="${idx}">
                        <td>${item.productId}</td>
                        <td>${item.productDesc}</td>
                        <td>${item.reason}</td>
                        <td>${item.qty}</td>
                        <td>
                            <button class="btn btn-sm btn-danger btn-remove-item">Remove</button>
                        </td>
                    </tr>`;
                $tableBody.append(row);
            });
        }

        const payload = buildReturnDocument();
        $jsonOut.text(JSON.stringify(payload, null, 2));
    }

    function saveReturns() {
        try {
            localStorage.setItem(LS_RETURNS, JSON.stringify(returnItems));
        } catch (e) {
            console.warn('Unable to persist returns draft:', e);
        }
    }

    function buildReturnDocument() {
        return {
            shopperEmail: $('#returnEmail').val().trim(),
            orderNumber: $('#orderNumber').val().trim(),
            returnDate: new Date().toISOString(),
            items: returnItems
        };
    }

    $('#addReturnItemBtn').on('click', function () {
        if (!validateReturnsFormPart()) return;
        if (!validateReturnItem()) return;

        const id = $('#returnProductSearch').val().trim();
        const prod = findProductById(id);
        const reason = $('#returnReason').val();
        const qty = Number($('#returnQty').val());

        let desc = '';
        if (prod) {
            desc = prod.productDescription || prod.productDesc || '';
        }

        returnItems.push({
            productId: id,
            productDesc: desc || '(description not found in product list)',
            reason: reason,
            qty: qty
        });

        saveReturns();
        renderReturns();

        $('#returnProductSearch').val('');
        $('#returnReason').val('');
        $('#returnQty').val('1');
    });

    $('#returnsTable').on('click', '.btn-remove-item', function () {
        const index = $(this).closest('tr').data('index');
        if (index >= 0) {
            returnItems.splice(index, 1);
            saveReturns();
            renderReturns();
        }
    });

    $('#submitReturnsBtn').on('click', function () {
        if (!validateReturnsFormPart()) return;
        if (!returnItems.length) {
            $('#ajaxMsg').text('Add at least one item to return.').css('color', 'red');
            return;
        }

        const payload = buildReturnDocument();

        $.ajax({
            url: API_BASE + '/returns',
            type: 'POST',
            contentType: 'application/json',
            data: JSON.stringify(payload),
            success: function (resp) {
                $('#ajaxMsg').text('Return submitted to API successfully.').css('color', 'green');
                console.log('Return response:', resp);
            },
            error: function (xhr) {
                console.error('Return API error:', xhr);
                $('#ajaxMsg').text('There was a problem submitting your return.').css('color', 'red');
            }
        });
    });

    // ===== Previous Orders Integration & Auto-Populate =====
    (function setupPreviousOrdersIntegration() {
        const selectEl = document.getElementById('previousOrdersSelect');
        const orderNoEl = document.getElementById('orderNumber');
        const itemsWrap = document.getElementById('selectedOrderItemsWrap');
        const itemsEl = document.getElementById('selectedOrderItems');
        const addBtn = document.getElementById('addReturnItemBtn');
        const submitBtn = document.getElementById('submitReturnsBtn');
        const productSearch = document.getElementById('returnProductSearch');
        const reasonSel = document.getElementById('returnReason');
        const qtyInput = document.getElementById('returnQty');
        const hint = document.getElementById('previousOrderHint');

        function readOrders() {
            const list = [];
            try {
                const hist = JSON.parse(localStorage.getItem('orderHistory') || '[]');
                if (Array.isArray(hist)) hist.forEach(o => o && o.orderId && list.push(o));
            } catch (e) { }
            try {
                const cur = JSON.parse(localStorage.getItem('currentOrder') || 'null');
                if (cur && cur.orderId && !list.some(o => o.orderId === cur.orderId)) list.push(cur);
            } catch (e) { }
            list.sort((a, b) => Date.parse(b.submittedAt || 0) - Date.parse(a.submittedAt || 0));
            return list;
        }

        const orders = readOrders();
        const hasAnyOrder = orders.length > 0;

        if (!hasAnyOrder) {
            if (hint) hint.textContent = 'No prior orders found on this device. You must place an order before starting a return.';
            if (addBtn) addBtn.disabled = true;
            if (submitBtn) submitBtn.disabled = true;
            if (productSearch) productSearch.disabled = true;
            if (reasonSel) reasonSel.disabled = true;
            if (qtyInput) qtyInput.disabled = true;
            const noMsg = document.getElementById('noReturnsMsg');
            if (noMsg) {
                noMsg.textContent = 'You must place an order before you can submit a return.';
                noMsg.classList.remove('text-muted');
                noMsg.style.display = 'block';
            }
            return;
        }

        const defaultOption = document.createElement('option');
        defaultOption.value = '';
        defaultOption.textContent = '-- Select an order found on this device --';
        selectEl.appendChild(defaultOption);

        orders.forEach(o => {
            if (!o || !o.orderId) return;
            const when = o.submittedAt ? new Date(o.submittedAt).toLocaleString() : 'Unknown date';
            const opt = document.createElement('option');
            opt.value = o.orderId;
            opt.textContent = `${o.orderId} — ${when}`;
            selectEl.appendChild(opt);
        });

        selectEl.addEventListener('change', function () {
            const chosenId = this.value;
            const chosen = orders.find(o => o.orderId === chosenId);

            if (itemsWrap) itemsWrap.classList.add('d-none');
            if (itemsEl) itemsEl.innerHTML = '';

            if (chosenId && chosen) {
                if (orderNoEl) orderNoEl.value = chosenId;

                try {
                    let cartItems = [];
                    if (chosen.cart && Array.isArray(chosen.cart.items)) {
                        cartItems = chosen.cart.items;
                    } else if (Array.isArray(chosen.items)) {
                        cartItems = chosen.items;
                    }

                    returnItems = (Array.isArray(cartItems) ? cartItems : []).map(function (it) {
                        return {
                            productId: it.productId,
                            productDesc: it.productDescription || it.productDesc || '',
                            reason: 'Selected from previous order',
                            qty: (typeof it.quantity === 'number' && it.quantity > 0) ? it.quantity : 1
                        };
                    });

                    saveReturns();
                    renderReturns();

                    if (itemsEl) {
                        const rows = returnItems.map(function (it) {
                            return `<li><strong>${it.productId}</strong> — ${it.productDesc} (qty: ${it.qty})</li>`;
                        }).join('');
                        itemsEl.innerHTML = `<ul class="mb-0">${rows}</ul>`;
                    }
                    if (itemsWrap) itemsWrap.classList.remove('d-none');
                } catch (e) {
                    console.warn('Failed to auto-populate return items from order:', e);
                }
            }
        });
    })();

    loadProducts();

    const draft = localStorage.getItem(LS_RETURNS);
    if (draft) {
        try {
            returnItems = JSON.parse(draft);
        } catch (e) {
            returnItems = [];
        }
    }

    renderReturns();
});
