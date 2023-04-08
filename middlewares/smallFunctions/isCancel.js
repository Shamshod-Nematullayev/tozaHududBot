module.exports = function isCancel(msg) {
  if (msg === "🚫Bekor qilish") {
    return true;
  } else {
    return false;
  }
};
