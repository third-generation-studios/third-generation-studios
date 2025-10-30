"use client";

import Link from "next/link";
import React from "react";

export default function GlobalError({ error, reset }: { error: Error; reset: () => void }) {
    React.useEffect(() => {
        console.error("Unhandled application error:", error);
    }, [error]);

    return (
        <div style={{ padding: 32, textAlign: "center" }}>
            <h1>Something went wrong</h1>
            <p>{error?.message ?? "An unexpected error occurred."}</p>
            <div style={{ marginTop: 16 }}>
                <button onClick={() => reset()} style={{ marginRight: 12 }}>
                    Try again
                </button>
                <Link href="/">Go home</Link>
            </div>
        </div>
    );
}
