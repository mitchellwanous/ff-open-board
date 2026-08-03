import type { ReactNode } from "react";

/** Legacy /preview URLs — mockups only; main app lives at /. */
export default function PreviewLayout({ children }: { children: ReactNode }) {
  return children;
}
