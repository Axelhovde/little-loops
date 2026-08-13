export function formatSize(size: string): string {
  const match = size.match(/^(\d+)"$/);
  if (match) {
    const cm = Math.round(Number(match[1]) * 2.54);
    return `${size} / ${cm} cm`;
  }
  return size;
}
