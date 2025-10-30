import { type EmailOtpType } from "@supabase/supabase-js";
import { NextResponse, type NextRequest } from "next/server";
import { createClient } from "@/lib/supabase/server";

export async function GET(request: NextRequest) {
    const { searchParams } = new URL(request.url);
    const token_hash = searchParams.get("token_hash");
    const type = searchParams.get("type") as EmailOtpType | null;
    const next = searchParams.get("next") ?? "/";

    if (!token_hash || !type) {
        return NextResponse.redirect(new URL("/error", request.url));
    }

    // Create Supabase client bound to the request/response lifecycle
    const supabase = await createClient();

    // Handle signup and magiclink flows
    if (type === "signup" || type === "magiclink") {
        const { error } = await supabase.auth.verifyOtp({ type, token_hash });
        if (!error) {
            const redirectUrl = type === "signup" ? "/solo-queue" : next;
            return NextResponse.redirect(new URL(redirectUrl, request.url));
        }
    }

    // Handle recovery (password reset)
    if (type === "recovery") {
        const { data, error } = await supabase.auth.verifyOtp({
            type: "recovery",
            token_hash,
        });

        if (error) {
            console.error("Error verifying recovery OTP:", error.message);
            return NextResponse.redirect(new URL("/error", request.url));
        }

        const { session } = data;

        if (session) {
            // Redirect to reset-password with token_hash and next
            const response = NextResponse.redirect(
                new URL(
                    `/reset-password?access_token=${session.access_token}&refresh_token=${session.refresh_token}&token_hash=${encodeURIComponent(token_hash)}&next=${encodeURIComponent(next)}`,
                    request.url,
                ),
            );

            // 🔹 Attach Supabase session cookies manually
            response.cookies.set({
                name: "sb-access-token",
                value: session.access_token,
                path: "/",
                httpOnly: true,
                secure: process.env.NODE_ENV === "production", // false for localhost
                sameSite: "lax",
            });

            response.cookies.set({
                name: "sb-refresh-token",
                value: session.refresh_token,
                path: "/",
                httpOnly: true,
                secure: process.env.NODE_ENV === "production", // false for localhost
                sameSite: "lax",
            });

            return response;
        }
    }

    // Fallback for invalid type
    return NextResponse.redirect(new URL("/error", request.url));
}
