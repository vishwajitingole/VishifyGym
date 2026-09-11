import jwt from 'jsonwebtoken';

const SECRET = process.env.JWT_SECRET || 'vishify-gym-secret-change-me';

export function signToken(user) {
  return jwt.sign({ sub: user._id, name: user.name }, SECRET);
}

export function requireAuth(req, res, next) {
  const header = req.headers.authorization;
  if (!header || !header.startsWith('Bearer ')) return res.status(401).json({ message: 'Authentication required.' });
  try {
    const decoded = jwt.verify(header.split(' ')[1], SECRET);
    req.userId = decoded.sub;
    next();
  } catch {
    return res.status(401).json({ message: 'Invalid or expired token.' });
  }
}