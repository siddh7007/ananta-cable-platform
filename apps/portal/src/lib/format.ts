/**
 * Format a number as currency (USD)
 * @param amount - The amount to format (can be undefined/null)
 * @returns Formatted currency string like "$1,234.56" or "$0.00"
 */
export function formatMoney(amount?: number | null): string {
  if (amount == null || isNaN(amount)) {
    return '$0.00';
  }

  return new Intl.NumberFormat('en-US', {
    style: 'currency',
    currency: 'USD',
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  }).format(amount);
}
