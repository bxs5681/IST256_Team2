// productManagementValidation.js

// Validation rules
const pmRules = {
    productId: { required: true, pattern: /^[0-9-_]+$/ }, // numeric with hyphens/underscores
    productDescription: { required: true, minLength: 5 }, // at least 5 characters
    productCategory: { required: true }, // must select from dropdown
    productSubcategory: { required: true }, // must select from dropdown
    productUnit: { required: true }, // must select from dropdown
    productPrice: { required: true, min: 0.01, max: 999999.99 }, // positive monetary value
    productWeight: { required: false, min: 0, max: 1000 } // optional, but must be positive if provided
};

// Validation messages
const pmMessages = {
    productId: {
        required: 'Product ID is required',
        invalid: 'Product ID can only contain numbers, hyphens, and underscores'
    },
    productDescription: {
        required: 'Product description is required',
        tooShort: 'Product description must be at least 5 characters'
    },
    productCategory: {
        required: 'Product category is required'
    },
    productSubcategory: {
        required: 'Product subcategory is required'
    },
    productUnit: {
        required: 'Product unit of measure is required'
    },
    productPrice: {
        required: 'Product price is required',
        invalid: 'Price must be a valid monetary value with exactly two decimal places (e.g., 49.99, 100.00)',
        range: 'Price must be between $0.01 and $999,999.99'
    },
    productWeight: {
        invalid: 'Weight must be a positive number up to 1000 kg'
    }
};

// Main validation function
function validateProductManagementForm() {
    clearAllErrors();
    let isValid = true;

    // Validating each field
    if (!validateField('productId')) isValid = false;
    if (!validateField('productDescription')) isValid = false;
    if (!validateField('productCategory')) isValid = false;
    if (!validateField('productSubcategory')) isValid = false;
    if (!validateField('productUnit')) isValid = false;
    if (!validateField('productPrice')) isValid = false;
    if (!validateField('productWeight')) isValid = false;

    if (!isValid) return false;

    // Build JSON doc and save to localStorage
    const form = document.getElementById('productManagementForm');
    const productDoc = {
        productId: form.productId.value.trim(),
        productDescription: form.productDescription.value.trim(),
        productCategory: form.productCategory.value,
        productSubcategory: form.productSubcategory.value,
        productUnit: form.productUnit.value,
        productPrice: parseFloat(form.productPrice.value).toFixed(2),
        productWeight: form.productWeight.value ? parseFloat(form.productWeight.value).toFixed(2) : null,
        createdAt: new Date().toISOString()
    };

    const list = JSON.parse(localStorage.getItem('products') || '[]');
    list.push(productDoc);
    localStorage.setItem('products', JSON.stringify(list));

    // Display JSON output
    displayProductJSON(productDoc);

    alert('Product saved successfully!');
    return true; // allow form submit
}

// Individual field validation
function validateField(fieldName) {
    const form = document.getElementById('productManagementForm');
    const el = form[fieldName];
    const val = (el.value || '').trim();

    clearError(fieldName);

    // Required field validation
    if (pmRules[fieldName].required && val === '') {
        showError(fieldName, getMsg(fieldName, 'required'));
        return false;
    }

    // Skip further validation for optional empty fields
    if (!pmRules[fieldName].required && val === '') {
        return true;
    }

    // Pattern validation for Product ID
    if (fieldName === 'productId' && pmRules.productId.pattern && !pmRules.productId.pattern.test(val)) {
        showError(fieldName, pmMessages.productId.invalid);
        return false;
    }

    // Description length validation
    if (fieldName === 'productDescription' && val.length < pmRules.productDescription.minLength) {
        showError(fieldName, pmMessages.productDescription.tooShort);
        return false;
    }

    // Price validation
    if (fieldName === 'productPrice') {
        const price = parseFloat(val);
        if (isNaN(price) || price < pmRules.productPrice.min || price > pmRules.productPrice.max) {
            showError(fieldName, pmMessages.productPrice.range);
            return false;
        }

        // Check for exactly two decimal places
        const decimalPart = val.split('.')[1];
        if (!decimalPart || decimalPart.length !== 2) {
            showError(fieldName, pmMessages.productPrice.invalid);
            return false;
        }
    }

    // Weight validation (optional but must be valid if provided)
    if (fieldName === 'productWeight' && val !== '') {
        const weight = parseFloat(val);
        if (isNaN(weight) || weight < pmRules.productWeight.min || weight > pmRules.productWeight.max) {
            showError(fieldName, pmMessages.productWeight.invalid);
            return false;
        }
    }

    return true;
}

// Get appropriate error message
function getMsg(fieldName, type) {
    const m = pmMessages[fieldName];
    return typeof m === 'string' ? m : m[type];
}

