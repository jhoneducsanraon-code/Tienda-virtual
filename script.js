// Pedido (actualización con validación de sesión)
formPedido.addEventListener('submit', function (event) {
  event.preventDefault();

  const usuarioLogueado = localStorage.getItem('usuarioLogueado');
  if (!usuarioLogueado) {
    alert('Debes iniciar sesión o registrarte para realizar un pedido.');
    togglePanel('panelLogin'); // Opcional: abre el panel de login automáticamente
    return;
  }

  const producto = this.producto;
  const cantidad = this.cantidad;
  const direccion = this.direccion;
  const telefono = this.telefono;

  let valid = true;

  [producto, cantidad, direccion, telefono].forEach(field => {
    field.style.borderColor = '#a3b18a';
    if (!field.value.trim()) {
      field.style.borderColor = 'red';
      valid = false;
    }
  });

  if (cantidad.value <= 0) {
    cantidad.style.borderColor = 'red';
    alert('La cantidad debe ser mayor a cero.');
    return;
  }

  if (!valid) {
    alert('Por favor, completa todos los campos.');
    return;
  }

  alert(`¡Pedido realizado!\nProducto: ${producto.value}\nCantidad: ${cantidad.value}\nDirección: ${direccion.value}\nTeléfono: ${telefono.value}`);
  this.reset();
});




