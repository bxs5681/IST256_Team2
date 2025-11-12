$(function () {
    const LS_PRODUCTS = 'products';
    const LS_RETURNS = 'returnsDraft';
    let productCache = [];
    let returnItems = [];

    function loadProducts() {
        // try localStorage first
        const fromLS = localStorage.getItem(LS_PRODUCTS);
        if (fromLS) {
            productCache = JSON.parse(fromLS);
            return;
        }

        // fallback
        $.getJSON('productData.json')
            .done(function (data) {
                if (Array.isArray(data)) {
                    productCache = data;
                }
            })
            .fail(function () {
                console.log('Could not load productData.json, using empty list.');
            });
    }

    loadProducts();

    function findProductById(id) {
        if (!id) return null;
        return productCache.find(p => String(p.productId) === String(id)) || null;
    }

    function renderReturns() {
        const $tbody = $('#returnsTableBody');
        $tbody.empty();

        if (!returnItems.length) {
            $('#noReturnsMsg').show();
        } else {
            $('#noReturnsMsg').hide();
        }

        returnItems.forEach(function (item, index) {
            const tr = $('<tr>');
            tr.append($('<td>').text(item.productId));
            tr.append($('<td>').text(item.productDesc));
            tr.append($('<td>').text(item.reason));
            tr.append($('<td>').text(item.qty));
            const delBtn = $('<button>')
                .addClass('btn btn-danger btn-sm')
                .text('Remove')
                .on('click', function () {
                    returnItems.splice(index, 1);
                    saveReturns();

                    // ===== Previous Orders Integration (reads from Shipping & Billing page localStorage) =====
                    (function setupPreviousOrdersIntegration() {
                        try {
                            const selectEl = document.getElementById('previousOrdersSelect');
                            if (!selectEl) return; // page might not have the selector yet

                            function readOrderHistory() {
                                const orders = [];
                                // Optional: orderHistory array (if exists)
                                try {
                                    const hist = JSON.parse(localStorage.getItem('orderHistory') || '[]');
                                    if (Array.isArray(hist)) {
                                        hist.forEach(o => { if (o && o.orderId) orders.push(o); });
                                    }
                                } catch (e) {}

                                // Always include currentOrder if present
                                try {
                                    const current = JSON.parse(localStorage.getItem('currentOrder') || 'null');
                                    if (current && current.orderId) {
                                        // de-dupe by orderId
                                        if (!orders.some(o => o.orderId === current.orderId)) {
                                            orders.push(current);
                                        }
                                    }
                                } catch (e) {}

                                // sort by submittedAt if available, newest first
                                orders.sort((a,b) => {
                                    const da = Date.parse(a.submittedAt || 0);
                                    const db = Date.parse(b.submittedAt || 0);
                                    return db - da;
                                });
                                return orders;
                            }

                            const orders = readOrderHistory();
                            if (orders.length === 0) {
                                // provide hint when no orders are found
                                const hint = document.getElementById('previousOrderHint');
                                if (hint) {
                                    hint.textContent = 'No prior orders found on this browser.';
                                }
                                return;
                            }

                            // populate dropdown
                            orders.forEach((o, idx) => {
                                const when = o.submittedAt ? new Date(o.submittedAt).toLocaleString() : 'Unknown time';
                                const opt = document.createElement('option');
                                opt.value = o.orderId;
                                opt.textContent = `${o.orderId} — ${when}`;
                                opt.dataset.index = idx;
                                selectEl.appendChild(opt);
                            });

                            // selection handler: auto-fill order number input and show items purchased
                            selectEl.addEventListener('change', function(e) {
                                const chosenId = this.value;
                                const orderNoEl = document.getElementById('orderNumber');
                                const itemsWrap = document.getElementById('selectedOrderItemsWrap');
                                const itemsEl = document.getElementById('selectedOrderItems');

                                if (chosenId && orderNoEl) {
                                    orderNoEl.value = chosenId;
                                    // trigger validation re-check if available
                                    if (typeof clearReturnErrors === 'function') {
                                        clearReturnErrors();
                                    }
                                    const chosen = orders.find(o => o.orderId === chosenId);
                                    if (chosen && itemsEl && itemsWrap) {
                                        const cart = (chosen.cart && chosen.cart.items) ? chosen.cart.items : [];
                                        if (Array.isArray(cart) && cart.length) {
                                            const rows = cart.map(it => {
                                                const qty = typeof it.quantity === 'number' ? it.quantity : 1;
                                                return `<li><strong>${it.productId}</strong> — ${it.productDescription || ''} (qty: ${qty})</li>`;
                                            }).join('');
                                            itemsEl.innerHTML = `<ul class="mb-0">${rows}</ul>`;
                                            itemsWrap.classList.remove('d-none');
                                        } else {
                                            itemsEl.innerHTML = `<em>No items available to display for this order.</em>`;
                                            itemsWrap.classList.remove('d-none');
                                        }
                                    }
                                } else {
                                    if (orderNoEl) orderNoEl.value = '';
                                    if (itemsWrap) itemsWrap.classList.add('d-none');
                                }
                                // Keep the returns JSON preview in sync
                                if (typeof renderReturns === 'function') {
                                    renderReturns();
                                }
                            });
                        } catch (e) {
                            console.warn('Previous order integration failed:', e);
                        }
                    })();

                    renderReturns();
                });
            tr.append($('<td>').append(delBtn));
            $tbody.append(tr);
        });

        // show JSON
        const jsonDoc = buildReturnDocument();
        $('#returnsJson').text(JSON.stringify(jsonDoc, null, 2));
    }

    function saveReturns() {
        localStorage.setItem(LS_RETURNS, JSON.stringify(returnItems));
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
        if (!validateReturnsFormPart()) return;      // shopper + order
        if (!validateReturnItem()) return;           // item piece

        const id = $('#returnProductSearch').val().trim();
        const prod = findProductById(id);
        const reason = $('#returnReason').val();
        const qty = Number($('#returnQty').val());

        let desc = '';
        if (prod) {
            desc = prod.productDescription || prod.productDesc || '';
            $('#productLookupMsg').text('Product found: ' + desc).css('color', 'green');
        } else {
            desc = '(Unknown / not in current product list)';
            $('#productLookupMsg').text('Product not found in local list, adding with generic description.').css('color', 'orange');
        }

        returnItems.push({
            productId: id,
            productDesc: desc,
            reason: reason,
            qty: qty
        });

        saveReturns();

        // ===== Previous Orders Integration (reads from Shipping & Billing page localStorage) =====
        (function setupPreviousOrdersIntegration() {
            try {
                const selectEl = document.getElementById('previousOrdersSelect');
                if (!selectEl) return; // page might not have the selector yet

                function readOrderHistory() {
                    const orders = [];
                    // Optional: orderHistory array (if exists)
                    try {
                        const hist = JSON.parse(localStorage.getItem('orderHistory') || '[]');
                        if (Array.isArray(hist)) {
                            hist.forEach(o => { if (o && o.orderId) orders.push(o); });
                        }
                    } catch (e) {}

                    // Always include currentOrder if present
                    try {
                        const current = JSON.parse(localStorage.getItem('currentOrder') || 'null');
                        if (current && current.orderId) {
                            // de-dupe by orderId
                            if (!orders.some(o => o.orderId === current.orderId)) {
                                orders.push(current);
                            }
                        }
                    } catch (e) {}

                    // sort by submittedAt if available, newest first
                    orders.sort((a,b) => {
                        const da = Date.parse(a.submittedAt || 0);
                        const db = Date.parse(b.submittedAt || 0);
                        return db - da;
                    });
                    return orders;
                }

                const orders = readOrderHistory();
                if (orders.length === 0) {
                    // provide hint when no orders are found
                    const hint = document.getElementById('previousOrderHint');
                    if (hint) {
                        hint.textContent = 'No prior orders found on this browser.';
                    }
                    return;
                }

                // populate dropdown
                orders.forEach((o, idx) => {
                    const when = o.submittedAt ? new Date(o.submittedAt).toLocaleString() : 'Unknown time';
                    const opt = document.createElement('option');
                    opt.value = o.orderId;
                    opt.textContent = `${o.orderId} — ${when}`;
                    opt.dataset.index = idx;
                    selectEl.appendChild(opt);
                });

                // selection handler: auto-fill order number input and show items purchased
                selectEl.addEventListener('change', function(e) {
                    const chosenId = this.value;
                    const orderNoEl = document.getElementById('orderNumber');
                    const itemsWrap = document.getElementById('selectedOrderItemsWrap');
                    const itemsEl = document.getElementById('selectedOrderItems');

                    if (chosenId && orderNoEl) {
                        orderNoEl.value = chosenId;
                        // trigger validation re-check if available
                        if (typeof clearReturnErrors === 'function') {
                            clearReturnErrors();
                        }
                        const chosen = orders.find(o => o.orderId === chosenId);
                        if (chosen && itemsEl && itemsWrap) {
                            const cart = (chosen.cart && chosen.cart.items) ? chosen.cart.items : [];
                            if (Array.isArray(cart) && cart.length) {
                                const rows = cart.map(it => {
                                    const qty = typeof it.quantity === 'number' ? it.quantity : 1;
                                    return `<li><strong>${it.productId}</strong> — ${it.productDescription || ''} (qty: ${qty})</li>`;
                                }).join('');
                                itemsEl.innerHTML = `<ul class="mb-0">${rows}</ul>`;
                                itemsWrap.classList.remove('d-none');
                            } else {
                                itemsEl.innerHTML = `<em>No items available to display for this order.</em>`;
                                itemsWrap.classList.remove('d-none');
                            }
                        }
                    } else {
                        if (orderNoEl) orderNoEl.value = '';
                        if (itemsWrap) itemsWrap.classList.add('d-none');
                    }
                    // Keep the returns JSON preview in sync
                    if (typeof renderReturns === 'function') {
                        renderReturns();
                    }
                });
            } catch (e) {
                console.warn('Previous order integration failed:', e);
            }
        })();

        renderReturns();

        // clear item fields
        $('#returnProductSearch').val('');
        $('#returnReason').val('');
        $('#returnQty').val('1');
    });

    $('#submitReturnsBtn').on('click', function () {
        if (!validateReturnsFormPart()) return;
        if (!returnItems.length) {
            $('#ajaxMsg').text('Add at least one item to return.').css('color', 'red');
            return;
        }

        const payload = buildReturnDocument();

        $.ajax({
            url: 'https://jsonplaceholder.typicode.com/posts',  // new, CORS-friendly test API
            type: 'POST',
            contentType: 'application/json',
            data: JSON.stringify(payload),
            success: function (resp) {
                $('#ajaxMsg').text('Return submitted (demo). See console for response.').css('color', 'green');
                console.log('Return response:', resp);
            },
            error: function () {
                $('#ajaxMsg').text('Error sending return document.').css('color', 'red');
            }
        });

    });

    const draft = localStorage.getItem(LS_RETURNS);
    if (draft) {
        try {
            returnItems = JSON.parse(draft);
        } catch (e) {
            returnItems = [];
        }
    }


    // ===== Previous Orders Integration (reads from Shipping & Billing page localStorage) =====
    (function setupPreviousOrdersIntegration() {
        try {
            const selectEl = document.getElementById('previousOrdersSelect');
            if (!selectEl) return; // page might not have the selector yet

            function readOrderHistory() {
                const orders = [];
                // Optional: orderHistory array (if exists)
                try {
                    const hist = JSON.parse(localStorage.getItem('orderHistory') || '[]');
                    if (Array.isArray(hist)) {
                        hist.forEach(o => { if (o && o.orderId) orders.push(o); });
                    }
                } catch (e) {}

                // Always include currentOrder if present
                try {
                    const current = JSON.parse(localStorage.getItem('currentOrder') || 'null');
                    if (current && current.orderId) {
                        // de-dupe by orderId
                        if (!orders.some(o => o.orderId === current.orderId)) {
                            orders.push(current);
                        }
                    }
                } catch (e) {}

                // sort by submittedAt if available, newest first
                orders.sort((a,b) => {
                    const da = Date.parse(a.submittedAt || 0);
                    const db = Date.parse(b.submittedAt || 0);
                    return db - da;
                });
                return orders;
            }

            const orders = readOrderHistory();
            if (orders.length === 0) {
                // provide hint when no orders are found
                const hint = document.getElementById('previousOrderHint');
                if (hint) {
                    hint.textContent = 'No prior orders found on this browser.';
                }
                return;
            }

            // populate dropdown
            orders.forEach((o, idx) => {
                const when = o.submittedAt ? new Date(o.submittedAt).toLocaleString() : 'Unknown time';
                const opt = document.createElement('option');
                opt.value = o.orderId;
                opt.textContent = `${o.orderId} — ${when}`;
                opt.dataset.index = idx;
                selectEl.appendChild(opt);
            });

            // selection handler: auto-fill order number input and show items purchased
            selectEl.addEventListener('change', function(e) {
                const chosenId = this.value;
                const orderNoEl = document.getElementById('orderNumber');
                const itemsWrap = document.getElementById('selectedOrderItemsWrap');
                const itemsEl = document.getElementById('selectedOrderItems');

                if (chosenId && orderNoEl) {
                    orderNoEl.value = chosenId;
                    // trigger validation re-check if available
                    if (typeof clearReturnErrors === 'function') {
                        clearReturnErrors();
                    }
                    const chosen = orders.find(o => o.orderId === chosenId);
                    if (chosen && itemsEl && itemsWrap) {
                        const cart = (chosen.cart && chosen.cart.items) ? chosen.cart.items : [];
                        if (Array.isArray(cart) && cart.length) {
                            const rows = cart.map(it => {
                                const qty = typeof it.quantity === 'number' ? it.quantity : 1;
                                return `<li><strong>${it.productId}</strong> — ${it.productDescription || ''} (qty: ${qty})</li>`;
                            }).join('');
                            itemsEl.innerHTML = `<ul class="mb-0">${rows}</ul>`;
                            itemsWrap.classList.remove('d-none');
                        } else {
                            itemsEl.innerHTML = `<em>No items available to display for this order.</em>`;
                            itemsWrap.classList.remove('d-none');
                        }
                    }
                } else {
                    if (orderNoEl) orderNoEl.value = '';
                    if (itemsWrap) itemsWrap.classList.add('d-none');
                }
                // Keep the returns JSON preview in sync
                if (typeof renderReturns === 'function') {
                    renderReturns();
                }
            });
        } catch (e) {
            console.warn('Previous order integration failed:', e);
        }
    })();

    renderReturns();
});
