function daysInMonth(iMonth, iYear) {
  return 32 - new Date(iYear, iMonth, 32).getDate();
}
export function isWeekday(year, month, day) {
  var day = new Date(year, month, day).getDay();
  return day != 0;
}
export function getWeekdaysInMonth(today, month, year) {
  var days = daysInMonth(month, year);
  var weekdays = 0;
  for (var i = 0; i < days - today; i++) {
    if (isWeekday(year, month, i + 1)) weekdays++;
  }
  return weekdays;
}
function getAllWeekdaysInMonth(month, year) {
  var days = daysInMonth(month, year);
  var weekdays = 0;
  for (var i = 0; i < days; i++) {
    if (isWeekday(year, month, i + 1)) weekdays++;
  }
  return weekdays;
}
