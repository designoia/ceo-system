import { useEffect, useRef } from 'react';
import { usePathname } from 'next/navigation';

/**
 * Force-closes an overlay whenever the route changes. Required for any
 * modal/sheet mounted at the layout level (survives page navigation) —
 * without this, a backdrop left open by a missed close call permanently
 * blocks the entire app since it sits above the bottom nav (z-50/60 vs
 * nav's z-40), while looking like nothing happened because dark-on-dark
 * translucent backdrops are easy to miss.
 *
 * Pass `isOpen` + the setter that closes it. No-ops on the initial render
 * so mount doesn't immediately fire close.
 */
export function useCloseOnRouteChange(isOpen: boolean, close: () => void) {
  const pathname = usePathname();
  const prevPathname = useRef(pathname);

  useEffect(() => {
    if (prevPathname.current !== pathname) {
      prevPathname.current = pathname;
      if (isOpen) close();
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [pathname]);
}
