const express = require('express')
const cors = require('cors')
const fs = require('fs')
const path = require('path')

const app = express()
const PUERTO = 4000
const CARPETA_EXPEDIENTES = path.join(__dirname, 'data', 'expedientes')
const CARPETA_OPERATIVOS = path.join(__dirname, 'data', 'operativos')

const PERMISOS_POR_ROL = {
  Comandante: 7,
  Oficial: 6,
  Analista: 4,
}

function tienePermiso(rol, accion) {
  const permisos = PERMISOS_POR_ROL[rol] || 0
  return (permisos & accion) === accion
}

app.use(cors())
app.use(express.json())

app.get('/', (req, res) => {
  res.send('Servidor SIGO-GN activo')
})

app.get('/expedientes', (req, res) => {
  const archivos = fs.readdirSync(CARPETA_EXPEDIENTES)
  const expedientes = archivos
    .filter((archivo) => archivo.endsWith('.json'))
    .map((archivo) => {
      const contenido = fs.readFileSync(
        path.join(CARPETA_EXPEDIENTES, archivo),
        'utf8'
      )
      return JSON.parse(contenido)
    })

  res.json(expedientes)
})

app.post('/expedientes', (req, res) => {
  const {
    folio,
    nombre,
    tipo,
    zona,
    fecha,
    descripcion,
    estatus,
    prioridad,
  } = req.body

  if (!/^EXP-0289-\d{3}$/.test(folio || '')) {
    return res.status(400).json({
      error: 'El folio debe tener formato EXP-0289-###',
    })
  }

  const archivo = path.join(CARPETA_EXPEDIENTES, `${folio}.json`)

  if (fs.existsSync(archivo)) {
    return res.status(409).json({ error: 'Ese folio ya existe.' })
  }

  const ahora = new Date().toISOString()
  const expediente = {
    folio,
    nombre,
    tipo,
    zona,
    fecha,
    descripcion,
    estatus: estatus || 'Abierto',
    prioridad: prioridad || 'Media',
    fechaCreacion: ahora,
    fechaModificacion: ahora,
  }

  fs.writeFileSync(archivo, JSON.stringify(expediente, null, 2), 'utf8')
  res.status(201).json(expediente)
})

app.get('/expedientes/buscar', (req, res) => {
  const texto = (req.query.texto || '').toLowerCase()

  const archivos = fs.readdirSync(CARPETA_EXPEDIENTES)
  const expedientes = archivos
    .filter((archivo) => archivo.endsWith('.json'))
    .map((archivo) => {
      const contenido = fs.readFileSync(
        path.join(CARPETA_EXPEDIENTES, archivo),
        'utf8'
      )
      return JSON.parse(contenido)
    })
    .filter((expediente) =>
      [expediente.folio, expediente.nombre, expediente.descripcion]
        .some((campo) => (campo || '').toLowerCase().includes(texto))
    )

  res.json(expedientes)
})

app.get('/expedientes/:folio', (req, res) => {
  const { folio } = req.params

  if (!/^EXP-0289-\d{3}$/.test(folio)) {
    return res.status(400).json({ error: 'Formato de folio inválido.' })
  }

  const archivo = path.join(CARPETA_EXPEDIENTES, `${folio}.json`)

  if (!fs.existsSync(archivo)) {
    return res.status(404).json({ error: 'Expediente no encontrado.' })
  }

  const contenido = fs.readFileSync(archivo, 'utf8')
  res.json(JSON.parse(contenido))
})

app.put('/expedientes/:folio', (req, res) => {
  const { folio } = req.params

  const rol = req.get('x-rol')

  if (!tienePermiso(rol, 2)) {
    return res.status(403).json({ error: 'No tienes permiso para editar expedientes.' })
  }

  if (!/^EXP-0289-\d{3}$/.test(folio)) {
    return res.status(400).json({ error: 'Formato de folio inválido.' })
  }

  const archivo = path.join(CARPETA_EXPEDIENTES, `${folio}.json`)

  if (!fs.existsSync(archivo)) {
    return res.status(404).json({ error: 'Expediente no encontrado.' })
  }

  const actual = JSON.parse(fs.readFileSync(archivo, 'utf8'))
  const { nombre, tipo, zona, fecha, descripcion, estatus, prioridad } = req.body

  const expediente = {
    folio,
    nombre,
    tipo,
    zona,
    fecha,
    descripcion,
    estatus: estatus || actual.estatus || 'Abierto',
    prioridad: prioridad || actual.prioridad || 'Media',
    fechaCreacion: actual.fechaCreacion || new Date().toISOString(),
    fechaModificacion: new Date().toISOString(),
  }

  fs.writeFileSync(archivo, JSON.stringify(expediente, null, 2), 'utf8')
  res.json(expediente)
})

