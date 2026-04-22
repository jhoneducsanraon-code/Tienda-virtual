/**
 * ============================================================
 * catalog.js - Lógica del catálogo, servicios y página principal
 * FerreTech Pro
 * ============================================================
 */

document.addEventListener('DOMContentLoaded', () => {

    /* ==================== INICIALIZACIÓN ==================== */
    API.Init.seedData();
    setupNavbar();
    setupHero();
    renderCategories();
    renderProducts('all');
    renderServices();
    setupFilters();
    setupSearch();
    setupServiceModal();
    updateCartBadge();

    /* ==================== NAVBAR ==================== */
    function setupNavbar() {
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

            // Cerrar menú al hacer click en un link
            navLinks.querySelectorAll('.nav-link').forEach(link => {
                link.addEventListener('click', () => {
                    navLinks.classList.remove('active');
                    const icon = navToggle.querySelector('i');
                    icon.classList.add('fa-bars');
                    icon.classList.remove('fa-times');
                });
            });
        }

        // Usuario logueado o no
        if (navUser) {
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

                // Toggle dropdown
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

                // Logout
                const logoutBtn = document.getElementById('logoutBtn');
                if (logoutBtn) {
                    logoutBtn.addEventListener('click', () => {
                        API.Auth.logout();
                        showToast('Sesión cerrada correctamente', 'info');
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

        // Navbar scroll effect
        let lastScroll = 0;
        window.addEventListener('scroll', () => {
            const navbar = document.getElementById('navbar');
            if (!navbar) return;
            const currentScroll = window.pageYOffset;
            if (currentScroll > 50) {
                navbar.classList.add('scrolled');
            } else {
                navbar.classList.remove('scrolled');
            }
            lastScroll = currentScroll;
        });
    }

    /* ==================== HERO ==================== */
    function setupHero() {
        // Animación de números
        const statNumbers = document.querySelectorAll('.stat-number');
        if (statNumbers.length === 0) return;

        const animateNumber = (el) => {
            const target = parseInt(el.dataset.target);
            const duration = 2000;
            const step = target / (duration / 16);
            let current = 0;

            const timer = setInterval(() => {
                current += step;
                if (current >= target) {
                    current = target;
                    clearInterval(timer);
                }
                el.textContent = Math.floor(current);
            }, 16);
        };

        // Intersection Observer para animar cuando sea visible
        const observer = new IntersectionObserver((entries) => {
            entries.forEach(entry => {
                if (entry.isIntersecting) {
                    const numbers = entry.target.querySelectorAll('.stat-number');
                    numbers.forEach(n => animateNumber(n));
                    observer.unobserve(entry.target);
                }
            });
        }, { threshold: 0.5 });

        const heroStats = document.querySelector('.hero-stats');
        if (heroStats) observer.observe(heroStats);

        // Smooth scroll para botones del hero
        document.querySelectorAll('a[href^="#"]').forEach(anchor => {
            anchor.addEventListener('click', function (e) {
                const targetId = this.getAttribute('href');
                if (targetId === '#') return;
                const targetEl = document.querySelector(targetId);
                if (targetEl) {
                    e.preventDefault();
                    targetEl.scrollIntoView({ behavior: 'smooth', block: 'start' });
                }
            });
        });
    }

    /* ==================== CATEGORÍAS ==================== */
    function renderCategories() {
        const grid = document.getElementById('categoriesGrid');
        if (!grid) return;

        const categories = [
            { id: 'herramientas', name: 'Herramientas', icon: 'fa-screwdriver-wrench', color: '#3b82f6', desc: 'Taladros, sierras, llaves y más' },
            { id: 'materiales', name: 'Materiales', icon: 'fa-cubes', color: '#f59e0b', desc: 'Cemento, varillas, arena y bloques' },
            { id: 'electrico', name: 'Eléctrico', icon: 'fa-bolt', color: '#ef4444', desc: 'Cables, breakers, paneles LED' },
            { id: 'seguridad', name: 'Seguridad', icon: 'fa-shield-halved', color: '#10b981', desc: 'Cámaras, DVR, alarmas' },
            { id: 'plomeria', name: 'Plomería', icon: 'fa-faucet-drip', color: '#6366f1', desc: 'Tubos, válvulas, bombas' },
            { id: 'servicios', name: 'Servicios', icon: 'fa-headset', color: '#8b5cf6', desc: 'Reparación, instalación, software' }
        ];

        grid.innerHTML = categories.map(cat => `
            <div class="category-card" data-category="${cat.id}" style="--cat-color: ${cat.color}">
                <div class="category-icon">
                    <i class="fas ${cat.icon}"></i>
                </div>
                <h3>${cat.name}</h3>
                <p>${cat.desc}</p>
                <span class="category-count">${cat.id === 'servicios' ? API.Products.getServices().length : API.Products.getByCategory(cat.id).length} items</span>
            </div>
        `).join('');

        // Click en categoría
        grid.querySelectorAll('.category-card').forEach(card => {
            card.addEventListener('click', () => {
                const catId = card.dataset.category;
                if (catId === 'servicios') {
                    document.getElementById('servicios').scrollIntoView({ behavior: 'smooth' });
                } else {
                    // Activar filtro correspondiente
                    document.querySelectorAll('.filter-btn').forEach(b => b.classList.remove('active'));
                    const filterBtn = document.querySelector(`.filter-btn[data-filter="${catId}"]`);
                    if (filterBtn) filterBtn.classList.add('active');
                    renderProducts(catId);
                    document.getElementById('catalogo').scrollIntoView({ behavior: 'smooth' });
                }
            });
        });
    }

    /* ==================== PRODUCTOS ==================== */
    function renderProducts(filter = 'all') {
        const grid = document.getElementById('productsGrid');
        const empty = document.getElementById('emptyProducts');
        if (!grid) return;

        let products;
        if (filter === 'all') {
            products = API.Products.getProducts();
        } else {
            products = API.Products.getByCategory(filter);
        }

        if (products.length === 0) {
            grid.innerHTML = '';
            grid.classList.add('hidden');
            if (empty) empty.classList.remove('hidden');
            return;
        }

        grid.classList.remove('hidden');
        if (empty) empty.classList.add('hidden');

        grid.innerHTML = products.map((product, index) => `
            <div class="product-card" data-id="${product.id}" style="animation-delay: ${index * 0.05}s">
                <div class="product-badge ${product.stock <= 5 ? 'badge-warning' : 'badge-success'}">
                    ${product.stock <= 5 ? (product.stock === 0 ? 'Agotado' : '¡Últimas unidades!') : 'Disponible'}
                </div>
                <div class="product-image">
                    <i class="fas ${product.icon}"></i>
                </div>
                <div class="product-info">
                    <span class="product-category">${product.category}</span>
                    <h3 class="product-name">${product.name}</h3>
                    <p class="product-desc">${product.description}</p>
                    <div class="product-meta">
                        <span class="product-price">$${product.price.toFixed(2)}</span>
                        <span class="product-stock ${product.stock <= 5 ? 'low-stock' : ''}">
                            <i class="fas fa-box"></i> ${product.stock} en stock
                        </span>
                    </div>
                    <button class="btn btn-primary btn-block btn-add-cart"
                            data-id="${product.id}"
                            ${product.stock === 0 ? 'disabled' : ''}>
                        <i class="fas ${product.stock === 0 ? 'fa-ban' : 'fa-cart-plus'}"></i>
                        ${product.stock === 0 ? 'Sin Stock' : 'Agregar al Carrito'}
                    </button>
                </div>
            </div>
        `).join('');

        // Eventos de agregar al carrito
        grid.querySelectorAll('.btn-add-cart').forEach(btn => {
            btn.addEventListener('click', (e) => {
                e.stopPropagation();
                const productId = btn.dataset.id;
                const user = API.Auth.getCurrentUser();

                if (!user) {
                    showToast('Debes iniciar sesión para agregar productos', 'warning');
                    setTimeout(() => { window.location.href = 'login.html'; }, 1500);
                    return;
                }

                const result = API.Cart.add(productId);
                if (result.success) {
                    showToast('Producto agregado al carrito', 'success');
                    updateCartBadge();

                    // Animación del botón
                    btn.innerHTML = '<i class="fas fa-check"></i> ¡Agregado!';
                    btn.classList.add('btn-success');
                    setTimeout(() => {
                        btn.innerHTML = '<i class="fas fa-cart-plus"></i> Agregar al Carrito';
                        btn.classList.remove('btn-success');
                    }, 1500);
                } else {
                    showToast(result.message, 'error');
                }
            });
        });

        // Animación de entrada
        requestAnimationFrame(() => {
            grid.querySelectorAll('.product-card').forEach(card => {
                card.classList.add('fade-in');
            });
        });
    }

    /* ==================== SERVICIOS ==================== */
    function renderServices() {
        const grid = document.getElementById('servicesGrid');
        if (!grid) return;

        const services = API.Products.getServices();

        grid.innerHTML = services.map((service, index) => `
            <div class="service-card service-${service.color || 'blue'}" data-id="${service.id}" style="animation-delay: ${index * 0.1}s">
                <div class="service-icon">
                    <i class="fas ${service.icon}"></i>
                </div>
                <h3>${service.name}</h3>
                <p>${service.description}</p>
                <div class="service-features">
                    ${(service.features || []).map(f => `
                        <div class="feature-item">
                            <i class="fas fa-check-circle"></i>
                            <span>${f}</span>
                        </div>
                    `).join('')}
                </div>
                <div class="service-footer">
                    <div class="service-price">
                        <span class="price-label">Desde</span>
                        <span class="price-value">$${service.price.toFixed(2)}</span>
                    </div>
                    <button class="btn btn-primary btn-request-service" data-id="${service.id}">
                        <i class="fas fa-paper-plane"></i> Solicitar
                    </button>
                </div>
            </div>
        `).join('');

        // Eventos de solicitar servicio
        grid.querySelectorAll('.btn-request-service').forEach(btn => {
            btn.addEventListener('click', () => {
                const user = API.Auth.getCurrentUser();
                if (!user) {
                    showToast('Debes iniciar sesión para solicitar servicios', 'warning');
                    setTimeout(() => { window.location.href = 'login.html'; }, 1500);
                    return;
                }
                openServiceModal(btn.dataset.id);
            });
        });
    }

    /* ==================== FILTROS ==================== */
    function setupFilters() {
        const filtersContainer = document.getElementById('catalogFilters');
        if (!filtersContainer) return;

        filtersContainer.querySelectorAll('.filter-btn').forEach(btn => {
            btn.addEventListener('click', () => {                // Quitar active de todos y poner en el clickeado
                filtersContainer.querySelectorAll('.filter-btn').forEach(b => b.classList.remove('active'));
                btn.classList.add('active');
                renderProducts(btn.dataset.filter);
            });
        });
    }

    /* ==================== BÚSQUEDA ==================== */
    function setupSearch() {
        const searchInput = document.getElementById('searchInput');
        const searchBtn = document.getElementById('searchBtn');
        if (!searchInput) return;

        let debounceTimer;

        const performSearch = () => {
            const query = searchInput.value.trim();
            const grid = document.getElementById('productsGrid');
            const empty = document.getElementById('emptyProducts');

            if (query.length === 0) {
                // Resetear filtros
                document.querySelectorAll('.filter-btn').forEach(b => b.classList.remove('active'));
                const allBtn = document.querySelector('.filter-btn[data-filter="all"]');
                if (allBtn) allBtn.classList.add('active');
                renderProducts('all');
                return;
            }

            const results = API.Products.search(query).filter(p => p.type === 'product');

            if (results.length === 0) {
                if (grid) { grid.innerHTML = ''; grid.classList.add('hidden'); }
                if (empty) {
                    empty.classList.remove('hidden');
                    empty.querySelector('h3').textContent = `No se encontraron resultados para "${query}"`;
                }
                return;
            }

            if (grid) grid.classList.remove('hidden');
            if (empty) empty.classList.add('hidden');

            // Desactivar filtros activos
            document.querySelectorAll('.filter-btn').forEach(b => b.classList.remove('active'));

            // Renderizar resultados
            grid.innerHTML = results.map((product, index) => `
                <div class="product-card" data-id="${product.id}" style="animation-delay: ${index * 0.05}s">
                    <div class="product-badge ${product.stock <= 5 ? 'badge-warning' : 'badge-success'}">
                        ${product.stock <= 5 ? (product.stock === 0 ? 'Agotado' : '¡Últimas unidades!') : 'Disponible'}
                    </div>
                    <div class="product-image">
                        <i class="fas ${product.icon}"></i>
                    </div>
                    <div class="product-info">
                        <span class="product-category">${product.category}</span>
                        <h3 class="product-name">${product.name}</h3>
                        <p class="product-desc">${product.description}</p>
                        <div class="product-meta">
                            <span class="product-price">$${product.price.toFixed(2)}</span>
                            <span class="product-stock ${product.stock <= 5 ? 'low-stock' : ''}">
                                <i class="fas fa-box"></i> ${product.stock} en stock
                            </span>
                        </div>
                        <button class="btn btn-primary btn-block btn-add-cart"
                                data-id="${product.id}"
                                ${product.stock === 0 ? 'disabled' : ''}>
                            <i class="fas ${product.stock === 0 ? 'fa-ban' : 'fa-cart-plus'}"></i>
                            ${product.stock === 0 ? 'Sin Stock' : 'Agregar al Carrito'}
                        </button>
                    </div>
                </div>
            `).join('');

            // Re-bindear eventos de agregar al carrito
            grid.querySelectorAll('.btn-add-cart').forEach(btn => {
                btn.addEventListener('click', (e) => {
                    e.stopPropagation();
                    const productId = btn.dataset.id;
                    const user = API.Auth.getCurrentUser();

                    if (!user) {
                        showToast('Debes iniciar sesión para agregar productos', 'warning');
                        setTimeout(() => { window.location.href = 'login.html'; }, 1500);
                        return;
                    }

                    const result = API.Cart.add(productId);
                    if (result.success) {
                        showToast('Producto agregado al carrito', 'success');
                        updateCartBadge();
                        btn.innerHTML = '<i class="fas fa-check"></i> ¡Agregado!';
                        btn.classList.add('btn-success');
                        setTimeout(() => {
                            btn.innerHTML = '<i class="fas fa-cart-plus"></i> Agregar al Carrito';
                            btn.classList.remove('btn-success');
                        }, 1500);
                    } else {
                        showToast(result.message, 'error');
                    }
                });
            });

            // Scroll al catálogo
            document.getElementById('catalogo').scrollIntoView({ behavior: 'smooth' });
        };

        // Búsqueda con debounce al escribir
        searchInput.addEventListener('input', () => {
            clearTimeout(debounceTimer);
            debounceTimer = setTimeout(performSearch, 400);
        });

        // Búsqueda al presionar Enter
        searchInput.addEventListener('keydown', (e) => {
            if (e.key === 'Enter') {
                e.preventDefault();
                clearTimeout(debounceTimer);
                performSearch();
            }
        });

        // Botón de búsqueda
        if (searchBtn) {
            searchBtn.addEventListener('click', () => {
                clearTimeout(debounceTimer);
                performSearch();
            });
        }
    }

    /* ==================== MODAL DE SERVICIO ==================== */
    function setupServiceModal() {
        const modal = document.getElementById('serviceModal');
        const closeBtn = document.getElementById('modalClose');
        const form = document.getElementById('serviceForm');

        if (!modal || !form) return;

        // Cerrar modal
        if (closeBtn) {
            closeBtn.addEventListener('click', () => closeServiceModal());
        }

        // Cerrar al hacer click fuera
        modal.addEventListener('click', (e) => {
            if (e.target === modal) closeServiceModal();
        });

        // Cerrar con Escape
        document.addEventListener('keydown', (e) => {
            if (e.key === 'Escape') closeServiceModal();
        });

        // Fecha mínima = hoy
        const dateInput = document.getElementById('serviceDate');
        if (dateInput) {
            const today = new Date().toISOString().split('T')[0];
            dateInput.setAttribute('min', today);
            dateInput.value = today;
        }

        // Submit del formulario
        form.addEventListener('submit', (e) => {
            e.preventDefault();

            const serviceId = document.getElementById('serviceId').value;
            const service = API.Products.getById(serviceId);
            const description = document.getElementById('serviceDescription').value.trim();
            const date = document.getElementById('serviceDate').value;
            const time = document.getElementById('serviceTime').value;
            const address = document.getElementById('serviceAddress').value.trim();

            if (!description || !date || !time || !address) {
                showToast('Por favor completa todos los campos', 'warning');
                return;
            }

            const result = API.ServiceRequests.create({
                serviceId,
                serviceName: service ? service.name : 'Servicio',
                description,
                date,
                time,
                address
            });

            if (result.success) {
                showToast('¡Solicitud de servicio enviada exitosamente!', 'success');
                closeServiceModal();
                form.reset();

                // Fecha mínima de nuevo
                const dateInput = document.getElementById('serviceDate');
                if (dateInput) {
                    const today = new Date().toISOString().split('T')[0];
                    dateInput.value = today;
                }
            } else {
                showToast(result.message, 'error');
            }
        });
    }

    function openServiceModal(serviceId) {
        const modal = document.getElementById('serviceModal');
        const service = API.Products.getById(serviceId);
        if (!modal || !service) return;

        // Llenar datos del modal
        document.getElementById('serviceId').value = serviceId;
        document.getElementById('modalTitle').textContent = `Solicitar: ${service.name}`;
        document.getElementById('modalDesc').textContent = service.description;

        const modalIcon = document.getElementById('modalIcon');
        if (modalIcon) {
            modalIcon.innerHTML = `<i class="fas ${service.icon}"></i>`;
            modalIcon.className = `modal-icon service-icon-${service.color || 'blue'}`;
        }

        // Pre-llenar dirección del usuario
        const user = API.Auth.getCurrentUser();
        const addressInput = document.getElementById('serviceAddress');
        if (user && user.address && addressInput) {
            addressInput.value = user.address;
        }

        // Mostrar modal
        modal.classList.add('active');
        document.body.style.overflow = 'hidden';
    }

    function closeServiceModal() {
        const modal = document.getElementById('serviceModal');
        if (modal) {
            modal.classList.remove('active');
            document.body.style.overflow = '';
        }
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

/* ==================== TOAST GLOBAL ==================== */
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

    // Animación de entrada
    requestAnimationFrame(() => {
        toast.classList.add('show');
    });

    // Cerrar manualmente
    toast.querySelector('.toast-close').addEventListener('click', () => {
        toast.classList.remove('show');
        setTimeout(() => toast.remove(), 300);
    });

    // Auto cerrar
    setTimeout(() => {
        if (toast.parentNode) {
            toast.classList.remove('show');
            setTimeout(() => toast.remove(), 300);
        }
    }, 3500);
}
