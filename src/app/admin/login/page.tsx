import { redirect } from "next/navigation";
import { LoginForm } from "@/components/admin/login-form";
import { getAdminUser } from "@/lib/auth";

export const metadata = {
  title: "Admin Login",
  robots: { index: false, follow: false },
};

// Selalu render dinamis — kita perlu cek sesi terbaru per request.
export const dynamic = "force-dynamic";

export default async function AdminLoginPage() {
  // Kalau user yang request sudah login & terdaftar sebagai admin,
  // langsung lempar ke dashboard. Kalau belum, render form login.
  const admin = await getAdminUser();
  if (admin) {
    redirect("/admin/dashboard");
  }

  return (
    <div className="container flex min-h-[70vh] max-w-md items-center py-10">
      <div className="w-full">
        <LoginForm />
      </div>
    </div>
  );
}
