// shippingValidation.js
const ShippingValidator = {
    validateAddress: function(address) {
        if (!address || address.trim().length === 0) return 'Street address is required';
        if (address.trim().length < 5) return 'Address must be at least 5 characters';
        if (address.trim().length > 100) return 'Address must be less than 100 characters';
        if (!/^[a-zA-Z0-9\s\-\#\.\,]+$/.test(address.trim())) return 'Address contains invalid characters';
        return '';
    },

    validateCity: function(city) {
        if (!city || city.trim().length === 0) return 'City is required';
        if (city.trim().length < 2) return 'City name is too short';
        if (city.trim().length > 50) return 'City name must be less than 50 characters';
        if (!/^[a-zA-Z\s\-\'\.]+$/.test(city.trim())) return 'City can only contain letters, spaces, hyphens, and apostrophes';
        return '';
    },

    validateState: function(state) {
        if (!state || state.trim().length === 0) return 'State is required';
        if (!/^[A-Za-z]{2}$/.test(state.trim())) return 'State must be a 2-letter code';

        const validStateCodes = ['AL','AK','AZ','AR','CA','CO','CT','DE','FL','GA','HI','ID','IL','IN','IA',
            'KS','KY','LA','ME','MD','MA','MI','MN','MS','MO','MT','NE','NV','NH','NJ',
            'NM','NY','NC','ND','OH','OK','OR','PA','RI','SC','SD','TN','TX','UT','VT',
            'VA','WA','WV','WI','WY'];
        if (!validStateCodes.includes(state.trim().toUpperCase())) return 'Please enter a valid US state code';
        return '';
    },

    validateZipCode: function(zipCode) {
        if (!zipCode || zipCode.trim().length === 0) return 'ZIP code is required';
        if (!/^\d{5}$/.test(zipCode.trim())) return 'ZIP code must be exactly 5 digits';
        return '';
    },

    validateShippingCarrier: function(carrier) {
        if (!carrier) return 'Please select a shipping carrier';
        return '';
    },

    validateShippingMethod: function(method) {
        if (!method) return 'Please select a shipping method';
        return '';
    },

    validateForm: function(formData) {
        const errors = {};

        errors.address = this.validateAddress(formData.address);
        errors.city = this.validateCity(formData.city);
        errors.state = this.validateState(formData.state);
        errors.zipCode = this.validateZipCode(formData.zipCode);
        errors.shippingCarrier = this.validateShippingCarrier(formData.shippingCarrier);
        errors.shippingMethod = this.validateShippingMethod(formData.shippingMethod);

        const hasErrors = Object.values(errors).some(error => error !== '');
        return { hasErrors, errors };
    },

    calculateShippingCost: function(carrier, method, weight = 0) {
        const rates = {
            'FedEx': { 'Overnight': 25.99, '2nd Day': 15.99, 'Ground': 8.99 },
            'UPS': { 'Overnight': 24.99, '2nd Day': 14.99, 'Ground': 7.99 },
            'DHL': { 'Overnight': 26.99, '2nd Day': 16.99, 'Ground': 9.99 }
        };

        let cost = rates[carrier]?.[method] || 0;
        if (weight > 5) cost += (weight - 5) * 0.50;
        cost += 2.99;

        return cost.toFixed(2);
    },

    estimateDeliveryDate: function(method) {
        const days = { 'Overnight': 1, '2nd Day': 2, 'Ground': 5 };
        const date = new Date();
        date.setDate(date.getDate() + (days[method] || 5));

        while (date.getDay() === 0 || date.getDay() === 6) {
            date.setDate(date.getDate() + 1);
        }

        return date.toLocaleDateString('en-US', {
            weekday: 'long', year: 'numeric', month: 'long', day: 'numeric'
        });
    }
};

// Real-time validation with jQuery
$(document).ready(function() {
    // Address validation
    $('#address').on('blur', function() {
        const error = ShippingValidator.validateAddress($(this).val());
        showValidationError($(this), error);
    });

    // City validation
    $('#city').on('blur', function() {
        const error = ShippingValidator.validateCity($(this).val());
        showValidationError($(this), error);
    });

    // State validation with auto-uppercase
    $('#state').on('input', function() {
        $(this).val($(this).val().toUpperCase());
    }).on('blur', function() {
        const error = ShippingValidator.validateState($(this).val());
        showValidationError($(this), error);
    });

    // ZIP code validation with auto-formatting
    $('#zipCode').on('input', function() {
        let value = $(this).val().replace(/\D/g, '');
        if (value.length > 5) value = value.substring(0, 5);
        $(this).val(value);
    }).on('blur', function() {
        const error = ShippingValidator.validateZipCode($(this).val());
        showValidationError($(this), error);
    });

    // Carrier validation
    $('#shippingCarrier').on('change', function() {
        const error = ShippingValidator.validateShippingCarrier($(this).val());
        showValidationError($(this), error);
    });

    // Method validation
    $('#shippingMethod').on('change', function() {
        const error = ShippingValidator.validateShippingMethod($(this).val());
        showValidationError($(this), error);
    });

    function showValidationError($field, error) {
        // Remove any existing error message
        $field.next('.error-message').remove();
        $field.removeClass('field-error error-field');

        if (error) {
            $field.addClass('field-error error-field');
            $field.after(`<div class="error-message">${error}</div>`);
        }
    }
});