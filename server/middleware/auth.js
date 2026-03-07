import jwt from 'jsonwebtoken';

export default function (req, res, next) {
  const token = req.header('Authorization');
  if (!token) return res.status(401).json({ message: 'Auth Error: No token' });

  try {
    const decoded = jwt.verify(token.replace('Bearer ', ''), process.env.JWT_SECRET);
    req.user = decoded.user;
    next();
  } catch (e) {
    res.status(500).send({ message: 'Invalid Token' });
  }
};
