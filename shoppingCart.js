// shoppingCart.js
(function () {
  let products = [];   
  let cart = [];      

  const $ = (sel) => document.querySelector(sel);
  const $$ = (sel) => Array.from(document.querySelectorAll(sel));
  const money = (n) => `$${Number(n).toFixed(2)}`;

  function show(el, on) { if (el) el.style.display = on ? '' : 'none'; }

  function loadProducts() {
    try {
      const fromLS = JSON.parse(localStorage.getItem('products') || '[]');
      if (Array.isArray(fromLS) && fromLS.length) return Promise.resolve(fromLS);
    } catch (_) {}

    if (location.protocol === 'file:') {
      const el = document.getElementById('productDataSeed');
      if (el && el.textContent.trim()) {
        try {
          const data = JSON.parse(el.textContent);
          if (Array.isArray(data)) return Promise.resolve(data);
        } catch (_) {}
      }
      return Promise.resolve([]); // no seed found
    }

    return fetch('productData.json')
      .then((r) => r.json())
      .then((data) => (Array.isArray(data) ? data : []))
      .catch(() => []);
  }

  function populateSelect() {
    const select = $('#productSelect');
    if (!select) return;

    select.querySelectorAll('option:not(:first-child)').forEach(o => o.remove());

    products.forEach(p => {
      const opt = document.createElement('option');
      opt.value = p.productId;
      const price = Number(p.productPrice || 0);
      opt.textContent = `${p.productDescription} — ${money(price)}`;
      select.appendChild(opt);
    });
  }

  function findProduct(pid) {
    return products.find(p => String(p.productId) === String(pid));
  }

  function addToCart(pid, qty) {
    const p = findProduct(pid);
    if (!p) return;

    const price = Number(p.productPrice || 0);
    const existing = cart.find(i => String(i.productId) === String(pid));
    if (existing) {
      existing.quantity += qty;
      existing.total = existing.quantity * price;
    } else {
      cart.push({
        productId: String(pid),
        productName: p.productDescription || '',
        price,
        quantity: qty,
        total: qty * price
      });
    }
    renderCart();
  }

  function removeFromCart(pid) {
    cart = cart.filter(i => String(i.productId) !== String(pid));
    renderCart();
  }

  function updateQty(pid, qty) {
    const item = cart.find(i => String(i.productId) === String(pid));
    if (!item) return;
    item.quantity = qty;
    item.total = qty * item.price;
    renderCart();
  }

  function renderCart() {
    const tbody = $('#cartBody');
    const jsonBox = $('#cartJson');
    const totalCell = $('#grandTotal');
    if (!tbody || !jsonBox || !totalCell) return;

    tbody.innerHTML = '';
    cart.forEach(i => {
      const tr = document.createElement('tr');
      tr.innerHTML = `
        <td>${i.productId}</td>
        <td>${i.productName}</td>
        <td>${money(i.price)}</td>
        <td>
          <input type="number" class="qty-input" data-id="${i.productId}" min="1" step="1" value="${i.quantity}">
        </td>
        <td>${money(i.total)}</td>
        <td><button class="btn-danger small remove-btn" data-id="${i.productId}">Remove</button></td>
      `;
      tbody.appendChild(tr);
    });

    // grand total
    const gTotal = cart.reduce((s, i) => s + i.total, 0);
    totalCell.textContent = money(gTotal);

    jsonBox.textContent = JSON.stringify(cart, null, 2);

    $$('.remove-btn').forEach(btn => {
      btn.addEventListener('click', e => removeFromCart(e.currentTarget.getAttribute('data-id')));
    });
    $$('.qty-input').forEach(inp => {
      inp.addEventListener('change', e => {
        let v = parseInt(e.target.value, 10);
        if (isNaN(v) || v < 1) v = 1;
        e.target.value = v;
        updateQty(e.target.getAttribute('data-id'), v);
      });
    });
  }

  function validateAdd() {
    const pid = $('#productSelect').value;
    const qty = parseInt($('#qtyInput').value, 10);

    const pErr = $('#productError');
    const qErr = $('#qtyError');

    let ok = true;
    if (!pid) { show(pErr, true); ok = false; } else { show(pErr, false); }
    if (!Number.isInteger(qty) || qty < 1) { show(qErr, true); ok = false; } else { show(qErr, false); }

    return ok ? { pid, qty } : null;
  }

  document.addEventListener('DOMContentLoaded', async () => {
    products = await loadProducts();
    populateSelect();

    // Add
    $('#addBtn').addEventListener('click', () => {
      const data = validateAdd();
      if (!data) return;
      addToCart(data.pid, data.qty);
    });

    // (placeholder for Task 7)
    $('#checkoutBtn').addEventListener('click', () => {
      if (!cart.length) { alert('Your cart is empty.'); return; }
      alert('Checkout payload is shown in the JSON box.');
      console.log('Checkout payload:', cart);
    });

    $('#clearCartBtn').addEventListener('click', () => { cart = []; renderCart(); });

    renderCart();
  });
})();
