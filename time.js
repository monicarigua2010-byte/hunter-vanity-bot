const { DateTime } = require("luxon");

function now(tz) {
  return DateTime.now().setZone(tz);
}

// ISO week: Monday is the first day.
// The key is stable for the entire week in the configured timezone.
function periodKey(tz) {
  return now(tz).startOf("week").toFormat("yyyy-LL-dd");
}

function dateKey(tz) {
  return now(tz).toFormat("yyyy-LL-dd");
}

function isReminderTime(config) {
  const t = now(config.timezone);
  const [hour, minute] = config.reminder_time.split(":").map(Number);
  return t.hour === hour && t.minute === minute;
}

function formatPeriod(config) {
  const start = now(config.timezone).startOf("week");
  const end = start.plus({ days: 6 }).endOf("day");
  return `${start.toFormat("MMM d")} – ${end.toFormat("MMM d, yyyy")} (${config.timezone})`;
}

module.exports = { now, periodKey, dateKey, isReminderTime, formatPeriod };
