export function generateOrderNumber(): string {
  const random = Math.floor(10000 + Math.random() * 89999);
  return `JS-${random}`;
}
