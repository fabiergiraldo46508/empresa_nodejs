const express = require('express');
const path = require('path');
const db = require('./db');

const app = express();
const PORT = 3000;

app.use(express.json());

app.use(express.static(path.join(__dirname, 'public')));

app.get('/api/empresas', async (req, res) => {
  try {
    const [rows] = await db.query(
      'SELECT id, nombre, created_at FROM empresas ORDER BY id DESC'
    );
    res.json(rows);
  } catch (error) {
    console.error('Error al obtener empresas:', error);
    res.status(500).json({ error: 'Error al obtener empresas' });
  }
});

app.post('/api/empresas', async (req, res) => {
  try {
    const { nombre } = req.body;

    if (!nombre || !nombre.trim()) {
      return res.status(400).json({ error: 'El nombre de la empresa es obligatorio' });
    }

    const [result] = await db.query(
      'INSERT INTO empresas (nombre) VALUES (?)',
      [nombre.trim()]
    );

    res.status(201).json({
      id: result.insertId,
      nombre: nombre.trim()
    });
  } catch (error) {
    console.error('Error al crear empresa:', error);
    res.status(500).json({ error: 'Error al crear empresa' });
  }
});

app.get('/api/empresas/:id/empleados', async (req, res) => {
  try {
    const empresaId = parseInt(req.params.id, 10);

    if (isNaN(empresaId)) {
      return res.status(400).json({ error: 'ID de empresa inválido' });
    }

    const [rows] = await db.query(
      `SELECT e.id, e.nombre, e.cargo, e.email, e.created_at
       FROM empleados e
       WHERE e.empresa_id = ?
       ORDER BY e.created_at DESC`,
      [empresaId]
    );

    res.json(rows);
  } catch (error) {
    console.error('Error al obtener empleados:', error);
    res.status(500).json({ error: 'Error al obtener empleados' });
  }
});

app.post('/api/empresas/:id/empleados', async (req, res) => {
  try {
    const empresaId = parseInt(req.params.id, 10);
    const { nombre, cargo, email } = req.body;

    if (isNaN(empresaId)) {
      return res.status(400).json({ error: 'ID de empresa inválido' });
    }

    if (!nombre || !nombre.trim()) {
      return res.status(400).json({ error: 'El nombre del empleado es obligatorio' });
    }

    const [empresaRows] = await db.query(
      'SELECT id FROM empresas WHERE id = ?',
      [empresaId]
    );
    if (empresaRows.length === 0) {
      return res.status(404).json({ error: 'La empresa no existe' });
    }

    const [result] = await db.query(
      `INSERT INTO empleados (empresa_id, nombre, cargo, email)
       VALUES (?, ?, ?, ?)`,
      [empresaId, nombre.trim(), cargo || null, email || null]
    );

    res.status(201).json({
      id: result.insertId,
      empresa_id: empresaId,
      nombre: nombre.trim(),
      cargo: cargo || null,
      email: email || null
    });
  } catch (error) {
    console.error('Error al crear empleado:', error);
    res.status(500).json({ error: 'Error al crear empleado' });
  }
});

app.get('/api/estado', (req, res) => {
  res.json({ ok: true });
});

app.listen(PORT, () => {
  console.log(`Servidor corriendo en http://localhost:${PORT}`);
});
