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

        // Billing data initialization
        $scope.billingData = {
            cardholderName: '',
            cardNumber: '',
            expiryDate: '',
            cvv: '',
            billingAddress: '',
            billingCity: '',
            billingState: '',
            billingZipCode: '',
            sameAsShipping: true
        };

        $scope.validationErrors = {
            address: '',
            city: '',
            state: '',
            zipCode: '',
            shippingCarrier: '',
            shippingMethod: ''
        };

        // Billing validation errors
        $scope.billingValidationErrors = {
            cardholderName: '',
            cardNumber: '',
            expiryDate: '',
            cvv: '',
            billingAddress: '',
            billingCity: '',
            billingState: '',
            billingZipCode: ''
        };

        $scope.orderSubmitted = false;
        $scope.showSuccess = false;
        $scope.finalOrderJson = 'Fill out the shipping form to see order preview';
        $scope.cartSummary = null;
        $scope.cartItems = [];
        $scope.shippingCost = '0.00';
        $scope.estimatedDelivery = '';
        $scope.selectedTestCard = '';
        $scope.showTestCardAlert = false;
        $scope.testCardMessage = '';

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

        // Billing validation methods
        $scope.validateBillingField = function(fieldName, value) {
            let error = '';
            switch(fieldName) {
                case 'cardholderName':
                    error = BillingValidator.validateCardholderName(value);
                    break;
                case 'cardNumber':
                    error = BillingValidator.validateCardNumber(value);
                    break;
                case 'expiryDate':
                    error = BillingValidator.validateExpiryDate(value);
                    break;
                case 'cvv':
                    error = BillingValidator.validateCVV(value, $scope.billingData.cardNumber);
                    break;
                case 'billingAddress':
                    error = BillingValidator.validateBillingAddress(value);
                    break;
                case 'billingCity':
                    error = BillingValidator.validateBillingCity(value);
                    break;
                case 'billingState':
                    error = BillingValidator.validateBillingState(value);
                    break;
                case 'billingZipCode':
                    error = BillingValidator.validateBillingZipCode(value);
                    break;
            }
            $scope.billingValidationErrors[fieldName] = error;
            $scope.updateOrderJson();
        };

        $scope.hasValidationErrors = function() {
            return Object.values($scope.validationErrors).some(error => error !== '');
        };

        $scope.hasBillingValidationErrors = function() {
            return Object.values($scope.billingValidationErrors).some(error => error !== '');
        };

        $scope.hasError = function(fieldName) {
            return $scope.validationErrors[fieldName] !== '';
        };

        $scope.hasBillingError = function(fieldName) {
            return $scope.billingValidationErrors[fieldName] !== '';
        };

        // Copy shipping to billing when checkbox is checked
        $scope.copyShippingToBilling = function() {
            if ($scope.billingData.sameAsShipping) {
                $scope.billingData.billingAddress = $scope.shippingData.address;
                $scope.billingData.billingCity = $scope.shippingData.city;
                $scope.billingData.billingState = $scope.shippingData.state;
                $scope.billingData.billingZipCode = $scope.shippingData.zipCode;

                // Clear validation errors for these fields since they're now valid
                $scope.billingValidationErrors.billingAddress = '';
                $scope.billingValidationErrors.billingCity = '';
                $scope.billingValidationErrors.billingState = '';
                $scope.billingValidationErrors.billingZipCode = '';
            }
            $scope.updateOrderJson();
        };

        // Method to handle test card selection
        $scope.fillTestCard = function() {
            console.log('fillTestCard called with:', $scope.selectedTestCard);

            if ($scope.selectedTestCard) {
                const cardDetails = BillingValidator.getMockCardDetails($scope.selectedTestCard);
                console.log('Card details:', cardDetails);

                // Use $timeout to ensure Angular detects the changes
                $timeout(() => {
                    // Fill in the form fields using Angular
                    $scope.billingData.cardNumber = cardDetails.number;
                    $scope.billingData.expiryDate = cardDetails.expiry;
                    $scope.billingData.cvv = cardDetails.cvv;
                    $scope.billingData.cardholderName = cardDetails.name;

                    // Fill billing address (only if not same as shipping)
                    if (!$scope.billingData.sameAsShipping) {
                        $scope.billingData.billingAddress = cardDetails.billingAddress;
                        $scope.billingData.billingCity = cardDetails.billingCity;
                        $scope.billingData.billingState = cardDetails.billingState;
                    }
                    $scope.billingData.billingZipCode = cardDetails.billingZipCode;

                    // Force Angular to update the view
                    $scope.$apply();

                    // Also update the DOM directly as a backup
                    $timeout(() => {
                        $('#cardNumber').val(cardDetails.number).trigger('input');
                        $('#expiryDate').val(cardDetails.expiry);
                        $('#cvv').val(cardDetails.cvv);
                        $('#cardholderName').val(cardDetails.name);
                        $('#billingZipCode').val(cardDetails.billingZipCode);

                        if (!$scope.billingData.sameAsShipping) {
                            $('#billingAddress').val(cardDetails.billingAddress);
                            $('#billingCity').val(cardDetails.billingCity);
                            $('#billingState').val(cardDetails.billingState);
                            $('#billingZipCodeFull').val(cardDetails.billingZipCode);
                        }

                        // Trigger blur events to validate
                        $('#cardNumber').trigger('blur');
                        $('#expiryDate').trigger('blur');
                        $('#cvv').trigger('blur');
                        $('#cardholderName').trigger('blur');
                        $('#billingZipCode').trigger('blur');
                    }, 100);

                    // Clear validation errors
                    Object.keys($scope.billingValidationErrors).forEach(key => {
                        $scope.billingValidationErrors[key] = '';
                    });

                    // Show success message
                    $scope.showTestCardMessage(`✅ ${$scope.selectedTestCard.charAt(0).toUpperCase() + $scope.selectedTestCard.slice(1)} test card filled!`);

                    // Reset dropdown after a short delay
                    $timeout(() => {
                        $scope.selectedTestCard = '';
                        $scope.$apply();
                    }, 1500);
                });
            }
        };

        // Method to show test card messages
        $scope.showTestCardMessage = function(message) {
            $scope.testCardMessage = message;
            $scope.showTestCardAlert = true;

            $timeout(() => {
                $scope.showTestCardAlert = false;
                $scope.testCardMessage = '';
            }, 5000);
        };

        // Method to detect if it's a test card
        $scope.isTestCard = function() {
            if (!$scope.billingData.cardNumber) return false;
            const cleanNumber = $scope.billingData.cardNumber.replace(/[\s\-]/g, '');
            return BillingValidator.isMockCard(cleanNumber);
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
                $scope.finalOrderJson = 'Fill out the shipping and billing forms to see order preview';
                return;
            }

            const billingAddress = $scope.billingData.sameAsShipping ?
                {
                    address: $scope.shippingData.address || 'Not provided',
                    city: $scope.shippingData.city || 'Not provided',
                    state: $scope.shippingData.state || 'Not provided',
                    zipCode: $scope.shippingData.zipCode || 'Not provided'
                } :
                {
                    address: $scope.billingData.billingAddress || 'Not provided',
                    city: $scope.billingData.billingCity || 'Not provided',
                    state: $scope.billingData.billingState || 'Not provided',
                    zipCode: $scope.billingData.billingZipCode || 'Not provided'
                };

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
                billing: {
                    cardholderName: $scope.billingData.cardholderName || 'Not provided',
                    cardNumber: $scope.billingData.cardNumber ? '****' + $scope.billingData.cardNumber.slice(-4) : 'Not provided',
                    expiryDate: $scope.billingData.expiryDate || 'Not provided',
                    billingAddress: billingAddress,
                    sameAsShipping: $scope.billingData.sameAsShipping || false,
                    isTestCard: $scope.isTestCard() || false
                },
                totals: {
                    subtotal: $scope.cartSummary.totalPrice,
                    shipping: $scope.shippingCost || '0.00',
                    total: $scope.calculateTotal()
                },
                specialInstructions: $scope.shippingData.specialInstructions || 'None',
                lastUpdated: new Date().toISOString(),
                testMode: $scope.isTestCard()
            };

            $scope.finalOrderJson = JSON.stringify(orderPreview, null, 2);
        };

        function generateFinalOrderJson() {
            const billingAddress = $scope.billingData.sameAsShipping ?
                {
                    address: $scope.shippingData.address,
                    city: $scope.shippingData.city,
                    state: $scope.shippingData.state,
                    zipCode: $scope.shippingData.zipCode
                } :
                {
                    address: $scope.billingData.billingAddress,
                    city: $scope.billingData.billingCity,
                    state: $scope.billingData.billingState,
                    zipCode: $scope.billingData.billingZipCode
                };

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
                billing: {
                    cardholderName: $scope.billingData.cardholderName,
                    cardNumber: '****' + $scope.billingData.cardNumber.replace(/[\s\-]/g, '').slice(-4),
                    expiryDate: $scope.billingData.expiryDate,
                    billingAddress: billingAddress,
                    sameAsShipping: $scope.billingData.sameAsShipping,
                    isTestCard: $scope.isTestCard()
                },
                totals: {
                    subtotal: $scope.cartSummary.totalPrice,
                    shipping: $scope.shippingCost || '0.00',
                    total: $scope.calculateTotal()
                },
                specialInstructions: $scope.shippingData.specialInstructions || 'None',
                submittedAt: new Date().toISOString(),
                testMode: $scope.isTestCard()
            };
            return JSON.stringify(order, null, 2);
        }

        $scope.submitOrder = function() {
            // Validate all shipping fields
            $scope.validateField('address', $scope.shippingData.address);
            $scope.validateField('city', $scope.shippingData.city);
            $scope.validateField('state', $scope.shippingData.state);
            $scope.validateField('zipCode', $scope.shippingData.zipCode);
            $scope.validateField('shippingCarrier', $scope.shippingData.shippingCarrier);
            $scope.validateField('shippingMethod', $scope.shippingData.shippingMethod);

            // Validate all billing fields
            $scope.validateBillingField('cardholderName', $scope.billingData.cardholderName);
            $scope.validateBillingField('cardNumber', $scope.billingData.cardNumber);
            $scope.validateBillingField('expiryDate', $scope.billingData.expiryDate);
            $scope.validateBillingField('cvv', $scope.billingData.cvv);

            // Only validate billing address fields if they're different from shipping
            if (!$scope.billingData.sameAsShipping) {
                $scope.validateBillingField('billingAddress', $scope.billingData.billingAddress);
                $scope.validateBillingField('billingCity', $scope.billingData.billingCity);
                $scope.validateBillingField('billingState', $scope.billingData.billingState);
            }

            $scope.validateBillingField('billingZipCode', $scope.billingData.billingZipCode);

            if ($scope.hasValidationErrors() || $scope.hasBillingValidationErrors()) {
                const shippingErrors = Object.values($scope.validationErrors)
                    .filter(error => error !== '');
                const billingErrors = Object.values($scope.billingValidationErrors)
                    .filter(error => error !== '');
                const allErrors = [...shippingErrors, ...billingErrors];

                alert('❌ Please fix the following errors:\n\n• ' + allErrors.join('\n• '));
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
                `Billing: ${$scope.billingData.cardholderName}\n` +
                `Card: ****${$scope.billingData.cardNumber.slice(-4)}\n` +
                `Carrier: ${$scope.shippingData.shippingCarrier} ${$scope.shippingData.shippingMethod}\n` +
                `Delivery: ${$scope.estimatedDelivery}\n` +
                // Show test mode indicator
                `${$scope.isTestCard() ? '\n🧪 TEST MODE: Using test credit card\n' : ''}\n` +
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
                url: 'https://jsonplaceholder.typicode.com/posts', // Test API
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
            $scope.billingData = {
                cardholderName: '', cardNumber: '', expiryDate: '', cvv: '',
                billingAddress: '', billingCity: '', billingState: '', billingZipCode: '',
                sameAsShipping: true
            };
            $scope.validationErrors = {};
            $scope.billingValidationErrors = {};
            $scope.orderSubmitted = false;
            $scope.showSuccess = false;
            $scope.finalOrderJson = 'Fill out the shipping and billing forms to see order preview';
            $scope.shippingCost = '0.00';
            $scope.estimatedDelivery = '';
            $scope.selectedTestCard = '';
            $scope.showTestCardAlert = false;
            $scope.testCardMessage = '';

            $scope.cartSummary = null;
            $scope.cartItems = [];
        };

        // Initialize when controller loads
        loadCartData();

        // Add jQuery event handler as backup
        $(document).ready(function() {
            $('#testCardDropdown').on('change', function() {
                const selectedValue = $(this).val();
                if (selectedValue) {
                    $scope.$apply(function() {
                        $scope.selectedTestCard = selectedValue;
                        $scope.fillTestCard();
                    });
                }
            });
        });

        // Watch for changes to update JSON in real-time
        $scope.$watch('shippingData', function() {
            $scope.updateOrderJson();
        }, true);

        $scope.$watch('billingData', function() {
            $scope.updateOrderJson();
        }, true);

        $scope.$watch('cartSummary', function() {
            $scope.updateOrderJson();
        });
    }]);