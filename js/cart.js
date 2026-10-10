/* --- Berlly Boutique - Gestion du panier & commande (cart.js corrigé) --- */

const CART_KEY = 'berlly_cart';
const WHATSAPP_NUMBER = '25776672387'; // numéro WhatsApp de la boutique

/* ---------- Utilitaires panier ---------- */

function getCart() {
  try {
    const data = localStorage.getItem(CART_KEY);
    return data ? JSON.parse(data) : [];
  } catch (e) {
    console.warn('Erreur lecture panier', e);
    return [];
  }
}

function saveCart(cart) {
  try {
    localStorage.setItem(CART_KEY, JSON.stringify(cart || []));
  } catch (e) {
    console.error('Erreur sauvegarde panier', e);
  }
  updateCartBadge();
}

function addToCart(id, name, price, image, quantity = 1) {
  quantity = parseInt(quantity, 10) || 1;

  const cart = getCart();
  const existing = cart.find(item => String(item.id) === String(id));

  if (existing) {
    existing.quantity = (existing.quantity || 0) + quantity;
  } else {
    cart.push({
      id: String(id),
      name,
      price: Number(price) || 0,
      image,
      quantity
    });
  }

  saveCart(cart);
  showToast(`${name} ajouté au panier ✔`);
}

function removeFromCart(id) {
  let cart = getCart();
  cart = cart.filter(item => String(item.id) !== String(id));
  saveCart(cart);
  renderCartPage();
}

function updateQuantity(id, quantity) {
  quantity = parseInt(quantity, 10);

  let cart = getCart();

  if (isNaN(quantity) || quantity < 1) {
    cart = cart.filter(item => String(item.id) !== String(id));
  } else {
    const item = cart.find(item => String(item.id) === String(id));
    if (item) item.quantity = quantity;
  }

  saveCart(cart);
  renderCartPage();
}

function clearCart() {
  try {
    localStorage.removeItem(CART_KEY);
  } catch (e) {
    console.error('Erreur clearCart', e);
  }
  updateCartBadge();
}

function getCartTotal() {
  return getCart().reduce((sum, item) => sum + (Number(item.price) || 0) * (item.quantity || 0), 0);
}

function getCartCount() {
  return getCart().reduce((sum, item) => sum + (item.quantity || 0), 0);
}

function formatFBu(amount) {
  const rounded = Math.round(Number(amount) || 0);
  return new Intl.NumberFormat('fr-FR').format(rounded) + ' FBu';
}

/* ---------- Badge du panier ---------- */

function updateCartBadge() {
  document.querySelectorAll('.cart-count').forEach(badge => {
    const count = getCartCount();
    badge.textContent = count;
    badge.style.display = count > 0 ? 'inline-flex' : 'none';
    badge.setAttribute('aria-label', `${count} article${count > 1 ? 's' : ''} dans le panier`);
  });
}

/* ---------- Notification ---------- */

function showToast(message) {
  let toast = document.getElementById('cart-toast');

  if (!toast) {
    toast = document.createElement('div');
    toast.id = 'cart-toast';
    document.body.appendChild(toast);
  }

  toast.textContent = message;
  toast.classList.add('show');

  clearTimeout(toast._timeout);
  toast._timeout = setTimeout(() => {
    toast.classList.remove('show');
  }, 2200);
}

/* ---------- Page Panier ---------- */

function renderCartPage() {
  const container = document.getElementById('cart-items');
  const totalEl = document.getElementById('cart-total-value');

  if (!container) return;

  const cart = getCart();

  if (cart.length === 0) {
    container.innerHTML = `
      <p class="empty-cart">
        Votre panier est vide.
        <a href="produits.html">Voir nos produits</a>
      </p>
    `;
  } else {
    container.innerHTML = cart.map(item => `
      <div class="cart-item">
        <img src="${item.image || 'images/placeholder.png'}" alt="${escapeHtml(item.name)}">
        <div class="cart-item-info">
          <h3>${escapeHtml(item.name)}</h3>
          <p class="price">${formatFBu(item.price)}</p>
        </div>

        <div class="cart-item-qty">
          <button type="button" onclick="updateQuantity('${item.id}', ${item.quantity - 1})">−</button>
          <span>${item.quantity}</span>
          <button type="button" onclick="updateQuantity('${item.id}', ${item.quantity + 1})">+</button>
        </div>

        <p class="cart-item-subtotal">${formatFBu(item.price * item.quantity)}</p>

        <button type="button" class="remove-btn" onclick="removeFromCart('${item.id}')" title="Retirer">
          <i class="fa-solid fa-trash"></i>
        </button>
      </div>
    `).join('');
  }

  if (totalEl) {
    totalEl.textContent = formatFBu(getCartTotal());
  }
}

/* ---------- Page Produit ---------- */

function changeProductQty(delta) {
  const input = document.getElementById('product-qty');
  if (!input) return;

  const min = parseInt(input.min, 10) || 1;
  let value = (parseInt(input.value, 10) || min) + delta;
  if (value < min) value = min;
  input.value = value;
  updateProductSubtotal();
}

function updateProductSubtotal() {
  const input = document.getElementById('product-qty');
  const subtotalEl = document.getElementById('product-subtotal');
  if (!input || !subtotalEl) return;

  const price = Number(subtotalEl.dataset.price || 0);
  const qty = parseInt(input.value, 10) || 1;
  subtotalEl.textContent = formatFBu(price * qty);
}

function addProductToCart(id, name, price, image) {
  const input = document.getElementById('product-qty');
  const qty = input ? (parseInt(input.value, 10) || 1) : 1;
  addToCart(id, name, price, image, qty);
}

/* ---------- Page Commande ---------- */

