import jwt from 'jsonwebtoken';

export function sanitizeUser(user) {
  const { password: _password, ...safeUser } = user;
  return safeUser;
}

export function signAuthToken(user) {
  if (!process.env.JWT_SECRET) {
    const error = new Error('JWT_SECRET is not configured');
    error.status = 500;
    throw error;
  }

  return jwt.sign({ id: user.id, role: user.role }, process.env.JWT_SECRET, { expiresIn: '7d' });
}

export function buildAuthResponse(user) {
  return {
    token: signAuthToken(user),
    user: sanitizeUser(user),
  };
}
