function daysInMonth(iMonth, iYear) {
  return 32 - new Date(iYear, iMonth, 32).getDate();
}
function isWeekday(year, month, day) {
  var day = new Date(year, month, day).getDay();
  return day != 0;
}
function getWeekdaysInMonth(month, year) {
  var days = daysInMonth(month, year);
  var weekdays = 0;
  for (var i = 0; i < days; i++) {
    if (isWeekday(year, month, i + 1)) weekdays++;
  }
  return weekdays;
}
module.exports = { getWeekdaysInMonth };
