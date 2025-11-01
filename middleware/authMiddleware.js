import jwt from "jsonwebtoken";

export const verifyToken = (req, res, next) => {
  const authHeader = req.headers.authorization;

  if (!authHeader) {
    console.log("🚫 No Authorization header");
    return res.status(401).json({ message: "No token provided" });
  }

  const token = authHeader.split(" ")[1];
  if (!token) {
    console.log("🚫 Token format invalid");
    return res.status(401).json({ message: "Invalid token format" });
  }

  try {
    const decoded = jwt.verify(token, process.env.JWT_SECRET);
    console.log("✅ Decoded token:", decoded);

    // Ensure the userId gets attached correctly
    req.user = {
      userId: decoded.userId || decoded.id || decoded._id,
      email: decoded.email
    };

    if (!req.user.userId) {
      console.log("❌ No userId found in token");
      return res.status(400).json({ message: "Invalid token payload" });
    }

    next();
  } catch (err) {
    console.error("JWT Error:", err.message);
    return res.status(401).json({ message: "Invalid token" });
  }
};
