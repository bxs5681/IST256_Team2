// shopperJSON.js
// Purpose: After your existing validation runs (and stores to localStorage),
// read the last saved shopper object and display it as formatted JSON on the page.

function handleShopperSubmit(event) {
    event.preventDefault(); // prevent page reload

    // Reuse your existing validation (kept exactly as-is in shopperValidation.js)
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

    // CLEAR THE FORM AFTER SUCCESSFUL SUBMISSION
    clearForm();

    // Do not reload the page; assignment asks to show the JSON on the page.
    return false;
}

// Function to clear all form fields
function clearForm() {
    const form = document.getElementById('shopperManagementForm');
    if (!form) return;

    // Clear text/email/phone inputs
    form.shopperName.value = '';
    form.shopperEmail.value = '';
    form.shopperPhoneNumber.value = '';
    form.shopperAge.value = '';
    form.shopperAddress.value = '';

    // Uncheck the terms checkbox
    form.terms.checked = false;

    // Clear any remaining error styling
    clearAllErrors();
}

// SEARCH FUNCTIONALITY
function searchShoppers() {
    const searchInput = document.getElementById('shopperSearch');
    const searchError = document.getElementById('shopperSearchError');
    const searchResultsDiv = document.getElementById('searchResults');
    const searchResultsContent = document.getElementById('searchResultsContent');

    if (!searchInput || !searchError || !searchResultsDiv || !searchResultsContent) return;

    const searchTerm = searchInput.value.trim();

    // Clear previous errors and results
    searchError.textContent = '';
    searchResultsContent.innerHTML = '';

    if (!searchTerm) {
        searchError.textContent = 'Please enter a search term';
        searchResultsDiv.style.display = 'none';
        return;
    }

    // Get all shoppers from localStorage
    const shoppers = JSON.parse(localStorage.getItem('shoppers') || '[]');

    if (shoppers.length === 0) {
        searchResultsContent.innerHTML = '<p class="text-muted">No shoppers found in database.</p>';
        searchResultsDiv.style.display = 'block';
        return;
    }

    // Search by name or email (case-insensitive)
    const results = shoppers.filter(shopper => {
        const nameMatch = shopper.name.toLowerCase().includes(searchTerm.toLowerCase());
        const emailMatch = shopper.email.toLowerCase().includes(searchTerm.toLowerCase());
        return nameMatch || emailMatch;
    });

    if (results.length === 0) {
        searchResultsContent.innerHTML = `<p>No shoppers found matching "<strong>${searchTerm}</strong>"</p>`;
        searchResultsDiv.style.display = 'block';
        return;
    }

    // Display results in a formatted way
    let html = `<p class="mb-3"><strong>Found ${results.length} shopper(s):</strong></p>`;

    results.forEach((shopper, index) => {
        const highlightedName = highlightText(shopper.name, searchTerm);
        const highlightedEmail = highlightText(shopper.email, searchTerm);

        html += `
            <div class="search-result-item mb-3 p-3 border rounded">
                <h6>Shopper #${index + 1}</h6>
                <p><strong>Name:</strong> ${highlightedName}</p>
                <p><strong>Email:</strong> ${highlightedEmail}</p>
                <p><strong>Phone:</strong> ${shopper.phone}</p>
                <p><strong>Age:</strong> ${shopper.age}</p>
                <p class="small text-muted">Added: ${new Date(shopper.createdAt).toLocaleDateString()}</p>
            </div>
        `;
    });

    searchResultsContent.innerHTML = html;
    searchResultsDiv.style.display = 'block';
}

// Helper function to highlight search terms
function highlightText(text, searchTerm) {
    if (!text || !searchTerm) return text;

    const regex = new RegExp(`(${searchTerm})`, 'gi');
    return text.replace(regex, '<span class="search-highlight">$1</span>');
}

// Setup event listeners
document.addEventListener('DOMContentLoaded', function() {
    const form = document.getElementById('shopperManagementForm');
    const searchButton = document.getElementById('searchButton');
    const searchInput = document.getElementById('shopperSearch');

    // Form submission
    if (form) {
        form.addEventListener('submit', handleShopperSubmit);
    }

    // Search button click
    if (searchButton) {
        searchButton.addEventListener('click', searchShoppers);
    }

    // Search on Enter key in search input
    if (searchInput) {
        searchInput.addEventListener('keypress', function(event) {
            if (event.key === 'Enter') {
                event.preventDefault();
                searchShoppers();
            }
        });
    }

    // Optional: Clear search when user starts typing again
    if (searchInput) {
        searchInput.addEventListener('input', function() {
            document.getElementById('shopperSearchError').textContent = '';
        });
    }
});