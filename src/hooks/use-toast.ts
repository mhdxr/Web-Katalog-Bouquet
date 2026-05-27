"use client";

import { toast as sonnerToast } from "sonner";

/**
 * Wrapper tipis di atas `sonner` agar call-site lama tetap kompatibel.
 *
 * API yang dijaga supaya tidak breaking change:
 *   toast.success(message)
 *   toast.error(message)
 *   toast.info(message)
 *   toast.push(message, variant?)
 *
 * Implementasi sebenarnya delegasi penuh ke sonner — animasi, stacking,
 * dan auto-dismiss di-handle oleh komponen `<Toaster />` global di
 * `src/app/layout.tsx`.
 */

export type ToastVariant = "success" | "error" | "info";

export const toast = {
  success(message: string) {
    sonnerToast.success(message);
  },
  error(message: string) {
    sonnerToast.error(message);
  },
  info(message: string) {
    sonnerToast(message);
  },
  push(message: string, variant: ToastVariant = "info") {
    if (variant === "success") sonnerToast.success(message);
    else if (variant === "error") sonnerToast.error(message);
    else sonnerToast(message);
  },
};
