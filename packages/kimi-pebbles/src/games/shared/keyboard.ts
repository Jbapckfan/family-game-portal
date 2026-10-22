/** Let focused controls receive Enter instead of treating it as a board submit. */
export function isNativeEnter(event: KeyboardEvent): boolean {
  const target = event.target as Element | null
  return event.key === 'Enter' && Boolean(target?.closest?.(
    'button,a[href],input,textarea,select,summary,[role="button"],[role="link"]',
  ))
}
