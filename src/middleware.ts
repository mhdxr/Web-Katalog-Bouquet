import type { NextRequest } from "next/server";
import { updateSupabaseSession } from "@/lib/supabase/proxy";

/**
 * Edge middleware untuk merefresh session Supabase di setiap request
 * yang relevan. Ini wajib supaya cookie auth (`sb-*`) tetap valid dan
 * Server Components / Server Actions bisa membaca user.
 */
export async function middleware(request: NextRequest) {
  return updateSupabaseSession(request);
}

export const config = {
  // Skip aset statis & file image — middleware tidak perlu sentuh itu.
  matcher: [
    "/((?!_next/static|_next/image|favicon.ico|images|.*\\.(?:svg|png|jpg|jpeg|gif|webp|ico)$).*)",
  ],
};