function renderOrderSummary() {
  const container = document.getElementById('order-items');
  const totalEl = document.getElementById('order-total-value');
  if (!container) return;

  const cart = getCart();

  if (cart.length === 0) {
    container.innerHTML = `
      <p>
        Votre panier est vide.
        <a href="produits.html">Voir les produits</a>
      </p>
    `;
  } else {
    container.innerHTML = cart.map(item => `
      <div class="order-item">
        <span>${escapeHtml(item.name)} × ${item.quantity}</span>
        <span>${formatFBu(item.price * item.quantity)}</span>
      </div>
    `).join('');
  }

  if (totalEl) totalEl.textContent = formatFBu(getCartTotal());
}

/* ---------- Paiement ---------- */

function togglePaymentDetails() {
  const select = document.getElementById('payment-method');
  if (!select) return;

  document.querySelectorAll('.payment-details').forEach(el => {
    el.style.display = 'none';
    el.querySelectorAll('input').forEach(inp => inp.required = false);
  });

  const target = document.getElementById('details-' + select.value);
  if (target) {
    target.style.display = 'block';
    target.querySelectorAll('input[data-required="true"]').forEach(inp => inp.required = true);
  }
}

/* ---------- Validation et envoi de la commande ---------- */

async function handleOrderSubmit(event) {
  if (event && event.preventDefault) event.preventDefault();

  const currentUserRaw = localStorage.getItem('berlly_current_user');
  let currentUser = null;
  try {
    currentUser = currentUserRaw ? JSON.parse(currentUserRaw) : null;
  } catch (e) {
    currentUser = null;
  }
  // Une session valide = jeton délivré par le serveur
  if (!localStorage.getItem('berlly_token')) currentUser = null;

  if (!currentUser) {
    alert('Vous devez créer un compte ou vous connecter avant de passer une commande.');
    window.location.href = 'connexion.html';
    return false;
  }

  const cart = getCart();
  if (cart.length === 0) {
    alert('Votre panier est vide. Ajoutez des produits avant de commander.');
    return false;
  }

  const name = (document.getElementById('order-name')?.value || '').trim();
  const phone = (document.getElementById('order-phone')?.value || '').trim();
  const address = (document.getElementById('order-address')?.value || '').trim();

  if (!name || !phone || !address) {
    alert('Veuillez remplir tous les champs obligatoires.');
    return false;
  }

  const paymentSelect = document.getElementById('payment-method');
  const paymentValue = paymentSelect ? paymentSelect.value : '';
  const paymentLabel = paymentSelect ? paymentSelect.options[paymentSelect.selectedIndex].text : '';

  let transactionRef = '';
  if (paymentValue === 'lumicash' || paymentValue === 'ecocash') {
    const refInput = document.getElementById('ref-' + paymentValue);
    transactionRef = refInput ? refInput.value.trim() : '';
    if (!transactionRef) {
      alert('Veuillez indiquer le code de transaction reçu par SMS après votre paiement ' + paymentLabel + '.');
      return false;
    }
  }

  const total = getCartTotal();

  let message = '🛍️ *Nouvelle commande - Berlly Boutique*\n\n';
  message += `👤 Nom : ${name}\n`;
  message += `📞 Téléphone : ${phone}\n`;
  message += `🏠 Adresse : ${address}\n\n`;
  message += '📦 *Produits commandés :*\n';
  cart.forEach(item => {
    message += `- ${item.name} x${item.quantity} = ${formatFBu(item.price * item.quantity)}\n`;
  });
  message += `\n💰 *Total : ${formatFBu(total)}*\n`;
  message += `💳 Paiement : ${paymentLabel}\n`;
  if (transactionRef) message += `🔖 Référence de transaction : ${transactionRef}\n`;

  // Enregistrement de la commande sur le serveur (visible dans l'espace admin et dans "Mes commandes")
  let savedOrder;
  try {
    savedOrder = await API.createOrder({
      name: name,
      phone: phone,
      address: address,
      payment: paymentLabel,
      transactionRef: transactionRef,
      cart: cart.map(item => ({
        name: item.name,
        price: item.price,
        quantity: item.quantity,
        image: item.image
      }))
    });
  } catch (e) {
    if (e.status === 401) {
      alert('Votre session a expiré. Veuillez vous reconnecter pour passer commande.');
      window.location.href = 'connexion.html';
    } else {
      alert(e.message || "Impossible d'enregistrer la commande. Réessayez.");
    }
    return false;
  }

  localStorage.setItem('berlly_last_order', JSON.stringify(savedOrder));
  message += `🧾 N° de commande : ${savedOrder.id}\n`;

  clearCart();

  const encoded = encodeURIComponent(message);
  window.location.href = `https://wa.me/${WHATSAPP_NUMBER}?text=${encoded}`;

  return false;
}

/* ---------- Recherche de produits ---------- */

function filterProducts(query) {
  const term = (query || '').trim().toLowerCase();
  document.querySelectorAll('.product-card').forEach(card => {
    const title = card.querySelector('h2, h3');
    const name = title ? title.textContent.toLowerCase() : '';
    card.style.display = name.includes(term) ? '' : 'none';
  });
}

/* ---------- Helpers ---------- */

function escapeHtml(str) {
  if (!str) return '';
  return String(str)
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#039;');
}

/* ---------- Initialisation ---------- */

document.addEventListener('DOMContentLoaded', () => {
  updateCartBadge();
  renderCartPage();
  renderOrderSummary();
  togglePaymentDetails();
  updateProductSubtotal();

  window.addEventListener('storage', (e) => {
    if (e.key === CART_KEY) {
      updateCartBadge();
      renderCartPage();
      renderOrderSummary();
    }
  });
});
