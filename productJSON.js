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

    const API_BASE = "https://130.203.136.203:3002/api";

    function writeProducts(list) {
        localStorage.setItem(LS_KEY, JSON.stringify(list));

        // Also send the current product list to our backend API so MongoDB stays in sync.
        if (typeof $ !== 'undefined') {
            const payload = {
                products: list,
                lastUpdated: new Date().toISOString()
            };

            $.ajax({
                url: API_BASE + "/products/bulk",
                type: "POST",
                contentType: "application/json",
                data: JSON.stringify(payload),
                success: function (response) {
                    console.log("Products synced to API:", response);
                },
                error: function (error) {
                    console.error("API error when syncing products:", error);
                }
            });
        }
    }

    // Seed products either from MongoDB (preferred) or from the local JSON file
    function seedIfNeeded() {
        if (readProducts().length) return;

        function seedFromLocalFile() {
            if (location.protocol === "file:") {
                const el = document.getElementById("productDataSeed");
                if (el && el.textContent.trim()) {
                    try {
                        const data = JSON.parse(el.textContent);
                        if (Array.isArray(data)) {
                            writeProducts(data);
                            renderAllJSON();
                        }
                    } catch (err) {
                        console.warn("Failed to seed products from inline JSON:", err);
                    }
                }
                return;
            }

            if (typeof $ === "undefined") {
                return;
            }

            $.getJSON("productData.json")
                .done(function (data) {
                    if (Array.isArray(data)) {
                        writeProducts(data);
                        renderAllJSON();
                    }
                })
                .fail(function (err) {
                    console.warn("Failed to seed products from productData.json:", err);
                });
        }

        if (typeof $ === "undefined") {
            seedFromLocalFile();
            return;
        }

        // First try to seed from the database
        $.getJSON(API_BASE + "/products")
            .done(function (data) {
                if (Array.isArray(data) && data.length) {
                    writeProducts(data);
                    renderAllJSON();
                } else {
                    seedFromLocalFile();
                }
            })
            .fail(function () {
                // If the API is down or empty, fall back to the static JSON seed file.
                seedFromLocalFile();
            });
    }

    function renderAllJSON() {
        const out = document.getElementById('jsonOutput');
        if (!out) return;

        const products = readProducts();
        out.innerHTML = '';

        if (products.length === 0) {
            out.textContent = 'No products found.';
            return;
        }

        products.forEach((product, index) => {
            const productContainer = document.createElement('div');
            productContainer.className = 'product-json-item mb-3 p-2 border rounded';

            const header = document.createElement('div');
            header.className = 'd-flex justify-content-between align-items-center';

            const title = document.createElement('h6');
            title.textContent = `Product ID: ${product.productId}`;
            header.appendChild(title);

            const editButton = document.createElement('button');
            editButton.textContent = 'Edit';
            editButton.className = 'btn btn-sm btn-secondary';
            editButton.addEventListener('click', () => {
                loadProductIntoForm(product);
            });
            header.appendChild(editButton);

            productContainer.appendChild(header);

            const pre = document.createElement('pre');
            pre.textContent = JSON.stringify(product, null, 2);
            productContainer.appendChild(pre);

            out.appendChild(productContainer);
        });
    }

    function renderFoundProductJSON(product) {
        const out = document.getElementById('jsonOutput');
        if (!out) return;

        out.innerHTML = '';

        const productContainer = document.createElement('div');
        productContainer.className = 'product-json-item mb-3 p-2 border rounded';

        const header = document.createElement('div');
        header.className = 'd-flex justify-content-between align-items-center';

        const title = document.createElement('h6');
        title.textContent = `Product ID: ${product.productId}`;
        header.appendChild(title);

        const editButton = document.createElement('button');
        editButton.textContent = 'Edit';
        editButton.className = 'btn btn-sm btn-secondary';
        editButton.addEventListener('click', () => {
            loadProductIntoForm(product);
        });
        header.appendChild(editButton);

        productContainer.appendChild(header);

        const pre = document.createElement('pre');
        pre.textContent = JSON.stringify(product, null, 2);
        productContainer.appendChild(pre);

        out.appendChild(productContainer);
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

    function loadProductIntoForm(product) {
        const f = document.getElementById('productManagementForm');
        f.productId.value = product.productId;
        f.productDescription.value = product.productDescription;
        f.productCategory.value = product.productCategory;

        if (typeof updateSubcategories === 'function') {
            updateSubcategories(product.productCategory);
        }

        f.productSubcategory.value = product.productSubcategory;
        f.productUnit.value = product.productUnit;
        f.productPrice.value = product.productPrice;
        f.productWeight.value = product.productWeight;

        editingProductId = product.productId;

        document.getElementById('productId').readOnly = true;

        document.getElementById('productSubmitMessage').textContent = 'Editing existing product. Change fields and click Save to update.';
        document.getElementById('productSubmitMessage').style.color = 'blue';
    }

    function isDuplicateProductId(productId) {
        const products = readProducts();
        if (editingProductId !== null && String(productId) === String(editingProductId)) {
            return false;
        }
        return products.some(product => String(product.productId) === String(productId));
    }

    function clearDuplicateIdStyling() {
        const productIdField = document.getElementById('productId');
        if (productIdField) {
            productIdField.classList.remove('is-invalid');
        }
    }

    function highlightDuplicateId() {
        const productIdField = document.getElementById('productId');
        if (productIdField) {
            productIdField.classList.add('is-invalid');
        }
    }

    function clearAddProductForm() {
        const f = document.getElementById('productManagementForm');
        f.productId.value = '';
        f.productDescription.value = '';
        f.productCategory.value = '';

        if (typeof updateSubcategories === 'function') {
            updateSubcategories('');
        }
        f.productSubcategory.value = '';
        f.productUnit.value = '';
        f.productPrice.value = '';
        f.productWeight.value = '';

        document.getElementById('productId').readOnly = false;
        editingProductId = null;

        clearDuplicateIdStyling();
        clearProductSubmitMessage();
    }

    function showProductSubmitMessage(message, isSuccess = true) {
        const $messageField = $('#productSubmitMessage');
        $messageField.text(message);
        $messageField.css('color', isSuccess ? 'green' : 'red');
    }

    function clearProductSubmitMessage() {
        $('#productSubmitMessage').text('').css('color', '');
    }

    $(document).ready(function () {
        seedIfNeeded();
        renderAllJSON();

        $('#searchButton').on('click', function () {
            const term = document.getElementById('productSearch').value.trim().toLowerCase();
            $('#productSearchError').text('');

            if (!term) {
                $('#productSearchError').text('Enter a Product ID or Description to search.');
                return;
            }

            const list = readProducts();
            let currentSearchTerm = term;

            const isNumeric = /^[0-9]+$/.test(currentSearchTerm);
            let found = null;

            if (isNumeric) {
                found = list.find(p =>
                    p.productId &&
                    p.productId.toString().trim().toLowerCase() === currentSearchTerm
                );
            } else {
                found = list.find(p =>
                    (p.productId && p.productId.toString().trim().toLowerCase() === currentSearchTerm) ||
                    (p.productDescription && p.productDescription.toLowerCase().includes(currentSearchTerm))
                );
            }

            if (found) {
                renderFoundProductJSON(found);
            } else {
                renderAllJSON();
                currentSearchTerm = '';
            }
        });

        $('#showAllProductsButton').on('click', function () {
            $('#productSearchError').text('');
            renderAllJSON();
        });

        $('#productId').on('input', function () {
            clearProductSubmitMessage();
        });

        $('#productManagementForm').on('submit', function (e) {
            e.preventDefault();

            clearProductSubmitMessage();
            clearDuplicateIdStyling();

            const doc = buildProductFromForm();

            if (typeof validateProductManagementForm === 'function') {
                const ok = validateProductManagementForm();
                if (!ok) {
                    showProductSubmitMessage('Please fix the validation errors above.', false);
                    return false;
                }
            }

            if (isDuplicateProductId(doc.productId)) {
                showProductSubmitMessage('Error: Product ID already exists! Please use a different Product ID.', false);
                highlightDuplicateId();
                document.getElementById('productId').focus();
                return false;
            }

            upsertProduct(doc);

            const wasEditing = editingProductId !== null;
            clearAddProductForm();

            if (wasEditing) {
                showProductSubmitMessage('Product updated successfully!', true);
            } else {
                showProductSubmitMessage('Product saved successfully!', true);
            }

            renderAllJSON();
        });

        $('#resetLocalStorage').on('click', function () {
            localStorage.removeItem('products');
            $('#resetMsg').text('Product storage cleared. Refreshing...');
            setTimeout(() => location.reload(), 800);
        });
    });
})();
