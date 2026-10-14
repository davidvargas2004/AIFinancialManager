export function parseMoney(value) {
  if (typeof value === 'number') return value

  const normalized = String(value || '')
    .replace(/\./g, '')
    .replace(',', '.')

  return Number(normalized)
}

export function formatMoneyInput(value) {
  const source = String(value ?? '').replace(/[^\d,]/g, '')
  if (!source) return ''

  const [integerPart, decimalPart] = source.split(',')
  const formattedInteger = integerPart.replace(/^0+(?=\d)/, '').replace(/\B(?=(\d{3})+(?!\d))/g, '.')
  return decimalPart === undefined
    ? formattedInteger
    : `${formattedInteger || '0'},${decimalPart.slice(0, 2)}`
}
