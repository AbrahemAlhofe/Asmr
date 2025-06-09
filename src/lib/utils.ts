export function formatSecondsToTimestamp(totalSeconds: number): string {
  const hours = Math.floor(totalSeconds / 3600);
  const minutes = Math.floor((totalSeconds % 3600) / 60);
  const seconds = Math.floor(totalSeconds % 60);

  const padded = (num: number) => String(num).padStart(2, '0');

  if (hours > 0) {
    return `${padded(hours)}:${padded(minutes)}:${padded(seconds)}`;
  } else {
    return `${padded(minutes)}:${padded(seconds)}`;
  }
}