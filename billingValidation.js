// billingValidation.js
const BillingValidator = {
    // Mock/test credit card numbers for testing
    mockCards: {
        visa: '1111 1111 1111 1111',
        mastercard: '2222 2222 2222 2222',
        amex: '3333 333333 33333',
        discover: '4444 4444 4444 4444'
    },

    validateCardNumber: function(cardNumber) {
        if (!cardNumber || cardNumber.trim().length === 0) return 'Credit card number is required';

        const cleanNumber = cardNumber.replace(/[\s\-]/g, '');

        // Allow mock cards for testing
        if (this.isMockCard(cleanNumber)) {
            return ''; // Mock cards are always valid
        }

        if (!/^\d+$/.test(cleanNumber)) return 'Card number must contain only digits';
        if (cleanNumber.length < 13) return 'Card number is too short';
        if (cleanNumber.length > 19) return 'Card number is too long';

        if (!this.validateLuhn(cleanNumber)) return 'Invalid credit card number';

        return '';
    },

    // Check if the card number is a mock/test card
    isMockCard: function(cardNumber) {
        const cleanNumber = cardNumber.replace(/[\s\-]/g, '');
        const mockNumbers = Object.values(this.mockCards).map(card => card.replace(/[\s\-]/g, ''));
        return mockNumbers.includes(cleanNumber);
    },

    validateLuhn: function(cardNumber) {
        // Skip Luhn validation for mock cards
        if (this.isMockCard(cardNumber)) {
            return true;
        }

        let sum = 0;
        let isEven = false;

        for (let i = cardNumber.length - 1; i >= 0; i--) {
            let digit = parseInt(cardNumber[i]);

            if (isEven) {
                digit *= 2;
                if (digit > 9) digit -= 9;
            }

            sum += digit;
            isEven = !isEven;
        }

        return sum % 10 === 0;
    },

    validateExpiryDate: function(expiryDate) {
        if (!expiryDate || expiryDate.trim().length === 0) return 'Expiry date is required';

        if (!/^\d{2}\/\d{2}$/.test(expiryDate.trim())) return 'Expiry date must be in MM/YY format';

        const [month, year] = expiryDate.split('/').map(part => parseInt(part));
        const currentDate = new Date();
        const currentYear = currentDate.getFullYear() % 100;
        const currentMonth = currentDate.getMonth() + 1;

        if (month < 1 || month > 12) return 'Invalid month (must be 01-12)';
        if (year < currentYear) return 'Card has expired';
        if (year === currentYear && month < currentMonth) return 'Card has expired';
        if (year > currentYear + 20) return 'Invalid expiry year';

        return '';
    },

    validateCVV: function(cvv, cardNumber = '') {
        if (!cvv || cvv.trim().length === 0) return 'CVV is required';

        if (!/^\d+$/.test(cvv)) return 'CVV must contain only digits';

        const cleanCardNumber = cardNumber.replace(/[\s\-]/g, '');
        let expectedLength = 3;

        // For mock cards, use appropriate CVV lengths
        if (this.isMockCard(cleanCardNumber)) {
            if (cleanCardNumber.startsWith('3782') || cleanCardNumber.startsWith('34') || cleanCardNumber.startsWith('37')) {
                expectedLength = 4; // Amex
            } else {
                expectedLength = 3; // Visa, MasterCard, Discover
            }
        } else if (cleanCardNumber.startsWith('34') || cleanCardNumber.startsWith('37')) {
            expectedLength = 4;
        }

        if (cvv.length !== expectedLength) return `CVV must be ${expectedLength} digits`;

        return '';
    },

    validateCardholderName: function(name) {
        if (!name || name.trim().length === 0) return 'Cardholder name is required';
        if (name.trim().length < 2) return 'Name is too short';
        if (name.trim().length > 50) return 'Name must be less than 50 characters';
        if (!/^[a-zA-Z\s\-\.']+$/.test(name.trim())) return 'Name can only contain letters, spaces, hyphens, and apostrophes';
        return '';
    },

    validateBillingAddress: function(address) {
        if (!address || address.trim().length === 0) return 'Billing address is required';
        if (address.trim().length < 5) return 'Address must be at least 5 characters';
        if (address.trim().length > 100) return 'Address must be less than 100 characters';
        return '';
    },

    validateBillingCity: function(city) {
        if (!city || city.trim().length === 0) return 'Billing city is required';
        if (city.trim().length < 2) return 'City name is too short';
        if (city.trim().length > 50) return 'City name must be less than 50 characters';
        if (!/^[a-zA-Z\s\-\'\.]+$/.test(city.trim())) return 'City can only contain letters, spaces, hyphens, and apostrophes';
        return '';
    },

    validateBillingState: function(state) {
        if (!state || state.trim().length === 0) return 'Billing state is required';
        if (!/^[A-Za-z]{2}$/.test(state.trim())) return 'State must be a 2-letter code';

        const validStateCodes = ['AL','AK','AZ','AR','CA','CO','CT','DE','FL','GA','HI','ID','IL','IN','IA',
            'KS','KY','LA','ME','MD','MA','MI','MN','MS','MO','MT','NE','NV','NH','NJ',
            'NM','NY','NC','ND','OH','OK','OR','PA','RI','SC','SD','TN','TX','UT','VT',
            'VA','WA','WV','WI','WY'];
        if (!validStateCodes.includes(state.trim().toUpperCase())) return 'Please enter a valid US state code';
        return '';
    },

    validateBillingZipCode: function(zipCode) {
        if (!zipCode || zipCode.trim().length === 0) return 'Billing ZIP code is required';
        if (!/^\d{5}(-\d{4})?$/.test(zipCode.trim())) return 'ZIP code must be 5 digits or 5+4 format';
        return '';
    },

    validateForm: function(formData) {
        const errors = {};

        errors.cardNumber = this.validateCardNumber(formData.cardNumber);
        errors.expiryDate = this.validateExpiryDate(formData.expiryDate);
        errors.cvv = this.validateCVV(formData.cvv, formData.cardNumber);
        errors.cardholderName = this.validateCardholderName(formData.cardholderName);
        errors.billingAddress = this.validateBillingAddress(formData.billingAddress);
        errors.billingCity = this.validateBillingCity(formData.billingCity);
        errors.billingState = this.validateBillingState(formData.billingState);
        errors.billingZipCode = this.validateBillingZipCode(formData.billingZipCode);

        const hasErrors = Object.values(errors).some(error => error !== '');
        return { hasErrors, errors };
    },

    formatCardNumber: function(cardNumber) {
        const cleanNumber = cardNumber.replace(/[\s\-]/g, '');
        return cleanNumber.replace(/(\d{4})/g, '$1 ').trim();
    },

    detectCardType: function(cardNumber) {
        const cleanNumber = cardNumber.replace(/[\s\-]/g, '');

        const cardPatterns = {
            visa: /^4/,
            mastercard: /^5[1-5]/,
            amex: /^3[47]/,
            discover: /^6(?:011|5)/
        };

        for (const [type, pattern] of Object.entries(cardPatterns)) {
            if (pattern.test(cleanNumber)) return type;
        }

        return 'unknown';
    },

    // Get mock card details for testing
    getMockCardDetails: function(cardType) {
        const mockDetails = {
            visa: {
                number: '1111 1111 1111 1111',
                expiry: '12/28',
                cvv: '123',
                name: 'Test User Visa',
                billingAddress: '123 Test Street',
                billingCity: 'Testville',
                billingState: 'CA',
                billingZipCode: '12345'
            },
            mastercard: {
                number: '2222 2222 2222 2222',
                expiry: '12/28',
                cvv: '123',
                name: 'Test User MasterCard',
                billingAddress: '456 Demo Avenue',
                billingCity: 'Sample City',
                billingState: 'NY',
                billingZipCode: '12345'
            },
            amex: {
                number: '3333 333333 33333',
                expiry: '12/28',
                cvv: '123',
                name: 'Test User Amex',
                billingAddress: '789 Example Boulevard',
                billingCity: 'Test City',
                billingState: 'TX',
                billingZipCode: '12345'
            },
            discover: {
                number: '4444 4444 4444 4444',
                expiry: '12/28',
                cvv: '123',
                name: 'Test User Discover',
                billingAddress: '321 Sample Road',
                billingCity: 'Demo Town',
                billingState: 'FL',
                billingZipCode: '12345'
            }
        };

        return mockDetails[cardType] || mockDetails.visa;
    }
};

// jQuery real-time validation for billing form
$(document).ready(function() {
    // Card number formatting and validation
    $('#cardNumber').on('input', function() {
        let value = $(this).val().replace(/[\s\-]/g, '');
        if (value.length > 16) value = value.substring(0, 16);

        const formatted = value.replace(/(\d{4})/g, '$1 ').trim();
        $(this).val(formatted);

        const cardType = BillingValidator.detectCardType(value);
        updateCardTypeDisplay(cardType);
    }).on('blur', function() {
        const error = BillingValidator.validateCardNumber($(this).val());
        showBillingValidationError($(this), error);
    });

    // Expiry date formatting
    $('#expiryDate').on('input', function() {
        let value = $(this).val().replace(/\D/g, '');
        if (value.length > 4) value = value.substring(0, 4);

        if (value.length >= 2) {
            value = value.substring(0, 2) + '/' + value.substring(2);
        }
        $(this).val(value);
    }).on('blur', function() {
        const error = BillingValidator.validateExpiryDate($(this).val());
        showBillingValidationError($(this), error);
    });

    // CVV validation
    $('#cvv').on('input', function() {
        let value = $(this).val().replace(/\D/g, '');
        if (value.length > 4) value = value.substring(0, 4);
        $(this).val(value);
    }).on('blur', function() {
        const cardNumber = $('#cardNumber').val();
        const error = BillingValidator.validateCVV($(this).val(), cardNumber);
        showBillingValidationError($(this), error);
    });

    // Cardholder name validation
    $('#cardholderName').on('blur', function() {
        const error = BillingValidator.validateCardholderName($(this).val());
        showBillingValidationError($(this), error);
    });

    // Billing address validation
    $('#billingAddress').on('blur', function() {
        const error = BillingValidator.validateBillingAddress($(this).val());
        showBillingValidationError($(this), error);
    });

    // Billing city validation
    $('#billingCity').on('blur', function() {
        const error = BillingValidator.validateBillingCity($(this).val());
        showBillingValidationError($(this), error);
    });

    // Billing state validation with auto-uppercase
    $('#billingState').on('input', function() {
        $(this).val($(this).val().toUpperCase());
    }).on('blur', function() {
        const error = BillingValidator.validateBillingState($(this).val());
        showBillingValidationError($(this), error);
    });

    // Billing ZIP code validation
    $('#billingZipCode, #billingZipCodeFull').on('input', function() {
        let value = $(this).val().replace(/\D/g, '');
        if (value.length > 5) value = value.substring(0, 5);
        $(this).val(value);
    }).on('blur', function() {
        const error = BillingValidator.validateBillingZipCode($(this).val());
        showBillingValidationError($(this), error);
    });

    function showBillingValidationError($field, error) {
        $field.next('.error-message').remove();
        $field.removeClass('field-error error-field');

        if (error) {
            $field.addClass('field-error error-field');
            $field.after(`<div class="error-message">${error}</div>`);
        }
    }

    function updateCardTypeDisplay(cardType) {
        let $display = $('#cardTypeDisplay');
        if ($display.length === 0) {
            $display = $('<div id="cardTypeDisplay" class="text-muted small mt-1"></div>');
            $('#cardNumber').after($display);
        }

        const typeNames = {
            visa: 'Visa',
            mastercard: 'MasterCard',
            amex: 'American Express',
            discover: 'Discover',
            unknown: 'Credit Card'
        };

        const displayText = typeNames[cardType] || 'Credit Card';
        $display.text(displayText + (BillingValidator.isMockCard($('#cardNumber').val().replace(/[\s\-]/g, '')) ? ' (Test Card)' : ''));
    }
});