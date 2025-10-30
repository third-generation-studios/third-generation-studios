import { NextResponse } from "next/server";
import { createClient } from "@supabase/supabase-js";

export async function POST(req: Request) {
    const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL as string;
    const serviceKey = process.env.SUPABASE_SERVICE_ROLE_KEY as string;

    // ⚠️ Safe because Route Handlers run server-side only
    const supabaseAdmin = createClient(supabaseUrl, serviceKey);
    try {
        const { trackUrl } = await req.json();

        if (!trackUrl) {
            return NextResponse.json({ error: "Missing trackUrl" }, { status: 400 });
        }

        const lastSlash = trackUrl.lastIndexOf("/");
        if (lastSlash === -1) {
            return NextResponse.json({ error: "Invalid trackUrl format" }, { status: 400 });
        }

        const folder = trackUrl.substring(0, lastSlash);
        const fileName = trackUrl.substring(lastSlash + 1);

        // ✅ Check if file exists
        const { data: fileData, error: listError } = await supabaseAdmin.storage.from("track-urls").list(folder, { search: fileName });

        if (listError || !fileData?.length) {
            return NextResponse.json({ error: `File not found in storage: ${trackUrl}` }, { status: 404 });
        }

        // 🎯 Generate signed URL (7 days)
        const { data, error } = await supabaseAdmin.storage.from("track-urls").createSignedUrl(trackUrl, 7 * 24 * 3600);

        if (error || !data?.signedUrl) {
            return NextResponse.json({ error: error?.message ?? "Failed to create signed URL" }, { status: 500 });
        }

        return NextResponse.json({ signedUrl: data.signedUrl });
    } catch (err: any) {
        console.error("refresh-track-url API error:", err);
        return NextResponse.json({ error: "Internal server error" }, { status: 500 });
    }
}
