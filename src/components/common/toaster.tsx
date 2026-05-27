"use client";

import { Toaster as SonnerToaster } from "sonner";

/**
 * Toaster premium berbasis `sonner`.
 *
 * Kenapa sonner?
 *  - Animation halus, stack rapi, di-dismiss otomatis dengan timer adaptif.
 *  - Dukungan posisi & rich colors yang konsisten lintas device.
 *  - Bundle sangat kecil (~6KB gzipped) — tidak menambah berat halaman.
 *
 * Kita tetap mengekspos API `toast` lama (`toast.success`, `toast.error`,
 * `toast.info`) lewat wrapper di `src/hooks/use-toast.ts` supaya call-site
 * lama (admin dashboard, custom-order, dll.) tidak perlu diubah.
 */
export function Toaster() {
  return (
    <SonnerToaster
      position="bottom-right"
      richColors
      closeButton
      theme="light"
      duration={3500}
      offset={16}
      toastOptions={{
        classNames: {
          toast:
            "group rounded-2xl border border-border/60 shadow-md font-sans !text-sm",
          title: "font-medium",
          description: "text-muted-foreground",
        },
      }}
    />
  );
}
