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

export function estimateCost({
  model,
  inputTokens,
  outputTokens,
  mode = 'non-thinking' // 'thinking' or 'non-thinking'
}: {
  model: 'gemini-2.0-flash' | 'gemini-2.5-flash-preview-05-20';
  inputTokens: number;
  outputTokens: number;
  mode?: 'thinking' | 'non-thinking';
}): number {

  if ( model === "gemini-2.5-flash-preview-05-20" ) {
    const inputRate = 0.15 / 1_000_000; // $0.15 per 1M
    const outputRate = mode === 'thinking'
      ? 3.50 / 1_000_000  // $3.50 per 1M
      : 0.60 / 1_000_000; // $0.60 per 1M
  
    const cost = (inputTokens * inputRate) + (outputTokens * outputRate);
    return parseFloat(cost.toFixed(6));
  }

  throw new Error("Unsupported model for cost estimation");

}
