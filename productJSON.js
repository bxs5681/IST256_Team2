(function () {
    const LS_KEY = 'products';
    let editingProductId = null;

    function readProducts() {
        try {
            return JSON.parse(localStorage.getItem(LS_KEY) || '[]');
        } catch (e) {
            return [];
        }
    }

    function writeProducts(list) {
        localStorage.setItem(LS_KEY, JSON.stringify(list));
    }

    // Seed from productData.json
    function seedIfNeeded() {
        if (readProducts().length) return;

        if (location.protocol === 'file:') {
            const el = document.getElementById('productDataSeed');
            if (el && el.textContent.trim()) {
                try {
                    const data = JSON.parse(el.textContent);
                    if (Array.isArray(data)) {
                        writeProducts(data);
                        renderAllJSON();
                    }
                } catch (err) {

                }
            }
            return;
        }

        $.getJSON('productData.json')
            .done(function (data) {
                if (Array.isArray(data)) {
                    writeProducts(data);
                    renderAllJSON();
                }
            })
            .fail(function () {

            });
    }

    function renderAllJSON() {
        const out = document.getElementById('jsonOutput');
        if (!out) return;

        const products = readProducts();
        out.innerHTML = ''; // Clear existing content

        if (products.length === 0) {
            out.textContent = 'No products found.';
            return;
        }

        // Create a container for each product with edit button
        products.forEach((product, index) => {
            const productContainer = document.createElement('div');
            productContainer.className = 'product-item mb-3 p-3 border rounded';

            // Product JSON display
            const pre = document.createElement('pre');
            pre.textContent = JSON.stringify(product, null, 2);
            pre.style.marginBottom = '10px';

            // Edit button for each product
            const editButton = document.createElement('button');
            editButton.textContent = 'Edit';
            editButton.className = 'btn btn-warning btn-sm';
            editButton.onclick = function () {
                fillForm(product);
            };

            productContainer.appendChild(pre);
            productContainer.appendChild(editButton);
            out.appendChild(productContainer);
        });

        const section = document.getElementById('jsonSection');
        if (section) section.style.display = 'block';
    }

    // Refresh display based on current search state after save
    function refreshDisplayAfterSave() {
        // If there's an active search, show only the searched product
        if (currentSearchTerm) {
            const list = readProducts();

            // Check if search is purely numeric → ID-only mode
            const isNumeric = /^[0-9]+$/.test(currentSearchTerm);

            let found = null;

            if (isNumeric) {
                // ID-only search
                found = list.find(p =>
                    p.productId &&
                    p.productId.toString().trim().toLowerCase() === currentSearchTerm
                );
            } else {
                // Description search allowed
                found = list.find(p =>
                    (p.productId && p.productId.toString().trim().toLowerCase() === currentSearchTerm) ||
                    (p.productDescription && p.productDescription.toLowerCase().includes(currentSearchTerm))
                );
            }

            if (found) {
                renderFoundProductJSON(found);
            } else {
                // If the searched product is no longer found (e.g., ID changed), show all
                renderAllJSON();
                currentSearchTerm = ''; // Clear search term since product not found
            }
        } else {
            // No active search, show all products
            renderAllJSON();
        }
    }

    function toProfessorShape(p) {
        return {
            productId: p.productId || '',
            productDesc: p.productDescription || '',
            productCategory: p.productCategory || '',
            productUOM: p.productUnit || '',
            productPrice: p.productPrice ? Number(p.productPrice) : null,
            productWeight: p.productWeight ? Number(p.productWeight) : null
        };
    }

    function renderFoundProductJSON(p) {
        const out = document.getElementById('jsonOutput');
        if (!out) return;

        out.innerHTML = ''; // Clear existing content

        const productContainer = document.createElement('div');
        productContainer.className = 'product-item mb-3 p-3 border rounded';

        // Product JSON display
        const pre = document.createElement('pre');
        pre.textContent = JSON.stringify(toProfessorShape(p), null, 2);
        pre.style.marginBottom = '10px';

        // Edit button for search results
        const editButton = document.createElement('button');
        editButton.textContent = 'Edit';
        editButton.className = 'btn btn-warning btn-sm';
        editButton.onclick = function () {
            fillForm(p);
        };

        productContainer.appendChild(pre);
        productContainer.appendChild(editButton);
        out.appendChild(productContainer);

        const section = document.getElementById('jsonSection');
        if (section) section.style.display = 'block';

    }

    let currentSearchTerm = '';

    function fillForm(p) {
        const f = document.getElementById('productManagementForm');
        if (!f || !p) return;

        // Store the current search term before filling the form
        currentSearchTerm = document.getElementById('productSearch').value.trim();

        // Set editing State: Store the original product ID we're editing
        editingProductId = p.productId;

        f.productId.value = p.productId || '';
        f.productDescription.value = p.productDescription || '';
        f.productCategory.value = p.productCategory || '';

        if (typeof updateSubcategories === 'function') {
            updateSubcategories(f.productCategory.value);
        }
        f.productSubcategory.value = p.productSubcategory || '';
        f.productUnit.value = p.productUnit || '';
        f.productPrice.value = p.productPrice != null ? String(p.productPrice) : '';
        f.productWeight.value = p.productWeight != null ? String(p.productWeight) : '';

        // Clear product submit message when filling form
        clearProductSubmitMessage();
    }


    // Clear form fields
    function clearAddProductForm() {
        const f = document.getElementById('productManagementForm');
        if (!f) return;

        // Reset editing state: Clear the editing tracking
        editingProductId = null;

        // Clear all form fields
        f.productId.value = '';
        f.productDescription.value = '';
        f.productCategory.value = '';

        // Reset subcategory dropdown
        if (typeof updateSubcategories === 'function') {
            updateSubcategories('');
        }
        f.productSubcategory.value = '';
        f.productUnit.value = '';
        f.productPrice.value = '';
        f.productWeight.value = '';

        // Also clear any error messages in the form
        const errorElements = f.querySelectorAll('.error-message');
        errorElements.forEach(el => el.textContent = '');

        // Clear duplicate ID styling
        clearDuplicateIdStyling();

        // Clear product submit message
        clearProductSubmitMessage();
    }

    // Check for duplicate product ID
    function isDuplicateProductId(productId) {
        if (!productId) return false; // Don't check empty IDs

        const products = readProducts();
        return products.some(product => {
            // If editing, skip checking against the product being edited
            if (editingProductId !== null && String(product.productId) === String(editingProductId)) {
                return false;
            }
            // Check if any other product has the same ID
            return String(product.productId) === String(productId);
        });
    }

// Show message in productSubmitMessage field with appropriate color
    function showProductSubmitMessage(message, isSuccess = true) {
        const $messageField = $('#productSubmitMessage');
        $messageField.text(message);

        if (isSuccess) {
            $messageField.css('color', 'green');
            // Auto-clear success messages after 3 seconds
            setTimeout(function () {
                if ($messageField.text() === message) {
                    clearProductSubmitMessage();
                }
            }, 3000);
        } else {
            $messageField.css('color', 'red');
        }
    }

// Clear message from productSubmitMessage field
    function clearProductSubmitMessage() {
        $('#productSubmitMessage').text('').css('color', '');
    }

    // Highlight product ID field as duplicate
    function highlightDuplicateId() {
        const productIdField = document.getElementById('productId');
        const productIdError = document.getElementById('productIdError');

        if (productIdField) {
            productIdField.classList.add('is-invalid');
            productIdField.style.borderColor = '#dc3545';
            productIdField.style.boxShadow = '0 0 0 0.2rem rgba(220, 53, 69, 0.25)';
        }

        if (productIdError) {
            productIdError.textContent = 'This Product ID already exists. Please use a different ID.';
            productIdError.style.display = 'block';
            productIdError.style.color = '#dc3545';
        }
    }

// Clear duplicate ID styling
    function clearDuplicateIdStyling() {
        const productIdField = document.getElementById('productId');
        const productIdError = document.getElementById('productIdError');

        if (productIdField) {
            productIdField.classList.remove('is-invalid');
            productIdField.style.borderColor = '';
            productIdField.style.boxShadow = '';
        }

        // Only clear the duplicate error, not validation errors
        if (productIdError && productIdError.textContent.includes('already exists')) {
            productIdError.textContent = '';
            productIdError.style.display = 'none';
        }
    }

    function buildProductFromForm() {
        const f = document.getElementById('productManagementForm');
        return {
            productId: (f.productId.value || '').trim(),
            productDescription: (f.productDescription.value || '').trim(),
            productCategory: f.productCategory.value,
            productSubcategory: f.productSubcategory.value,
            productUnit: f.productUnit.value,
            productPrice: Number((f.productPrice.value || '0')).toFixed(2),
            productWeight: f.productWeight.value ? Number(f.productWeight.value).toFixed(2) : null,
            updatedAt: new Date().toISOString()
        };
    }

    function upsertProduct(doc) {
        const list = readProducts();

        // If editing, find and update the existing product
        if (editingProductId !== null) {
            const i = list.findIndex(p => String(p.productId) === String(editingProductId));
            if (i >= 0) {
                // Preserve creation date
                doc.createdAt = list[i].createdAt || new Date().toISOString();
                list[i] = doc;
                writeProducts(list);
                return;
            }
        }

        // For new products, check if ID already exists
        const existingIndex = list.findIndex(p => String(p.productId) === String(doc.productId));
        if (existingIndex >= 0) {
            // Update existing if somehow we got here
            doc.createdAt = list[existingIndex].createdAt || new Date().toISOString();
            list[existingIndex] = doc;
        } else {
            // Add new product
            doc.createdAt = new Date().toISOString();
            list.push(doc);
        }
        writeProducts(list);
    }

    $(document).ready(function () {
        seedIfNeeded();
        renderAllJSON();

        // Search: Product ID OR Description (with numeric-safety)
        $('#searchButton').on('click', function () {
            const term = document.getElementById('productSearch').value.trim().toLowerCase();
            $('#productSearchError').text('');

            if (!term) {
                $('#productSearchError').text('Enter a Product ID or Description to search.');
                return;
            }

            const list = readProducts();

            // Check if search is purely numeric → ID-only mode
            const isNumeric = /^[0-9]+$/.test(term);

            let found = null;

            if (isNumeric) {
                // ID-only search
                found = list.find(p =>
                    p.productId &&
                    p.productId.toString().trim().toLowerCase() === term
                );
            } else {
                // Description search allowed
                found = list.find(p =>
                    (p.productId && p.productId.toString().trim().toLowerCase() === term) ||
                    (p.productDescription && p.productDescription.toLowerCase().includes(term))
                );
            }

            if (found) {
                renderFoundProductJSON(found);
            } else {
                $('#productSearchError').text('No product found for that Product ID or Description.');
            }
        });

        // Enter key triggers search
        $('#productSearch').on('keydown', function (e) {
            if (e.key === 'Enter') {
                e.preventDefault();
                $('#searchButton').click();
            }
        });

        // Clear form when search input changes
        $('#productSearch').on('input', function () {
            clearAddProductForm();

            // Show all products in JSON output
            renderAllJSON();

            // Clear search error message too
            $('#productSearchError').text('');
        });

// Form submit with duplicate validation
        $('#productManagementForm').on('submit', function (e) {
            e.preventDefault();

            // Clear previous product submit message
            clearProductSubmitMessage();
            clearDuplicateIdStyling();

            // Get current form data
            const doc = buildProductFromForm();

            // Run form validation first
            if (typeof validateProductManagementForm === 'function') {
                const ok = validateProductManagementForm();
                if (!ok) {
                    // Show validation error message
                    showProductSubmitMessage('Please fix the validation errors above.', false);
                    return false;
                }
            }

            // Check for duplicates AFTER validation passes but BEFORE saving
            if (isDuplicateProductId(doc.productId)) {
                showProductSubmitMessage('Error: Product ID already exists! Please use a different Product ID.', false);
                highlightDuplicateId(); // Add red styling to product ID field
                document.getElementById('productId').focus();
                return false;
            }

            // Save/Update product
            upsertProduct(doc);

            // Store editing state before clearing form
            const wasEditing = editingProductId !== null;

            clearAddProductForm();

            // Show appropriate success message
            if (wasEditing) {
                showProductSubmitMessage('Product updated successfully!', true); // true = success (green)
            } else {
                showProductSubmitMessage('Product saved successfully!', true); // true = success (green)
            }

            // Refresh the display
            refreshDisplayAfterSave();
            return false;
        });

        // Clear product submit message when product ID changes
        $('#productId').on('input', function () {
            clearProductSubmitMessage();
        });

        // Reset localStorage when clicking Reset button
        $('#resetLocalStorage').on('click', function () {
            localStorage.removeItem('products');
            $('#resetMsg').text('Product storage cleared. Refreshing...');
            setTimeout(() => location.reload(), 800);
        });

    });
})();
