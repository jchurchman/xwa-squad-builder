/** A card name with its cost, e.g. "Chewbacca (4)". */
export function withPoints(name: string, points: number | undefined): string {
  return points === undefined ? name : `${name} (${points})`;
}

/** A list's pilot points against its maximum, e.g. "14 / 20 points". */
export function listPointsLabel(total: number, max: number): string {
  return `${total} / ${max} points`;
}
