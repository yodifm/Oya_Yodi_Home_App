import type { Paginated } from '../types'

/**
 * If the current page runs out of rows (its last rows were deleted, or moved
 * to another tab), step back to the last page that still exists instead of
 * leaving an empty list with no pager to get back.
 *
 * Called during render: React's documented pattern for correcting state from
 * new data, which avoids a flash of the empty page that an effect would cause.
 */
export function useStepBackWhenEmpty(
  data: Paginated<unknown> | undefined,
  loading: boolean,
  page: number,
  setPage: (page: number) => void,
) {
  // Only act on data that belongs to this page: until the new page loads, the
  // previous (empty) response is still around and must not trigger again.
  if (data && !loading && page > 1 && data.meta.current_page === page && data.data.length === 0) {
    setPage(Math.max(1, data.meta.last_page))
  }
}
