

(function () {
  const STORAGE_KEY = 'adamstravel_cart_v1';

  function formatFt(n) {
    return new Intl.NumberFormat('hu-HU').format(n) + ' Ft';
  }

  function loadCart() {
    try {
      const raw = localStorage.getItem(STORAGE_KEY);
      return raw ? JSON.parse(raw) : [];
    } catch (e) {
      console.error('Cart load error', e);
      return [];
    }
  }

  function saveCart(cart) {
    try {
      localStorage.setItem(STORAGE_KEY, JSON.stringify(cart));
      updateBadge();
      renderCart();
    } catch (e) {
      console.error('Cart save error', e);
    }
  }


  function cartItemCount(cart) {
    return cart.reduce((s, it) => s + (it.qty || 0), 0);
  }


  function cartTotalPrice(cart) {
    return cart.reduce((s, it) => s + (it.price || 0) * (it.qty || 0), 0);
  }

  function updateBadge() {
    const cart = loadCart();
    const badges = document.querySelectorAll('#cartBadge');
    const count = cartItemCount(cart);
    badges.forEach(b => {
      if (count > 0) {
        b.textContent = count;
        b.classList.remove('d-none');
      } else {
        b.textContent = 0;
        b.classList.add('d-none');
      }
    });
  }

  function renderCart() {
    const container = document.getElementById('cartItemsContainer');
    const totalEl = document.getElementById('cartTotal');
    if (!container) return; 
    const cart = loadCart();

    container.innerHTML = '';

    if (cart.length === 0) {
      const empty = document.createElement('div');
      empty.className = 'text-center text-muted';
      empty.textContent = 'A kosarad üres.';
      container.appendChild(empty);
      if (totalEl) totalEl.textContent = formatFt(0);
      return;
    }

    cart.forEach(item => {
      const itemRow = document.createElement('div');
      itemRow.className = 'list-group-item d-flex gap-3 align-items-start';

 
      const img = document.createElement('img');
      img.src = item.img || '';
      img.alt = item.title || '';
      img.style.width = '64px';
      img.style.height = '64px';
      img.style.objectFit = 'cover';
      img.className = 'rounded';


      const content = document.createElement('div');
      content.className = 'flex-grow-1';

      const titleRow = document.createElement('div');
      titleRow.className = 'd-flex justify-content-between align-items-start';

      const title = document.createElement('div');
      title.innerHTML = `<strong>${escapeHtml(item.title || '')}</strong>`;

      const removeBtn = document.createElement('button');
      removeBtn.className = 'btn btn-sm btn-outline-danger ms-2';
      removeBtn.type = 'button';
      removeBtn.textContent = 'Eltávolít';
      removeBtn.addEventListener('click', () => {
        removeItem(item.id);
      });

      titleRow.appendChild(title);
      titleRow.appendChild(removeBtn);

      const desc = document.createElement('div');
      desc.className = 'text-muted small';
      desc.textContent = item.desc || '';


      const qp = document.createElement('div');
      qp.className = 'd-flex justify-content-between align-items-center mt-2';

      const qtyWrapper = document.createElement('div');
      qtyWrapper.className = 'd-flex align-items-center gap-2';

      const qtyLabel = document.createElement('label');
      qtyLabel.className = 'mb-0 small';
      qtyLabel.textContent = 'Fő:';

      const qtyInput = document.createElement('input');
      qtyInput.type = 'number';
      qtyInput.min = '1';
      qtyInput.value = item.qty || 1;
      qtyInput.className = 'form-control form-control-sm';
      qtyInput.style.width = '80px';
      qtyInput.addEventListener('change', (e) => {
        const newQty = Math.max(1, parseInt(e.target.value || 1, 10));
        updateItemQty(item.id, newQty);
      });

      qtyWrapper.appendChild(qtyLabel);
      qtyWrapper.appendChild(qtyInput);

      const priceDiv = document.createElement('div');
      priceDiv.className = 'text-end';
      const itemTotal = (item.price || 0) * (item.qty || 1);
      priceDiv.innerHTML = `<div class="small text-muted">${formatFt(item.price || 0)} / fő</div><div class="fw-bold">${formatFt(itemTotal)}</div>`;

      qp.appendChild(qtyWrapper);
      qp.appendChild(priceDiv);

      content.appendChild(titleRow);
      content.appendChild(desc);
      content.appendChild(qp);

      itemRow.appendChild(img);
      itemRow.appendChild(content);

      container.appendChild(itemRow);
    });

    if (totalEl) {
      totalEl.textContent = formatFt(cartTotalPrice(cart));
    }
  }

  function escapeHtml(text) {
    if (!text) return '';
    return text.replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;');
  }

  function addItem(item) {
    if (!item || !item.id) return;
    const cart = loadCart();
    const existing = cart.find(i => i.id === item.id);
    if (existing) {
      existing.qty = (existing.qty || 0) + (item.qty || 1);
    } else {
      cart.push({
        id: item.id,
        title: item.title || '',
        price: parseInt(item.price || 0, 10) || 0,
        img: item.img || '',
        desc: item.desc || '',
        qty: item.qty || 1
      });
    }
    saveCart(cart);
  }

 
  function updateItemQty(id, qty) {
    const cart = loadCart();
    const idx = cart.findIndex(i => i.id === id);
    if (idx === -1) return;
    cart[idx].qty = qty;
    saveCart(cart);
  }

  
  function removeItem(id) {
    let cart = loadCart();
    cart = cart.filter(i => i.id !== id);
    saveCart(cart);
  }

 
  function clearCart() {
    saveCart([]);
  }

 
  function payCart() {
    const cart = loadCart();
    if (!cart || cart.length === 0) {
      alert('A kosarad üres.');
      return;
    }
   
   
    const total = cartTotalPrice(cart);
    const summaryLines = cart.map(i => `${i.title} — ${i.qty} fő — ${formatFt((i.price || 0) * i.qty)}`);
    const confirmMsg = 'Fizetés összeg: ' + formatFt(total) + '\n\n' + summaryLines.join('\n') + '\n\nFizetés szimulálása — a kosár törlődik.';
 
    alert(confirmMsg);
    clearCart();
  }

  function attachControls() {
    document.querySelectorAll('.add-to-cart-btn').forEach(btn => {
      if (btn.dataset.cartListenerAttached) return;
      btn.dataset.cartListenerAttached = '1';
      btn.addEventListener('click', (e) => {
        const id = btn.dataset.id || ('trip-' + Date.now());
        let qty = 1;
        const card = btn.closest('.card');
        if (card) {
          const q = card.querySelector('.qty-input') || card.querySelector('input[type="number"]');
          if (q) qty = Math.max(1, parseInt(q.value || 1, 10));
        }
        const item = {
          id,
          title: btn.dataset.title || btn.dataset.name || btn.textContent || 'Utazás',
          price: parseInt(btn.dataset.price || 0, 10) || 0,
          img: btn.dataset.img || '',
          desc: btn.dataset.desc || '',
          qty
        };
        addItem(item);

        const offcanvasEl = document.getElementById('cartOffcanvas');
        if (offcanvasEl) {
          const bsOff = bootstrap.Offcanvas.getOrCreateInstance(offcanvasEl);
          bsOff.show();
        }
      });
    });

    const clearBtn = document.getElementById('clearCartBtn');
    if (clearBtn && !clearBtn.dataset.listener) {
      clearBtn.dataset.listener = '1';
      clearBtn.addEventListener('click', () => {
        if (confirm('Biztosan törlöd a kosár tartalmát?')) clearCart();
      });
    }

    const payBtn = document.getElementById('payCartBtn');
    if (payBtn && !payBtn.dataset.listener) {
      payBtn.dataset.listener = '1';
      payBtn.addEventListener('click', () => {
        payCart();
      });
    }

    const offcanvasEl = document.getElementById('cartOffcanvas');
    if (offcanvasEl && !offcanvasEl.dataset.showListener) {
      offcanvasEl.dataset.showListener = '1';
      offcanvasEl.addEventListener('show.bs.offcanvas', () => {
        renderCart();
      });
    }
  }

  window.cartAddItem = function (item) {
    addItem(item);
  };

  document.addEventListener('DOMContentLoaded', function () {
    updateBadge();
    attachControls();
    renderCart();
  });

  window.addEventListener('storage', (e) => {
    if (e.key === STORAGE_KEY) {
      updateBadge();
      renderCart();
    }
  });

})();