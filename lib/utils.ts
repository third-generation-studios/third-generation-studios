import { clsx, type ClassValue } from "clsx";
import { twMerge } from "tailwind-merge";

export function cn(...inputs: ClassValue[]) {
    return twMerge(clsx(inputs));
}

export function formatDuration(duration?: number) {
    if (!duration && duration !== 0) return "--:--";

    // convert milliseconds if the number is too large
    let seconds = duration;
    if (duration > 3600) {
        seconds = Math.floor(duration / 1000);
    }
    const totalSec = Math.floor(seconds);
    const m = Math.floor(totalSec / 60);
    const s = totalSec % 60;
    return `${m}:${s.toString().padStart(2, "0")}`;
}

export async function getSignedTrackUrl(trackUrl: string): Promise<string | null> {
    try {
        const res = await fetch("/api/refresh-track-url", {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({ trackUrl }),
        });

        const data = await res.json();
        if (!res.ok) throw new Error(data.error || "Failed to fetch signed URL");

        return data.signedUrl;
    } catch (error) {
        console.error("Failed to get signed URL:", error);
        return null;
    }
}
