export function extractTrackPathFromUrl(urlOrPath: string) {
    try {
        if (urlOrPath.startsWith("http")) {
            const u = new URL(urlOrPath);
            const prefix = `/storage/v1/object/sign/track-urls/`;
            const idx = u.pathname.indexOf(prefix);
            if (idx === -1) throw new Error("Invalid track URL");
            return u.pathname.slice(idx + prefix.length);
        }
        // Already a relative path
        return urlOrPath;
    } catch (err) {
        console.error("Failed to extract path from URL:", urlOrPath, err);
        return urlOrPath; // fallback
    }
}
