angular.module('shippingApp', [])
    .controller('ShippingController', ['$scope', '$timeout', function($scope, $timeout) {
        // Initialize shipping data with empty values
        $scope.shippingData = {
            address: '',
            city: '',
            state: '',
            zipCode: '',
            shippingCarrier: '',
            shippingMethod: '',
            specialInstructions: ''
        };

        $scope.validationErrors = {
            address: '',
            city: '',
            state: '',
            zipCode: '',
            shippingCarrier: '',
            shippingMethod: ''
        };

        $scope.orderSubmitted = false;
        $scope.showSuccess = false;
        $scope.finalOrderJson = 'Fill out the shipping form to see order preview';
        $scope.cartSummary = null;
        $scope.cartItems = [];
        $scope.shippingCost = '0.00';
        $scope.estimatedDelivery = '';

        function loadCartData() {
            const cartJson = localStorage.getItem('checkoutCart');
            if (cartJson) {
                try {
                    const cart = JSON.parse(cartJson);
                    $scope.cartSummary = cart.totals;
                    $scope.cartItems = cart.items;
                    $scope.$apply(); // Ensure Angular knows about the changes
                } catch (e) {
                    console.error('Error loading cart:', e);
                }
            } else {
                console.log('No cart data found');
                $scope.cartSummary = null;
            }
        }

        // FUNCTION: Clear the shopping cart from localStorage
        function clearShoppingCart() {
            try {
                // Clear the main shopping cart
                localStorage.removeItem('shoppingCart');

                // Also clear the checkout cart to be thorough
                localStorage.removeItem('checkoutCart');

                console.log('Shopping cart cleared successfully');
                return true;
            } catch (e) {
                console.error('Error clearing shopping cart:', e);
                return false;
            }
        }

        $scope.validateField = function(fieldName, value) {
            let error = '';
            switch(fieldName) {
                case 'address':
                    error = ShippingValidator.validateAddress(value);
                    break;
                case 'city':
                    error = ShippingValidator.validateCity(value);
                    break;
                case 'state':
                    error = ShippingValidator.validateState(value);
                    break;
                case 'zipCode':
                    error = ShippingValidator.validateZipCode(value);
                    break;
                case 'shippingCarrier':
                    error = ShippingValidator.validateShippingCarrier(value);
                    break;
                case 'shippingMethod':
                    error = ShippingValidator.validateShippingMethod(value);
                    break;
            }
            $scope.validationErrors[fieldName] = error;

            // Update shipping calculations when carrier or method changes
            if (fieldName === 'shippingCarrier' || fieldName === 'shippingMethod') {
                $scope.calculateShipping();
            }

            // Update JSON preview
            $scope.updateOrderJson();
        };

        $scope.hasValidationErrors = function() {
            return Object.values($scope.validationErrors).some(error => error !== '');
        };

        $scope.hasError = function(fieldName) {
            return $scope.validationErrors[fieldName] !== '';
        };

        $scope.calculateShipping = function() {
            if ($scope.shippingData.shippingCarrier && $scope.shippingData.shippingMethod && $scope.cartSummary) {
                const weight = parseFloat($scope.cartSummary.totalWeight) || 0;
                $scope.shippingCost = ShippingValidator.calculateShippingCost(
                    $scope.shippingData.shippingCarrier,
                    $scope.shippingData.shippingMethod,
                    weight
                );
                $scope.estimatedDelivery = ShippingValidator.estimateDeliveryDate(
                    $scope.shippingData.shippingMethod
                );
            } else {
                $scope.shippingCost = '0.00';
                $scope.estimatedDelivery = '';
            }
            return $scope.shippingCost;
        };

        $scope.calculateTotal = function() {
            const subtotal = $scope.cartSummary ? parseFloat($scope.cartSummary.totalPrice) : 0;
            const shipping = parseFloat($scope.shippingCost) || 0;
            return (subtotal + shipping).toFixed(2);
        };

        // Update JSON preview in real-time
        $scope.updateOrderJson = function() {
            if (!$scope.cartSummary) {
                $scope.finalOrderJson = 'Fill out the shipping form to see order preview';
                return;
            }

            const orderPreview = {
                orderId: 'PREVIEW_' + Date.now(),
                status: 'DRAFT',
                cart: {
                    itemCount: $scope.cartSummary.itemCount,
                    totalPrice: $scope.cartSummary.totalPrice,
                    totalWeight: $scope.cartSummary.totalWeight
                },
                shipping: {
                    destination: {
                        address: $scope.shippingData.address || 'Not provided',
                        city: $scope.shippingData.city || 'Not provided',
                        state: $scope.shippingData.state || 'Not provided',
                        zipCode: $scope.shippingData.zipCode || 'Not provided'
                    },
                    carrier: $scope.shippingData.shippingCarrier || 'Not selected',
                    method: $scope.shippingData.shippingMethod || 'Not selected',
                    cost: $scope.shippingCost || '0.00',
                    estimatedDelivery: $scope.estimatedDelivery || 'Not calculated'
                },
                totals: {
                    subtotal: $scope.cartSummary.totalPrice,
                    shipping: $scope.shippingCost || '0.00',
                    total: $scope.calculateTotal()
                },
                specialInstructions: $scope.shippingData.specialInstructions || 'None',
                lastUpdated: new Date().toISOString()
            };

            $scope.finalOrderJson = JSON.stringify(orderPreview, null, 2);
        };

        function generateFinalOrderJson() {
            const order = {
                orderId: 'ORD_' + Date.now(),
                status: 'SUBMITTED',
                cart: JSON.parse(localStorage.getItem('checkoutCart')),
                shipping: {
                    destination: {
                        address: $scope.shippingData.address,
                        city: $scope.shippingData.city,
                        state: $scope.shippingData.state,
                        zipCode: $scope.shippingData.zipCode
                    },
                    carrier: $scope.shippingData.shippingCarrier,
                    method: $scope.shippingData.shippingMethod,
                    cost: $scope.shippingCost || '0.00',
                    estimatedDelivery: $scope.estimatedDelivery
                },
                totals: {
                    subtotal: $scope.cartSummary.totalPrice,
                    shipping: $scope.shippingCost || '0.00',
                    total: $scope.calculateTotal()
                },
                specialInstructions: $scope.shippingData.specialInstructions || 'None',
                submittedAt: new Date().toISOString()
            };
            return JSON.stringify(order, null, 2);
        }

        $scope.submitOrder = function() {
            // Validate all fields
            $scope.validateField('address', $scope.shippingData.address);
            $scope.validateField('city', $scope.shippingData.city);
            $scope.validateField('state', $scope.shippingData.state);
            $scope.validateField('zipCode', $scope.shippingData.zipCode);
            $scope.validateField('shippingCarrier', $scope.shippingData.shippingCarrier);
            $scope.validateField('shippingMethod', $scope.shippingData.shippingMethod);

            if ($scope.hasValidationErrors()) {
                const errorMessages = Object.values($scope.validationErrors)
                    .filter(error => error !== '')
                    .join('\n• ');
                alert('❌ Please fix the following errors:\n\n• ' + errorMessages);
                return false;
            }

            // Check if cart exists
            if (!$scope.cartSummary) {
                alert('❌ No cart data found. Please return to shopping cart and try again.');
                return false;
            }

            const confirmationMessage =
                `ORDER CONFIRMATION\n\n` +
                `Items: ${$scope.cartSummary.itemCount}\n` +
                `Subtotal: $${$scope.cartSummary.totalPrice}\n` +
                `Shipping: $${$scope.shippingCost}\n` +
                `Total: $${$scope.calculateTotal()}\n\n` +
                `Shipping to:\n` +
                `${$scope.shippingData.address}\n` +
                `${$scope.shippingData.city}, ${$scope.shippingData.state} ${$scope.shippingData.zipCode}\n\n` +
                `Carrier: ${$scope.shippingData.shippingCarrier} ${$scope.shippingData.shippingMethod}\n` +
                `Delivery: ${$scope.estimatedDelivery}\n\n` +
                `Do you want to complete this order?`;

            const isConfirmed = confirm(confirmationMessage);
            if (!isConfirmed) return false;

            processOrder();
            return false;
        };

        function processOrder() {
            $scope.finalOrderJson = generateFinalOrderJson();
            $scope.orderSubmitted = true;
            $scope.showSuccess = true;

            // Save order to localStorage
            localStorage.setItem('currentOrder', $scope.finalOrderJson);

            // CLEAR THE SHOPPING CART
            clearShoppingCart();

            const orderData = JSON.parse($scope.finalOrderJson);
            alert('🎉 ORDER SUCCESSFULLY COMPLETED!\n\n' +
                `Order ID: ${orderData.orderId}\n` +
                `Total: $${$scope.calculateTotal()}\n` +
                `Delivery: ${$scope.estimatedDelivery}\n\n` +
                `Your shopping cart has been cleared.\n` +
                `Thank you for your order!`);

            // Auto-hide success banner after 10 seconds
            $timeout(() => {
                $scope.showSuccess = false;
                $scope.$apply();
            }, 10000);

            // Send to API (simulated)
            $.ajax({
                url: 'http://ist256.up.ist.psu.edu:3002/ordered', // Test API
                type: 'POST',
                contentType: 'application/json',
                data: $scope.finalOrderJson,
                success: function(response) {
                    console.log('Order submitted to API:', response);
                },
                error: function(error) {
                    console.error('API error:', error);
                    // Note: This is a test API, errors are expected
                }
            });
        }

        $scope.resetForm = function() {
            $scope.shippingData = {
                address: '', city: '', state: '', zipCode: '',
                shippingCarrier: '', shippingMethod: '', specialInstructions: ''
            };
            $scope.validationErrors = {};
            $scope.orderSubmitted = false;
            $scope.showSuccess = false;
            $scope.finalOrderJson = 'Fill out the shipping form to see order preview';
            $scope.shippingCost = '0.00';
            $scope.estimatedDelivery = '';

            // Note: We don't reload cart data here because cart was cleared
            // Redirect user back to shopping cart if they want to add more items
            $scope.cartSummary = null;
            $scope.cartItems = [];
        };

        // Initialize when controller loads
        loadCartData();

        // Watch for changes to update JSON in real-time
        $scope.$watch('shippingData', function() {
            $scope.updateOrderJson();
        }, true);

        $scope.$watch('cartSummary', function() {
            $scope.updateOrderJson();
        });
    }]);
