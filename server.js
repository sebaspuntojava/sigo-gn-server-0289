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