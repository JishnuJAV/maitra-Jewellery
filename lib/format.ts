export function formatINR(amount: number) {
  return '₹' + amount.toLocaleString('en-IN');
}