// Show error message and style field
function showError(fieldName, message) {
    const form = document.getElementById('productManagementForm');
    const errorEl = document.getElementById(fieldName + 'Error');
    const fieldEl = form[fieldName];

    if (errorEl) {
        errorEl.textContent = message;
        errorEl.style.display = 'block';
    }
    if (fieldEl) fieldEl.classList.add('is-invalid');
}

// Clear error for a specific field
function clearError(fieldName) {
    const form = document.getElementById('productManagementForm');
    const errorEl = document.getElementById(fieldName + 'Error');
    const fieldEl = form[fieldName];

    if (errorEl) {
        errorEl.textContent = '';
        errorEl.style.display = 'none';
    }
    if (fieldEl) fieldEl.classList.remove('is-invalid');
}

// Clear all validation errors
function clearAllErrors() {
    [
        'productId', 'productDescription', 'productCategory',
        'productSubcategory', 'productUnit', 'productPrice', 'productWeight'
    ].forEach(clearError);
}

// Display product JSON after successful validation
function displayProductJSON(productDoc) {
    const jsonOutput = document.getElementById('jsonOutput');
    const jsonSection = document.getElementById('jsonSection');

    if (jsonOutput) {
        jsonOutput.textContent = JSON.stringify(productDoc, null, 2);
    }
    if (jsonSection) {
        jsonSection.style.display = 'block';
    }
}

// Setup event listeners for real-time validation
function setupProductValidation() {
    const form = document.getElementById('productManagementForm');
    if (!form) return;

    // Add validation on blur for all fields
    [
        'productId', 'productDescription', 'productCategory',
        'productSubcategory', 'productUnit', 'productPrice', 'productWeight'
    ].forEach(id => {
        form[id].addEventListener('blur', () => validateField(id));
        form[id].addEventListener('input', () => clearError(id));
    });

    // Update subcategories when category changes
    form.productCategory.addEventListener('change', function() {
        clearError('productCategory');
        clearError('productSubcategory');
        updateSubcategories(this.value);
    });
}

// Update subcategory dropdown based on selected category
function updateSubcategories(category) {
    const subcategorySelect = document.getElementById('productSubcategory');

    // Clear existing options except the first one
    while (subcategorySelect.options.length > 1) {
        subcategorySelect.remove(1);
    }

    // Add appropriate subcategories based on category
    const subcategories = getSubcategoriesForCategory(category);

    if (subcategories && subcategories.length > 0) {
        subcategories.forEach(subcat => {
            const option = document.createElement('option');
            option.value = subcat;
            option.textContent = subcat;
            subcategorySelect.appendChild(option);
        });
    }
}

// Get subcategories for a given category
function getSubcategoriesForCategory(category) {
    const subcategoryMap = {
        "Computers & Accessories": [
            "Laptops", "Desktops", "Monitors", "Keyboards & Mice",
            "Docking Stations", "External Storage (HDDs, SSDs)"
        ],
        "Mobile Devices": [
            "Smartphones", "Tablets", "Smartwatches",
            "Phone Cases & Screen Protectors", "Chargers & Power Banks"
        ],
        "Audio & Music": [
            "Headphones & Earbuds", "Bluetooth Speakers", "Soundbars",
            "Home Audio Systems", "Microphones"
        ],
        "Cameras & Photography": [
            "Digital Cameras", "Action Cameras (e.g., GoPro)", "Drones",
            "Camera Lenses", "Tripods & Mounts"
        ],
        "Home Entertainment": [
            "Smart TVs", "Streaming Devices (e.g., Roku, Fire Stick)",
            "Projectors", "Gaming Consoles"
        ],
        "Gaming": [
            "Consoles (PlayStation, Xbox, Nintendo)", "Gaming PCs",
            "Controllers & Accessories", "VR Headsets", "Gaming Chairs"
        ],
        "Smart Home & IoT": [
            "Smart Lights", "Smart Thermostats", "Smart Plugs",
            "Home Security Cameras", "Video Doorbells"
        ],
        "Cables & Components": [
            "HDMI, USB, Ethernet Cables", "Adapters & Converters",
            "Internal PC Components (RAM, GPUs, CPUs)", "Cooling Systems"
        ],
        "Office Tech": [
            "Printers & Scanners", "Routers & Modems",
            "Webcams", "Networking Equipment"
        ],
        "Tech Lifestyle & Wearables": [
            "Fitness Trackers", "Smart Glasses", "E-Readers",
            "Tech Backpacks & Organizers"
        ]
    };

    return subcategoryMap[category] || [];
}

// Initialize validation when DOM is loaded
document.addEventListener('DOMContentLoaded', setupProductValidation);