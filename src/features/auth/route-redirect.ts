export const DEFAULT_ADMIN_ROUTE = '/admin/ingredients';

export function getAdminReturnTo(locationState: unknown): string {
  if (
    typeof locationState !== 'object' ||
    locationState === null ||
    !('from' in locationState)
  ) {
    return DEFAULT_ADMIN_ROUTE;
  }

  const from = locationState.from;
  if (
    typeof from !== 'string' ||
    !(from === '/admin' || from.startsWith('/admin/')) ||
    from.startsWith('//') ||
    from.includes('\\')
  ) {
    return DEFAULT_ADMIN_ROUTE;
  }

  return from;
}
