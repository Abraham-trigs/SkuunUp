// components/common/FooterWrapper.tsx
// Purpose: Conditionally renders the global footer, hidden on dashboard routes.

"use client";

import { usePathname } from "next/navigation";
import SchoolFooter from "./SchoolFooter.tsx";

export default function FooterWrapper() {
  const pathname = usePathname();
  const hideFooter = pathname.startsWith("/dashboard");
  if (hideFooter) return null;

  return <SchoolFooter />;
}
