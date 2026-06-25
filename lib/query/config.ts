/** Data is fresh for 5 min — tab switches won't refetch during this window. */
export const STALE_TIME_MS = 5 * 60 * 1000;

/** Keep unused cache entries for 30 min after the last subscriber unmounts. */
export const GC_TIME_MS = 30 * 60 * 1000;
