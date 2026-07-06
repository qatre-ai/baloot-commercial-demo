// Simple password hashing for SQLite setup
// In production, use bcrypt or argon2

const encoder = new TextEncoder();

export async function hashPassword(password: string): Promise<string> {
  const data = encoder.encode(password + "-mab-salt-2024");
  const hashBuffer = await crypto.subtle.digest("SHA-256", data);
  const hashArray = Array.from(new Uint8Array(hashBuffer));
  return hashArray.map(b => b.toString(16).padStart(2, "0")).join("");
}

export async function verifyPassword(password: string, hash: string): Promise<boolean> {
  const computedHash = await hashPassword(password);
  return computedHash === hash;
}
