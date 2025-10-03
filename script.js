document.addEventListener('DOMContentLoaded', () => {
  const navLinks = document.querySelectorAll('nav a');
  const panels = document.querySelectorAll('.panel');

  let carrito = JSON.parse(localStorage.getItem('carrito')) || [];
  let usuarios = JSON.parse(localStorage.getItem('usuarios')) || [];
  let usuarioActual = JSON.parse(sessionStorage.getItem('usuarioActual')) || null;
  let pedidos = JSON.parse(localStorage.getItem('pedidos')) || [];

  // Mostrar/ocultar paneles al hacer clic en el menú
  navLinks.forEach(link => {
    link.addEventListener('click', e => {
      e.preventDefault();
      const targetId = link.getAttribute('data-panel');
      togglePanel(targetId);
    });
  });

  // Función para mostrar un panel y ocultar los demás
  function togglePanel(id) {
    panels.forEach(panel => {
      if (panel.id === id) {
        panel.classList.add('active');
        panel.setAttribute('aria-hidden', 'false');
      } else {
        panel.classList.remove('active');
        panel.setAttribute('aria-hidden', 'true');
      }
    });
    // Actualizar menú activo
    navLinks.forEach(link => {
      link.classList.toggle('active', link.getAttribute('data-panel') === id);
    });
    // Actualizar visibilidad de enlaces admin
    updateAdminLinks();
  }

  // Actualizar visibilidad de enlaces de admin/login dependiendo de si hay usuario logueado
  function updateAdminLinks() {
    const adminLinks = document.querySelectorAll('.admin-link');
    adminLinks.forEach(link => {
      if (usuarioActual) {
        // Si está logueado, ocultar login/registro y mostrar 'Ver Pedidos'
        if (link.getAttribute('data-panel') === 'login' || link.getAttribute('data-panel') === 'registro') {
          link.style.display = 'none';
        } else {
          link.style.display = 'inline-block';
        }
      } else {
        // No logueado: mostrar login y registro, ocultar admin y pedidos
        if (link.getAttribute('data-panel') === 'login' || link.getAttribute('data-panel') === 'registro') {
          link.style.display = 'inline-block';
        } else {
          link.style.display = 'none';
        }
      }
    });
    // Si es admin, mostrar enlace de pedidos admin
    if (usuarioActual && usuarioActual.isAdmin) {
      showAdminPedidosLink();
    }
  }

  // Agregar enlace "Ver Pedidos" solo para admin
  function showAdminPedidosLink() {
    let pedidosLink = document.querySelector('nav a[data-panel="adminPedidos"]');
    if (!pedidosLink) {
      pedidosLink = document.createElement('a');
      pedidosLink.href = '#';
      pedidosLink.textContent = 'Ver Pedidos';
      pedidosLink.setAttribute('data-panel', 'adminPedidos');
      pedidosLink.classList.add('admin-link');
      document.querySelector('nav').appendChild(pedidosLink);
      pedidosLink.addEventListener('click', e => {
        e.preventDefault();
        togglePanel('adminPedidos');
        renderPedidosAdmin();
      });
    }
    pedidosLink.style.display = 'inline-block';
  }

  // Crear panel para pedidos admin dinámicamente
  const adminPedidosPanel = document.createElement('section');
  adminPedidosPanel.id = 'adminPedidos';
  adminPedidosPanel.className = 'panel';
  adminPedidosPanel.setAttribute('aria-hidden', 'true');
  adminPedidosPanel.innerHTML = `
    <h2>Pedidos Recibidos</h2>
    <div id="listaPedidosAdmin"></div>
    <button id="cerrarAdminPedidos" class="cerrar">Cerrar</button>
  `;
  document.querySelector('main').appendChild(adminPedidosPanel);
  document.getElementById('cerrarAdminPedidos').addEventListener('click', () => togglePanel('catalogo'));

  // Renderiza pedidos en panel admin
  function renderPedidosAdmin() {
    const container = document.getElementById('listaPedidosAdmin');
    if (pedidos.length === 0) {
      container.innerHTML = '<p>No hay pedidos aún.</p>';
      return;
    }
    container.innerHTML = '';
    pedidos.forEach((pedido, i) => {
      const div = document.createElement('div');
      div.className = 'pedido-admin-item';
      div.style.border = '1px solid #ccc';
      div.style.padding = '10px';
      div.style.marginBottom = '10px';
      div.innerHTML = `
        <strong>Pedido #${i + 1}</strong><br/>
        Producto: ${pedido.producto}<br/>
        Cantidad: ${pedido.cantidad}<br/>
        Dirección: ${pedido.direccion}<br/>
        Teléfono: ${pedido.telefono}<br/>
        Fecha: ${new Date(pedido.fecha).toLocaleString()}
      `;
      container.appendChild(div);
    });
  }

  // ------------------ Carrito ------------------
  function actualizarCarrito() {
    localStorage.setItem('carrito', JSON.stringify(carrito));
    const contenedor = document.querySelector('.carrito-items');
    contenedor.innerHTML = '';
    let total = 0;

    carrito.forEach((item, index) => {
      total += item.precio;
      const div = document.createElement('div');
      div.className = 'carrito-item';
      div.innerHTML = `
        <span>${item.nombre}</span>
        <div>
          <span>S/ ${item.precio.toFixed(2)}</span>
          <button data-index="${index}">X</button>
        </div>
      `;
      contenedor.appendChild(div);
    });

    document.querySelector('.carrito-total').textContent = `Total: S/ ${total.toFixed(2)}`;

    // Botones para eliminar producto del carrito
    contenedor.querySelectorAll('button').forEach(btn => {
      btn.addEventListener('click', e => {
        const idx = parseInt(e.target.dataset.index);
        carrito.splice(idx, 1);
        actualizarCarrito();
      });
    });
  }

  function agregarAlCarrito(nombre, precio) {
    carrito.push({ nombre, precio });
    actualizarCarrito();
    togglePanel('carrito');
  }

  document.getElementById('finalizarCompra').addEventListener('click', () => {
    if (carrito.length === 0) {
      alert('Tu carrito está vacío.');
      return;
    }
    let resumen = 'Resumen de tu compra:\n\n';
    let total = 0;
    carrito.forEach(item => {
      resumen += `${item.nombre} - S/ ${item.precio.toFixed(2)}\n`;
      total += item.precio;
    });
    resumen += `\nTOTAL: S/ ${total.toFixed(2)}`;
    alert(resumen);
    carrito = [];
    actualizarCarrito();
    togglePanel('catalogo');
  });

  // ------------------ Formulario de Pedido ------------------
  const formPedido = document.getElementById('formPedido');
  formPedido.addEventListener('submit', e => {
    e.preventDefault();

    const producto = formPedido.producto.value.trim();
    const cantidad = parseInt(formPedido.cantidad.value.trim());
    const direccion = formPedido.direccion.value.trim();
    const telefono = formPedido.telefono.value.trim();

    if (!producto || !cantidad || !direccion || !telefono) {
      alert('Por favor, completa todos los campos.');
      return;
    }

    if (cantidad <= 0) {
      alert('La cantidad debe ser mayor a cero.');
      return;
    }

    // Guardar pedido con fecha y usuario si está logueado
    pedidos.push({
      producto,
      cantidad,
      direccion,
      telefono,
      fecha: new Date(),
      usuario: usuarioActual ? usuarioActual.usuario : 'Invitado',
    });

    localStorage.setItem('pedidos', JSON.stringify(pedidos));

    alert('Pedido enviado con éxito. ¡Gracias!');
    formPedido.reset();
    togglePanel('catalogo');
  });

  // ------------------ Contacto ------------------
  const formContacto = document.getElementById('formContacto');
  formContacto.addEventListener('submit', e => {
    e.preventDefault();

    const nombre = formContacto.nombre.value.trim();
    const email = formContacto.email.value.trim();
    const mensaje = formContacto.mensaje.value.trim();

    if (!nombre || !email || !mensaje) {
      alert('Por favor, completa todos los campos.');
      return;
    }

    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(email)) {
      alert('Por favor, ingresa un correo electrónico válido.');
      return;
    }

    alert('Mensaje enviado con éxito. ¡Gracias por contactarnos!');
    formContacto.reset();
    togglePanel('catalogo');
  });

  // ------------------ Login ------------------
  const formLogin = document.getElementById('formLogin');
  formLogin.addEventListener('submit', e => {
    e.preventDefault();

    const usuario = formLogin.usuario.value.trim();
    const password = formLogin.password.value.trim();

    if (!usuario || !password) {
      alert('Por favor, ingresa usuario y contraseña.');
      return;
    }

    const encontrado = usuarios.find(u => u.usuario === usuario && u.password === password);
    if (!encontrado) {
      alert('Usuario o contraseña incorrectos.');
      return;
    }

    usuarioActual = encontrado;
    sessionStorage.setItem('usuarioActual', JSON.stringify(usuarioActual));

    alert(`Bienvenido, ${usuarioActual.usuario}!`);
    formLogin.reset();
    togglePanel('catalogo');
    updateAdminLinks();
  });

  // ------------------ Registro ------------------
  const formRegistro = document.getElementById('formRegistro');
  formRegistro.addEventListener('submit', e => {
    e.preventDefault();

    const usuario = formRegistro.usuario.value.trim();
    const password = formRegistro.password.value.trim();
    const telefono = formRegistro.telefono.value.trim();

    if (!usuario || !password || !telefono) {
      alert('Por favor, completa todos los campos.');
      return;
    }

    if (usuarios.find(u => u.usuario === usuario)) {
      alert('Este usuario ya existe.');
      return;
    }

    usuarios.push({ usuario, password, telefono, isAdmin: false });
    localStorage.setItem('usuarios', JSON.stringify(usuarios));

    alert('Registro exitoso. Ahora puedes iniciar sesión.');
    formRegistro.reset();
    togglePanel('login');
  });

  // ------------------ Productos - Agregar al carrito ------------------
  document.querySelectorAll('.producto button').forEach(boton => {
    boton.addEventListener('click', () => {
      const productoEl = boton.closest('.producto');
      const nombreProducto = productoEl.querySelector('h3').textContent;
      const precioProducto = parseFloat(productoEl.querySelector('.precio').textContent);

      agregarAlCarrito(nombreProducto, precioProducto);
    });
  });

  // ------------------ Inicio ------------------
  // Usuario por defecto admin (solo si no hay usuarios aún)
  if (usuarios.length === 0) {
    usuarios.push({ usuario: 'admin', password: 'Sa311507', telefono: '', isAdmin: true });
    localStorage.setItem('usuarios', JSON.stringify(usuarios));
  }

  updateAdminLinks();
  actualizarCarrito();
  togglePanel('catalogo');
});


