export const MONTHS = [
  'Январь', 'Февраль', 'Март', 'Апрель', 'Май', 'Июнь',
  'Июль', 'Август', 'Сентябрь', 'Октябрь', 'Ноябрь', 'Декабрь',
];
export const MONTHS_SHORT = ['Янв', 'Фев', 'Мар', 'Апр', 'Май', 'Июн', 'Июл', 'Авг', 'Сен', 'Окт', 'Ноя', 'Дек'];

export function fmt(n: number): string {
  return '₸' + Math.round(n).toLocaleString('ru-RU');
}

export function fmtShort(n: number): string {
  if (n >= 1e6) return '₸' + (n / 1e6).toFixed(1) + 'M';
  if (n >= 1e3) return '₸' + Math.round(n / 1e3) + 'K';
  return '₸' + Math.round(n);
}

export function monthLabel(month: number, year: number): string {
  return `${MONTHS[month]} ${year}`;
}

export function avatarColorFor(id: string): string {
  const palette = ['#a78bfa', '#4ade80', '#38bdf8', '#f97316', '#f472b6', '#facc15'];
  let hash = 0;
  for (let i = 0; i < id.length; i++) hash = (hash * 31 + id.charCodeAt(i)) >>> 0;
  return palette[hash % palette.length];
}