app.delete('/expedientes/:folio', (req, res) => {
  const { folio } = req.params

  const rol = req.get('x-rol')

  if (!tienePermiso(rol, 1)) {
    return res.status(403).json({ error: 'No tienes permiso para eliminar expedientes.' })
  }

  if (!/^EXP-0289-\d{3}$/.test(folio)) {
    return res.status(400).json({ error: 'Formato de folio inválido.' })
  }

  const archivo = path.join(CARPETA_EXPEDIENTES, `${folio}.json`)

  if (!fs.existsSync(archivo)) {
    return res.status(404).json({ error: 'Expediente no encontrado.' })
  }

  fs.unlinkSync(archivo)
  res.json({ mensaje: `Expediente ${folio} eliminado.` })
})

  app.get('/operativos', (req, res) => {
  const archivos = fs.readdirSync(CARPETA_OPERATIVOS)

  const operativos = archivos
    .filter((archivo) => archivo.endsWith('.json'))
    .map((archivo) => {
      const contenido = fs.readFileSync(
        path.join(CARPETA_OPERATIVOS, archivo),
        'utf8'
      )
      return JSON.parse(contenido)
    })

  res.json(operativos)
})

app.post('/operativos', (req, res) => {
  const { clave, nombre, tipoOperativo, unidadAsignada, prioridad } = req.body

  if (!/^OP-0289-\d{3}$/.test(clave || '')) {
    return res.status(400).json({
      error: 'La clave debe tener formato OP-0289-###',
    })
  }

  const archivo = path.join(CARPETA_OPERATIVOS, `${clave}.json`)

  if (fs.existsSync(archivo)) {
    return res.status(409).json({ error: 'Esa clave ya existe.' })
  }

  const operativo = {
    clave,
    nombre,
    tipoOperativo,
    unidadAsignada,
    estado: 'Nuevo',
    prioridad: prioridad || 'Media',
    fechaCambioEstado: new Date().toISOString(),
  }

  fs.writeFileSync(archivo, JSON.stringify(operativo, null, 2), 'utf8')
  res.status(201).json(operativo)
})

  app.get('/operativos/:clave', (req, res) => {
  const { clave } = req.params

  if (!/^OP-0289-\d{3}$/.test(clave)) {
    return res.status(400).json({ error: 'Formato de clave inválido.' })
  }

  const archivo = path.join(CARPETA_OPERATIVOS, `${clave}.json`)

  if (!fs.existsSync(archivo)) {
    return res.status(404).json({ error: 'Operativo no encontrado.' })
  }

  const contenido = fs.readFileSync(archivo, 'utf8')
  res.json(JSON.parse(contenido))
})

app.put('/operativos/:clave', (req, res) => {
  const { clave } = req.params

  if (!/^OP-0289-\d{3}$/.test(clave)) {
    return res.status(400).json({ error: 'Formato de clave inválido.' })
  }

  const archivo = path.join(CARPETA_OPERATIVOS, `${clave}.json`)

  if (!fs.existsSync(archivo)) {
    return res.status(404).json({ error: 'Operativo no encontrado.' })
  }

  const actual = JSON.parse(fs.readFileSync(archivo, 'utf8'))
  const { nombre, tipoOperativo, unidadAsignada, prioridad } = req.body

  const operativo = {
    clave,
    nombre: nombre ?? actual.nombre,
    tipoOperativo: tipoOperativo ?? actual.tipoOperativo,
    unidadAsignada: unidadAsignada ?? actual.unidadAsignada,
    estado: actual.estado,
    prioridad: prioridad ?? actual.prioridad,
    fechaCambioEstado: actual.fechaCambioEstado,
  }

  fs.writeFileSync(archivo, JSON.stringify(operativo, null, 2), 'utf8')
  res.json(operativo)
})

app.delete('/operativos/:clave', (req, res) => {
  const { clave } = req.params

  if (!/^OP-0289-\d{3}$/.test(clave)) {
    return res.status(400).json({ error: 'Formato de clave inválido.' })
  }

  const archivo = path.join(CARPETA_OPERATIVOS, `${clave}.json`)

  if (!fs.existsSync(archivo)) {
    return res.status(404).json({ error: 'Operativo no encontrado.' })
  }

  fs.unlinkSync(archivo)
  res.json({ mensaje: `Operativo ${clave} eliminado.` })
})



app.listen(PUERTO, () => {
  console.log(`Servidor escuchando en http://localhost:${PUERTO}`)
})