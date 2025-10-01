// Validation rules
const rules = {
    username: {required: true},
    email: {required: true, pattern: /^[^\s@]+@[^\s@]+\.[^\s@]+$/},
    password: {required: true, minLength: 8},
    confirmPassword: {required: true},
    terms: {required: true}
};

// Error messages
const messages = {
    username: 'Username is required',
    email: {
        required: 'Email is required',
        invalid: 'Please enter a valid email address (e.g., joe@test.com)'
    },
    password: {
        required: 'Password is required',
        tooShort: 'Password must be at least 8 characters long'
    },
    confirmPassword: {
        required: 'Please confirm your password',
        mismatch: 'Passwords do not match'
    },
    terms: 'You must agree to the terms and conditions'
};

// Main validation function
function validateForm() {
    clearErrors();
    let isValid = true;

    // Validate each field
    if (!validateField('username')) isValid = false;
    if (!validateField('email')) isValid = false;
    if (!validateField('password')) isValid = false;
    if (!validateField('confirmPassword')) isValid = false;
    if (!validateField('terms')) isValid = false;

    if (isValid) {
        alert('Account created successfully!');
    }
    return isValid;
}

// Validate individual field
function validateField(fieldName) {
    const form = document.forms.signupForm;
    let value, isValid = true;

    // Get field value
    if (fieldName === 'terms') {
        value = form.terms.checked;
    } else {
        value = form[fieldName].value.trim();
    }

    clearFieldError(fieldName);

    // Required field check
    if (rules[fieldName].required && !hasValue(value)) {
        showError(fieldName, getMessage(fieldName, 'required'));
        isValid = false;
    }

    // Skip further checks if field is empty
    if (!hasValue(value)) return isValid;

    // Specific validations
    switch (fieldName) {
        case 'email':
            if (!rules.email.pattern.test(value)) {
                showError(fieldName, messages.email.invalid);
                isValid = false;
            }
            break;

        case 'password':
            if (value.length < rules.password.minLength) {
                showError(fieldName, messages.password.tooShort);
                isValid = false;
            }
            break;

        case 'confirmPassword':
            const password = form.password.value;
            if (password !== value) {
                showError(fieldName, messages.confirmPassword.mismatch);
                isValid = false;
            }
            break;
    }

    return isValid;
}

// Helper functions
function hasValue(value) {
    if (typeof value === 'boolean') return value;
    return value && value !== '';
}

function getMessage(fieldName, type = 'required') {
    const message = messages[fieldName];
    return typeof message === 'object' ? message[type] : message;
}

function showError(fieldName, message) {
    const errorElement = document.getElementById(fieldName + 'Error');
    const fieldElement = document.forms.signupForm[fieldName];

    if (errorElement) errorElement.textContent = message;
    if (fieldElement) fieldElement.classList.add('error-field');
}

function clearFieldError(fieldName) {
    const errorElement = document.getElementById(fieldName + 'Error');
    const fieldElement = document.forms.signupForm[fieldName];

    if (errorElement) errorElement.textContent = '';
    if (fieldElement) fieldElement.classList.remove('error-field');
}

function clearErrors() {
    const fields = ['username', 'email', 'password', 'confirmPassword', 'terms'];
    fields.forEach(field => clearFieldError(field));
}

// Setup event listeners
function setupValidation() {
    const form = document.forms.signupForm;
    if (!form) return;

    // Add blur validation to all fields
    const fields = ['username', 'email', 'password', 'confirmPassword'];
    fields.forEach(field => {
        form[field].addEventListener('blur', () => validateField(field));
        form[field].addEventListener('input', () => clearFieldError(field));
    });

    // Terms checkbox
    form.terms.addEventListener('change', () => validateField('terms'));

    // Real-time password confirmation
    form.password.addEventListener('input', () => {
        if (form.confirmPassword.value) {
            validateField('confirmPassword');
        }
    });
}

// Page loads
document.addEventListener('DOMContentLoaded', setupValidation);