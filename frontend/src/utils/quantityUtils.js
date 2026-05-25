export function calculateQuantityTotal(rows) {
  return (rows || []).reduce((sum, row) => sum + (Number(row.quantity) || 0), 0);
}

export function formatQuantityTotal(total) {
  return total.toLocaleString('en-IN');
}
