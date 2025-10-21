(function () {
    const LS_KEY = 'products';

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
        if (out) out.textContent = JSON.stringify(readProducts(), null, 2);
        const section = document.getElementById('jsonSection');
        if (section) section.style.display = 'block';
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
        out.textContent = JSON.stringify(toProfessorShape(p), null, 2);
        const section = document.getElementById('jsonSection');
        if (section) section.style.display = 'block';
    }

    function fillForm(p) {
        const f = document.getElementById('productManagementForm');
        if (!f || !p) return;

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
    }

    // Clear form fields
    function clearAddProductForm() {
        const f = document.getElementById('productManagementForm');
        if (!f) return;
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
        const i = list.findIndex(p => String(p.productId) === String(doc.productId));
        if (i >= 0) {
            doc.createdAt = list[i].createdAt || new Date().toISOString();
            list[i] = doc;
        } else {
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
                fillForm(found);
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

        // Save/Update product
        $('#productManagementForm').on('submit', function (e) {
            e.preventDefault();
            if (typeof validateProductManagementForm === 'function') {
                const ok = validateProductManagementForm();
                if (!ok) return false;
            }
            const doc = buildProductFromForm();
            upsertProduct(doc);
            renderAllJSON();
            alert('Product saved successfully!');
            return false;
        });
        // Reset localStorage when clicking Reset button
        $('#resetLocalStorage').on('click', function () {
            localStorage.removeItem('products');
            $('#resetMsg').text('Product storage cleared. Refreshing...');
            setTimeout(() => location.reload(), 800);
        });

    });
})();
