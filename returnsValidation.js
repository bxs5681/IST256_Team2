function clearReturnErrors() {
    ['returnEmail','orderNumber','returnProductSearch','returnReason','returnQty']
        .forEach(function(id) {
            const err = document.getElementById(id + 'Error');
            if (err) err.textContent = '';
        });
}

// Validate a single return-line entry
function validateReturnItem() {
    let ok = true;

    const prodId = (document.getElementById('returnProductSearch')?.value || '').trim();
    const reason = (document.getElementById('returnReason')?.value || '').trim();
    const qty = (document.getElementById('returnQty')?.value || '').trim();

    if (!prodId) {
        const e = document.getElementById('returnProductSearchError');
        if (e) e.textContent = 'Enter a Product ID';
        ok = false;
    } else {
        const e = document.getElementById('returnProductSearchError');
        if (e) e.textContent = '';
    }

    if (!reason) {
        const e = document.getElementById('returnReasonError');
        if (e) e.textContent = 'Select a reason';
        ok = false;
    } else {
        const e = document.getElementById('returnReasonError');
        if (e) e.textContent = '';
    }

    const q = Number(qty);
    if (!q || q < 1) {
        const e = document.getElementById('returnQtyError');
        if (e) e.textContent = 'Qty must be 1 or more';
        ok = false;
    } else {
        const e = document.getElementById('returnQtyError');
        if (e) e.textContent = '';
    }

    return ok;
}

// Validate shopper/order part of the form
function validateReturnsFormPart() {
    clearReturnErrors();
    let ok = true;

    // MUST_HAVE_ORDER_CHECK: user must have a prior order saved on this device
    try {
        const hist = JSON.parse(localStorage.getItem('orderHistory') || '[]');
        const cur = JSON.parse(localStorage.getItem('currentOrder') || 'null');
        const hasHistory = Array.isArray(hist) && hist.length > 0;
        const hasCurrent = !!cur;
        if (!hasHistory && !hasCurrent) {
            const err = document.getElementById('orderNumberError');
            if (err) err.textContent = 'You must place an order before making a return.';
            return false;
        }
    } catch(e){}

    const email = (document.getElementById('returnEmail')?.value || '').trim();
    const orderNo = (document.getElementById('orderNumber')?.value || '').trim();
    const orderDropdown = document.getElementById('previousOrdersSelect');
    const selectedOrderFromDropdown = orderDropdown ? (orderDropdown.value || '').trim() : '';

    if (!email || !/^\S+@\S+\.\S+$/.test(email)) {
        const e = document.getElementById('returnEmailError');
        if (e) e.textContent = 'Enter a valid email';
        ok = false;
    } else {
        const e = document.getElementById('returnEmailError');
        if (e) e.textContent = '';
    }

    // Allow either typed order number OR a selected previous order
    if (!orderNo && !selectedOrderFromDropdown) {
        const e = document.getElementById('orderNumberError');
        if (e) e.textContent = 'Enter an order number or select a previous order';
        ok = false;
    } else {
        const e = document.getElementById('orderNumberError');
        if (e) e.textContent = '';
    }

    return ok;
}
