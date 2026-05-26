import { redirect } from "next/navigation";
import { AdminDashboard } from "@/components/admin/admin-dashboard";
import { getAdminUser } from "@/lib/auth";

export const metadata = {
  title: "Admin Dashboard",
  robots: { index: false, follow: false },
};

// Cek session admin per request, jangan di-cache.
export const dynamic = "force-dynamic";

export default async function AdminDashboardPage() {
  // Server-side guard: hanya user yang login + terdaftar di tabel
  // `admin_users` yang boleh masuk. Kalau tidak, redirect ke login.
  // Tidak ada lagi penyimpanan session di localStorage.
  const admin = await getAdminUser();
  if (!admin) {
    redirect("/admin/login");
  }

  return <AdminDashboard adminEmail={admin.email} />;
}
