const IntlFormatter = new Intl.NumberFormat('ru-RU', {
  style: 'currency',
  currency: 'RUB',
  maximumFractionDigits: 2,
});

export function formatCurrency(value: number): string {
  return IntlFormatter.format(value);
}
