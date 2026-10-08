/**
 * Guest favourites ordering, shared by the public homepage and the admin
 * panel so both agree on what the list is and what order it is in.
 *
 * Kept free of imports so `npm run check` can exercise it directly.
 */

/** Featured dishes, in the order the homepage shows them. */
export function favouritesOf<T extends { is_featured: boolean; featured_order?: number }>(
  items: T[]
): T[] {
  return items
    .filter((i) => i.is_featured)
    // Equal positions keep menu order — Array.sort is stable.
    .sort((a, b) => (a.featured_order ?? 0) - (b.featured_order ?? 0));
}

/** Move one entry by one slot. Returns the list untouched when it cannot move. */
export function moveBy<T>(list: T[], index: number, delta: number): T[] {
  const to = index + delta;
  if (index < 0 || index >= list.length || to < 0 || to >= list.length) return list;
  const next = [...list];
  [next[index], next[to]] = [next[to], next[index]];
  return next;
}
