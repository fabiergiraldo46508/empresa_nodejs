function showAlert(message, type = 'success', timeout = 3000) {
  const alertPlaceholder = document.getElementById('alertPlaceholder');
  const wrapper = document.createElement('div');
  wrapper.innerHTML = `
    <div class="alert alert-${type} alert-dismissible fade show" role="alert">
      ${message}
      <button type="button" class="btn-close" data-bs-dismiss="alert" aria-label="Close"></button>
    </div>
  `;
  alertPlaceholder.append(wrapper);

  if (timeout) {
    setTimeout(() => {
      const alert = bootstrap.Alert.getOrCreateInstance(wrapper.firstElementChild);
      alert.close();
    }, timeout);
  }
}

async function cargarEmpresas() {
  try {
    const res = await fetch('/api/empresas');
    if (!res.ok) throw new Error('Error al obtener empresas');

    const empresas = await res.json();
    const select = document.getElementById('empresaSelect');

    select.innerHTML = '';

    if (empresas.length === 0) {
      const option = document.createElement('option');
      option.value = '';
      option.textContent = 'No hay empresas. Crea una primero.';
      select.appendChild(option);
      renderEmpleados([]);
      return;
    }

    empresas.forEach(empresa => {
      const option = document.createElement('option');
      option.value = empresa.id;
      option.textContent = `${empresa.nombre} (id: ${empresa.id})`;
      select.appendChild(option);
    });
    const empresaId = select.value;
    if (empresaId) {
      await cargarEmpleados(empresaId);
    }
  } catch (error) {
    console.error(error);
    showAlert('No se pudieron cargar las empresas', 'danger');
  }
}

function renderEmpleados(empleados) {
  const tbody = document.getElementById('tbodyEmpleados');
  tbody.innerHTML = '';

  if (!empleados || empleados.length === 0) {
    const tr = document.createElement('tr');
    tr.innerHTML = `
      <td colspan="5" class="text-center text-muted">
        No hay empleados para esta empresa.
      </td>
    `;
    tbody.appendChild(tr);
    return;
  }

  empleados.forEach((emp, index) => {
    const tr = document.createElement('tr');
    tr.innerHTML = `
      <td>${index + 1}</td>
      <td>${emp.nombre}</td>
      <td>${emp.cargo || '-'}</td>
      <td>${emp.email || '-'}</td>
      <td>${new Date(emp.created_at).toLocaleString()}</td>
    `;
    tbody.appendChild(tr);
  });
}

async function cargarEmpleados(empresaId) {
  if (!empresaId) {
    renderEmpleados([]);
    return;
  }

  try {
    const res = await fetch(`/api/empresas/${empresaId}/empleados`);
    if (!res.ok) throw new Error('Error al obtener empleados');

    const empleados = await res.json();
    renderEmpleados(empleados);
  } catch (error) {
    console.error(error);
    showAlert('No se pudieron cargar los empleados', 'danger');
  }
}

async function manejarSubmitEmpresa(event) {
  event.preventDefault();
  const inputNombre = document.getElementById('nombreEmpresa');
  const nombre = inputNombre.value.trim();

  if (!nombre) {
    showAlert('El nombre de la empresa es obligatorio', 'warning');
    return;
  }

  try {
    const res = await fetch('/api/empresas', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ nombre })
    });

    if (!res.ok) {
      const dataError = await res.json().catch(() => ({}));
      throw new Error(dataError.error || 'Error al crear la empresa');
    }

    inputNombre.value = '';
    showAlert('Empresa creada correctamente');
    await cargarEmpresas();
  } catch (error) {
    console.error(error);
    showAlert(error.message, 'danger');
  }
}

async function manejarSubmitEmpleado(event) {
  event.preventDefault();

  const selectEmpresa = document.getElementById('empresaSelect');
  const empresaId = selectEmpresa.value;

  if (!empresaId) {
    showAlert('Primero selecciona una empresa', 'warning');
    return;
  }

  const nombre = document.getElementById('nombreEmpleado').value.trim();
  const cargo = document.getElementById('cargoEmpleado').value.trim();
  const email = document.getElementById('emailEmpleado').value.trim();

  if (!nombre) {
    showAlert('El nombre del empleado es obligatorio', 'warning');
    return;
  }

  try {
    const res = await fetch(`/api/empresas/${empresaId}/empleados`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        nombre,
        cargo: cargo || null,
        email: email || null
      })
    });

    if (!res.ok) {
      const dataError = await res.json().catch(() => ({}));
      throw new Error(dataError.error || 'Error al crear el empleado');
    }

    document.getElementById('nombreEmpleado').value = '';
    document.getElementById('cargoEmpleado').value = '';
    document.getElementById('emailEmpleado').value = '';

    showAlert('Empleado creado correctamente');
    await cargarEmpleados(empresaId);
  } catch (error) {
    console.error(error);
    showAlert(error.message, 'danger');
  }
}

document.addEventListener('DOMContentLoaded', () => {
  const formEmpresa = document.getElementById('formEmpresa');
  const formEmpleado = document.getElementById('formEmpleado');
  const selectEmpresa = document.getElementById('empresaSelect');

  formEmpresa.addEventListener('submit', manejarSubmitEmpresa);
  formEmpleado.addEventListener('submit', manejarSubmitEmpleado);
  selectEmpresa.addEventListener('change', (e) => {
    const empresaId = e.target.value;
    cargarEmpleados(empresaId);
  });

  cargarEmpresas();
});
