// shopperJSON.js
// Team Member: Vedang — JSON Shopper Document collection
// Purpose: After your existing validation runs (and stores to localStorage),
// read the last saved shopper object and display it as formatted JSON on the page.

function handleShopperSubmit(event) {
    event.preventDefault(); // prevent page reload

    // Reuse your existing validation (kept exactly as-is in shopperManagementValidation.js)
    // That function already: clears errors, validates, builds shopperDoc, stores to localStorage('shoppers')
    const ok = validateShopperManagementForm();
    if (!ok) return false;

    // Pull the last saved shopper from localStorage (what your validator just saved)
    const list = JSON.parse(localStorage.getItem('shoppers') || '[]');
    const last = list.length ? list[list.length - 1] : null;

    const outputDiv = document.getElementById('jsonOutput');
    if (!outputDiv) return false;

    if (last) {
        outputDiv.textContent = JSON.stringify(last, null, 2);
    } else {
        outputDiv.textContent = 'No shopper data found.';
    }

    // Do not reload the page; assignment asks to show the JSON on the page.
    return false;
}
