$(function () {
  const LS_PRODUCTS = 'products';
  const LS_RETURNS = 'returnsDraft';    
  let productCache = [];
  let returnItems = [];

  function loadProducts() {
    // try localStorage first 
    const fromLS = localStorage.getItem(LS_PRODUCTS);
    if (fromLS) {
      productCache = JSON.parse(fromLS);
      return;
    }

    // fallback
    $.getJSON('productData.json')
      .done(function (data) {
        if (Array.isArray(data)) {
          productCache = data;
        }
      })
      .fail(function () {
        console.log('Could not load productData.json, using empty list.');
      });
  }

  loadProducts();

  function findProductById(id) {
    if (!id) return null;
    return productCache.find(p => String(p.productId) === String(id)) || null;
  }

  function renderReturns() {
    const $tbody = $('#returnsTableBody');
    $tbody.empty();

    if (!returnItems.length) {
      $('#noReturnsMsg').show();
    } else {
      $('#noReturnsMsg').hide();
    }

    returnItems.forEach(function (item, index) {
      const tr = $('<tr>');
      tr.append($('<td>').text(item.productId));
      tr.append($('<td>').text(item.productDesc));
      tr.append($('<td>').text(item.reason));
      tr.append($('<td>').text(item.qty));
      const delBtn = $('<button>')
        .addClass('btn btn-danger btn-sm')
        .text('Remove')
        .on('click', function () {
          returnItems.splice(index, 1);
          saveReturns();
          renderReturns();
        });
      tr.append($('<td>').append(delBtn));
      $tbody.append(tr);
    });

    // show JSON
    const jsonDoc = buildReturnDocument();
    $('#returnsJson').text(JSON.stringify(jsonDoc, null, 2));
  }

  function saveReturns() {
    localStorage.setItem(LS_RETURNS, JSON.stringify(returnItems));
  }

  function buildReturnDocument() {
    return {
      shopperEmail: $('#returnEmail').val().trim(),
      orderNumber: $('#orderNumber').val().trim(),
      returnDate: new Date().toISOString(),
      items: returnItems
    };
  }

  $('#addReturnItemBtn').on('click', function () {
    if (!validateReturnsFormPart()) return;      // shopper + order
    if (!validateReturnItem()) return;           // item piece

    const id = $('#returnProductSearch').val().trim();
    const prod = findProductById(id);
    const reason = $('#returnReason').val();
    const qty = Number($('#returnQty').val());

    let desc = '';
    if (prod) {
      desc = prod.productDescription || prod.productDesc || '';
      $('#productLookupMsg').text('Product found: ' + desc).css('color', 'green');
    } else {
      desc = '(Unknown / not in current product list)';
      $('#productLookupMsg').text('Product not found in local list, adding with generic description.').css('color', 'orange');
    }

    returnItems.push({
      productId: id,
      productDesc: desc,
      reason: reason,
      qty: qty
    });

    saveReturns();
    renderReturns();

    // clear item fields
    $('#returnProductSearch').val('');
    $('#returnReason').val('');
    $('#returnQty').val('1');
  });

  $('#submitReturnsBtn').on('click', function () {
    if (!validateReturnsFormPart()) return;
    if (!returnItems.length) {
      $('#ajaxMsg').text('Add at least one item to return.').css('color', 'red');
      return;
    }

    const payload = buildReturnDocument();

    $.ajax({
  url: 'https://jsonplaceholder.typicode.com/posts',  // new, CORS-friendly test API
  type: 'POST',
  contentType: 'application/json',
  data: JSON.stringify(payload),
  success: function (resp) {
    $('#ajaxMsg').text('Return submitted (demo). See console for response.').css('color', 'green');
    console.log('Return response:', resp);
  },
  error: function () {
    $('#ajaxMsg').text('Error sending return document.').css('color', 'red');
  }
});

  });

  const draft = localStorage.getItem(LS_RETURNS);
  if (draft) {
    try {
      returnItems = JSON.parse(draft);
    } catch (e) {
      returnItems = [];
    }
  }

  renderReturns();
});
