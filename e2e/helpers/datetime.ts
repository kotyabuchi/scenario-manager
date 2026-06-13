/** 翌週の datetime-local 形式文字列を生成 */
export function getNextWeekDateTimeLocal(
  dayOffset: number,
  hour: number,
  minute: number,
): string {
  const date = new Date();
  date.setDate(date.getDate() + 7 + dayOffset);

  const year = date.getFullYear();
  const month = String(date.getMonth() + 1).padStart(2, '0');
  const day = String(date.getDate()).padStart(2, '0');
  const h = String(hour).padStart(2, '0');
  const m = String(minute).padStart(2, '0');

  return `${year}-${month}-${day}T${h}:${m}`;
}
