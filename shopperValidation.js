// shopperValidation.js

// Validation rules
const smRules = {
  shopperName: { required: true }, // basic non-empty + pattern below
  shopperEmail: { required: true, pattern: /^[^\s@]+@[^\s@]+\.[^\s@]+$/ },
  shopperPhoneNumber: { required: true, minDigits: 10 }, // digits-only length check
  shopperAge: { required: true, min: 13, max: 120 },     // simple 13 to 120 
  shopperAddress: { required: true, minLength: 5 }, // not sophisticated address validation simple string check
  terms: { required: true }
};

// 
const smMessages = {
  shopperName: {
    required: 'Full name is required',
    invalid: 'Use letters and spaces only'
  },
  shopperEmail: {
    required: 'Email is required',
    invalid: 'Enter a valid email (e.g., joe@test.com)'
  },
  shopperPhoneNumber: {
    required: 'Phone number is required',
    invalid: 'Enter at least 10 digits'
  },
  shopperAge: {
    required: 'Age is required',
    invalid: 'Age must be a number between 13 and 120'
  },
  shopperAddress: {
    required: 'Address is required',
    tooShort: 'Address must be at least 5 characters'
  },
  terms: 'You must agree to the terms and conditions'
};


function validateShopperManagementForm() {
  clearAllErrors();
  let isValid = true;

  // Validating each field
  if (!validateField('shopperName')) isValid = false;
  if (!validateField('shopperEmail')) isValid = false;
  if (!validateField('shopperPhoneNumber')) isValid = false;
  if (!validateField('shopperAge')) isValid = false;
  if (!validateField('shopperAddress')) isValid = false;
  if (!validateField('terms')) isValid = false;

  if (!isValid) return false;

  // Build JSON doc and save to localStorage
  const form = document.getElementById('shopperManagementForm');
  const shopperDoc = {
    name: form.shopperName.value.trim(),
    email: form.shopperEmail.value.trim(),
    phone: form.shopperPhoneNumber.value.trim(),
    age: parseInt(form.shopperAge.value.trim(), 10),
    address: form.shopperAddress.value.trim(),
    agreedToTerms: form.terms.checked,
    createdAt: new Date().toISOString()
  };

  const list = JSON.parse(localStorage.getItem('shoppers') || '[]');
  list.push(shopperDoc);
  localStorage.setItem('shoppers', JSON.stringify(list));

  alert('Shopper saved successfully!');
  return true; // allow form submit
}


function validateField(fieldName) {
  const form = document.getElementById('shopperManagementForm');
  const isCheckbox = fieldName === 'terms';
  const el = isCheckbox ? form.terms : form[fieldName];
  const val = isCheckbox ? el.checked : (el.value || '').trim();

  clearError(fieldName);

  // Required
  if (smRules[fieldName].required) {
    if (isCheckbox ? !val : val === '') {
      showError(fieldName, getMsg(fieldName, 'required'));
      return false;
    }
  }

  // Pattern checks
  if (fieldName === 'shopperEmail' && smRules.shopperEmail.pattern && !smRules.shopperEmail.pattern.test(val)) {
    showError(fieldName, smMessages.shopperEmail.invalid);
    return false;
  }

  // Name: simple string
  if (fieldName === 'shopperName') {
    const nameOk = /^[A-Za-z][A-Za-z .'-]*$/.test(val);
    if (!nameOk) {
      showError(fieldName, smMessages.shopperName.invalid);
      return false;
    }
  }

  // Phone: at least 10 digits 
  if (fieldName === 'shopperPhoneNumber') {
    const digits = val.replace(/\D/g, '');
    if (digits.length < (smRules.shopperPhoneNumber.minDigits || 10)) {
      showError(fieldName, smMessages.shopperPhoneNumber.invalid);
      return false;
    }
  }

  // Age: number and range
  if (fieldName === 'shopperAge') {
    const n = Number(val);
    if (!Number.isInteger(n) || n < smRules.shopperAge.min || n > smRules.shopperAge.max) {
      showError(fieldName, smMessages.shopperAge.invalid);
      return false;
    }
  }

  // Address: min length
  if (fieldName === 'shopperAddress') {
    if (val.length < smRules.shopperAddress.minLength) {
      showError(fieldName, smMessages.shopperAddress.tooShort);
      return false;
    }
  }

  return true;
}

function getMsg(fieldName, type) {
  const m = smMessages[fieldName];
  return typeof m === 'string' ? m : m[type];
}

function showError(fieldName, message) {
  const form = document.getElementById('shopperManagementForm');
  const errorEl = document.getElementById(fieldName + 'Error');
  const fieldEl = fieldName === 'terms' ? form.terms : form[fieldName];

  if (errorEl) errorEl.textContent = message;
  if (fieldEl && fieldName !== 'terms') fieldEl.classList.add('error-field'); // relies on your CSS
}

function clearError(fieldName) {
  const form = document.getElementById('shopperManagementForm');
  const errorEl = document.getElementById(fieldName + 'Error');
  const fieldEl = fieldName === 'terms' ? form.terms : form[fieldName];

  if (errorEl) errorEl.textContent = '';
  if (fieldEl) fieldEl.classList.remove('error-field');
}

function clearAllErrors() {
  ['shopperName','shopperEmail','shopperPhoneNumber','shopperAge','shopperAddress','terms']
    .forEach(clearError);
}

function setupShopperValidation() {
  const form = document.getElementById('shopperManagementForm');
  if (!form) return;

  ['shopperName','shopperEmail','shopperPhoneNumber','shopperAge','shopperAddress'].forEach(id => {
    form[id].addEventListener('blur', () => validateField(id));
    form[id].addEventListener('input', () => clearError(id));
  });

  form.terms.addEventListener('change', () => validateField('terms'));
}

document.addEventListener('DOMContentLoaded', setupShopperValidation);
