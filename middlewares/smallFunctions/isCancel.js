module.exports = function isCancel(msg) {
  if (msg === "🚫Bekor qilish" || msg === "🚫Бекор қилиш") {
    return true;
  } else {
    return false;
  }
};
