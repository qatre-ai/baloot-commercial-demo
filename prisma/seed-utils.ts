// Simple hash function that matches the auth/password.ts implementation
const encoder = new TextEncoder();

export async function hash(password: string): Promise<string> {
  const data = encoder.encode(password + "-mab-salt-2024");
  const hashBuffer = await crypto.subtle.digest("SHA-256", data);
  const hashArray = Array.from(new Uint8Array(hashBuffer));
  return hashArray.map(b => b.toString(16).padStart(2, "0")).join("");
}
