const express = require('express')
const cors = require('cors')
const fs = require('fs')
const path = require('path')

const app = express()
const PUERTO = 4000
const CARPETA_EXPEDIENTES = path.join(__dirname, 'data', 'expedientes')

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
  const { folio, nombre, tipo, zona, fecha, descripcion } = req.body

  if (!/^EXP-0289-\d{3}$/.test(folio || '')) {
    return res.status(400).json({
      error: 'El folio debe tener formato EXP-0289-###',
    })
  }

  const archivo = path.join(CARPETA_EXPEDIENTES, `${folio}.json`)

  if (fs.existsSync(archivo)) {
    return res.status(409).json({ error: 'Ese folio ya existe.' })
  }

  const expediente = { folio, nombre, tipo, zona, fecha, descripcion }
  fs.writeFileSync(archivo, JSON.stringify(expediente, null, 2), 'utf8')

  res.status(201).json(expediente)
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

  if (!/^EXP-0289-\d{3}$/.test(folio)) {
    return res.status(400).json({ error: 'Formato de folio inválido.' })
  }

  const archivo = path.join(CARPETA_EXPEDIENTES, `${folio}.json`)

  if (!fs.existsSync(archivo)) {
    return res.status(404).json({ error: 'Expediente no encontrado.' })
  }

  const { nombre, tipo, zona, fecha, descripcion } = req.body
  const expediente = { folio, nombre, tipo, zona, fecha, descripcion }

  fs.writeFileSync(archivo, JSON.stringify(expediente, null, 2), 'utf8')
  res.json(expediente)
})

app.delete('/expedientes/:folio', (req, res) => {
  const { folio } = req.params

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

app.listen(PUERTO, () => {
  console.log(`Servidor escuchando en http://localhost:${PUERTO}`)
})