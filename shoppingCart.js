(function () {
    const CART_KEY = 'shoppingCart';
    let currentSearchTerm = '';

    // Shopping Cart Data Structure
    function readCart() {
        try {
            return JSON.parse(localStorage.getItem(CART_KEY) || '[]');
        } catch (e) {
            return [];
        }
    }

    function writeCart(cart) {
        localStorage.setItem(CART_KEY, JSON.stringify(cart));
    }

    function readProducts() {
        try {
            return JSON.parse(localStorage.getItem('products') || '[]');
        } catch (e) {
            return [];
        }
    }

    // Add product to cart
    function addToCart(product, quantity = 1) {
        const cart = readCart();
        const existingItemIndex = cart.findIndex(item => item.productId === product.productId);

        if (existingItemIndex >= 0) {
            // Update quantity if product already in cart
            cart[existingItemIndex].quantity += quantity;
        } else {
            // Add new item to cart
            const cartItem = {
                productId: product.productId,
                productDescription: product.productDescription,
                productCategory: product.productCategory,
                productPrice: parseFloat(product.productPrice),
                productWeight: parseFloat(product.productWeight),
                quantity: quantity,
                addedAt: new Date().toISOString()
            };
            cart.push(cartItem);
        }

        writeCart(cart);
        renderCart();
        showCartJson();
        showSuccessMessage(`Added ${product.productDescription} to cart!`);
    }

    // Remove product from cart
    function removeFromCart(productId) {
        const cart = readCart();
        const updatedCart = cart.filter(item => item.productId !== productId);
        writeCart(updatedCart);
        renderCart();
        showCartJson();
    }

    // Update product quantity in cart
    function updateQuantity(productId, newQuantity) {
        if (newQuantity < 1) {
            removeFromCart(productId);
            return;
        }

        const cart = readCart();
        const itemIndex = cart.findIndex(item => item.productId === productId);

        if (itemIndex >= 0) {
            cart[itemIndex].quantity = newQuantity;
            writeCart(cart);
            renderCart();
            showCartJson();
        }
    }

    // Calculate cart totals
    function calculateCartTotals() {
        const cart = readCart();
        let itemCount = 0;
        let totalPrice = 0;
        let totalWeight = 0;

        cart.forEach(item => {
            itemCount += item.quantity;
            totalPrice += item.productPrice * item.quantity;
            totalWeight += item.productWeight * item.quantity;
        });

        return {
            itemCount: itemCount,
            totalPrice: totalPrice.toFixed(2),
            totalWeight: totalWeight.toFixed(2)
        };
    }

    // Render cart items
    function renderCart() {
        const cartItemsEl = document.getElementById('cartItems');
        const cartTotalEl = document.getElementById('cartTotal');
        const checkoutBtn = document.getElementById('checkoutButton');
        const clearCartBtn = document.getElementById('clearCartButton');
        const cart = readCart();

        if (!cartItemsEl) return;

        if (cart.length === 0) {
            cartItemsEl.innerHTML = '<p>Your cart is empty. Search for products above to add items to your cart.</p>';
            cartTotalEl.textContent = 'Total: $0.00';
            checkoutBtn.style.display = 'none';
            clearCartBtn.style.display = 'none';
            return;
        }

        let cartHTML = '';
        cart.forEach(item => {
            const itemTotal = (item.productPrice * item.quantity).toFixed(2);
            cartHTML += `
                <div class="cart-item">
                    <div class="cart-item-header">
                        <h5>${item.productDescription}</h5>
                        <button class="btn btn-sm btn-danger remove-item" data-product-id="${item.productId}">Remove</button>
                    </div>
                    <p><strong>Price:</strong> $${item.productPrice.toFixed(2)} each</p>
                    <p><strong>Weight:</strong> ${item.productWeight.toFixed(2)} lb each</p>
                    <div class="quantity-controls">
                        <label><strong>Quantity:</strong></label>
                        <button class="btn btn-sm btn-outline-secondary quantity-btn decrease" data-product-id="${item.productId}">-</button>
                        <span class="quantity-display">${item.quantity}</span>
                        <button class="btn btn-sm btn-outline-secondary quantity-btn increase" data-product-id="${item.productId}">+</button>
                    </div>
                    <p><strong>Item Total:</strong> $${itemTotal}</p>
                </div>
            `;
        });

        cartItemsEl.innerHTML = cartHTML;

        // Update totals
        const totals = calculateCartTotals();
        cartTotalEl.textContent = `Total: $${totals.totalPrice}`;

        // Update summary
        document.getElementById('itemCount').textContent = totals.itemCount;
        document.getElementById('totalPrice').textContent = totals.totalPrice;
        document.getElementById('totalWeight').textContent = totals.totalWeight;

        // Show buttons
        checkoutBtn.style.display = 'inline-block';
        clearCartBtn.style.display = 'inline-block';

        // Add event listeners for dynamic buttons
        attachCartEventListeners();
    }

    // Attach event listeners to dynamic cart elements
    function attachCartEventListeners() {
        // Remove item buttons
        document.querySelectorAll('.remove-item').forEach(button => {
            button.addEventListener('click', function() {
                const productId = this.getAttribute('data-product-id');
                removeFromCart(productId);
            });
        });

        // Quantity decrease buttons
        document.querySelectorAll('.quantity-btn.decrease').forEach(button => {
            button.addEventListener('click', function() {
                const productId = this.getAttribute('data-product-id');
                const cart = readCart();
                const item = cart.find(item => item.productId === productId);
                if (item) {
                    updateQuantity(productId, item.quantity - 1);
                }
            });
        });

        // Quantity increase buttons
        document.querySelectorAll('.quantity-btn.increase').forEach(button => {
            button.addEventListener('click', function() {
                const productId = this.getAttribute('data-product-id');
                const cart = readCart();
                const item = cart.find(item => item.productId === productId);
                if (item) {
                    updateQuantity(productId, item.quantity + 1);
                }
            });
        });
    }

    // Search products
    function searchProducts() {
        const term = document.getElementById('productSearch').value.trim().toLowerCase();
        $('#productSearchError').text('');


        // No ID will show everything
        if (!term) {
            renderAllProducts();
            currentSearchTerm = '';
            return;
        }


        const products = readProducts();
        const isNumeric = /^[0-9]+$/.test(term);


        let results = [];
        if (isNumeric) {
        // Numeric will match productId that *includes* the digits (e.g., "1" finds "10", "21")
            results = products.filter(p =>
                p.productId && p.productId.toString().trim().toLowerCase().includes(term)
            );
        } else {
        // Text will match description (contains) OR exact/partial id string
            results = products.filter(p => {
                const idStr = (p.productId || '').toString().trim().toLowerCase();
                const desc = (p.productDescription || '').toLowerCase();
                return desc.includes(term) || idStr.includes(term);
            });
        }


        displaySearchResults(results, { term });
        currentSearchTerm = term;
    }

    function getAllProducts() {
        return readProducts();
    }

    function renderAllProducts() {
        const products = getAllProducts();
        displaySearchResults(products, { showAll: true });
    }

    // Display search results
    function displaySearchResults(results, opts = {}) {
        const { term = '', showAll = false } = opts;
        const resultsSection = document.getElementById('searchResultsSection');
        const headerEl = document.getElementById('resultsHeader');
        const resultsEl = document.getElementById('searchResults');
        if (!resultsEl) return;


    // Make section always visable
        resultsSection.style.display = 'block';
        if (headerEl) headerEl.textContent = showAll || !term ? 'Available Products' : 'Search Results';


        if (!results || results.length === 0) {
            resultsEl.innerHTML = '<p>No products found matching your search.</p>';
            return;
        }


        let resultsHTML = '<div class="row">';
        results.forEach(product => {
            resultsHTML += `
<div class="col-md-6 mb-3">
<div class="card">
<div class="card-body">
<h5 class="card-title">${product.productDescription}</h5>
<p class="card-text">
<strong>ID:</strong> ${product.productId}<br>
<strong>Category:</strong> ${product.productCategory}<br>
<strong>Price:</strong> $${parseFloat(product.productPrice).toFixed(2)}<br>
<strong>Weight:</strong> ${product.productWeight} lb
</p>
<button class="btn btn-primary add-to-cart" data-product-id="${product.productId}">
Add to Cart
</button>
</div>
</div>
</div>`;
        });
        resultsHTML += '</div>';


        resultsEl.innerHTML = resultsHTML;


// Add event listeners to add-to-cart buttons
        document.querySelectorAll('.add-to-cart').forEach(button => {
            button.addEventListener('click', function() {
                const productId = this.getAttribute('data-product-id');
                const products = readProducts();
                const product = products.find(p => p.productId === productId);
                if (product) addToCart(product, 1);
            });
        });
    }

    // Show cart JSON document
    function showCartJson() {
        const cart = readCart();
        const jsonOutput = document.getElementById('cartJsonOutput');
        const jsonSection = document.getElementById('cartJsonSection');

        if (!jsonOutput || !jsonSection) return;

        const cartDocument = {
            cartId: generateCartId(),
            items: cart,
            totals: calculateCartTotals(),
            lastUpdated: new Date().toISOString()
        };

        jsonOutput.textContent = JSON.stringify(cartDocument, null, 2);
        jsonSection.style.display = 'block';

        // Send to REST API via AJAX
        sendCartToApi(cartDocument);
    }

    // Generate unique cart ID
    function generateCartId() {
        return 'cart_' + Date.now() + '_' + Math.random().toString(36).substr(2, 9);
    }

    // AJAX - Send cart to REST API
    function sendCartToApi(cartDocument) {
        // Simulate sending to REST API
        $.ajax({
            url: '',
            type: 'POST',
            contentType: 'application/json',
            data: JSON.stringify(cartDocument),
            success: function(response) {
                console.log('Cart data sent to API successfully:', response);
            },
            error: function(xhr, status, error) {
                console.error('Error sending cart data to API:', error);
            }
        });
    }

    // Clear entire cart
    function clearCart() {
        if (confirm('Are you sure you want to clear your entire cart?')) {
            writeCart([]);
            renderCart();
            document.getElementById('cartJsonSection').style.display = 'none';
            showSuccessMessage('Cart cleared successfully!');
        }
    }

    // Show success message
    function showSuccessMessage(message) {
        // Create temporary success message
        const messageEl = document.createElement('div');
        messageEl.className = 'alert alert-success alert-dismissible fade show';
        messageEl.innerHTML = `
            ${message}
            <button type="button" class="btn-close" data-bs-dismiss="alert"></button>
        `;

        const main = document.querySelector('main');
        main.insertBefore(messageEl, main.firstChild);

        // Auto remove after 3 seconds
        setTimeout(() => {
            if (messageEl.parentNode) {
                messageEl.remove();
            }
        }, 3000);
    }

    // Initialize shopping cart
    $(document).ready(function () {
        // Initial render
        renderCart();
        //show all items on load
        renderAllProducts();

        // Search button click
        $('#searchButton').on('click', searchProducts);

        // Enter key in search
        $('#productSearch').on('keydown', function (e) {
            if (e.key === 'Enter') {
                e.preventDefault();
                searchProducts();
            }
        });

        // Checkout button
        $('#checkoutButton').on('click', function() {
            const cart = readCart();
            if (cart.length === 0) {
                alert('Your cart is empty!');
                return;
            }
            alert('Checkout functionality would be implemented here!');
            // In a real application, this would redirect to checkout page
        });

        // Clear cart button
        $('#clearCartButton').on('click', clearCart);

        // Live search filter
        $('#productSearch').on('input', function () {
            searchProducts();
        });
    });
})();