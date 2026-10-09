/**
 * Indian Mart — Next-Gen Core E-Commerce Engine
 * Features: Multi-Currency · AI Shopping Assistant · Side-by-Side Compare ·
 *           Live Order Tracker · Web Audio SFX · Social Proof Notifications ·
 *           Smart Cart with Free Shipping Progress & WhatsApp Checkout
 */

document.addEventListener('DOMContentLoaded', () => {

  // ═══════════════════ STATE ════════════════════════════════════════════════
  let cart     = JSON.parse(localStorage.getItem('im_cart'))     || [];
  let wishlist = JSON.parse(localStorage.getItem('im_wishlist')) || [];
  let compareList = JSON.parse(localStorage.getItem('im_compare')) || [];
  let activeCategory = 'all';
  let searchQuery    = '';
  let sortOption     = 'featured';
  let appliedCoupon  = null;
  let currentCurrency = localStorage.getItem('im_currency') || 'INR';
  let soundEnabled   = localStorage.getItem('im_sound') !== 'false';

  // Currency Exchange Rates (Base: INR)
  const CURRENCY_RATES = {
    INR: { symbol: '₹', rate: 1, label: 'INR (₹)' },
    USD: { symbol: '$', rate: 0.012, label: 'USD ($)' },
    EUR: { symbol: '€', rate: 0.011, label: 'EUR (€)' },
    AED: { symbol: 'AED ', rate: 0.044, label: 'AED (د.إ)' },
    GBP: { symbol: '£', rate: 0.0095, label: 'GBP (£)' }
  };

  function formatPrice(amountInINR) {
    const cur = CURRENCY_RATES[currentCurrency] || CURRENCY_RATES.INR;
    const converted = Math.round(amountInINR * cur.rate);
    return `${cur.symbol}${converted.toLocaleString()}`;
  }

  // ═══════════════════ WEB AUDIO SYNTHESIS (Sound FX) ══════════════════════
  let audioCtx = null;
  function playSound(type) {
    if (!soundEnabled) return;
    try {
      if (!audioCtx) audioCtx = new (window.AudioContext || window.webkitAudioContext)();
      if (audioCtx.state === 'suspended') audioCtx.resume();

      const osc = audioCtx.createOscillator();
      const gain = audioCtx.createGain();
      osc.connect(gain);
      gain.connect(audioCtx.destination);

      const now = audioCtx.currentTime;
      if (type === 'click') {
        osc.frequency.setValueAtTime(440, now);
        osc.frequency.exponentialRampToValueAtTime(880, now + 0.06);
        gain.gain.setValueAtTime(0.08, now);
        gain.gain.exponentialRampToValueAtTime(0.001, now + 0.06);
        osc.start(now); osc.stop(now + 0.06);
      } else if (type === 'add') {
        osc.frequency.setValueAtTime(523.25, now); // C5
        osc.frequency.setValueAtTime(659.25, now + 0.07); // E5
        osc.frequency.setValueAtTime(783.99, now + 0.14); // G5
        gain.gain.setValueAtTime(0.12, now);
        gain.gain.exponentialRampToValueAtTime(0.001, now + 0.28);
        osc.start(now); osc.stop(now + 0.28);
      } else if (type === 'success') {
        osc.frequency.setValueAtTime(587.33, now); // D5
        osc.frequency.setValueAtTime(880, now + 0.1); // A5
        osc.frequency.setValueAtTime(1174.66, now + 0.2); // D6
        gain.gain.setValueAtTime(0.15, now);
        gain.gain.exponentialRampToValueAtTime(0.001, now + 0.4);
        osc.start(now); osc.stop(now + 0.4);
      }
    } catch(e) {}
  }

  // ═══════════════════ DOM REFS ═════════════════════════════════════════════
  const $  = id => document.getElementById(id);
  const $$ = sel => document.querySelectorAll(sel);

  const productsGrid     = $('products-grid');
  const filterPills      = $$('.filter-pill');
  const sortSelect       = $('sort-select');
  const cartBadge        = $('cart-badge');
  const wishlistBadge    = $('wishlist-badge');
  const compareCountEl   = $('compare-count-text');

  // Cart Drawer
  const cartDrawer       = $('cart-drawer');
  const cartOverlay      = $('cart-overlay');
  const closeCartBtn     = $('close-cart-btn');
  const openCartBtn      = $('open-cart-btn');
  const cartItemsCont    = $('cart-items-container');
  const cartEmptyState   = $('cart-empty-state');
  const cartFooter       = $('cart-footer');
  const cartSubtotal     = $('cart-subtotal');
  const cartTotal        = $('cart-total');
  const cartCountText    = $('cart-count-text');
  const shippingFill     = $('shipping-progress-fill');
  const shippingText     = $('shipping-progress-text');
  const discountRow      = $('discount-row');
  const discountAmount   = $('discount-amount');
  const couponInput      = $('coupon-input');
  const applyCouponBtn   = $('apply-coupon-btn');
  const checkoutBtn      = $('checkout-btn');

  // Wishlist Drawer
  const wishlistDrawer   = $('wishlist-drawer');
  const wishlistOverlay  = $('wishlist-overlay');
  const closeWishlistBtn = $('close-wishlist-btn');
  const openWishlistBtn  = $('open-wishlist-btn');
  const wishlistItemsCont= $('wishlist-items-container');
  const wishlistEmpty    = $('wishlist-empty-state');
  const wishlistCountText= $('wishlist-count-text');

  // Compare
  const compareBar       = $('compare-floating-bar');
  const compareModal     = $('compare-modal-overlay');
  const closeCompareBtn  = $('close-compare-btn');
  const openCompareBtn   = $('open-compare-btn');
  const compareGridMatrix= $('compare-grid-matrix');

  // Quick View
  const qvOverlay        = $('quickview-overlay');
  const qvModal          = $('quickview-modal');
  const closeQvBtn       = $('close-quickview-btn');
  const qvInner          = $('quickview-inner');

  // Order Tracker
  const trackerModal     = $('order-tracker-modal');
  const openTrackerBtn   = $('open-tracker-btn');
  const closeTrackerBtn  = $('close-tracker-btn');
  const trackOrderForm   = $('track-order-form');

  // AI Assistant
  const aiToggle         = $('ai-assistant-toggle');
  const aiChatWindow     = $('ai-chat-window');
  const closeAiBtn       = $('close-ai-btn');
  const aiChatBody       = $('ai-chat-body');
  const aiChatInput      = $('ai-chat-input');
  const aiChatSend       = $('ai-chat-send');

  // Currency
  const currencyBtn      = $('currency-select-btn');
  const currencyDropdown = $('currency-dropdown');
  const currencyOpts     = $$('.currency-opt');

  // Sound Toggle
  const soundToggleBtn   = $('sound-toggle-btn');

  // ═══════════════════ SOUND TOGGLE ═════════════════════════════════════════
  function updateSoundIcon() {
    if (soundToggleBtn) {
      soundToggleBtn.textContent = soundEnabled ? '🔊 Sound On' : '🔇 Muted';
    }
  }
  if (soundToggleBtn) {
    soundToggleBtn.addEventListener('click', () => {
      soundEnabled = !soundEnabled;
      localStorage.setItem('im_sound', soundEnabled);
      updateSoundIcon();
      if (soundEnabled) playSound('click');
      showToast(soundEnabled ? 'Audio sound effects enabled' : 'Audio sound muted');
    });
    updateSoundIcon();
  }

  // ═══════════════════ CURRENCY SWITCHER ════════════════════════════════════
  if (currencyBtn && currencyDropdown) {
    currencyBtn.addEventListener('click', (e) => {
      e.stopPropagation();
      currencyDropdown.classList.toggle('open');
      playSound('click');
    });
    document.addEventListener('click', () => currencyDropdown.classList.remove('open'));

    currencyOpts.forEach(opt => {
      opt.addEventListener('click', () => {
        const cur = opt.getAttribute('data-cur');
        if (cur && CURRENCY_RATES[cur]) {
          currentCurrency = cur;
          localStorage.setItem('im_currency', cur);
          currencyBtn.innerHTML = `<span>${CURRENCY_RATES[cur].symbol}</span> ${cur} ▾`;
          currencyOpts.forEach(o => o.classList.toggle('active', o.getAttribute('data-cur') === cur));
          currencyDropdown.classList.remove('open');
          playSound('click');
          renderProducts();
          renderCart();
          renderWishlist();
          renderCompareMatrix();
          showToast(`Currency changed to ${CURRENCY_RATES[cur].label}`);
        }
      });
    });
    // Set initial
    if (currencyBtn) currencyBtn.innerHTML = `<span>${CURRENCY_RATES[currentCurrency].symbol}</span> ${currentCurrency} ▾`;
  }

  // ═══════════════════ FLASH SALE COUNTDOWN TIMER ═══════════════════════════
  function initFlashTimer() {
    const timerEls = $$('.flash-timer-display');
    if (!timerEls.length) return;

    let targetTime = Date.now() + (5 * 60 * 60 * 1000) + (42 * 60 * 1000) + (18 * 1000);

    function update() {
      const now = Date.now();
      const diff = Math.max(0, targetTime - now);
      const hours = Math.floor(diff / (1000 * 60 * 60));
      const mins  = Math.floor((diff % (1000 * 60 * 60)) / (1000 * 60));
      const secs  = Math.floor((diff % (1000 * 60)) / 1000);

      const str = `${String(hours).padStart(2, '0')}h : ${String(mins).padStart(2, '0')}m : ${String(secs).padStart(2, '0')}s`;
      timerEls.forEach(el => el.textContent = str);
    }
    update();
    setInterval(update, 1000);
  }
  initFlashTimer();

  // ═══════════════════ PRODUCT RENDERING ════════════════════════════════════
  function getFilteredProducts() {
    if (typeof PRODUCTS === 'undefined') return [];
    let list = [...PRODUCTS];

    // Category filter
    if (activeCategory !== 'all') {
      list = list.filter(p => p.category === activeCategory);
    }

    // Search query filter
    if (searchQuery.trim()) {
      const q = searchQuery.toLowerCase().trim();
      list = list.filter(p =>
        p.name.toLowerCase().includes(q) ||
        (p.categoryLabel && p.categoryLabel.toLowerCase().includes(q)) ||
        (p.description && p.description.toLowerCase().includes(q))
      );
    }

    // Sort
    if (sortOption === 'price-asc') {
      list.sort((a, b) => a.price - b.price);
    } else if (sortOption === 'price-desc') {
      list.sort((a, b) => b.price - a.price);
    } else if (sortOption === 'rating') {
      list.sort((a, b) => (b.rating || 0) - (a.rating || 0));
    }

    return list;
  }

  function renderProducts() {
    if (!productsGrid) return;
    const list = getFilteredProducts();

    if (list.length === 0) {
      productsGrid.innerHTML = `
        <div style="grid-column: 1/-1; text-align: center; padding: 60px 20px;">
          <div style="font-size: 3rem; margin-bottom: 12px;">🔍</div>
          <h3 style="font-family:'Poppins',sans-serif; font-size: 1.3rem; font-weight: 700;">No matching products found</h3>
          <p style="color: var(--text-3); font-size: 0.9rem; margin-top: 6px;">Try adjusting your filters or search keywords.</p>
          <button class="btn-primary" id="reset-filter-btn" style="margin-top: 18px;">View All Products</button>
        </div>
      `;
      const resetBtn = $('reset-filter-btn');
      if (resetBtn) resetBtn.addEventListener('click', () => {
        activeCategory = 'all';
        searchQuery = '';
        filterPills.forEach(p => p.classList.toggle('active', p.getAttribute('data-cat') === 'all'));
        renderProducts();
      });
      return;
    }

    productsGrid.innerHTML = list.map(prod => {
      const isWishlisted = wishlist.some(item => item.id === prod.id);
      const isCompared   = compareList.some(item => item.id === prod.id);
      const starsHtml = '★'.repeat(Math.round(prod.rating || 5)) + '☆'.repeat(5 - Math.round(prod.rating || 5));

      return `
        <div class="product-card" data-id="${prod.id}">
          <div class="product-image-wrap">
            <img src="${prod.image}" alt="${prod.name}" loading="lazy" onerror="this.onerror=null; this.src='images/hero_watch.jpg';">
            ${prod.badge ? `<span class="product-badge ${prod.badgeType || 'badge-sale'}">${prod.badge}</span>` : ''}
            
            <div class="product-quick-actions">
              <button class="product-act-btn wish-btn ${isWishlisted ? 'active' : ''}" data-id="${prod.id}" title="Wishlist">
                ${isWishlisted ? '❤️' : '🤍'}
              </button>
              <button class="product-act-btn qv-btn" data-id="${prod.id}" title="Quick View">
                👁️
              </button>
            </div>
          </div>

          <div class="product-card-body">
            <span class="product-category-tag">${prod.categoryLabel || prod.category}</span>
            <h3 class="product-card-title" title="${prod.name}">${prod.name}</h3>
            
            <div class="product-card-rating">
              <span class="product-stars">${starsHtml}</span>
              <span class="product-rev-count">(${prod.reviewsCount || 120})</span>
            </div>

            <div class="product-card-pricing">
              <span class="price-main">${formatPrice(prod.price)}</span>
              ${prod.originalPrice ? `<span class="price-strike">${formatPrice(prod.originalPrice)}</span>` : ''}
              ${prod.discountPercent ? `<span class="discount-chip">${prod.discountPercent}% OFF</span>` : ''}
            </div>

            <div class="product-card-footer">
              <button class="btn-card-add" data-id="${prod.id}">
                🛒 <span>Add to Bag</span>
              </button>
              <button class="btn-card-compare ${isCompared ? 'in-compare' : ''}" data-id="${prod.id}" title="Compare Product">
                ⚖️
              </button>
            </div>
          </div>
        </div>
      `;
    }).join('');

    attachProductCardListeners();
  }

  function attachProductCardListeners() {
    // Add to Cart
    $$('.btn-card-add').forEach(btn => {
      btn.addEventListener('click', (e) => {
        e.stopPropagation();
        const id = btn.getAttribute('data-id');
        addToCart(id);
      });
    });

    // Wishlist
    $$('.wish-btn').forEach(btn => {
      btn.addEventListener('click', (e) => {
        e.stopPropagation();
        const id = btn.getAttribute('data-id');
        toggleWishlist(id);
      });
    });

    // Quick View
    $$('.qv-btn').forEach(btn => {
      btn.addEventListener('click', (e) => {
        e.stopPropagation();
        const id = btn.getAttribute('data-id');
        openQuickView(id);
      });
    });

    // Compare
    $$('.btn-card-compare').forEach(btn => {
      btn.addEventListener('click', (e) => {
        e.stopPropagation();
        const id = btn.getAttribute('data-id');
        toggleCompare(id);
      });
    });
  }

  // ═══════════════════ FILTER & SORT EVENTS ═════════════════════════════════
  filterPills.forEach(pill => {
    pill.addEventListener('click', () => {
      filterPills.forEach(p => p.classList.remove('active'));
      pill.classList.add('active');
      activeCategory = pill.getAttribute('data-cat') || 'all';
      playSound('click');
      renderProducts();
    });
  });

  if (sortSelect) {
    sortSelect.addEventListener('change', () => {
      sortOption = sortSelect.value;
      playSound('click');
      renderProducts();
    });
  }

  // ═══════════════════ CART MANAGEMENT ══════════════════════════════════════
  function addToCart(productId, qty = 1) {
    if (typeof PRODUCTS === 'undefined') return;
    const prod = PRODUCTS.find(p => p.id === productId);
    if (!prod) return;

    const existing = cart.find(item => item.id === productId);
    if (existing) {
      existing.quantity += qty;
    } else {
      cart.push({ id: prod.id, name: prod.name, price: prod.price, image: prod.image, quantity: qty });
    }

    localStorage.setItem('im_cart', JSON.stringify(cart));
    playSound('add');
    updateBadges();
    renderCart();
    openCart();
    showToast(`Added "${prod.name}" to Bag! 🛍️`);
  }

  function removeFromCart(productId) {
    cart = cart.filter(item => item.id !== productId);
    localStorage.setItem('im_cart', JSON.stringify(cart));
    playSound('click');
    updateBadges();
    renderCart();
  }

  function updateCartQty(productId, delta) {
    const item = cart.find(i => i.id === productId);
    if (!item) return;
    item.quantity += delta;
    if (item.quantity <= 0) {
      removeFromCart(productId);
    } else {
      localStorage.setItem('im_cart', JSON.stringify(cart));
      renderCart();
      updateBadges();
    }
  }

  function renderCart() {
    if (!cartItemsCont) return;

    if (cart.length === 0) {
      cartEmptyState.style.display = 'block';
      cartFooter.style.display = 'none';
      if (shippingFill) shippingFill.style.width = '0%';
      if (shippingText) shippingText.textContent = 'Add ₹999 for FREE Delivery!';
      return;
    }

    cartEmptyState.style.display = 'none';
    cartFooter.style.display = 'block';

    cartItemsCont.innerHTML = cart.map(item => `
      <div class="cart-item-row">
        <img class="cart-item-img" src="${item.image}" alt="${item.name}" onerror="this.src='images/hero_watch.jpg';">
        <div>
          <h4 class="cart-item-title">${item.name}</h4>
          <div class="cart-item-price">${formatPrice(item.price)}</div>
          <div class="cart-qty-ctrl">
            <button class="qty-btn" onclick="window.imUpdateQty('${item.id}', -1)">−</button>
            <span style="font-weight:700; font-size:0.85rem;">${item.quantity}</span>
            <button class="qty-btn" onclick="window.imUpdateQty('${item.id}', 1)">+</button>
          </div>
        </div>
        <button onclick="window.imRemoveCart('${item.id}')" style="color:#EF4444; font-size:1.1rem; padding:4px;" title="Remove">🗑️</button>
      </div>
    `).join('');

    // Totals Calculation (in base INR)
    const subtotal = cart.reduce((sum, item) => sum + (item.price * item.quantity), 0);
    let discount = 0;
    if (appliedCoupon === 'LUXE20') {
      discount = Math.round(subtotal * 0.20);
    } else if (appliedCoupon === 'WELCOME15') {
      discount = Math.round(subtotal * 0.15);
    } else if (appliedCoupon === 'MEGA500') {
      discount = Math.min(500, subtotal);
    }

    const total = Math.max(0, subtotal - discount);

    if (cartSubtotal) cartSubtotal.textContent = formatPrice(subtotal);
    if (cartTotal) cartTotal.textContent = formatPrice(total);

    if (discountRow && discountAmount) {
      if (discount > 0) {
        discountRow.style.display = 'flex';
        discountAmount.textContent = `-${formatPrice(discount)}`;
      } else {
        discountRow.style.display = 'none';
      }
    }

    // Free shipping calculation (threshold ₹999)
    const freeShippingThreshold = 999;
    const progressPercent = Math.min(100, Math.round((subtotal / freeShippingThreshold) * 100));
    if (shippingFill) shippingFill.style.width = `${progressPercent}%`;
    if (shippingText) {
      if (subtotal >= freeShippingThreshold) {
        shippingText.innerHTML = '🎉 <strong style="color:#10B981;">Congratulations! You unlocked FREE Delivery!</strong>';
      } else {
        const remaining = freeShippingThreshold - subtotal;
        shippingText.innerHTML = `Add <strong style="color:#FF5A00;">${formatPrice(remaining)}</strong> more to unlock <strong>FREE Delivery!</strong>`;
      }
    }
  }

  window.imUpdateQty = (id, delta) => updateCartQty(id, delta);
  window.imRemoveCart = (id) => removeFromCart(id);

  function openCart() {
    if (cartDrawer && cartOverlay) {
      cartDrawer.classList.add('open');
      cartOverlay.classList.add('open');
      playSound('click');
    }
  }
  function closeCart() {
    if (cartDrawer && cartOverlay) {
      cartDrawer.classList.remove('open');
      cartOverlay.classList.remove('open');
    }
  }

  if (openCartBtn) openCartBtn.addEventListener('click', openCart);
  if (closeCartBtn) closeCartBtn.addEventListener('click', closeCart);
  if (cartOverlay) cartOverlay.addEventListener('click', closeCart);

  // Coupon handling
  if (applyCouponBtn && couponInput) {
    applyCouponBtn.addEventListener('click', () => {
      const code = couponInput.value.trim().toUpperCase();
      if (code === 'LUXE20' || code === 'WELCOME15' || code === 'MEGA500') {
        appliedCoupon = code;
        renderCart();
        playSound('success');
        showToast(`🎉 Coupon "${code}" Applied Successfully!`);
      } else {
        showToast('❌ Invalid coupon code');
      }
    });
  }

  // Coupon Chips
  $$('.coupon-chip-pill').forEach(pill => {
    pill.addEventListener('click', () => {
      const code = pill.getAttribute('data-code');
      if (couponInput && code) {
        couponInput.value = code;
        appliedCoupon = code;
        renderCart();
        playSound('success');
        showToast(`🎉 Coupon "${code}" Applied!`);
      }
    });
  });

  // WhatsApp 1-Click Order
  const waBtn = $('whatsapp-order-btn');
  if (waBtn) {
    waBtn.addEventListener('click', () => {
      if (cart.length === 0) {
        showToast('Your bag is empty!');
        return;
      }
      const itemsList = cart.map(i => `• ${i.name} (x${i.quantity}) - ${formatPrice(i.price * i.quantity)}`).join('%0A');
      const total = cart.reduce((s, i) => s + (i.price * i.quantity), 0);
      const text = `*New Order from Indian Mart Website*%0A%0A*Items Ordered:*%0A${itemsList}%0A%0A*Total Amount:* ${formatPrice(total)}%0A%0APlease confirm my order & send delivery update!`;
      window.open(`https://wa.me/919876543210?text=${text}`, '_blank');
      playSound('success');
    });
  }

  // ═══════════════════ WISHLIST MANAGEMENT ══════════════════════════════════
  function toggleWishlist(productId) {
    if (typeof PRODUCTS === 'undefined') return;
    const prod = PRODUCTS.find(p => p.id === productId);
    if (!prod) return;

    const idx = wishlist.findIndex(item => item.id === productId);
    if (idx > -1) {
      wishlist.splice(idx, 1);
      showToast(`Removed "${prod.name}" from Wishlist`);
    } else {
      wishlist.push({ id: prod.id, name: prod.name, price: prod.price, image: prod.image });
      playSound('add');
      showToast(`Saved "${prod.name}" to Wishlist! ❤️`);
    }

    localStorage.setItem('im_wishlist', JSON.stringify(wishlist));
    updateBadges();
    renderWishlist();
    renderProducts();
  }

  function renderWishlist() {
    if (!wishlistItemsCont) return;
    if (wishlist.length === 0) {
      wishlistEmpty.style.display = 'block';
      wishlistItemsCont.innerHTML = '';
      return;
    }

    wishlistEmpty.style.display = 'none';
    wishlistItemsCont.innerHTML = wishlist.map(item => `
      <div class="cart-item-row">
        <img class="cart-item-img" src="${item.image}" alt="${item.name}" onerror="this.src='images/hero_watch.jpg';">
        <div>
          <h4 class="cart-item-title">${item.name}</h4>
          <div class="cart-item-price">${formatPrice(item.price)}</div>
          <button class="btn-card-add" onclick="window.imWishToCart('${item.id}')" style="margin-top:8px; padding:6px 12px; font-size:0.75rem;">
            🛒 Move to Bag
          </button>
        </div>
        <button onclick="window.imToggleWish('${item.id}')" style="color:#EF4444; font-size:1.1rem; padding:4px;">❌</button>
      </div>
    `).join('');
  }

  window.imWishToCart = (id) => {
    addToCart(id);
    toggleWishlist(id);
  };
  window.imToggleWish = (id) => toggleWishlist(id);

  if (openWishlistBtn) openWishlistBtn.addEventListener('click', () => {
    wishlistDrawer.classList.add('open');
    wishlistOverlay.classList.add('open');
    playSound('click');
  });
  if (closeWishlistBtn) closeWishlistBtn.addEventListener('click', () => {
    wishlistDrawer.classList.remove('open');
    wishlistOverlay.classList.remove('open');
  });
  if (wishlistOverlay) wishlistOverlay.addEventListener('click', () => {
    wishlistDrawer.classList.remove('open');
    wishlistOverlay.classList.remove('open');
  });

  // ═══════════════════ SIDE-BY-SIDE COMPARE SYSTEM ══════════════════════════
  function toggleCompare(productId) {
    if (typeof PRODUCTS === 'undefined') return;
    const prod = PRODUCTS.find(p => p.id === productId);
    if (!prod) return;

    const idx = compareList.findIndex(i => i.id === productId);
    if (idx > -1) {
      compareList.splice(idx, 1);
      showToast(`Removed "${prod.name}" from comparison`);
    } else {
      if (compareList.length >= 4) {
        showToast('You can compare up to 4 products at once.');
        return;
      }
      compareList.push(prod);
      playSound('add');
      showToast(`Added to compare! (${compareList.length}/4) ⚖️`);
    }

    localStorage.setItem('im_compare', JSON.stringify(compareList));
    updateCompareBar();
    renderProducts();
  }

  function updateCompareBar() {
    if (!compareBar) return;
    if (compareList.length > 0) {
      compareBar.classList.add('active');
      if (compareCountEl) compareCountEl.textContent = `(${compareList.length})`;

      const thumbsCont = $('compare-thumbnails-container');
      if (thumbsCont) {
        thumbsCont.innerHTML = compareList.map(item => `
          <div class="compare-thumb-slot" title="${item.name}">
            <img src="${item.image}" alt="${item.name}">
          </div>
        `).join('');
      }
    } else {
      compareBar.classList.remove('active');
    }
  }

  function renderCompareMatrix() {
    if (!compareGridMatrix) return;
    if (compareList.length === 0) {
      compareGridMatrix.innerHTML = '<p style="text-align:center; padding:40px;">No products selected for comparison.</p>';
      return;
    }

    compareGridMatrix.style.gridTemplateColumns = `repeat(${compareList.length}, minmax(220px, 1fr))`;
    compareGridMatrix.innerHTML = compareList.map(prod => `
      <div style="border:1.5px solid var(--border); border-radius:var(--radius); padding:18px; display:flex; flex-direction:column; gap:12px; background:#fff;">
        <div style="position:relative; width:100%; aspect-ratio:1/1; border-radius:10px; overflow:hidden; background:#F8FAFC;">
          <img src="${prod.image}" alt="${prod.name}" style="width:100%; height:100%; object-fit:cover;">
          <button onclick="window.imRemoveCompare('${prod.id}')" style="position:absolute; top:6px; right:6px; background:#EF4444; color:#fff; width:26px; height:26px; border-radius:50%; font-size:0.75rem;">✕</button>
        </div>
        <h4 style="font-family:'Poppins',sans-serif; font-size:0.95rem; font-weight:700;">${prod.name}</h4>
        <div style="font-size:1.2rem; font-weight:900; color:var(--orange);">${formatPrice(prod.price)}</div>
        <div style="font-size:0.8rem; color:#F59E0B;">⭐ ${prod.rating || '4.7'} (${prod.reviewsCount || 100}+ reviews)</div>
        <div style="font-size:0.75rem; color:var(--text-3); font-weight:600; text-transform:uppercase;">Category: ${prod.categoryLabel || prod.category}</div>
        
        <div style="border-top:1px solid var(--border-soft); padding-top:10px; font-size:0.8rem; color:var(--text-2);">
          <strong>Key Highlights:</strong>
          <ul style="margin-top:6px; padding-left:14px; list-style:disc; font-size:0.76rem; line-height:1.5;">
            ${(prod.features || ['Premium Authentic Build', '1 Year Warranty', 'Free Pan-India Delivery']).slice(0, 3).map(f => `<li>${f}</li>`).join('')}
          </ul>
        </div>

        <button class="btn-primary" onclick="window.imAddToCart('${prod.id}')" style="margin-top:auto; font-size:0.8rem; padding:10px;">
          🛒 Add to Bag
        </button>
      </div>
    `).join('');
  }

  window.imRemoveCompare = (id) => toggleCompare(id);
  window.imAddToCart = (id) => addToCart(id);

  if (openCompareBtn) openCompareBtn.addEventListener('click', () => {
    renderCompareMatrix();
    compareModal.classList.add('open');
    playSound('click');
  });
  if (closeCompareBtn) closeCompareBtn.addEventListener('click', () => {
    compareModal.classList.remove('open');
  });
  if (compareModal) compareModal.addEventListener('click', (e) => {
    if (e.target === compareModal) compareModal.classList.remove('open');
  });

  // ═══════════════════ QUICK VIEW MODAL ═════════════════════════════════════
  function openQuickView(productId) {
    if (typeof PRODUCTS === 'undefined') return;
    const prod = PRODUCTS.find(p => p.id === productId);
    if (!prod || !qvInner || !qvOverlay) return;

    const starsHtml = '★'.repeat(Math.round(prod.rating || 5)) + '☆'.repeat(5 - Math.round(prod.rating || 5));

    qvInner.innerHTML = `
      <div class="qv-image-box">
        <img src="${prod.image}" alt="${prod.name}" id="qv-main-img">
        ${prod.badge ? `<span class="product-badge ${prod.badgeType || 'badge-sale'}">${prod.badge}</span>` : ''}
      </div>
      <div>
        <span class="product-category-tag">${prod.categoryLabel || prod.category}</span>
        <h2 style="font-family:'Poppins',sans-serif; font-size:1.35rem; font-weight:800; color:var(--text); margin-bottom:10px;">${prod.name}</h2>
        
        <div style="display:flex; align-items:center; gap:8px; margin-bottom:14px;">
          <span style="color:#F59E0B; font-size:0.9rem;">${starsHtml}</span>
          <span style="font-size:0.8rem; color:var(--text-3); font-weight:600;">${prod.rating || 4.8} (${prod.reviewsCount || 240} verified ratings)</span>
        </div>

        <div style="display:flex; align-items:baseline; gap:10px; margin-bottom:18px;">
          <span style="font-family:'Poppins',sans-serif; font-size:1.6rem; font-weight:900; color:var(--orange);">${formatPrice(prod.price)}</span>
          ${prod.originalPrice ? `<span style="font-size:0.95rem; color:var(--text-3); text-decoration:line-through;">${formatPrice(prod.originalPrice)}</span>` : ''}
          ${prod.discountPercent ? `<span class="discount-chip">${prod.discountPercent}% OFF</span>` : ''}
        </div>

        <p style="font-size:0.88rem; color:var(--text-2); line-height:1.6; margin-bottom:18px;">${prod.description || 'Crafted with premium materials for long-lasting durability, aesthetic design, and superior performance.'}</p>

        <div style="margin-bottom:20px; font-size:0.82rem; color:var(--text-2);">
          <strong>Key Specifications:</strong>
          <ul style="margin-top:6px; padding-left:18px; list-style:disc; font-size:0.8rem; line-height:1.6;">
            ${(prod.features || ['100% Genuine Certified Quality', 'Pan-India Express Delivery in 2-4 Days', '30-Day Hassle-Free Return Policy']).map(f => `<li>${f}</li>`).join('')}
          </ul>
        </div>

        <div style="display:flex; gap:12px; align-items:center;">
          <button class="btn-primary" onclick="window.imAddToCart('${prod.id}')" style="flex:1;">
            🛒 Add to Bag Now
          </button>
          <button class="btn-secondary" onclick="window.imToggleWish('${prod.id}')" style="padding:12px 18px;">
            ❤️ Wishlist
          </button>
        </div>
      </div>
    `;

    qvOverlay.classList.add('open');
    playSound('click');
  }

  if (closeQvBtn && qvOverlay) {
    closeQvBtn.addEventListener('click', () => qvOverlay.classList.remove('open'));
    qvOverlay.addEventListener('click', (e) => {
      if (e.target === qvOverlay) qvOverlay.classList.remove('open');
    });
  }

  // ═══════════════════ LIVE ORDER TRACKER MODAL ═════════════════════════════
  if (openTrackerBtn && trackerModal) {
    openTrackerBtn.addEventListener('click', () => {
      trackerModal.classList.add('open');
      playSound('click');
    });
  }
  if (closeTrackerBtn && trackerModal) {
    closeTrackerBtn.addEventListener('click', () => trackerModal.classList.remove('open'));
    trackerModal.addEventListener('click', (e) => {
      if (e.target === trackerModal) trackerModal.classList.remove('open');
    });
  }

  if (trackOrderForm) {
    trackOrderForm.addEventListener('submit', (e) => {
      e.preventDefault();
      const input = $('track-order-input');
      let queryId = input ? input.value.trim() : '#IM-88421';
      if (!queryId) queryId = '#IM-88421';

      const resultBox = $('tracker-result-box');
      if (!resultBox) return;

      // Clean ID format
      const displayId = queryId.startsWith('#') ? queryId.toUpperCase() : (queryId.startsWith('CUST') || queryId.startsWith('IM') ? `#${queryId.toUpperCase()}` : `#IM-${queryId.toUpperCase()}`);
      
      // Determine sample product for tracking
      let sampleProd = (typeof PRODUCTS !== 'undefined' && PRODUCTS.length > 0) ? PRODUCTS[0] : {
        name: 'Quantum G15 Ultra 5G (256GB, Midnight Black)',
        price: 24999,
        image: 'images/products/quantum_smartphone.jpg'
      };

      // If query mentions watch, kurti, audio, phone
      const qLower = queryId.toLowerCase();
      if (typeof PRODUCTS !== 'undefined') {
        if (qLower.includes('watch') || qLower.includes('9042')) {
          const found = PRODUCTS.find(p => p.category === 'watches');
          if (found) sampleProd = found;
        } else if (qLower.includes('audio') || qLower.includes('headphone')) {
          const found = PRODUCTS.find(p => p.category === 'audio');
          if (found) sampleProd = found;
        } else if (qLower.includes('kurti') || qLower.includes('women')) {
          const found = PRODUCTS.find(p => p.category === 'women');
          if (found) sampleProd = found;
        }
      }

      // Check if Out for Delivery or In Transit based on query
      const isOutForDelivery = qLower.includes('9042') || qLower.includes('deliv');

      // Update Basic Info
      $('tracker-order-id-display').textContent = displayId;
      $('tracker-prod-name').textContent = sampleProd.name;
      $('tracker-prod-img').src = sampleProd.image;
      $('tracker-prod-price').textContent = formatPrice(sampleProd.price);

      // Date calculations
      const now = new Date();
      const yesterday = new Date(Date.now() - 24 * 60 * 60 * 1000);
      const months = ['Jan','Feb','Mar','Apr','May','Jun','Jul','Aug','Sep','Oct','Nov','Dec'];
      const dateStr = `${yesterday.getDate()} ${months[yesterday.getMonth()]}, ${yesterday.getFullYear()}`;
      $('tracker-order-date').textContent = `Ordered on: ${dateStr} · Cash on Delivery / UPI`;

      // Status & Progress
      const statusBadge = $('tracker-status-badge');
      const statusText  = $('tracker-status-text');
      const progressBar = $('tracker-progress-bar');
      const etaText     = $('tracker-eta-text');
      const currentHub  = $('tracker-current-hub');
      const hubDesc     = $('tracker-hub-desc');

      if (isOutForDelivery) {
        statusText.textContent = '🟢 OUT FOR DELIVERY (TODAY)';
        statusBadge.style.background = 'rgba(16, 185, 129, 0.25)';
        statusBadge.style.borderColor = '#10B981';
        progressBar.style.width = '90%';
        etaText.textContent = 'Arriving Today by 4:00 PM';
        currentHub.textContent = '📍 Local Delivery Station (Bandra West Hub), Mumbai';
        hubDesc.textContent = 'Courier agent Ramesh Kumar has loaded your package for delivery. Please keep OTP or COD cash ready.';
        
        $('step-1').className = 'tracker-step completed';
        $('step-2').className = 'tracker-step completed';
        $('step-3').className = 'tracker-step completed';
        $('step-4').className = 'tracker-step completed';
        $('step-5').className = 'tracker-step active';
      } else {
        statusText.textContent = '⚡ IN TRANSIT (ON SCHEDULE)';
        statusBadge.style.background = 'rgba(255, 90, 0, 0.2)';
        statusBadge.style.borderColor = '#FF5A00';
        progressBar.style.width = '70%';
        etaText.textContent = 'Arriving Tomorrow by 2:30 PM';
        currentHub.textContent = '📍 Bhiwandi Central Logistics Hub, Maharashtra';
        hubDesc.textContent = 'Shipment processed and loaded into express inter-city dispatch vehicle. Next stop: Local Sorting Hub in your destination city.';
        
        $('step-1').className = 'tracker-step completed';
        $('step-2').className = 'tracker-step completed';
        $('step-3').className = 'tracker-step completed';
        $('step-4').className = 'tracker-step active';
        $('step-5').className = 'tracker-step';
      }

      // Checkpoint Activity Logs
      const logsCont = $('tracker-logs-container');
      if (logsCont) {
        logsCont.innerHTML = `
          <div class="tracker-log-entry">
            <span class="tracker-log-time">10:45 AM Today</span>
            <div class="tracker-log-desc">
              <strong>${isOutForDelivery ? 'Out for Delivery' : 'In Transit / Sorting Scan'}</strong>
              <div style="color:var(--text-3); font-size:0.72rem;">${isOutForDelivery ? 'Package out with delivery executive Ramesh Kumar.' : 'Scanned at Central Logistics Facility (Bhiwandi Hub). Departed on express route.'}</div>
            </div>
          </div>
          <div class="tracker-log-entry">
            <span class="tracker-log-time">06:30 AM Today</span>
            <div class="tracker-log-desc">
              <strong>Departed Central Fulfillment Center</strong>
              <div style="color:var(--text-3); font-size:0.72rem;">Shipment sorted and loaded onto BlueDart Air Cargo Container #BD-904.</div>
            </div>
          </div>
          <div class="tracker-log-entry">
            <span class="tracker-log-time">Yesterday, 08:15 PM</span>
            <div class="tracker-log-desc">
              <strong>Quality Check &amp; Tamper-Proof Packaging</strong>
              <div style="color:var(--text-3); font-size:0.72rem;">Product verified by Quality Assurance &amp; packed in secure sealed box.</div>
            </div>
          </div>
          <div class="tracker-log-entry">
            <span class="tracker-log-time">Yesterday, 02:00 PM</span>
            <div class="tracker-log-desc">
              <strong>Order Confirmed &amp; Payment Allocated</strong>
              <div style="color:var(--text-3); font-size:0.72rem;">Order ${displayId} received and sent to fulfillment warehouse.</div>
            </div>
          </div>
        `;
      }

      resultBox.style.display = 'block';
      playSound('success');
      showToast(`📦 Live tracking loaded for ${displayId}!`);

      // Scroll into view inside modal
      setTimeout(() => {
        resultBox.scrollIntoView({ behavior: 'smooth', block: 'start' });
      }, 100);
    });
  }

  // ═══════════════════ AI SHOPPING ASSISTANT ("MartAI") ═════════════════════
  if (aiToggle && aiChatWindow) {
    aiToggle.addEventListener('click', () => {
      aiChatWindow.classList.toggle('open');
      playSound('click');
    });
  }
  if (closeAiBtn && aiChatWindow) {
    closeAiBtn.addEventListener('click', () => aiChatWindow.classList.remove('open'));
  }

  function appendAiMsg(text, sender = 'bot', productsToRecommend = []) {
    if (!aiChatBody) return;
    const msg = document.createElement('div');
    msg.className = `ai-msg ${sender}`;
    msg.innerHTML = text;
    aiChatBody.appendChild(msg);

    if (productsToRecommend.length > 0) {
      const recWrap = document.createElement('div');
      recWrap.style.cssText = 'display:flex; flex-direction:column; gap:8px; margin-top:6px;';
      recWrap.innerHTML = productsToRecommend.map(p => `
        <div style="background:#fff; border:1px solid var(--border); border-radius:10px; padding:10px; display:flex; align-items:center; gap:10px; box-shadow:var(--shadow-xs);">
          <img src="${p.image}" style="width:40px; height:40px; border-radius:6px; object-fit:cover;">
          <div style="flex:1;">
            <div style="font-size:0.78rem; font-weight:700; color:var(--text); line-height:1.2;">${p.name}</div>
            <div style="font-size:0.75rem; font-weight:800; color:var(--orange); margin-top:2px;">${formatPrice(p.price)}</div>
          </div>
          <button onclick="window.imAddToCart('${p.id}')" style="background:var(--orange); color:#fff; padding:6px 10px; border-radius:6px; font-size:0.72rem; font-weight:700;">Add</button>
        </div>
      `).join('');
      aiChatBody.appendChild(recWrap);
    }

    aiChatBody.scrollTop = aiChatBody.scrollHeight;
  }

  function handleAiQuery(query) {
    if (!query.trim()) return;
    appendAiMsg(query, 'user');

    setTimeout(() => {
      const q = query.toLowerCase();
      let matches = [];

      if (q.includes('phone') || q.includes('mobile') || q.includes('5g')) {
        matches = PRODUCTS.filter(p => p.category === 'phones' || p.category === 'electronics').slice(0, 2);
        appendAiMsg("Here are our top rated 5G smartphones with high-refresh AMOLED screens & fast charging:", 'bot', matches);
      } else if (q.includes('watch') || q.includes('smartwatch')) {
        matches = PRODUCTS.filter(p => p.category === 'watches').slice(0, 2);
        appendAiMsg("Check out our bestselling smartwatches with Bluetooth calling & AMOLED display:", 'bot', matches);
      } else if (q.includes('audio') || q.includes('earbuds') || q.includes('headphone') || q.includes('sound')) {
        matches = PRODUCTS.filter(p => p.category === 'audio').slice(0, 2);
        appendAiMsg("Here are high-bass studio audio gear with Active Noise Cancellation:", 'bot', matches);
      } else if (q.includes('kurti') || q.includes('saree') || q.includes('women') || q.includes('dress') || q.includes('fashion')) {
        matches = PRODUCTS.filter(p => p.category === 'women' || p.category === 'fashion').slice(0, 2);
        appendAiMsg("Here is our handcrafted ethnic festive collection sourced directly from master artisans:", 'bot', matches);
      } else if (q.includes('gift') || q.includes('under') || q.includes('budget') || q.includes('discount')) {
        matches = PRODUCTS.filter(p => p.price < 3500).slice(0, 2);
        appendAiMsg("Here are our top value picks with maximum discounts & 5-star ratings:", 'bot', matches);
      } else {
        matches = PRODUCTS.slice(0, 2);
        appendAiMsg(`I found these popular recommendations for "${query}". You can also filter by category!`, 'bot', matches);
      }
      playSound('click');
    }, 400);
  }

  if (aiChatSend && aiChatInput) {
    aiChatSend.addEventListener('click', () => {
      const txt = aiChatInput.value.trim();
      if (txt) {
        handleAiQuery(txt);
        aiChatInput.value = '';
      }
    });
    aiChatInput.addEventListener('keypress', (e) => {
      if (e.key === 'Enter') {
        const txt = aiChatInput.value.trim();
        if (txt) {
          handleAiQuery(txt);
          aiChatInput.value = '';
        }
      }
    });
  }

  // AI Prompt Chips
  $$('.ai-chip-btn').forEach(chip => {
    chip.addEventListener('click', () => {
      const q = chip.getAttribute('data-query');
      if (q) handleAiQuery(q);
    });
  });

  // ═══════════════════ LIVE SOCIAL PROOF NOTIFICATIONS ═════════════════════
  const socialToast = $('social-proof-toast');
  const SOCIAL_PURCHASES = [
    { name: 'Rahul S.', city: 'Mumbai', prod: 'Quantum G15 Ultra 5G', img: 'images/products/quantum_smartphone.jpg', time: '2m ago' },
    { name: 'Priya V.', city: 'Bengaluru', prod: 'Floral Anarkali Kurti', img: 'images/products/anarkali_kurti.jpg', time: '4m ago' },
    { name: 'Amit K.', city: 'Pune', prod: 'AuraPro Wireless Headphones', img: 'images/products/aura_headphones.jpg', time: '1m ago' },
    { name: 'Sneha N.', city: 'Kochi', prod: 'Titanium Pro Smartwatch', img: 'images/products/amoled_smartwatch.jpg', time: '5m ago' },
    { name: 'Vikram S.', city: 'Jaipur', prod: 'Royal Oud Luxury Attar', img: 'images/products/royal_oud_attar.jpg', time: '3m ago' }
  ];
  let socialIdx = 0;

  function showNextSocialToast() {
    if (!socialToast) return;
    const item = SOCIAL_PURCHASES[socialIdx];
    socialIdx = (socialIdx + 1) % SOCIAL_PURCHASES.length;

    $('sp-img').src = item.img;
    $('sp-text').innerHTML = `<strong>${item.name}</strong> from ${item.city} just bought <strong>${item.prod}</strong>`;
    $('sp-time').textContent = `Verified Purchase · ${item.time}`;

    socialToast.classList.add('show');
    setTimeout(() => {
      socialToast.classList.remove('show');
    }, 4500);
  }

  setTimeout(() => {
    showNextSocialToast();
    setInterval(showNextSocialToast, 12000);
  }, 4000);

  // ═══════════════════ SEARCH OVERLAY & AUTOCOMPLETE ════════════════════════
  const searchToggle = $('search-toggle-btn');
  const searchOverlay= $('search-overlay');
  const searchClose  = $('search-close-btn');
  const searchInput  = $('search-overlay-input');
  const searchResults= $('search-results-list');
  const heroSearchInput = $('hero-search-input');

  if (searchToggle && searchOverlay) {
    searchToggle.addEventListener('click', () => {
      searchOverlay.classList.add('open');
      if (searchInput) searchInput.focus();
      playSound('click');
    });
  }
  if (searchClose && searchOverlay) {
    searchClose.addEventListener('click', () => searchOverlay.classList.remove('open'));
  }

  function handleSearchLive(q) {
    if (!searchResults) return;
    const clean = q.toLowerCase().trim();
    if (!clean) {
      searchResults.innerHTML = '<p style="color:var(--text-3); font-size:0.85rem; padding:10px 0;">Start typing to explore 60+ categories...</p>';
      return;
    }
    const matches = PRODUCTS.filter(p =>
      p.name.toLowerCase().includes(clean) ||
      (p.categoryLabel && p.categoryLabel.toLowerCase().includes(clean))
    ).slice(0, 5);

    if (matches.length === 0) {
      searchResults.innerHTML = '<p style="color:var(--text-3); font-size:0.85rem; padding:10px 0;">No matching products found.</p>';
      return;
    }

    searchResults.innerHTML = matches.map(prod => `
      <div class="search-result-item" onclick="window.imSelectSearch('${prod.id}')">
        <img class="search-result-thumb" src="${prod.image}" alt="${prod.name}">
        <div class="search-result-info">
          <div class="search-result-name">${prod.name}</div>
          <div class="search-result-price">${formatPrice(prod.price)}</div>
        </div>
        <span style="font-size:0.75rem; color:var(--text-3); text-transform:uppercase;">${prod.category}</span>
      </div>
    `).join('');
  }

  window.imSelectSearch = (id) => {
    if (searchOverlay) searchOverlay.classList.remove('open');
    openQuickView(id);
  };

  if (searchInput) {
    searchInput.addEventListener('input', (e) => handleSearchLive(e.target.value));
  }
  if (heroSearchInput) {
    heroSearchInput.addEventListener('keypress', (e) => {
      if (e.key === 'Enter') {
        searchQuery = heroSearchInput.value.trim();
        const productsSec = $('products');
        if (productsSec) productsSec.scrollIntoView({ behavior: 'smooth' });
        renderProducts();
      }
    });
  }

  // ═══════════════════ TOAST NOTIFICATIONS ═════════════════════════════════
  function showToast(msg) {
    const cont = $('toast-container');
    if (!cont) return;
    const toast = document.createElement('div');
    toast.className = 'toast';
    toast.innerHTML = msg;
    cont.appendChild(toast);
    setTimeout(() => {
      toast.style.opacity = '0';
      toast.style.transform = 'translateY(-10px)';
      setTimeout(() => toast.remove(), 300);
    }, 3200);
  }

  function updateBadges() {
    const totalCartCount = cart.reduce((s, i) => s + i.quantity, 0);
    if (cartBadge) {
      cartBadge.textContent = totalCartCount;
      cartBadge.classList.toggle('visible', totalCartCount > 0);
    }
    if (cartCountText) cartCountText.textContent = `(${totalCartCount})`;

    if (wishlistBadge) {
      wishlistBadge.textContent = wishlist.length;
      wishlistBadge.classList.toggle('visible', wishlist.length > 0);
    }
    if (wishlistCountText) wishlistCountText.textContent = `(${wishlist.length})`;
  }

  // ═══════════════════ INITIALIZATION ═══════════════════════════════════════
  renderProducts();
  updateBadges();
  renderCart();
  renderWishlist();
  updateCompareBar();

}); // DOMContentLoaded
