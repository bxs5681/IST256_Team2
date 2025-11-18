$(function () {
    const LS_PRODUCTS = 'products';
    const LS_RETURNS = 'returnsDraft';
    let productCache = [];
    let returnItems = [];

    // Load available products (used for description lookup by productId)
    function loadProducts() {
        // try localStorage first
        const fromLS = localStorage.getItem(LS_PRODUCTS);
        if (fromLS) {
            productCache = JSON.parse(fromLS);
            return;
        }

        // fallback to productData.json
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

    // Render the returnItems table and JSON preview
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
                    renderReturns();
                });

            tr.append($('<td>').append(delBtn));
            $tbody.append(tr);
        });

        // Update JSON preview
        const jsonDoc = buildReturnDocument();
        $('#returnsJson').text(JSON.stringify(jsonDoc, null, 2));
    }

    function saveReturns() {
        localStorage.setItem(LS_RETURNS, JSON.stringify(returnItems));
    }

    // Build the payload document
    function buildReturnDocument() {
        return {
            shopperEmail: $('#returnEmail').val().trim(),
            orderNumber: $('#orderNumber').val().trim(),
            returnDate: new Date().toISOString(),
            items: returnItems
        };
    }

    // Add item to return
    $('#addReturnItemBtn').on('click', function () {
        if (!validateReturnsFormPart()) return;   // shopper + order basic validation
        if (!validateReturnItem()) return;        // item section validation

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
            $('#productLookupMsg').text('Product not found in current product list, adding with generic description.').css('color', 'orange');
        }

        returnItems.push({
            productId: id,
            productDesc: desc,
            reason: reason,
            qty: qty
        });

        saveReturns();
        renderReturns();

        // clear item fields
        $('#returnProductSearch').val('');
        $('#returnReason').val('');
        $('#returnQty').val('1');
    });

    // Submit the return document (demo)
    $('#submitReturnsBtn').on('click', function () {
        if (!validateReturnsFormPart()) return;
        if (!returnItems.length) {
            $('#ajaxMsg').text('Add at least one item to return.').css('color', 'red');
            return;
        }

        const payload = buildReturnDocument();

        $.ajax({
            url: 'https://ist256.up.ist.psu.edu:3002/products', // demo API
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
            } catch(e){}
            try {
                const cur = JSON.parse(localStorage.getItem('currentOrder') || 'null');
                if (cur && cur.orderId && !list.some(o => o.orderId === cur.orderId)) list.push(cur);
            } catch(e){}
            list.sort((a,b) => Date.parse(b.submittedAt||0) - Date.parse(a.submittedAt||0));
            return list;
        }

        const orders = readOrders();
        const hasAnyOrder = orders.length > 0;

        // Hard-gate: user must have placed an order
        if (!hasAnyOrder) {
            if (hint) hint.textContent = 'No prior orders found. You must place an order before starting a return.';
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
            return; // nothing else to do
        }

        // Populate dropdown
        if (selectEl) {
            orders.forEach(o => {
                const when = o.submittedAt ? new Date(o.submittedAt).toLocaleString() : 'Unknown time';
                const opt = document.createElement('option');
                opt.value = o.orderId;
                opt.textContent = `${o.orderId} — ${when}`;
                selectEl.appendChild(opt);
            });

            // Auto-populate when an order is chosen
            selectEl.addEventListener('change', function() {
                const chosenId = this.value;
                const chosen = orders.find(o => o.orderId === chosenId);

                // reset preview box
                if (itemsWrap) itemsWrap.classList.add('d-none');
                if (itemsEl) itemsEl.innerHTML = '';

                if (chosenId && chosen) {
                    if (orderNoEl) orderNoEl.value = chosenId;

                    try {
                        const cartItems = (chosen.cart && chosen.cart.items) ? chosen.cart.items : [];
                        // rebuild in-memory returnItems to match previous order
                        returnItems = (Array.isArray(cartItems) ? cartItems : []).map(function(it){
                            return {
                                productId: it.productId,
                                productDesc: it.productDescription || it.productDesc || '',
                                reason: 'Selected from previous order',
                                qty: (typeof it.quantity === 'number' && it.quantity > 0) ? it.quantity : 1
                            };
                        });

                        // persist + re-render (updates JSON preview)
                        saveReturns();
                        renderReturns();

                        // show items preview
                        if (itemsEl) {
                            const rows = returnItems.map(function(it){
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
        }
    })();

    // Restore any draft return items from localStorage
    const draft = localStorage.getItem(LS_RETURNS);
    if (draft) {
        try {
            returnItems = JSON.parse(draft);
        } catch (e) {
            returnItems = [];
        }
    }

    // Initial render
    renderReturns();
});
