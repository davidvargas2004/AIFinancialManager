export function normalizeAIMovement(registro) {
  return {
    ...registro,
    monto: Number(registro.monto),
    fecha: registro.ocurridoEn,
    categoria: registro.categoria || 'Sin categoría',
  }
}