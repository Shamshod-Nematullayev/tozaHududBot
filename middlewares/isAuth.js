const jwt = require("jsonwebtoken");

module.exports = function (req, res, next) {
  return next();
  const token = req.headers.authorization?.split(" ")[1];

  if (!token) {
    return res
      .status(401)
      .json({ message: "Access Denied: No Token Provided" });
  }
  try {
    // Verify the token
    const decoded = jwt.verify(token, process.env.SECRET_JWT_KEY);
    req.user = decoded; // Add user data to request
    next();
  } catch (error) {
    return res.status(401).json({ message: "Invalid Token" });
  }
};
