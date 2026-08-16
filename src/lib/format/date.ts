const shortDateFormatter = new Intl.DateTimeFormat("en-IL", {
  month: "short",
  day: "numeric",
});

const longDateFormatter = new Intl.DateTimeFormat("en-IL", {
  weekday: "short",
  month: "short",
  day: "numeric",
});

export function formatShortDate(value: string) {
  return shortDateFormatter.format(new Date(value));
}

export function formatLongDate(value: string) {
  return longDateFormatter.format(new Date(value));
}
