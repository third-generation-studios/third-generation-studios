import Link from "next/link";
import React from "react";

export default async function AuthCodeErrorPage({ searchParams }: { searchParams: any }) {
    const params = await searchParams;

    const msg =
        typeof params?.error_description === "string"
            ? params.error_description
            : typeof params?.error === "string"
              ? params.error
              : "An unknown authentication error occurred.";

    return (
        <div
            style={{
                minHeight: "100vh",
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
                padding: 24,
                background: "#f3f4f6",
            }}
        >
            <div
                style={{
                    width: "100%",
                    maxWidth: 880,
                    background: "#fff",
                    borderRadius: 12,
                    boxShadow: "0 8px 30px rgba(2,6,23,0.08)",
                    padding: 28,
                }}
            >
                <div style={{ display: "flex", gap: 20 }}>
                    <div style={{ flex: "0 0 72px", display: "flex", alignItems: "center", justifyContent: "center" }}>
                        <div
                            style={{
                                width: 64,
                                height: 64,
                                borderRadius: "50%",
                                background: "linear-gradient(180deg,#fff5f5,#ffecec)",
                                display: "flex",
                                alignItems: "center",
                                justifyContent: "center",
                                boxShadow: "inset 0 -4px 8px rgba(0,0,0,0.02)",
                            }}
                        >
                            <svg width="30" height="30" viewBox="0 0 24 24" fill="none" aria-hidden>
                                <path d="M12 9v4" stroke="#b91c1c" strokeWidth="1.6" strokeLinecap="round" strokeLinejoin="round" />
                                <path d="M12 17h.01" stroke="#b91c1c" strokeWidth="1.6" strokeLinecap="round" strokeLinejoin="round" />
                                <circle cx="12" cy="12" r="9" stroke="#fecaca" strokeWidth="1.5" fill="transparent" />
                            </svg>
                        </div>
                    </div>

                    <div style={{ flex: 1 }}>
                        <h1 style={{ margin: 0, fontSize: 22, color: "#0f172a" }}>Authentication Error</h1>
                        <p style={{ marginTop: 10, marginBottom: 18, color: "#334155", lineHeight: 1.5 }}>{msg}</p>

                        <div style={{ display: "flex", gap: 10, flexWrap: "wrap" }}>
                            <Link
                                href="/reset-password"
                                style={{
                                    display: "inline-block",
                                    padding: "10px 14px",
                                    background: "#0ea5a0",
                                    color: "#fff",
                                    borderRadius: 8,
                                    fontWeight: 600,
                                    textDecoration: "none",
                                }}
                            >
                                Return to Reset Password
                            </Link>

                            <Link
                                href="/"
                                style={{
                                    display: "inline-block",
                                    padding: "10px 14px",
                                    borderRadius: 8,
                                    border: "1px solid #e6eef0",
                                    background: "#fff",
                                    color: "#0f172a",
                                    textDecoration: "none",
                                }}
                            >
                                Go to Home
                            </Link>
                        </div>

                        <details style={{ marginTop: 18, background: "#f8fafc", padding: 12, borderRadius: 8 }}>
                            <summary style={{ cursor: "pointer", fontWeight: 600, color: "#0f172a" }}>Show technical details</summary>
                            <pre style={{ whiteSpace: "pre-wrap", marginTop: 8, background: "transparent", padding: 0, fontSize: 13 }}>
                                {JSON.stringify(params, null, 2)}
                            </pre>
                        </details>

                        <p style={{ marginTop: 14, fontSize: 13, color: "#64748b" }}>
                            If you continue to experience problems, contact support with the error details above.
                        </p>
                    </div>
                </div>
            </div>
        </div>
    );
}
