"use client";

import { useEffect, useState, type RefObject } from "react";

const ROW_HEIGHT_PX = 68;
const RESERVED_BELOW_LIST_PX = 140; // pagination controls + bottom nav / spacing
const MIN_ROWS = 5;

/**
 * Sizes the transaction list page to however many rows fit between the list's
 * top and the bottom of the viewport, so pagination adapts to viewport height
 * instead of using a fixed page size.
 */
export function usePageSize(containerRef: RefObject<HTMLElement | null>): number {
  const [pageSize, setPageSize] = useState(10);

  useEffect(() => {
    function recompute() {
      const top = containerRef.current?.getBoundingClientRect().top ?? 0;
      const available = window.innerHeight - top - RESERVED_BELOW_LIST_PX;
      const rows = Math.floor(available / ROW_HEIGHT_PX);
      setPageSize(Math.max(MIN_ROWS, rows));
    }

    recompute();
    window.addEventListener("resize", recompute);
    return () => window.removeEventListener("resize", recompute);
  }, [containerRef]);

  return pageSize;
}
