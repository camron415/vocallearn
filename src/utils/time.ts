/**
 * Check if a date is in the past (due for review).
 */
export function isDue(nextReviewAt: string | Date): boolean {
  const reviewDate = typeof nextReviewAt === "string" ? new Date(nextReviewAt) : nextReviewAt;
  return reviewDate <= new Date();
}

/**
 * Get the start of today (midnight).
 */
export function startOfToday(): Date {
  const now = new Date();
  now.setHours(0, 0, 0, 0);
  return now;
}
