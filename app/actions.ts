"use server";

import { createClient } from "@/lib/supabase/server";
import { bannedWords } from "@/lib/constants";

type ActionResult = { success?: boolean; error?: string; message?: string };

// Validation helpers - moved outside to prevent recreation on each call
const validatePassword = (password: string): string | null => {
    const passwordRegex = /^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)(?=.*[!@#$%^&*()_+\-=[\]{};':"\\|,.<>/?]).{8,}$/;

    return passwordRegex.test(password)
        ? null
        : "Password must be at least 8 characters and include a lowercase letter, uppercase letter, number, and symbol.";
};

const validateUsername = (username: string): string | null => {
    if (!username.trim()) return "Username is required";
    if (bannedWords.some((word) => username.toLowerCase().includes(word))) {
        return "Username contains inappropriate language";
    }
    return null;
};

// Database helpers for common operations
const checkUsernameUniqueness = async (username: string, supabase: any): Promise<boolean> => {
    const { data, error } = await supabase.from("profiles").select("id").eq("username", username).maybeSingle();

    if (error) throw new Error("Could not check username uniqueness");
    return !data; // Returns true if username is available
};

// Maps Supabase auth error messages to consistent codes and friendly messages
const mapSupabaseAuthError = (rawMessage: string) => {
    const m = (rawMessage || "").toLowerCase();
    if (m.includes("invalid login credentials") || m.includes("invalid email or password")) {
        return {
            code: "invalid_credentials" as const,
            message: "Invalid email or password",
        };
    }
    if (m.includes("email not confirmed")) {
        return {
            code: "email_not_confirmed" as const,
            message: "Email not confirmed",
        };
    }
    if (m.includes("too many requests") || m.includes("rate limit")) {
        return {
            code: "rate_limited" as const,
            message: "Too many attempts. Try again later.",
        };
    }
    if (m.includes("captcha") || m.includes("verification") || m.includes("challenge")) {
        return { code: "captcha_required" as const, message: "Captcha required" };
    }
    if (m.includes("user not found") || m.includes("no user") || m.includes("email not found")) {
        return { code: "user_not_found" as const, message: "User not found" };
    }
    return { code: "unknown" as const, message: rawMessage };
};

const serializeError = (err: any) => {
    try {
        // capture non-enumerable props as well
        return JSON.parse(JSON.stringify(err, Object.getOwnPropertyNames(err)));
    } catch {
        try {
            return { message: String(err) };
        } catch {
            return { error: "unserializable error" };
        }
    }
};

export async function signUpAction(formData: FormData): Promise<ActionResult> {
    const email = formData.get("email")?.toString()?.trim();
    const password = formData.get("password")?.toString();
    const confirmPassword = formData.get("confirm_password")?.toString();
    const username = formData.get("username")?.toString()?.trim();
    const hcaptchaToken = formData.get("hcaptcha_token")?.toString();

    // --- Basic validation ---
    if (!email || !password || !confirmPassword || !username) return { error: "All fields are required." };

    if (password !== confirmPassword) return { error: "Passwords do not match." };

    const passwordError = validatePassword(password);
    if (passwordError) return { error: passwordError };

    const usernameError = validateUsername(username);
    if (usernameError) return { error: usernameError };

    const supabase = await createClient();

    // --- Ensure unique username ---
    const isAvailable = await checkUsernameUniqueness(username, supabase);
    if (!isAvailable) return { error: "Username is already taken." };

    // --- Sign up user ---
    const { data, error } = await supabase.auth.signUp({
        email,
        password,
        options: {
            data: { username },
            captchaToken: hcaptchaToken,
            emailRedirectTo: `${process.env.NEXT_PUBLIC_SITE_URL}/auth/callback`,
        },
    });

    if (error) {
        console.error("🔴 signUpAction: signup failed", serializeError(error));

        if (error.message.toLowerCase().includes("already registered")) return { error: "Email already registered." };

        return { error: "Could not create account. Please try again." };
    }

    const user = data.user;
    if (!user) return { error: "Signup failed. Please try again." };

    // --- Ensure profile consistency ---
    const { data: profile, error: profileError } = await supabase.from("profiles").select("id, username").eq("id", user.id).maybeSingle();

    if (profileError) {
        console.error("⚠️ Profile fetch after signup failed", serializeError(profileError));
    } else if (!profile) {
        // Trigger didn’t run — create manually
        const { error: insertError } = await supabase.from("profiles").insert({
            id: user.id,
            username,
        });

        if (insertError) console.error("⚠️ Manual profile creation failed", serializeError(insertError));
    } else if (profile.username !== username) {
        // Update incorrect username
        const { error: updateError } = await supabase.from("profiles").update({ username }).eq("id", user.id);

        if (updateError) console.error("⚠️ Profile username update failed", serializeError(updateError));
    }

    // --- Done ---
    return {
        success: true,
        message: "Account created successfully! Please check your email to verify your account.",
    };
}

export const checkEmailExistsAction = async (formData: FormData) => {
    const email = formData.get("email") as string;

    if (!email) {
        return { error: "Email is required" };
    }

    try {
        const supabase = await createClient();

        // Use a dummy random strong password to probe auth without revealing existence
        const dummyPassword = `__dummy_${Math.random().toString(36).slice(2)}A!9`;

        const { error: authError } = await supabase.auth.signInWithPassword({
            email,
            password: dummyPassword,
        });

        const msg = authError?.message || "";

        // If there's no error, somehow the dummy password worked (very unlikely)
        if (!authError) {
            return { exists: true };
        }

        const lower = msg.toLowerCase();

        // Email exists but password is wrong
        if (lower.includes("invalid login credentials") || lower.includes("invalid email or password")) {
            return { exists: true };
        }

        // Email exists but not confirmed
        if (lower.includes("email not confirmed")) {
            return { exists: true, unconfirmed: true };
        }

        // Captcha-related issues: assume email exists
        if (lower.includes("captcha") || lower.includes("verification") || lower.includes("challenge")) {
            console.log("Captcha-related error during email check, assuming email exists:", msg);
            return { exists: true };
        }

        // Email not found cases
        if (
            lower.includes("user not found") ||
            lower.includes("no user") ||
            lower.includes("email not found") ||
            lower.includes("invalid email")
        ) {
            return { exists: false };
        }

        // For any unhandled error, log it and return a generic error
        console.log("Unhandled auth error during email check:", msg);
        return { error: "Could not verify email" };
    } catch (error) {
        console.error("checkEmailExistsAction error:", error);
        return { error: "Could not verify email" };
    }
};

const maskValue = (v?: string | null) => {
    if (!v) return "";
    if (v.length <= 2) return v[0] + "*";
    return v[0] + "*".repeat(Math.max(1, v.length - 2)) + v.slice(-1);
};

export const signInAction = async (formData: FormData) => {
    const email = formData.get("email") as string;
    const password = formData.get("password") as string;
    const hcaptchaToken = formData.get("hcaptcha_token")?.toString();

    // Early validation
    if (!email || !password) {
        console.log("❌ Sign-in validation failed: missing credentials", {
            timestamp: new Date().toISOString(),
            hasEmail: Boolean(email),
            hasPassword: Boolean(password),
        });
        return { error: "Email and password are required" };
    }

    try {
        const supabase = await createClient();

        const { data, error } = await supabase.auth.signInWithPassword({
            email,
            password,
            options: { captchaToken: hcaptchaToken },
        });

        if (error) {
            console.error("❌ Supabase auth error", {
                timestamp: new Date().toISOString(),
                email: maskValue(email),
                errorMessage: error.message,
                errorCode: (error as any).code ?? null,
                errorStatus: (error as any).status ?? null,
                fullError: serializeError(error),
            });

            const mappedError = mapSupabaseAuthError(error.message);
            return {
                error: mappedError.message,
                errorCode: mappedError.code,
            };
        }
        // Verify the session was properly set
        const { data: sessionCheck, error: sessionError } = await supabase.auth.getSession();

        if (sessionError) {
            console.error("❌ Session verification failed", {
                timestamp: new Date().toISOString(),
                error: serializeError(sessionError),
            });
            return { error: "Session creation failed. Please try again." };
        }

        if (!sessionCheck.session) {
            console.error("⚠️ No session found after successful sign-in", {
                timestamp: new Date().toISOString(),
                email: maskValue(email),
            });
            return { error: "Session creation failed. Please try again." };
        }

        // Return success - the session cookie is now set
        return {
            success: true,
            user: {
                id: data.user?.id,
                email: data.user?.email,
            },
        };
    } catch (error) {
        console.error("💥 Unexpected sign-in error", {
            timestamp: new Date().toISOString(),
            email: maskValue(email),
            error: serializeError(error),
        });
        return { error: "An unexpected error occurred. Please try again." };
    }
};

export const forgotPasswordAction = async (formData: FormData) => {
    const email = (formData.get("email") as string | null)?.trim();
    const hcaptchaToken = (formData.get("hcaptcha_token") as string | null)?.trim();

    if (!email) return { error: "Email is required" };
    if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) return { error: "Please enter a valid email address" };
    if (!hcaptchaToken) return { error: "Captcha is required" };

    try {
        const supabase = await createClient();
        // const origin = (process.env.NEXT_PUBLIC_BASE_URL as string).replace(/\/$/, "");

        const { error } = await supabase.auth.resetPasswordForEmail(email, {
            captchaToken: hcaptchaToken,
        });

        if (error) {
            const msg = (error.message || "").toLowerCase();
            if (msg.includes("rate") || msg.includes("too many"))
                return { error: "Too many reset attempts. Please wait before trying again." };
            if (msg.includes("captcha")) return { error: "Captcha verification failed. Please try again." };
        }

        // Always return success message
        return { success: true, message: "If an account with this email exists, we've sent you a password reset link." };
    } catch (error) {
        console.error("forgotPasswordAction error:", error);
        return { success: true, message: "If an account with this email exists, we've sent you a password reset link." };
    }
};

export const signOutAction = async () => {
    try {
        const supabase = await createClient();
        await supabase.auth.signOut();

        return {
            success: true,
            message: "Signed out successfully",
        };
    } catch (error) {
        console.error("signOutAction error:", error);
        return { error: "Could not sign out. Please try again." };
    }
};

export const deleteAccountAction = async () => {
    try {
        const supabase = await createClient();

        // Get current user
        const {
            data: { user },
            error: userError,
        } = await supabase.auth.getUser();

        if (userError || !user) {
            return { error: "You must be signed in to delete your account." };
        }

        // Delete user from auth (requires service role key on server)
        const { error: deleteError } = await supabase.auth.admin.deleteUser(user.id);

        if (deleteError) {
            console.error("Account deletion failed:", deleteError);
            return { error: "Failed to delete account. Please try again." };
        }

        // Optionally, delete from profiles or other tables if not cascaded
        // await supabase.from("profiles").delete().eq("id", user.id);

        return {
            success: true,
            message: "Your account has been deleted.",
        };
    } catch (error) {
        console.error("deleteAccountAction error:", error);
        return { error: "Could not delete account. Please try again." };
    }
};
