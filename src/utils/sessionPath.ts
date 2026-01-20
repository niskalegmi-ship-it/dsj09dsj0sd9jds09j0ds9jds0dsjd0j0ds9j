// Generate a random session path (8-12 characters, alphanumeric)
export const generateSessionPath = (): string => {
  const chars = 'abcdefghijklmnopqrstuvwxyz0123456789';
  const length = 8 + Math.floor(Math.random() * 5); // 8-12 characters
  let result = '';
  for (let i = 0; i < length; i++) {
    result += chars.charAt(Math.floor(Math.random() * chars.length));
  }
  return result;
};

// Validate session path format
export const isValidSessionPath = (path: string): boolean => {
  const p = path.toLowerCase();

  // Never allow admin routes to be treated as session paths
  if (p === "admin" || p === "batshoulista") return false;

  return /^[a-z0-9]{8,12}$/.test(p);
};
