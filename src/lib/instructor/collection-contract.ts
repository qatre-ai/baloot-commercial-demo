export function uniqueById<T extends { id: string }>(items: T[]): T[] {
  const seen = new Set<string>();
  return items.filter((item) => {
    const id = item.id.trim();
    if (!id || seen.has(id)) return false;
    seen.add(id);
    return true;
  });
}
