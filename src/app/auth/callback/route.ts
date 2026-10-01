import { NextResponse, type NextRequest } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { authRedirectUrl } from "@/lib/auth-redirect";

export async function GET(request: NextRequest) {
  const { searchParams, origin } = new URL(request.url);
  const code = searchParams.get("code");
  if (code) {
    const db = await createClient(); const { error } = await db.auth.exchangeCodeForSession(code);
    if (!error) {
      const next = searchParams.get("next") || "/library";
      return NextResponse.redirect(authRedirectUrl(next, origin));
    }
  }
  return NextResponse.redirect(authRedirectUrl("/login?error=callback", origin));
}
