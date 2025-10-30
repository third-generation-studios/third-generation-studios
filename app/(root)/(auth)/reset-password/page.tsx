"use client";

import { useEffect, useState } from "react";
import { useSearchParams } from "next/navigation";
import ResetPasswordForm from "@/components/auth/reset-password-form";
import { supabase } from "@/lib/supabase/client";
export default function ResetPasswordPage() {
    const searchParams = useSearchParams();
    const [loading, setLoading] = useState(true);
    const [tokenValid, setTokenValid] = useState(false);
    const [sessionExists, setSessionExists] = useState(false);

    useEffect(() => {
        const verifySession = async () => {
            const token_hash = searchParams.get("token_hash");
            const access_token = searchParams.get("access_token");
            const refresh_token = searchParams.get("refresh_token");

            if (!token_hash || !access_token || !refresh_token) {
                console.warn("Missing token in URL — invalid or expired link");
                setTokenValid(false);
                setLoading(false);
                return;
            }

            // ✅ Set the session using the tokens from URL
            const { error } = await supabase.auth.setSession({
                access_token,
                refresh_token,
            });

            // ✅ Check if the Supabase session cookie exists
            const {
                data: { session },
            } = await supabase.auth.getSession();

            if (session) {
                console.log("Supabase session found for reset:", session.user.email);
                setSessionExists(true);
                setTokenValid(true);
            } else {
                console.warn("No Supabase session found — user may need to restart reset flow", error);
                setTokenValid(false);
            }

            setLoading(false);
        };

        verifySession();
    }, [searchParams]);

    if (loading) return <div className="text-center mt-20">Verifying reset link...</div>;

    if (!tokenValid || !sessionExists) {
        return <div className="text-center mt-20">Invalid or expired link. Please request a new password reset.</div>;
    }

    return <ResetPasswordForm />;
}
