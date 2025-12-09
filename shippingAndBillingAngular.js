// shippingAndBillingAngular.js
// Uses AngularJS to manage Shipping/Billing and posts final order JSON to Team 2 API.

const API_BASE = "https://130.203.136.203:3002/api";

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

        // Cart summary and related data
        $scope.cartSummary = null;
        $scope.shippingCost = '0.00';
        $scope.estimatedDelivery = '';
        $scope.selectedTestCard = '';
        $scope.showTestCardAlert = false;
        $scope.testCardMessage = '';

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

        // FUNCTION: Load cart data from localStorage
        function loadCartData() {
            const cartJson = localStorage.getItem('checkoutCart');
            if (cartJson) {
                try {
                    const cartData = JSON.parse(cartJson);

                    // New structure from shoppingCart.js
                    if (cartData.items && Array.isArray(cartData.items)) {
                        $scope.cartSummary = {
                            itemCount: cartData.itemCount || cartData.items.reduce((sum, item) => sum + item.quantity, 0),
                            totalPrice: cartData.totalPrice || cartData.items.reduce((sum, item) => sum + (item.productPrice * item.quantity), 0).toFixed(2),
                            totalWeight: cartData.totalWeight || cartData.items.reduce((sum, item) => sum + (item.productWeight * item.quantity), 0).toFixed(2),
                            items: cartData.items
                        };
                    } else if (cartData.totals) {
                        // Old structure compatibility
                        $scope.cartSummary = {
                            itemCount: cartData.totals.itemCount || 0,
                            totalPrice: cartData.totals.totalPrice || '0.00',
                            totalWeight: cartData.totals.totalWeight || 0,
                            items: cartData.items || []
                        };
                    } else {
                        console.warn('Unexpected cart structure:', cartData);
                        $scope.cartSummary = null;
                    }

                    console.log('Loaded cart summary:', $scope.cartSummary);
                } catch (e) {
                    console.error('Error loading cart:', e);
                    $scope.cartSummary = null;
                }
            } else {
                console.log('No cart data found in localStorage');
                $scope.cartSummary = null;
            }
        }

        // FUNCTION: Clear the shopping cart from localStorage
        function clearShoppingCart() {
            try {
                localStorage.removeItem('shoppingCart');
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

        $scope.hasErrors = function() {
            return $scope.hasValidationErrors() || $scope.hasBillingValidationErrors();
        };

        // Copy shipping address to billing address
        $scope.copyShippingToBilling = function() {
            if ($scope.billingData.sameAsShipping) {
                $scope.billingData.billingAddress = $scope.shippingData.address;
                $scope.billingData.billingCity = $scope.shippingData.city;
                $scope.billingData.billingState = $scope.shippingData.state;
                $scope.billingData.billingZipCode = $scope.shippingData.zipCode;
            }
            $scope.updateOrderJson();
        };

        $scope.hasError = function(fieldName) {
            return $scope.validationErrors[fieldName] && $scope.validationErrors[fieldName].length > 0;
        };

        $scope.hasBillingError = function(fieldName) {
            return $scope.billingValidationErrors[fieldName] && $scope.billingValidationErrors[fieldName].length > 0;
        };

        $scope.showTestCardMessage = function(message) {
            $scope.testCardMessage = message;
            $scope.showTestCardAlert = true;

            $timeout(() => {
                $scope.showTestCardAlert = false;
                $scope.testCardMessage = '';
            }, 5000);
        };

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

        // Generate order JSON (includes cart + items)
        function generateFinalOrderJson() {
            if (!$scope.cartSummary) {
                return JSON.stringify({ error: 'No cart data available' }, null, 2);
            }

            // Get logged-in user (set by signupValidation.js)
            let shopperEmail = 'unknown@customer.com';
            try {
                const stored = JSON.parse(localStorage.getItem('currentUser') || 'null');
                if (stored && stored.email) {
                    shopperEmail = stored.email;
                }
            } catch (e) {
                console.warn('Unable to read currentUser from localStorage:', e);
            }

            const cartTotals = {
                itemCount: $scope.cartSummary.itemCount,
                totalPrice: $scope.cartSummary.totalPrice,
                totalWeight: $scope.cartSummary.totalWeight
            };

            const cartItems = $scope.cartSummary.items || [];

            const order = {
                orderId: 'ORD-' + Date.now(),
                shopper: {
                    email: shopperEmail
                },
                shipping: {
                    address: $scope.shippingData.address,
                    city: $scope.shippingData.city,
                    state: $scope.shippingData.state,
                    zipCode: $scope.shippingData.zipCode,
                    carrier: $scope.shippingData.shippingCarrier,
                    method: $scope.shippingData.shippingMethod,
                    estimatedDelivery: $scope.estimatedDelivery
                },
                billing: {
                    cardholderName: $scope.billingData.cardholderName,
                    cardLast4: ($scope.billingData.cardNumber || '').slice(-4),
                    expiryDate: $scope.billingData.expiryDate,
                    sameAsShipping: $scope.billingData.sameAsShipping,
                    billingAddress: $scope.billingData.billingAddress,
                    billingCity: $scope.billingData.billingCity,
                    billingState: $scope.billingData.billingState,
                    billingZipCode: $scope.billingData.billingZipCode,
                    isTestCard: $scope.isTestCard()
                },
                cart: {
                    items: cartItems,
                    totals: cartTotals
                },
                items: cartItems, // convenience for returns / Mongo queries
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

            if (!$scope.billingData.sameAsShipping) {
                $scope.validateBillingField('billingAddress', $scope.billingData.billingAddress);
                $scope.validateBillingField('billingCity', $scope.billingData.billingCity);
                $scope.validateBillingField('billingState', $scope.billingData.billingState);
            }

            $scope.validateBillingField('billingZipCode', $scope.billingData.billingZipCode);

            if ($scope.hasValidationErrors() || $scope.hasBillingValidationErrors()) {
                const shippingErrors = Object.values($scope.validationErrors).filter(e => e !== '');
                const billingErrors = Object.values($scope.billingValidationErrors).filter(e => e !== '');
                const allErrors = [...shippingErrors, ...billingErrors];

                alert('❌ Please fix the following errors:\n\n• ' + allErrors.join('\n• '));
                return false;
            }

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
                `Card: ****${($scope.billingData.cardNumber || '').slice(-4)}\n` +
                `Carrier: ${$scope.shippingData.shippingCarrier} ${$scope.shippingData.shippingMethod}\n` +
                `Delivery: ${$scope.estimatedDelivery}\n` +
                `${$scope.isTestCard() ? '\n🧪 TEST MODE: Using test credit card\n' : ''}\n` +
                `Do you want to complete this order?`;

            const isConfirmed = confirm(confirmationMessage);
            if (!isConfirmed) return false;

            processOrder();
            return true;
        };

        function processOrder() {
            $scope.finalOrderJson = generateFinalOrderJson();
            $scope.orderSubmitted = true;
            $scope.showSuccess = true;

            // Save order to localStorage (so Returns can see it as "currentOrder")
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

            // Send order JSON to Team 2 API (MongoDB)
            $.ajax({
                url: API_BASE + '/orders',
                type: 'POST',
                contentType: 'application/json',
                data: $scope.finalOrderJson,
                success: function(response) {
                    console.log('Order submitted to Team 2 API:', response);
                },
                error: function(error) {
                    console.error('API error when submitting order:', error);
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
            $scope.validationErrors = {
                address: '',
                city: '',
                state: '',
                zipCode: '',
                shippingCarrier: '',
                shippingMethod: ''
            };
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
            $scope.finalOrderJson = 'Fill out the shipping and billing forms to see order preview';
            $scope.shippingCost = '0.00';
            $scope.estimatedDelivery = '';
            $scope.selectedTestCard = '';
            $scope.showTestCardAlert = false;
            $scope.testCardMessage = '';

            loadCartData();
            $scope.updateOrderJson();
        };

        $scope.fillTestCard = function() {
            console.log('fillTestCard called with:', $scope.selectedTestCard);

            if ($scope.selectedTestCard) {
                const cardDetails = BillingValidator.getMockCardDetails($scope.selectedTestCard);
                console.log('Card details:', cardDetails);

                $timeout(() => {
                    $scope.billingData.cardNumber = cardDetails.number;
                    $scope.billingData.expiryDate = cardDetails.expiry;
                    $scope.billingData.cvv = cardDetails.cvv;
                    $scope.billingData.cardholderName = cardDetails.name;

                    if (!$scope.billingData.sameAsShipping) {
                        $scope.billingData.billingAddress = cardDetails.billingAddress;
                        $scope.billingData.billingCity = cardDetails.billingCity;
                        $scope.billingData.billingState = cardDetails.billingState;
                    }
                    $scope.billingData.billingZipCode = cardDetails.billingZipCode;

                    $scope.$apply();

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
                        }

                        $('#cardNumber').trigger('blur');
                        $('#expiryDate').trigger('blur');
                        $('#cvv').trigger('blur');
                        $('#cardholderName').trigger('blur');
                        $('#billingZipCode').trigger('blur');
                    }, 100);

                    Object.keys($scope.billingValidationErrors).forEach(key => {
                        $scope.billingValidationErrors[key] = '';
                    });

                    $scope.showTestCardMessage(
                        `✅ ${$scope.selectedTestCard.charAt(0).toUpperCase() + $scope.selectedTestCard.slice(1)} test card filled!`
                    );

                    $timeout(() => {
                        $scope.selectedTestCard = '';
                        $scope.$apply();
                    }, 1500);
                });
            }
        };

        $scope.updateTestCardDisplay = function() {
            if ($scope.isTestCard()) {
                $scope.testCardMessage = '🧪 Using a test credit card number.';
            } else {
                $scope.testCardMessage = '';
            }
        };

        $scope.updateOrderJson = function() {
            if ($scope.hasErrors() || !$scope.cartSummary) {
                $scope.finalOrderJson = 'Please complete the form and fix any errors to see the order JSON.';
            } else {
                $scope.calculateShipping();
                $scope.finalOrderJson = generateFinalOrderJson();
            }
        };

        // Initialize cart and JSON preview on page load
        loadCartData();
        $scope.updateOrderJson();

        // Watchers to keep JSON preview in sync
        $scope.$watch('shippingData', function() {
            $scope.updateOrderJson();
        }, true);

        $scope.$watch('billingData', function() {
            $scope.updateOrderJson();
        }, true);

        $scope.$watch('cartSummary', function() {
            $scope.updateOrderJson();
        }, true);
    }]);
