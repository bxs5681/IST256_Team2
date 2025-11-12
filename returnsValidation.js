function clearReturnErrors() {
    ['returnEmail','orderNumber','returnProductSearch','returnReason','returnQty']
        .forEach(function(id) {
            const err = document.getElementById(id + 'Error');
            if (err) err.textContent = '';
        });
}

function validateReturnsFormPart() {
    clearReturnErrors();
    let ok = true;

    const email = document.getElementById('returnEmail').value.trim();
    const orderNo = document.getElementById('orderNumber').value.trim();
    const orderDropdown = document.getElementById('previousOrdersSelect');
    const selectedOrderFromDropdown = orderDropdown ? orderDropdown.value.trim() : '';

    if (!email) {
        document.getElementById('returnEmailError').textContent = 'Email is required';
        ok = false;
    } else if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
        document.getElementById('returnEmailError').textContent = 'Enter a valid email';
        ok = false;
    }

    if (!orderNo && !selectedOrderFromDropdown) {
        document.getElementById('orderNumberError').textContent = 'Order number is required';
        ok = false;
    }

    return ok;
}

// validate the product part before adding to list
function validateReturnItem() {
    let ok = true;

    const prod = document.getElementById('returnProductSearch').value.trim();
    const reason = document.getElementById('returnReason').value;
    const qty = document.getElementById('returnQty').value;

    if (!prod) {
        document.getElementById('returnProductSearchError').textContent = 'Enter a Product ID to return';
        ok = false;
    } else {
        document.getElementById('returnProductSearchError').textContent = '';
    }

    if (!reason) {
        document.getElementById('returnReasonError').textContent = 'Select a reason';
        ok = false;
    } else {
        document.getElementById('returnReasonError').textContent = '';
    }

    const q = Number(qty);
    if (!q || q < 1) {
        document.getElementById('returnQtyError').textContent = 'Qty must be 1 or more';
        ok = false;
    } else {
        document.getElementById('returnQtyError').textContent = '';
    }

    return ok;
}
