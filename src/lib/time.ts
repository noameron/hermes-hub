const dayInMs = 24 * 60 * 60 * 1000;

export function startOfDay(date: Date) {
  return new Date(date.getFullYear(), date.getMonth(), date.getDate());
}

export function addDays(date: Date, days: number) {
  return new Date(date.getTime() + days * dayInMs);
}

export function startOfWeek(date: Date) {
  const start = startOfDay(date);
  const day = start.getDay();
  return addDays(start, -day);
}

export function startOfPreviousWeek(date: Date) {
  return addDays(startOfWeek(date), -7);
}

export function toIsoDate(date: Date) {
  return date.toISOString();
}

export function daysBetween(start: Date, end: Date) {
  return Math.round((startOfDay(end).getTime() - startOfDay(start).getTime()) / dayInMs);
}
