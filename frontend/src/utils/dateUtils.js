import { format } from 'date-fns';

export function formatSheetDate(date) {
  if (!date) return '';
  return format(new Date(date), 'dd MMM yyyy');
}

export function formatInputDate(date) {
  if (!date) return '';
  const d = new Date(date);
  const year = d.getFullYear();
  const month = String(d.getMonth() + 1).padStart(2, '0');
  const day = String(d.getDate()).padStart(2, '0');
  return `${year}-${month}-${day}`;
}

export function parseInputDate(value) {
  if (!value) return new Date();
  return new Date(value + 'T00:00:00');
}
