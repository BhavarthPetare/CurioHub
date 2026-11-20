import jwt from 'jsonwebtoken';

export default function (req, res, next) {
  const header = req.header('Authorization');
  if (!header) return res.status(401).json({ message: 'Auth Error: No token' });

  try {
    const decoded = jwt.verify(header.replace(/^Bearer\s+/i, ''), process.env.JWT_SECRET);
    req.user = decoded.user;
    next();
  } catch (e) {
    res.status(401).json({ message: 'Invalid Token' });
  }
};
