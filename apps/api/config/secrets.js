export const JWT_SECRET = process.env.JWT_SECRET;

if (!JWT_SECRET) {
  if (process.env.NODE_ENV === 'production') {
    throw new Error('FATAL ERROR: JWT_SECRET is not defined in environment variables.');
  } else {
    console.warn('⚠️ WARNING: JWT_SECRET is not defined. Using insecure fallback for development.');
  }
}

export const getJwtSecret = () => {
    return process.env.JWT_SECRET || 'vinh-super-secret-key-2024-techstore-12345';
};
