// Clears all error messages
function clearErrors() {
    const errorFields = ['usernameError', 'emailError', 'passwordError', 'confirmPasswordError', 'termsError'];
    errorFields.forEach(id => {
        const errorElement = document.getElementById(id);
        if (errorElement) {
            errorElement.textContent = '';
        }
    });
}

// Show specific error message
function showError(fieldName, message) {
    const errorElement = document.getElementById(fieldName + 'Error');
    if (errorElement) {
        errorElement.textContent = message;
    }
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

    // Rules for each field
    if (fieldName === 'username') {
        if (!value) {
            showError('username', 'Username is required.');
            isValid = false;
        } else if (value.length < 3) {
            showError('username', 'Username must be at least 3 characters.');
            isValid = false;
        }
    } else if (fieldName === 'email') {
        const emailPattern = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
        if (!value) {
            showError('email', 'Email is required.');
            isValid = false;
        } else if (!emailPattern.test(value)) {
            showError('email', 'Please enter a valid email address.');
            isValid = false;
        }
    } else if (fieldName === 'password') {
        if (!value) {
            showError('password', 'Password is required.');
            isValid = false;
        } else if (value.length < 6) {
            showError('password', 'Password must be at least 6 characters.');
            isValid = false;
        }
    } else if (fieldName === 'confirmPassword') {
        const password = form.password.value.trim();
        if (!value) {
            showError('confirmPassword', 'Please confirm your password.');
            isValid = false;
        } else if (value !== password) {
            showError('confirmPassword', 'Passwords do not match.');
            isValid = false;
        }
    } else if (fieldName === 'terms') {
        if (!value) {
            showError('terms', 'You must agree to the terms and conditions.');
            isValid = false;
        }
    }

    return isValid;
}

// Clear error message for a specific field
function clearFieldError(fieldName) {
    const errorElement = document.getElementById(fieldName + 'Error');
    if (errorElement) {
        errorElement.textContent = '';
    }
}

// MAIN FORM VALIDATION + AJAX TO MONGODB
function validateForm() {
    clearErrors();
    let isValid = true;

    // Validate each field
    if (!validateField('username')) isValid = false;
    if (!validateField('email')) isValid = false;
    if (!validateField('password')) isValid = false;
    if (!validateField('confirmPassword')) isValid = false;
    if (!validateField('terms')) isValid = false;

    if (!isValid) {
        // Stop normal submit if there are any validation errors
        return false;
    }

    const form = document.forms.signupForm;
    const payload = {
        username: form.username.value.trim(),
        email: form.email.value.trim(),
        password: form.password.value
    };

    // If jQuery is not present, just show a basic message and stop.
    if (typeof $ === 'undefined') {
        alert('Account validated on the frontend, but jQuery/AJAX is not available to save to the database.');
        return false;
    }

    const API_BASE = "https://130.203.136.203:3002/api";

    $.ajax({
        url: API_BASE + "/users/register",
        method: "POST",
        contentType: "application/json",
        data: JSON.stringify(payload),
        dataType: "json"
    })
        .done(function (resp) {
            const userId = resp && (resp.userId || resp._id) ? (resp.userId || resp._id) : null;
            alert("✅ Account created successfully in the database!" + (userId ? "\nUser ID: " + userId : ""));

            // Save a light-weight copy of the current user so other pages (shipping/returns) can use it.
            try {
                localStorage.setItem("currentUser", JSON.stringify({
                    _id: userId,
                    username: payload.username,
                    email: payload.email
                }));
            } catch (e) {
                console.warn("Unable to persist currentUser to localStorage:", e);
            }
        })
        .fail(function (xhr) {
            let msg = "Error creating account.";
            if (xhr && xhr.responseJSON && xhr.responseJSON.error) {
                msg = xhr.responseJSON.error;
            }
            alert("❌ " + msg);
        });

    // Always prevent the normal form post since we handled it via AJAX.
    return false;
}

// Attach blur events for live validation
function setupValidation() {
    const form = document.forms.signupForm;

    form.username.addEventListener('blur', () => validateField('username'));
    form.email.addEventListener('blur', () => validateField('email'));
    form.password.addEventListener('blur', () => validateField('password'));
    form.confirmPassword.addEventListener('blur', () => validateField('confirmPassword'));
    form.terms.addEventListener('change', () => validateField('terms'));
}

// Initialize when DOM is ready
document.addEventListener('DOMContentLoaded', setupValidation);
