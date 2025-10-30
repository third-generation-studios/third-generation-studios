"use client";

import { Eye, EyeOff, CheckCircle, AlertCircle, ArrowLeft, Shield } from "lucide-react";
import { useState, useCallback } from "react";
import { useRouter } from "next/navigation";
import { motion } from "framer-motion";
import Link from "next/link";
import { Label } from "../ui/label";
import { Input } from "../ui/input";
import { supabase } from "@/lib/supabase/client";

// Animation variants moved outside component to prevent recreation
const formVariants = {
    hidden: { opacity: 0, y: 40 },
    visible: { opacity: 1, y: 0, transition: { duration: 0.6 } },
};

const inputVariants = {
    hidden: { opacity: 0, x: -20 },
    visible: (custom: number) => ({
        opacity: 1,
        x: 0,
        transition: { delay: custom * 0.1, duration: 0.4 },
    }),
};

// Password validation regex moved outside to prevent recreation
const PASSWORD_REGEX = /^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)(?=.*[!@#$%^&*()_+\-=[\]{};':"\\|,.<>/?]).{8,}$/;

export default function ResetPasswordForm() {
    const [showPassword, setShowPassword] = useState(false);
    const [showConfirm, setShowConfirm] = useState(false);
    const [password, setPassword] = useState("");
    const [confirmPassword, setConfirmPassword] = useState("");
    const [formError, setFormError] = useState<string | null>(null);
    const [successMessage, setSuccessMessage] = useState<string | null>(null);
    const [isSubmitting, setIsSubmitting] = useState(false);
    const router = useRouter();

    // Memoized password validation function
    const validatePassword = useCallback((password: string) => {
        return PASSWORD_REGEX.test(password);
    }, []);

    // Simplified form submission handler
    const handleSubmit = useCallback(
        async (e: React.FormEvent<HTMLFormElement>) => {
            e.preventDefault();
            setFormError(null);
            setSuccessMessage(null);

            if (!password.trim() || !confirmPassword.trim()) {
                setFormError("Both password fields are required.");
                return;
            }

            if (password !== confirmPassword) {
                setFormError("Passwords do not match.");
                return;
            }

            if (!validatePassword(password)) {
                setFormError(
                    "Password must be at least 8 characters and include a lowercase letter, uppercase letter, number, and symbol.",
                );
                return;
            }

            setIsSubmitting(true);

            try {
                // ✅ Use the token for password recovery
                const { error } = await supabase.auth.updateUser({ password: password.trim() });

                if (error) throw error;

                setSuccessMessage("Password updated successfully!");

                setTimeout(() => {
                    router.push("/sign-in?message=Password updated successfully");
                }, 2000);
            } catch (error: any) {
                console.error("Reset password error:", error);

                if (error.message?.includes("session")) {
                    setFormError("Session expired or invalid. Please request a new password reset link.");
                } else if (error.message?.includes("weak")) {
                    setFormError("Password is too weak. Please choose a stronger password.");
                } else if (error.message?.includes("same")) {
                    setFormError("New password must be different from your current password.");
                } else {
                    setFormError(error.message || "Failed to reset password. Please try again.");
                }
            } finally {
                setIsSubmitting(false);
            }
        },
        [password, confirmPassword, validatePassword, router],
    );

    // Memoized password strength indicator
    const getPasswordStrength = useCallback((password: string) => {
        const checks = {
            length: password.length >= 8,
            lowercase: /[a-z]/.test(password),
            uppercase: /[A-Z]/.test(password),
            number: /\d/.test(password),
            symbol: /[!@#$%^&*()_+\-=[\]{};':"\\|,.<>/?]/.test(password),
        };

        const passedChecks = Object.values(checks).filter(Boolean).length;
        return { checks, strength: passedChecks };
    }, []);

    const passwordStrength = getPasswordStrength(password);

    return (
        <section className="flex items-center justify-center w-full py-8 px-4" aria-label="Reset password form">
            <motion.form
                variants={formVariants}
                initial="hidden"
                animate="visible"
                onSubmit={handleSubmit}
                className="flex-1 flex flex-col min-w-[90vw] sm:min-w-[400px] max-w-md mx-auto bg-gradient-to-br from-white/95 to-white/90 dark:from-neutral-900/95 dark:to-neutral-800/90 rounded-2xl shadow-[0_0_40px_-15px_rgba(0,0,0,0.3)] dark:shadow-[0_0_40px_-15px_rgba(0,0,0,0.5)] p-6 sm:p-10 border border-white/20 dark:border-neutral-700/50 backdrop-blur-xl"
                noValidate
            >
                {/* Header */}
                <header className="mb-6">
                    <Link
                        href="/sign-in"
                        className="inline-flex items-center gap-2 text-sm text-neutral-600 dark:text-neutral-400 hover:text-green-600 dark:hover:text-green-400 transition-colors duration-200 mb-4"
                    >
                        <ArrowLeft size={16} />
                        Back to Sign In
                    </Link>
                    <div className="flex items-center justify-center gap-2 mb-2">
                        <Shield className="text-green-600 dark:text-green-400" size={24} />
                        <h1 className="text-3xl sm:text-4xl font-bold text-center bg-gradient-to-r from-green-600 to-green-400 dark:from-green-400 dark:to-green-200 bg-clip-text text-transparent drop-shadow">
                            Reset Password
                        </h1>
                    </div>
                    <p className="text-sm sm:text-base text-neutral-600 dark:text-neutral-400 text-center">
                        Please enter your new password below.
                    </p>
                </header>

                {/* Error message display */}
                {formError && (
                    <div
                        className="text-red-600 dark:text-red-400 text-sm text-center mb-4 p-3 bg-red-50 dark:bg-red-900/20 rounded-lg border border-red-200 dark:border-red-800/50 flex items-center gap-2 justify-center"
                        role="alert"
                    >
                        <AlertCircle size={16} />
                        {formError}
                    </div>
                )}

                {/* Success message display */}
                {successMessage && (
                    <div
                        className="text-green-600 dark:text-green-400 text-sm text-center mb-4 p-3 bg-green-50 dark:bg-green-900/20 rounded-lg border border-green-200 dark:border-green-800/50 flex items-center gap-2 justify-center"
                        role="alert"
                    >
                        <CheckCircle size={16} />
                        {successMessage}
                    </div>
                )}

                <div className="flex flex-col gap-4">
                    {/* New password field */}
                    <motion.div variants={inputVariants} custom={0}>
                        <Label htmlFor="password" className="text-base sm:text-lg font-medium text-neutral-700 dark:text-neutral-300">
                            New Password
                        </Label>
                        <div className="relative">
                            <Input
                                autoComplete="new-password"
                                type={showPassword ? "text" : "password"}
                                id="password"
                                name="password"
                                placeholder="Create a new password"
                                required
                                value={password}
                                onChange={(e) => setPassword(e.target.value)}
                                className="focus:ring-2 focus:ring-green-500/50 text-base sm:text-lg px-4 py-3 mt-1 rounded-lg border border-neutral-200/80 dark:border-neutral-700/80 bg-white/80 dark:bg-neutral-900/80 backdrop-blur-sm transition-all pr-12 hover:border-green-300 dark:hover:border-green-600"
                                aria-describedby="password-help"
                            />
                            <button
                                type="button"
                                className="absolute right-3 top-1/2 -translate-y-1/2 text-neutral-400 hover:text-green-500 dark:hover:text-green-400 transition-colors duration-200 p-1"
                                tabIndex={-1}
                                onClick={() => setShowPassword((v) => !v)}
                                aria-label={showPassword ? "Hide password" : "Show password"}
                            >
                                {showPassword ? <EyeOff size={20} /> : <Eye size={20} />}
                            </button>
                        </div>
                    </motion.div>

                    {/* Confirm password field */}
                    <motion.div variants={inputVariants} custom={1}>
                        <Label
                            htmlFor="confirmPassword"
                            className="text-base sm:text-lg font-medium text-neutral-700 dark:text-neutral-300"
                        >
                            Confirm Password
                        </Label>
                        <div className="relative">
                            <Input
                                autoComplete="new-password"
                                type={showConfirm ? "text" : "password"}
                                id="confirmPassword"
                                name="confirmPassword"
                                placeholder="Confirm your new password"
                                required
                                value={confirmPassword}
                                onChange={(e) => setConfirmPassword(e.target.value)}
                                className="focus:ring-2 focus:ring-green-500/50 text-base sm:text-lg px-4 py-3 mt-1 rounded-lg border border-neutral-200/80 dark:border-neutral-700/80 bg-white/80 dark:bg-neutral-900/80 backdrop-blur-sm transition-all pr-12 hover:border-green-300 dark:hover:border-green-600"
                            />
                            <button
                                type="button"
                                className="absolute right-3 top-1/2 -translate-y-1/2 text-neutral-400 hover:text-green-500 dark:hover:text-green-400 transition-colors duration-200 p-1"
                                tabIndex={-1}
                                onClick={() => setShowConfirm((v) => !v)}
                                aria-label={showConfirm ? "Hide password" : "Show password"}
                            >
                                {showConfirm ? <EyeOff size={20} /> : <Eye size={20} />}
                            </button>
                        </div>
                    </motion.div>

                    {/* Password requirements and strength indicator */}
                    <motion.div variants={inputVariants} custom={2}>
                        <div
                            id="password-help"
                            className="text-xs text-neutral-500 dark:text-neutral-400 bg-neutral-50 dark:bg-neutral-900/50 p-3 rounded-lg border border-neutral-200 dark:border-neutral-700/50"
                        >
                            <div className="mb-2">Password requirements:</div>
                            <div className="grid grid-cols-2 gap-1">
                                <span
                                    className={`flex items-center gap-1 ${passwordStrength.checks.length ? "text-green-600 dark:text-green-400" : "text-neutral-400"}`}
                                >
                                    {passwordStrength.checks.length ? "✓" : "○"} 8+ characters
                                </span>
                                <span
                                    className={`flex items-center gap-1 ${passwordStrength.checks.lowercase ? "text-green-600 dark:text-green-400" : "text-neutral-400"}`}
                                >
                                    {passwordStrength.checks.lowercase ? "✓" : "○"} lowercase
                                </span>
                                <span
                                    className={`flex items-center gap-1 ${passwordStrength.checks.uppercase ? "text-green-600 dark:text-green-400" : "text-neutral-400"}`}
                                >
                                    {passwordStrength.checks.uppercase ? "✓" : "○"} uppercase
                                </span>
                                <span
                                    className={`flex items-center gap-1 ${passwordStrength.checks.number ? "text-green-600 dark:text-green-400" : "text-neutral-400"}`}
                                >
                                    {passwordStrength.checks.number ? "✓" : "○"} number
                                </span>
                                <span
                                    className={`flex items-center gap-1 ${passwordStrength.checks.symbol ? "text-green-600 dark:text-green-400" : "text-neutral-400"}`}
                                >
                                    {passwordStrength.checks.symbol ? "✓" : "○"} symbol
                                </span>
                            </div>
                        </div>
                    </motion.div>

                    {/* Submit button */}
                    <motion.div variants={inputVariants} custom={3} className="mt-6">
                        <button
                            type="submit"
                            disabled={isSubmitting || passwordStrength.strength < 5 || password !== confirmPassword}
                            className="w-full bg-gradient-to-r from-green-600 to-green-500 hover:from-green-700 hover:to-green-600 dark:from-green-500 dark:to-green-400 dark:hover:from-green-600 dark:hover:to-green-500 disabled:from-neutral-400 disabled:to-neutral-400 disabled:cursor-not-allowed disabled:hover:scale-100 text-white font-semibold py-3 px-6 rounded-xl transition-all duration-200 shadow-lg hover:shadow-green-500/25 dark:shadow-green-400/25 text-base sm:text-lg transform hover:scale-[1.02] active:scale-[0.98]"
                        >
                            {isSubmitting ? "Resetting Password..." : "Reset Password"}
                        </button>
                    </motion.div>

                    {/* Additional help */}
                    <motion.div variants={inputVariants} custom={4} className="text-center pt-4">
                        <p className="text-xs text-neutral-500 dark:text-neutral-400">
                            Having trouble?{" "}
                            <Link
                                href="/forgot-password"
                                className="text-green-600 dark:text-green-400 hover:text-green-700 dark:hover:text-green-300 underline font-medium transition-colors duration-200"
                            >
                                Request a new reset link
                            </Link>
                        </p>
                    </motion.div>
                </div>
            </motion.form>
        </section>
    );
}
