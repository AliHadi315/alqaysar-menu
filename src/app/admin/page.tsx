import type { Metadata } from "next";
import { AdminApp } from "@/components/admin/AdminApp";

// Not linked from anywhere on the site, and kept out of search results.
// The sign-in and the database rules are what actually protect it.
export const metadata: Metadata = {
  title: "Admin",
  robots: { index: false, follow: false, nocache: true },
};

export default function AdminPage() {
  return <AdminApp />;
}
