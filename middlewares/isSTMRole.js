module.exports = async (req, res, next) => {
  if (req.user.roles.includes("stm")) {
    next();
  }
  res.status(403).json({ message: "Access denied" });
};
