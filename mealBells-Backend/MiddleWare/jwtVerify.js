import jwt from 'jsonwebtoken';

export const ensureJwtValidation = (req, res, next) => {
  const token = req.cookies?.token;

  if (!token) {
    return res.status(403).json({ msg: "Unauthorized user error" });
  }

  try {
    const decoded = jwt.verify(token, process.env.JWT_SECRET);
    req.user = decoded;
    next();
  } catch (error) {
    return res.status(403).json({ msg: "Unauthorized user error" });
  }
};