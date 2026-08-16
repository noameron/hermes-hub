const ilsFormatter = new Intl.NumberFormat("en-IL", {
  style: "currency",
  currency: "ILS",
  minimumFractionDigits: 0,
  maximumFractionDigits: 2,
});

export function formatCurrencyFromAgorot(amountAgorot: number) {
  return ilsFormatter.format(amountAgorot / 100);
}
