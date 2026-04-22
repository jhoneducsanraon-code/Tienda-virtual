/**
 * ============================================================
 * API.js - Capa de datos con localStorage
 * Simula un backend completo para FerreTech Pro
 * ============================================================
 */

const API = (() => {
    const KEYS = {
        USERS: 'ftp_users',
        CURRENT_USER: 'ftp_current_user',
        PRODUCTS: 'ftp_products',
        CART: 'ftp_cart',
        ORDERS: 'ftp_orders',
        SERVICE_REQUESTS: 'ftp_service_requests',
        SEEDED: 'ftp_seeded'
    };

    // ==================== HELPERS ====================
    const Helpers = {
        get(key) {
            try {
                return JSON.parse(localStorage.getItem(key)) || null;
            } catch { return null; }
        },
        set(key, value) {
            try {
                localStorage.setItem(key, JSON.stringify(value));
                return true;
            } catch { return false; }
        },
        generateId() {
            return Date.now().toString(36) + Math.random().toString(36).substr(2, 9);
        },
        formatDate(date) {
            return new Date(date).toLocaleDateString('es-ES', {
                year: 'numeric', month: 'short', day: 'numeric', hour: '2-digit', minute: '2-digit'
            });
        }
    };

    // ==================== AUTH ====================
    const Auth = {
        register({ name, phone, email, address, password }) {
            const users = Helpers.get(KEYS.USERS) || [];
            if (users.find(u => u.email === email)) {
                return { success: false, message: 'El correo ya está registrado' };
            }
            if (password.length < 6) {
                return { success: false, message: 'La contraseña debe tener al menos 6 caracteres' };
            }
            const newUser = {
                id: Helpers.generateId(),
                name, phone, email, address, password,
                role: 'cliente',
                createdAt: new Date().toISOString()
            };
            users.push(newUser);
            Helpers.set(KEYS.USERS, users);
            return { success: true, user: newUser };
        },

        login(email, password) {
            const users = Helpers.get(KEYS.USERS) || [];
            const user = users.find(u => u.email === email && u.password === password);
            if (!user) {
                return { success: false, message: 'Correo o contraseña incorrectos' };
            }
            const sessionUser = { ...user };
            delete sessionUser.password;
            Helpers.set(KEYS.CURRENT_USER, sessionUser);
            return { success: true, user: sessionUser };
        },

        logout() {
            localStorage.removeItem(KEYS.CURRENT_USER);
            localStorage.removeItem(KEYS.CART);
        },

        getCurrentUser() {
            return Helpers.get(KEYS.CURRENT_USER);
        },

        isAdmin() {
            const user = this.getCurrentUser();
            return user && user.role === 'admin';
        },

        getAllUsers() {
            return (Helpers.get(KEYS.USERS) || []).map(u => {
                const copy = { ...u };
                delete copy.password;
                return copy;
            });
        }
    };

    // ==================== PRODUCTS & SERVICES ====================
    const Products = {
        getAll() {
            return Helpers.get(KEYS.PRODUCTS) || [];
        },

        getProducts() {
            return this.getAll().filter(p => p.type === 'product');
        },

        getServices() {
            return this.getAll().filter(p => p.type === 'service');
        },

        getById(id) {
            return this.getAll().find(p => p.id === id) || null;
        },

        getByCategory(category) {
            return this.getProducts().filter(p => p.category === category);
        },

        search(query) {
            const q = query.toLowerCase();
            return this.getAll().filter(p =>
                p.name.toLowerCase().includes(q) ||
                p.description.toLowerCase().includes(q) ||
                (p.category && p.category.toLowerCase().includes(q))
            );
        },

        create(item) {
            const items = this.getAll();
            const newItem = {
                id: Helpers.generateId(),
                ...item,
                createdAt: new Date().toISOString()
            };
            items.push(newItem);
            Helpers.set(KEYS.PRODUCTS, items);
            return { success: true, item: newItem };
        },

        update(id, updates) {
            const items = this.getAll();
            const index = items.findIndex(p => p.id === id);
            if (index === -1) return { success: false, message: 'Item no encontrado' };
            items[index] = { ...items[index], ...updates };
            Helpers.set(KEYS.PRODUCTS, items);
            return { success: true, item: items[index] };
        },

        delete(id) {
            const items = this.getAll().filter(p => p.id !== id);
            Helpers.set(KEYS.PRODUCTS, items);
            return { success: true };
        }
    };

    // ==================== CART ====================
    const Cart = {
        get() {
            return Helpers.get(KEYS.CART) || [];
        },

        add(productId, quantity = 1) {
            const cart = this.get();
            const product = Products.getById(productId);
            if (!product) return { success: false, message: 'Producto no encontrado' };

            if (product.type === 'product' && product.stock !== undefined && product.stock < 1) {
                return { success: false, message: 'Producto sin stock' };
            }

            const existing = cart.find(item => item.productId === productId);
            if (existing) {
                if (product.type === 'product' && product.stock !== undefined && existing.quantity + quantity > product.stock) {
                    return { success: false, message: 'Stock insuficiente' };
                }
                existing.quantity += quantity;
            } else {
                cart.push({
                    id: Helpers.generateId(),
                    productId,
                    name: product.name,
                    price: product.price,
                    icon: product.icon,
                    type: product.type,
                    quantity
                });
            }
            Helpers.set(KEYS.CART, cart);
            return { success: true, cart };
        },

        updateQuantity(itemId, quantity) {
            const cart = this.get();
            const item = cart.find(i => i.id === itemId);
            if (!item) return { success: false, message: 'Item no encontrado' };

            if (quantity <= 0) {
                return this.remove(itemId);
            }

            const product = Products.getById(item.productId);
            if (product && product.type === 'product' && product.stock !== undefined && quantity > product.stock) {
                return { success: false, message: 'Stock insuficiente' };
            }

            item.quantity = quantity;
            Helpers.set(KEYS.CART, cart);
            return { success: true, cart };
        },

        remove(itemId) {
            const cart = this.get().filter(i => i.id !== itemId);
            Helpers.set(KEYS.CART, cart);
            return { success: true, cart };
        },

        clear() {
            Helpers.set(KEYS.CART, []);
            return { success: true };
        },

        getTotal() {
            const cart = this.get();
            const subtotal = cart.reduce((sum, item) => sum + (item.price * item.quantity), 0);
            const tax = subtotal * 0.16;
            return { subtotal, tax, total: subtotal + tax, count: cart.reduce((s, i) => s + i.quantity, 0) };
        }
    };

    // ==================== ORDERS ====================
    const Orders = {
        getAll() {
            return Helpers.get(KEYS.ORDERS) || [];
        },

        getByUser(userId) {
            return this.getAll().filter(o => o.userId === userId);
        },

        create(userId) {
            const cart = Cart.get();
            if (cart.length === 0) return { success: false, message: 'El carrito está vacío' };

            const user = Auth.getCurrentUser();
            if (!user) return { success: false, message: 'Debes iniciar sesión' };

            const totals = Cart.getTotal();
            const productItems = cart.filter(i => i.type === 'product');

            if (productItems.length === 0) {
                return { success: false, message: 'No hay productos en el carrito para crear un pedido' };
            }

            const order = {
                id: Helpers.generateId(),
                userId: user.id,
                userName: user.name,
                userEmail: user.email,
                userPhone: user.phone || '',
                userAddress: user.address || '',
                items: productItems.map(i => ({ ...i })),
                subtotal: productItems.reduce((s, i) => s + i.price * i.quantity, 0),
                tax: productItems.reduce((s, i) => s + i.price * i.quantity, 0) * 0.16,
                total: productItems.reduce((s, i) => s + i.price * i.quantity, 0) * 1.16,
                status: 'pendiente',
                date: new Date().toISOString(),
                type: 'product_order'
            };

            const orders = this.getAll();
            orders.unshift(order);
            Helpers.set(KEYS.ORDERS, orders);

            // Reducir stock
            productItems.forEach(item => {
                const product = Products.getById(item.productId);
                if (product && product.stock !== undefined) {
                    Products.update(item.productId, { stock: Math.max(0, product.stock - item.quantity) });
                }
            });

            // Limpiar solo productos del carrito
            const remainingCart = cart.filter(i => i.type !== 'product');
            Helpers.set(KEYS.CART, remainingCart);

            return { success: true, order };
        },

        updateStatus(orderId, status) {
            const orders = this.getAll();
            const order = orders.find(o => o.id === orderId);
            if (!order) return { success: false, message: 'Pedido no encontrado' };
            order.status = status;
            Helpers.set(KEYS.ORDERS, orders);
            return { success: true, order };
        }
    };

    // ==================== SERVICE REQUESTS ====================
    const ServiceRequests = {
        getAll() {
            return Helpers.get(KEYS.SERVICE_REQUESTS) || [];
        },

        create({ serviceId, serviceName, description, date, time, address }) {
            const user = Auth.getCurrentUser();
            if (!user) return { success: false, message: 'Debes iniciar sesión' };

            const service = Products.getById(serviceId);
            const request = {
                id: Helpers.generateId(),
                serviceId,
                serviceName: serviceName || (service ? service.name : 'Servicio'),
                userId: user.id,
                userName: user.name,
                userEmail: user.email,
                userPhone: user.phone || '',
                description,
                requestedDate: date,
                requestedTime: time,
                address,
                price: service ? service.price : 0,
                status: 'pendiente',
                createdAt: new Date().toISOString(),
                type: 'service_request'
            };

            const requests = this.getAll();
            requests.unshift(request);
            Helpers.set(KEYS.SERVICE_REQUESTS, requests);
            return { success: true, request };
        },

        updateStatus(requestId, status) {
            const requests = this.getAll();
            const req = requests.find(r => r.id === requestId);
            if (!req) return { success: false, message: 'Solicitud no encontrada' };
            req.status = status;
            Helpers.set(KEYS.SERVICE_REQUESTS, requests);
            return { success: true, request: req };
        }
    };

    // ==================== SEED DATA ====================
    const Init = {
        seedData() {
            if (Helpers.get(KEYS.SEEDED)) return;

            // Admin user
            const users = [
                {
                    id: 'admin001',
                    name: 'Administrador',
                    phone: '+1 000 000 000',
                    email: 'admin@ferretech.com',
                    address: 'Oficina Central FerreTech',
                    password: 'admin123',
                    role: 'admin',
                    createdAt: new Date().toISOString()
                }
            ];
            Helpers.set(KEYS.USERS, users);

            // Products
            const products = [
                {
                    id: 'prod001', type: 'product', name: 'Taladro Percutor 800W',
                    description: 'Taladro percutor profesional con velocidad variable, mandril de 13mm y empuñadura antivibración.',
                    price: 89.99, stock: 25, category: 'herramientas', icon: 'fa-screwdriver-wrench',
                    createdAt: new Date().toISOString()
                },
                {
                    id: 'prod002', type: 'product', name: 'Sierra Circular 1400W',
                    description: 'Sierra circular con disco de 185mm, guía láser y sistema de extracción de polvo.',
                    price: 129.99, stock: 15, category: 'herramientas', icon: 'fa-gear',
                    createdAt: new Date().toISOString()
                },
                {
                    id: 'prod003', type: 'product', name: 'Juego de Llaves Combinadas 25pcs',
                    description: 'Set completo de llaves combinadas en acero cromo-vanadio, de 6mm a 32mm.',
                    price: 45.50, stock: 40, category: 'herramientas', icon: 'fa-wrench',
                    createdAt: new Date().toISOString()
                },
                {
                    id: 'prod004', type: 'product', name: 'Martillo de Carpintero 500g',
                    description: 'Martillo con cabeza de acero forjado y mango de fibra de vidrio ergonómico.',
                    price: 18.99, stock: 60, category: 'herramientas', icon: 'fa-hammer',
                    createdAt: new Date().toISOString()
                },
                {
                    id: 'prod005', type: 'product', name: 'Cemento Portland 50kg',
                    description: 'Cemento gris de alta resistencia para construcción general. Fraguado normal.',
                    price: 12.50, stock: 200, category: 'materiales', icon: 'fa-cubes',
                    createdAt: new Date().toISOString()
                },
                {
                    id: 'prod006', type: 'product', name: 'Varilla de Acero 3/8" x 12m',
                    description: 'Varilla corrugada de acero grado 60 para refuerzo

                  /**
 * ============================================================
 * API.js - Capa de datos con localStorage
 * Simula un backend completo para FerreTech Pro
 * ============================================================
 */

const API = (() => {
    const KEYS = {
        USERS: 'ftp_users',
        CURRENT_USER: 'ftp_current_user',
        PRODUCTS: 'ftp_products',
        CART: 'ftp_cart',
        ORDERS: 'ftp_orders',
        SERVICE_REQUESTS: 'ftp_service_requests',
        SEEDED: 'ftp_seeded'
    };

    const Helpers = {
        get(key) {
            try { return JSON.parse(localStorage.getItem(key)) || null; }
            catch { return null; }
        },
        set(key, value) {
            try { localStorage.setItem(key, JSON.stringify(value)); return true; }
            catch { return false; }
        },
        generateId() {
            return Date.now().toString(36) + Math.random().toString(36).substr(2, 9);
        },
        formatDate(date) {
            return new Date(date).toLocaleDateString('es-ES', {
                year: 'numeric', month: 'short', day: 'numeric',
                hour: '2-digit', minute: '2-digit'
            });
        }
    };

    const Auth = {
        register({ name, phone, email, address, password }) {
            const users = Helpers.get(KEYS.USERS) || [];
            if (users.find(u => u.email === email))
                return { success: false, message: 'El correo ya está registrado' };
            if (password.length < 6)
                return { success: false, message: 'La contraseña debe tener al menos 6 caracteres' };
            const newUser = {
                id: Helpers.generateId(), name, phone, email, address, password,
                role: 'cliente', createdAt: new Date().toISOString()
            };
            users.push(newUser);
            Helpers.set(KEYS.USERS, users);
            return { success: true, user: newUser };
        },
        login(email, password) {
            const users = Helpers.get(KEYS.USERS) || [];
            const user = users.find(u => u.email === email && u.password === password);
            if (!user) return { success: false, message: 'Correo o contraseña incorrectos' };
            const sessionUser = { ...user };
            delete sessionUser.password;
            Helpers.set(KEYS.CURRENT_USER, sessionUser);
            return { success: true, user: sessionUser };
        },
        logout() {
            localStorage.removeItem(KEYS.CURRENT_USER);
            localStorage.removeItem(KEYS.CART);
        },
        getCurrentUser() { return Helpers.get(KEYS.CURRENT_USER); },
        isAdmin() { const u = this.getCurrentUser(); return u && u.role === 'admin'; },
        getAllUsers() {
            return (Helpers.get(KEYS.USERS) || []).map(u => {
                const c = { ...u }; delete c.password; return c;
            });
        }
    };

    const Products = {
        getAll() { return Helpers.get(KEYS.PRODUCTS) || []; },
        getProducts() { return this.getAll().filter(p => p.type === 'product'); },
        getServices() { return this.getAll().filter(p => p.type === 'service'); },
        getById(id) { return this.getAll().find(p => p.id === id) || null; },
        getByCategory(cat) { return this.getProducts().filter(p => p.category === cat); },
        search(query) {
            const q = query.toLowerCase();
            return this.getAll().filter(p =>
                p.name.toLowerCase().includes(q) ||
                p.description.toLowerCase().includes(q) ||
                (p.category && p.category.toLowerCase().includes(q))
            );
        },
        create(item) {
            const items = this.getAll();
            const newItem = { id: Helpers.generateId(), ...item, createdAt: new Date().toISOString() };
            items.push(newItem);
            Helpers.set(KEYS.PRODUCTS, items);
            return { success: true, item: newItem };
        },
        update(id, updates) {
            const items = this.getAll();
            const idx = items.findIndex(p => p.id === id);
            if (idx === -1) return { success: false, message: 'Item no encontrado' };
            items[idx] = { ...items[idx], ...updates };
            Helpers.set(KEYS.PRODUCTS, items);
            return { success: true, item: items[idx] };
        },
        delete(id) {
            Helpers.set(KEYS.PRODUCTS, this.getAll().filter(p => p.id !== id));
            return { success: true };
        }
    };

    const Cart = {
        get() { return Helpers.get(KEYS.CART) || []; },
        add(productId, quantity = 1) {
            const cart = this.get();
            const product = Products.getById(productId);
            if (!product) return { success: false, message: 'Producto no encontrado' };
            if (product.type === 'product' && product.stock !== undefined && product.stock < 1)
                return { success: false, message: 'Producto sin stock' };
            const existing = cart.find(i => i.productId === productId);
            if (existing) {
                if (product.type === 'product' && product.stock !== undefined && existing.quantity + quantity > product.stock)
                    return { success: false, message: 'Stock insuficiente' };
                existing.quantity += quantity;
            } else {
                cart.push({
                    id: Helpers.generateId(), productId,
                    name: product.name, price: product.price,
                    icon: product.icon, type: product.type, quantity
                });
            }
            Helpers.set(KEYS.CART, cart);
            return { success: true, cart };
        },
        updateQuantity(itemId, quantity) {
            const cart = this.get();
            const item = cart.find(i => i.id === itemId);
            if (!item) return { success: false, message: 'Item no encontrado' };
            if (quantity <= 0) return this.remove(itemId);
            const product = Products.getById(item.productId);
            if (product && product.type === 'product' && product.stock !== undefined && quantity > product.stock)
                return { success: false, message: 'Stock insuficiente' };
            item.quantity = quantity;
            Helpers.set(KEYS.CART, cart);
            return { success: true, cart };
        },
        remove(itemId) {
            const cart = this.get().filter(i => i.id !== itemId);
            Helpers.set(KEYS.CART, cart);
            return { success: true, cart };
        },
        clear() { Helpers.set(KEYS.CART, []); return { success: true }; },
        getTotal() {
            const cart = this.get();
            const subtotal = cart.reduce((s, i) => s + i.price * i.quantity, 0);
            const tax = subtotal * 0.16;
            return { subtotal, tax, total: subtotal + tax, count: cart.reduce((s, i) => s + i.quantity, 0) };
        }
    };

    const Orders = {
        getAll() { return Helpers.get(KEYS.ORDERS) || []; },
        getByUser(userId) { return this.getAll().filter(o => o.userId === userId); },
        create() {
            const cart = Cart.get();
            const user = Auth.getCurrentUser();
            if (!user) return { success: false, message: 'Debes iniciar sesión' };
            const productItems = cart.filter(i => i.type === 'product');
            if (productItems.length === 0)
                return { success: false, message: 'No hay productos en el carrito' };
            const sub = productItems.reduce((s, i) => s + i.price * i.quantity, 0);
            const order = {
                id: Helpers.generateId(), userId: user.id, userName: user.name,
                userEmail: user.email, userPhone: user.phone || '',
                userAddress: user.address || '',
                items: productItems.map(i => ({ ...i })),
                subtotal: sub, tax: sub * 0.16, total: sub * 1.16,
                status: 'pendiente', date: new Date().toISOString(), type: 'product_order'
            };
            const orders = this.getAll();
            orders.unshift(order);
            Helpers.set(KEYS.ORDERS, orders);
            productItems.forEach(item => {
                const p = Products.getById(item.productId);
                if (p && p.stock !== undefined)
                    Products.update(item.productId, { stock: Math.max(0, p.stock - item.quantity) });
            });
            Helpers.set(KEYS.CART, cart.filter(i => i.type !== 'product'));
            return { success: true, order };
        },
        updateStatus(orderId, status) {
            const orders = this.getAll();
            const o = orders.find(x => x.id === orderId);
            if (!o) return { success: false, message: 'Pedido no encontrado' };
            o.status = status;
            Helpers.set(KEYS.ORDERS, orders);
            return { success: true, order: o };
        }
    };

    const ServiceRequests = {
        getAll() { return Helpers.get(KEYS.SERVICE_REQUESTS) || []; },
        create({ serviceId, serviceName, description, date, time, address }) {
            const user = Auth.getCurrentUser();
            if (!user) return { success: false, message: 'Debes iniciar sesión' };
            const service = Products.getById(serviceId);
            const request = {
                id: Helpers.generateId(), serviceId,
                serviceName: serviceName || (service ? service.name : 'Servicio'),
                userId: user.id, userName: user.name, userEmail: user.email,
                userPhone: user.phone || '', description,
                requestedDate: date, requestedTime: time, address,
                price: service ? service.price : 0,
                status: 'pendiente', createdAt: new Date().toISOString(),
                type: 'service_request'
            };
            const requests = this.getAll();
            requests.unshift(request);
            Helpers.set(KEYS.SERVICE_REQUESTS, requests);
            return { success: true, request };
        },
        updateStatus(requestId, status) {
            const requests = this.getAll();
            const r = requests.find(x => x.id === requestId);
            if (!r) return { success: false, message: 'Solicitud no encontrada' };
            r.status = status;
            Helpers.set(KEYS.SERVICE_REQUESTS, requests);
            return { success: true, request: r };
        }
    };

      /* ==================== SEED DATA ==================== */
    const Init = {
        seedData() {
            if (Helpers.get(KEYS.SEEDED)) return;

            // Usuario administrador
            const users = [{
                id: 'admin001',
                name: 'Administrador',
                phone: '+1 000 000 000',
                email: 'admin@ferretech.com',
                address: 'Oficina Central FerreTech',
                password: 'admin123',
                role: 'admin',
                createdAt: new Date().toISOString()
            }];
            Helpers.set(KEYS.USERS, users);

            // Timestamp reutilizable
            const ts = new Date().toISOString();

            const products = [
                // ========== HERRAMIENTAS ==========
                {
                    id: 'p01', type: 'product', category: 'herramientas',
                    name: 'Taladro Percutor 800W',
                    description: 'Taladro profesional con velocidad variable, mandril 13mm y empuñadura antivibración. Ideal para concreto, madera y metal.',
                    price: 89.99, stock: 25, icon: 'fa-screwdriver-wrench', createdAt: ts
                },
                {
                    id: 'p02', type: 'product', category: 'herramientas',
                    name: 'Sierra Circular 1400W',
                    description: 'Sierra circular con disco 185mm, guía láser integrada y sistema de extracción de polvo.',
                    price: 129.99, stock: 15, icon: 'fa-gear', createdAt: ts
                },
                {
                    id: 'p03', type: 'product', category: 'herramientas',
                    name: 'Juego Llaves Combinadas 25pcs',
                    description: 'Set completo de llaves combinadas en acero cromo-vanadio, medidas de 6mm a 32mm con estuche organizador.',
                    price: 45.50, stock: 40, icon: 'fa-wrench', createdAt: ts
                },
                {
                    id: 'p04', type: 'product', category: 'herramientas',
                    name: 'Martillo Carpintero 500g',
                    description: 'Martillo con cabeza de acero forjado pulido y mango de fibra de vidrio ergonómico con grip antideslizante.',
                    price: 18.99, stock: 60, icon: 'fa-hammer', createdAt: ts
                },
                {
                    id: 'p05', type: 'product', category: 'herramientas',
                    name: 'Destornillador Eléctrico 3.6V',
                    description: 'Destornillador inalámbrico recargable con 10 puntas intercambiables, luz LED y carga USB.',
                    price: 32.00, stock: 35, icon: 'fa-screwdriver', createdAt: ts
                },
                {
                    id: 'p06', type: 'product', category: 'herramientas',
                    name: 'Nivel Láser Autonivelante',
                    description: 'Nivel láser de línea cruzada con alcance de 15m, trípode incluido y estuche de transporte.',
                    price: 67.50, stock: 20, icon: 'fa-ruler-horizontal', createdAt: ts
                },

                // ========== MATERIALES ==========
                {
                    id: 'p07', type: 'product', category: 'materiales',
                    name: 'Cemento Portland 50kg',
                    description: 'Cemento gris de alta resistencia para construcción general. Fraguado normal, rendimiento óptimo.',
                    price: 12.50, stock: 200, icon: 'fa-cubes', createdAt: ts
                },
                {
                    id: 'p08', type: 'product', category: 'materiales',
                    name: 'Varilla Acero 3/8" x 12m',
                    description: 'Varilla corrugada de acero grado 60 para refuerzo estructural en columnas, vigas y losas.',
                    price: 8.75, stock: 150, icon: 'fa-minus', createdAt: ts
                },
                {
                    id: 'p09', type: 'product', category: 'materiales',
                    name: 'Arena Gruesa por m³',
                    description: 'Arena gruesa lavada de río para mezclas de concreto, mortero y rellenos estructurales.',
                    price: 35.00, stock: 50, icon: 'fa-mountain', createdAt: ts
                },
                {
                    id: 'p10', type: 'product', category: 'materiales',
                    name: 'Bloque de Concreto 15x20x40',
                    description: 'Bloque estándar para muros de carga y paredes divisorias. Alta resistencia a compresión.',
                    price: 1.25, stock: 500, icon: 'fa-square', createdAt: ts
                },
                {
                    id: 'p11', type: 'product', category: 'materiales',
                    name: 'Tabla de Pino 1"x12"x10ft',
                    description: 'Tabla de madera de pino cepillada, ideal para encofrados, estanterías y proyectos de carpintería.',
                    price: 14.00, stock: 80, icon: 'fa-tree', createdAt: ts
                },

                // ========== ELÉCTRICO ==========
                {
                    id: 'p12', type: 'product', category: 'electrico',
                    name: 'Cable THW 12 AWG (100m)',
                    description: 'Cable eléctrico de cobre sólido calibre 12 con aislamiento termoplástico. Colores surtidos.',
                    price: 52.00, stock: 80, icon: 'fa-bolt', createdAt: ts
                },
                {
                    id: 'p13', type: 'product', category: 'electrico',
                    name: 'Interruptor Termomagnético 2x20A',
                    description: 'Breaker bipolar de 20 amperios para protección de circuitos residenciales y comerciales.',
                    price: 15.99, stock: 45, icon: 'fa-toggle-on', createdAt: ts
                },
                {
                    id: 'p14', type: 'product', category: 'electrico',
                    name: 'Panel LED 60x60 48W',
                    description: 'Panel de iluminación LED empotrable para cielo falso, luz blanca 6500K, vida útil 50,000 horas.',
                    price: 28.50, stock: 35, icon: 'fa-lightbulb', createdAt: ts
                },
                {
                    id: 'p15', type: 'product', category: 'electrico',
                    name: 'Tomacorriente Doble GFCI',
                    description: 'Tomacorriente con protección contra fallas a tierra, ideal para baños, cocinas y exteriores.',
                    price: 12.00, stock: 70, icon: 'fa-plug', createdAt: ts
                },
                {
                    id: 'p16', type: 'product', category: 'electrico',
                    name: 'Centro de Carga 8 Circuitos',
                    description: 'Tablero eléctrico residencial para 8 circuitos con barra de neutros y tierra incluidas.',
                    price: 42.00, stock: 20, icon: 'fa-server', createdAt: ts
                },

                // ========== SEGURIDAD ==========
                {
                    id: 'p17', type: 'product', category: 'seguridad',
                    name: 'Cámara Domo HD 1080p',
                    description: 'Cámara de seguridad tipo domo con visión nocturna IR 30m, IP66 resistente a intemperie.',
                    price: 45.00, stock: 30, icon: 'fa-video', createdAt: ts
                },
                {
                    id: 'p18', type: 'product', category: 'seguridad',
                    name: 'DVR 8 Canales HD',
                    description: 'Grabador digital de video para 8 cámaras, salida HDMI, acceso remoto por app móvil.',
                    price: 120.00, stock: 12, icon: 'fa-hard-drive', createdAt: ts
                },
                {
                    id: 'p19', type: 'product', category: 'seguridad',
                    name: 'Cámara Bullet 2MP Exterior',
                    description: 'Cámara tipo bullet para exteriores con lente 3.6mm, visión nocturna 40m y carcasa metálica.',
                    price: 55.00, stock: 25, icon: 'fa-camera', createdAt: ts
                },
                {
                    id: 'p20', type: 'product', category: 'seguridad',
                    name: 'Kit Alarma Inalámbrica WiFi',
                    description: 'Sistema de alarma con panel central, 2 sensores de movimiento, 2 sensores de puerta y sirena.',
                    price: 89.00, stock: 18, icon: 'fa-bell', createdAt: ts
                },

                // ========== PLOMERÍA ==========
                {
                    id: 'p21', type: 'product', category: 'plomeria',
                    name: 'Tubo PVC 1/2" x 6m',
                    description: 'Tubo de PVC presión para agua fría, conexión cementada, resistente a corrosión.',
                    price: 4.50, stock: 100, icon: 'fa-droplet', createdAt: ts
                },
                {
                    id: 'p22', type: 'product', category: 'plomeria',
                    name: 'Llave de Paso 1/2" Bronce',
                    description: 'Válvula de paso tipo compuerta en bronce fundido para instalaciones de agua potable.',
                    price: 8.99, stock: 50, icon: 'fa-faucet-drip', createdAt: ts
                },
                {
                    id: 'p23', type: 'product', category: 'plomeria',
                    name: 'Tanque de Agua 1100L',
                    description: 'Tanque tricapa de polietileno para almacenamiento de agua, protección UV, tapa roscada.',
                    price: 145.00, stock: 8, icon: 'fa-water', createdAt: ts
                },
                {
                    id: 'p24', type: 'product', category: 'plomeria',
                    name: 'Bomba de Agua 1HP',
                    description: 'Bomba centrífuga periférica de 1HP para presurización doméstica, succión hasta 8m.',
                    price: 95.00, stock: 14, icon: 'fa-pump-soap', createdAt: ts
                },

                // ========== SERVICIOS TÉCNICOS ==========
                {
                    id: 'svc01', type: 'service',
                    name: 'Reparación Eléctrica',
                    description: 'Servicio profesional de diagnóstico y reparación de instalaciones eléctricas residenciales y comerciales. Incluye revisión de circuitos, cambio de componentes dañados y certificación de seguridad.',
                    price: 75.00,
                    icon: 'fa-plug-circle-bolt',
                    color: 'blue',
                    features: [
                        'Diagnóstico completo gratuito',
                        'Reparación de cortocircuitos',
                        'Cambio de cableado y breakers',
                        'Instalación de centros de carga',
                        'Certificación de seguridad eléctrica',
                        'Garantía de 6 meses'
                    ],
                    createdAt: ts
                },
                {
                    id: 'svc02', type: 'service',
                    name: 'Instalación de Cámaras de Seguridad',
                    description: 'Diseño e instalación profesional de sistemas CCTV con cámaras HD, grabadores digitales y configuración de acceso remoto desde tu celular.',
                    price: 150.00,
                    icon: 'fa-shield-halved',
                    color: 'green',
                    features: [
                        'Evaluación de seguridad del sitio',
                        'Instalación de cámaras HD/4K',
                        'Configuración de DVR/NVR',
                        'Acceso remoto desde celular',
                        'Cableado estructurado oculto',
                        'Capacitación de uso incluida',
                        'Garantía de 12 meses'
                    ],
                    createdAt: ts
                },
                {
                    id: 'svc03', type: 'service',
                    name: 'Desarrollo de Software Personalizado',
                    description: 'Creación de aplicaciones web y móviles a medida para tu negocio. Desde sistemas de inventario hasta tiendas en línea y apps de gestión empresarial.',
                    price: 500.00,
                    icon: 'fa-code',
                    color: 'purple',
                    features: [
                        'Análisis de requerimientos',
                        'Diseño UI/UX profesional',
                        'Desarrollo web y móvil',
                        'Sistemas de inventario y POS',
                        'Tiendas en línea e-commerce',
                        'Integración con APIs externas',
                        'Soporte técnico 12 meses',
                        'Capacitación incluida'
                    ],
                    createdAt: ts
                }
            ];

            Helpers.set(KEYS.PRODUCTS, products);
            Helpers.set(KEYS.ORDERS, []);
            Helpers.set(KEYS.SERVICE_REQUESTS, []);
            Helpers.set(KEYS.CART, []);
            Helpers.set(KEYS.SEEDED, true);

            console.log('✅ FerreTech Pro: Datos iniciales cargados correctamente');
        },

        resetAll() {
            Object.values(KEYS).forEach(key => localStorage.removeItem(key));
            this.seedData();
            console.log('🔄 FerreTech Pro: Datos reiniciados');
        }
    };

    /* ==================== PUBLIC API ==================== */
    return {
        Helpers,
        Auth,
        Products,
        Cart,
        Orders,
        ServiceRequests,
        Init
    };

})();

// Inicializar datos al cargar
API.Init.seedData();
