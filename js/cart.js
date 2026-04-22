/**
 * ============================================================
 * cart.js - Lógica del carrito de compras y navbar compartida
 * FerreTech Pro
 * ============================================================
 */

document.addEventListener('DOMContentLoaded', () => {

    /* ==================== INICIALIZACIÓN ==================== */
    API.Init.seedData();
    setupNavbarCart();
    updateCartBadge();

    // Solo ejecutar lógica del carrito si estamos en carrito.html
    const cartItems = document.getElementById('cartItems');
    if (cartItems) {
        renderCart();
        setupCartEvents();
    }

    /* ==================== NAVBAR (para páginas sin catalog.js) ==================== */
    function setupNavbarCart() {
        const navUser = document.getElementById('navUser');
        const navToggle = document.getElementById('navToggle');
        const navLinks = document.getElementById('navLinks');
        const user = API.Auth.getCurrentUser();

        // Menú móvil
        if (navToggle && navLinks) {
            navToggle.addEventListener('click', () => {
                navLinks.classList.toggle('active');
                const icon = navToggle.querySelector('i');
                icon.classList.toggle('fa-bars');
                icon.classList.toggle('fa-times');
            });
        }

        // Si catalog.js ya configuró el navbar, no duplicar
        if (navUser && navUser.innerHTML.trim() === '') {
            if (user) {
                const isAdmin = user.role === 'admin';
                navUser.innerHTML = `
                    <div class="user-dropdown">
                        <button class="user-btn" id="userDropdownBtn">
                            <div class="user-avatar">${user.name.charAt(0).toUpperCase()}</div>
                            <span class="user-name">${user.name.split(' ')[0]}</span>
                            <i class="fas fa-chevron-down"></i>
                        </button>
                        <div class="dropdown-menu" id="userDropdownMenu">
                            <div class="dropdown-header">
                                <strong>${user.name}</strong>
                                <small>${user.email}</small>
                                <span class="role-badge role-${user.role}">${user.role}</span>
                            </div>
                            ${isAdmin ? '<a href="admin.html" class="dropdown-item"><i class="fas fa-shield-alt"></i> Panel Admin</a>' : ''}
                            <a href="carrito.html" class="dropdown-item"><i class="fas fa-shopping-cart"></i> Mi Carrito</a>
                            <button class="dropdown-item dropdown-logout" id="logoutBtn"><i class="fas fa-sign-out-alt"></i> Cerrar Sesión</button>
                        </div>
                    </div>
                `;

                const dropdownBtn = document.getElementById('userDropdownBtn');
                const dropdownMenu = document.getElementById('userDropdownMenu');
                if (dropdownBtn && dropdownMenu) {
                    dropdownBtn.addEventListener('click', (e) => {
                        e.stopPropagation();
                        dropdownMenu.classList.toggle('show');
                    });
                    document.addEventListener('click', () => {
                        dropdownMenu.classList.remove('show');
                    });
                }

                const logoutBtn = document.getElementById('logoutBtn');
                if (logoutBtn) {
                    logoutBtn.addEventListener('click', () => {
                        API.Auth.logout();
                        showToast('Sesión cerrada', 'info');
                        setTimeout(() => { window.location.href = 'index.html'; }, 500);
                    });
                }
            } else {
                navUser.innerHTML = `
                    <a href="login.html" class="btn btn-outline btn-sm nav-login-btn">
                        <i class="fas fa-sign-in-alt"></i> Ingresar
                    </a>
                    <a href="register.html" class="btn btn-primary btn-sm nav-register-btn">
                        <i class="fas fa-user-plus"></i> Registro
                    </a>
                `;
            }
        }
    }

    /* ==================== RENDERIZAR CARRITO ==================== */
    function renderCart() {
        const cartItemsEl = document.getElementById('cartItems');
        const cartLayout = document.getElementById('cartLayout');
        const emptyCart = document.getElementById('emptyCart');
        const cartSummary = document.getElementById('cartSummary');

        if (!cartItemsEl) return;

        const cart = API.Cart.get();

        if (cart.length === 0) {
            if (            if (cartLayout) cartLayout.classList.add('hidden');
            if (emptyCart) emptyCart.classList.remove('hidden');
            return;
        }

        if (cartLayout) cartLayout.classList.remove('hidden');
        if (emptyCart) emptyCart.classList.add('hidden');

        cartItemsEl.innerHTML = cart.map((item, index) => `
            <div class="cart-item" data-id="${item.id}" style="animation-delay: ${index * 0.05}s">
                <div class="cart-item-icon">
                    <i class="fas ${item.icon || 'fa-box'}"></i>
                    <span class="cart-item-type type-${item.type}">${item.type === 'product' ? 'Producto' : 'Servicio'}</span>
                </div>
                <div class="cart-item-info">
                    <h4>${item.name}</h4>
                    <span class="cart-item-price-unit">$${item.price.toFixed(2)} c/u</span>
                </div>
                <div class="cart-item-quantity">
                    <button class="qty-btn qty-minus" data-id="${item.id}" data-action="minus">
                        <i class="fas fa-minus"></i>
                    </button>
                    <input type="number" class="qty-input" value="${item.quantity}" min="1" max="99" data-id="${item.id}">
                    <button class="qty-btn qty-plus" data-id="${item.id}" data-action="plus">
                        <i class="fas fa-plus"></i>
                    </button>
                </div>
                <div class="cart-item-total">
                    <span>$${(item.price * item.quantity).toFixed(2)}</span>
                </div>
                <button class="cart-item-remove" data-id="${item.id}" title="Eliminar">
                    <i class="fas fa-trash-alt"></i>
                </button>
            </div>
        `).join('');

        updateSummary();

        // Animación de entrada
        requestAnimationFrame(() => {
            cartItemsEl.querySelectorAll('.cart-item').forEach(item => {
                item.classList.add('fade-in');
            });
        });
    }

    /* ==================== ACTUALIZAR RESUMEN ==================== */
    function updateSummary() {
        const totals = API.Cart.getTotal();
        const subtotalEl = document.getElementById('subtotal');
        const taxEl = document.getElementById('tax');
        const totalEl = document.getElementById('total');

        if (subtotalEl) subtotalEl.textContent = `$${totals.subtotal.toFixed(2)}`;
        if (taxEl) taxEl.textContent = `$${totals.tax.toFixed(2)}`;
        if (totalEl) totalEl.textContent = `$${totals.total.toFixed(2)}`;

        updateCartBadge();
    }

    /* ==================== EVENTOS DEL CARRITO ==================== */
    function setupCartEvents() {
        const cartItemsEl = document.getElementById('cartItems');
        const checkoutBtn = document.getElementById('checkoutBtn');
        const clearCartBtn = document.getElementById('clearCartBtn');

        if (!cartItemsEl) return;

        // Delegación de eventos para botones dentro del carrito
        cartItemsEl.addEventListener('click', (e) => {
            const target = e.target.closest('button');
            if (!target) return;

            const itemId = target.dataset.id;

            // Botón menos
            if (target.dataset.action === 'minus') {
                const input = cartItemsEl.querySelector(`.qty-input[data-id="${itemId}"]`);
                const currentQty = parseInt(input.value);
                if (currentQty <= 1) {
                    removeItemWithAnimation(itemId);
                } else {
                    const result = API.Cart.updateQuantity(itemId, currentQty - 1);
                    if (result.success) {
                        input.value = currentQty - 1;
                        updateItemTotal(itemId);
                        updateSummary();
                    } else {
                        showToast(result.message, 'error');
                    }
                }
                return;
            }

            // Botón más
            if (target.dataset.action === 'plus') {
                const input = cartItemsEl.querySelector(`.qty-input[data-id="${itemId}"]`);
                const currentQty = parseInt(input.value);
                const result = API.Cart.updateQuantity(itemId, currentQty + 1);
                if (result.success) {
                    input.value = currentQty + 1;
                    updateItemTotal(itemId);
                    updateSummary();
                } else {
                    showToast(result.message, 'error');
                }
                return;
            }

            // Botón eliminar
            if (target.classList.contains('cart-item-remove')) {
                removeItemWithAnimation(itemId);
                return;
            }
        });

        // Cambio manual de cantidad en input
        cartItemsEl.addEventListener('change', (e) => {
            if (!e.target.classList.contains('qty-input')) return;
            const itemId = e.target.dataset.id;
            let newQty = parseInt(e.target.value);

            if (isNaN(newQty) || newQty < 1) {
                newQty = 1;
                e.target.value = 1;
            }

            const result = API.Cart.updateQuantity(itemId, newQty);
            if (result.success) {
                updateItemTotal(itemId);
                updateSummary();
            } else {
                showToast(result.message, 'error');
                // Restaurar valor anterior
                const cart = API.Cart.get();
                const item = cart.find(i => i.id === itemId);
                if (item) e.target.value = item.quantity;
            }
        });

        // Botón confirmar pedido
        if (checkoutBtn) {
            checkoutBtn.addEventListener('click', () => {
                const user = API.Auth.getCurrentUser();
                if (!user) {
                    showToast('Debes iniciar sesión para confirmar tu pedido', 'warning');
                    setTimeout(() => { window.location.href = 'login.html'; }, 1500);
                    return;
                }

                const cart = API.Cart.get();
                if (cart.length === 0) {
                    showToast('Tu carrito está vacío', 'warning');
                    return;
                }

                // Verificar si hay productos (no solo servicios)
                const hasProducts = cart.some(i => i.type === 'product');
                if (!hasProducts) {
                    showToast('No hay productos en el carrito. Los servicios se solicitan desde la página principal.', 'info');
                    return;
                }

                // Confirmar pedido
                checkoutBtn.disabled = true;
                checkoutBtn.innerHTML = '<i class="fas fa-spinner fa-spin"></i> Procesando...';

                // Simular delay de procesamiento
                setTimeout(() => {
                    const result = API.Orders.create();
                    if (result.success) {
                        showToast('¡Pedido confirmado exitosamente! 🎉', 'success');

                        // Mostrar resumen del pedido
                        showOrderConfirmation(result.order);
                    } else {
                        showToast(result.message, 'error');
                        checkoutBtn.disabled = false;
                        checkoutBtn.innerHTML = '<i class="fas fa-credit-card"></i> Confirmar Pedido';
                    }
                }, 1500);
            });
        }

        // Botón vaciar carrito
        if (clearCartBtn) {
            clearCartBtn.addEventListener('click', () => {
                const cart = API.Cart.get();
                if (cart.length === 0) {
                    showToast('El carrito ya está vacío', 'info');
                    return;
                }

                if (confirm('¿Estás seguro de vaciar todo el carrito?')) {
                    API.Cart.clear();
                    showToast('Carrito vaciado', 'info');
                    renderCart();
                    updateCartBadge();
                }
            });
        }
    }

    /* ==================== HELPERS DEL CARRITO ==================== */
    function updateItemTotal(itemId) {
        const cart = API.Cart.get();
        const item = cart.find(i => i.id === itemId);
        if (!item) return;

        const cartItemEl = document.querySelector(`.cart-item[data-id="${itemId}"]`);
        if (cartItemEl) {
            const totalEl = cartItemEl.querySelector('.cart-item-total span');
            if (totalEl) {
                totalEl.textContent = `$${(item.price * item.quantity).toFixed(2)}`;

                // Animación de cambio
                totalEl.classList.add('price-updated');
                setTimeout(() => totalEl.classList.remove('price-updated'), 300);
            }
        }
    }

    function removeItemWithAnimation(itemId) {
        const cartItemEl = document.querySelector(`.cart-item[data-id="${itemId}"]`);
        if (cartItemEl) {
            cartItemEl.classList.add('removing');
            setTimeout(() => {
                API.Cart.remove(itemId);
                renderCart();
                updateCartBadge();
                showToast('Producto eliminado del carrito', 'info');
            }, 300);
        } else {
            API.Cart.remove(itemId);
            renderCart();
            updateCartBadge();
        }
    }

    function showOrderConfirmation(order) {
        const cartLayout = document.getElementById('cartLayout');
        const emptyCart = document.getElementById('emptyCart');

        if (cartLayout) cartLayout.classList.add('hidden');
        if (emptyCart) emptyCart.classList.add('hidden');

        // Crear vista de confirmación
        const container = document.querySelector('.cart-page .container');
        if (!container) return;

        const confirmationHTML = `
            <div class="order-confirmation fade-in">
                <div class="confirmation-icon">
                    <i class="fas fa-check-circle"></i>
                </div>
                <h2>¡Pedido Confirmado!</h2>
                <p class="confirmation-id">Número de pedido: <strong>#${order.id.toUpperCase().slice(0, 8)}</strong></p>

                <div class="confirmation-details">
                    <div class="confirmation-section">
                        <h4><i class="fas fa-user"></i> Datos del Cliente</h4>
                        <p><strong>${order.userName}</strong></p>
                        <p>${order.userEmail}</p>
                        <p>${order.userPhone}</p>
                        <p>${order.userAddress}</p>
                    </div>

                    <div class="confirmation-section">
                        <h4><i class="fas fa-box"></i> Productos (${order.items.length})</h4>
                        ${order.items.map(item => `
                            <div class="confirmation-item">
                                <span>${item.name} x${item.quantity}</span>
                                <span>$${(item.price * item.quantity).toFixed(2)}</span>
                            </div>
                        `).join('')}
                    </div>

                    <div class="confirmation-section">
                        <h4><i class="fas fa-receipt"></i> Resumen</h4>
                        <div class="confirmation-item">
                            <span>Subtotal</span>
                            <span>$${order.subtotal.toFixed(2)}</span>
                        </div>
                        <div class="confirmation-item">
                            <span>IVA (16%)</span>
                            <span>$${order.tax.toFixed(2)}</span>
                        </div>
                        <div class="confirmation-item confirmation-total">
                            <span>Total</span>
                            <span>$${order.total.toFixed(2)}</span>
                        </div>
                    </div>
                </div>

                <div class="confirmation-status">
                    <span class="status-badge status-pendiente">
                        <i class="fas fa-clock"></i> Estado: Pendiente
                    </span>
                </div>

                <div class="confirmation-actions">
                    <a href="index.html" class="btn btn-primary btn-lg">
                        <i class="fas fa-store"></i> Seguir Comprando
                    </a>
                </div>
            </div>
        `;

        // Insertar después del page-header
        const pageHeader = container.querySelector('.page-header');
        const existingConfirmation = container.querySelector('.order-confirmation');
        if (existingConfirmation) existingConfirmation.remove();

        pageHeader.insertAdjacentHTML('afterend', confirmationHTML);
        updateCartBadge();
    }

    /* ==================== CART BADGE ==================== */
    function updateCartBadge() {
        const badge = document.getElementById('cartBadge');
        if (!badge) return;
        const totals = API.Cart.getTotal();
        badge.textContent = totals.count;
        if (totals.count > 0) {
            badge.classList.add('has-items');
        } else {
            badge.classList.remove('has-items');
        }
    }

});

/* ==================== TOAST (si no existe de catalog.js) ==================== */
if (typeof showToast !== 'function') {
    function showToast(message, type = 'info') {
        const container = document.getElementById('toastContainer');
        if (!container) return;

        const toast = document.createElement('div');
        toast.className = `toast toast-${type}`;

        const icons = {
            success: 'check-circle',
            error: 'exclamation-circle',
            info: 'info-circle',
            warning: 'exclamation-triangle'
        };

        toast.innerHTML = `
            <i class="fas fa-${icons[type] || icons.info}"></i>
            <span>${message}</span>
            <button class="toast-close"><i class="fas fa-times"></i></button>
        `;

        container.appendChild(toast);
        requestAnimationFrame(() => toast.classList.add('show'));

        toast.querySelector('.toast-close').addEventListener('click', () => {
            toast.classList.remove('show');
            setTimeout(() => toast.remove(), 300);
        });

        setTimeout(() => {
            if (toast.parentNode) {
                toast.classList.remove('show');
                setTimeout(() => toast.remove(), 300);
            }
        }, 3500);
    }
}
