module.exports = async (req, res, next) => {
  if (req.user.roles.includes("stm")) {
    return next();
  }
  return res.status(403).json({
    error: "Access denied",
    message: "Sizning ushbu amaliyotni bajarish uchun huquqingiz yo'q",
  });
};
