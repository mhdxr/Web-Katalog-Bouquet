"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { Lock, Loader2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { loginSchema, type LoginSchema } from "@/lib/validations";
import { createSupabaseBrowserClient } from "@/lib/supabase/client";
import { siteConfig } from "@/config/site";

export function LoginForm() {
  const router = useRouter();
  const [error, setError] = useState<string | null>(null);

  const {
    register,
    handleSubmit,
    formState: { errors, isSubmitting },
  } = useForm<LoginSchema>({
    resolver: zodResolver(loginSchema),
    defaultValues: { email: "", password: "" },
  });

  const onSubmit = async (data: LoginSchema) => {
    setError(null);
    try {
      const supabase = createSupabaseBrowserClient();
      const { data: signInData, error: signInError } =
        await supabase.auth.signInWithPassword({
          email: data.email.trim(),
          password: data.password,
        });

      if (signInError || !signInData.user) {
        setError(signInError?.message ?? "Email atau password salah.");
        return;
      }

      // Validasi tambahan: user harus terdaftar di tabel admin_users.
      // Kalau bukan admin, langsung sign-out supaya cookie tidak nyangkut.
      const { data: adminRow, error: adminError } = await supabase
        .from("admin_users")
        .select("user_id")
        .eq("user_id", signInData.user.id)
        .maybeSingle();

      if (adminError || !adminRow) {
        await supabase.auth.signOut();
        setError(
          "Akun ini belum terdaftar sebagai admin. Hubungi pemilik toko untuk akses.",
        );
        return;
      }

      router.replace("/admin/dashboard");
      router.refresh();
    } catch (e) {
      const msg = e instanceof Error ? e.message : "Terjadi kesalahan.";
      setError(msg);
    }
  };

  return (
    <form
      onSubmit={handleSubmit(onSubmit)}
      className="space-y-5 rounded-2xl border border-border/60 bg-white p-8 shadow-sm"
    >
      <div className="flex items-center gap-3">
        <span className="flex h-10 w-10 items-center justify-center rounded-xl bg-primary/10 text-primary">
          <Lock className="h-5 w-5" />
        </span>
        <div>
          <h1 className="font-serif text-xl font-semibold">Admin Login</h1>
          <p className="text-xs text-muted-foreground">
            Masuk untuk mengelola produk {siteConfig.displayName}.
          </p>
        </div>
      </div>

      <div className="space-y-2">
        <Label htmlFor="email">Email</Label>
        <Input
          id="email"
          type="email"
          placeholder={siteConfig.adminEmailPlaceholder}
          autoComplete="email"
          {...register("email")}
        />
        {errors.email && (
          <p className="text-xs text-destructive">{errors.email.message}</p>
        )}
      </div>

      <div className="space-y-2">
        <Label htmlFor="password">Password</Label>
        <Input
          id="password"
          type="password"
          placeholder="••••••••"
          autoComplete="current-password"
          {...register("password")}
        />
        {errors.password && (
          <p className="text-xs text-destructive">{errors.password.message}</p>
        )}
      </div>

      {error && (
        <p className="rounded-xl bg-destructive/10 p-3 text-center text-xs text-destructive">
          {error}
        </p>
      )}

      <Button type="submit" className="w-full" disabled={isSubmitting}>
        {isSubmitting && <Loader2 className="h-4 w-4 animate-spin" />}
        Masuk
      </Button>

      <p className="text-center text-xs text-muted-foreground">
        Akun admin diatur lewat Supabase Auth + tabel{" "}
        <code className="rounded bg-secondary px-1.5 py-0.5">admin_users</code>.
      </p>
    </form>
  );
}
