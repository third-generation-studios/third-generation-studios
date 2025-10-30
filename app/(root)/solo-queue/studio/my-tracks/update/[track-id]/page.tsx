"use client";

// import TrackUpdateForm from "@/components/layout/upload/track-update-form";
import { useAuthStore } from "@/stores/auth-store";
// import { useParams } from "next/navigation";

export default function StudioTrackUpdatePage() {
    // const params = useParams<{ "track-id": string }>();
    // const trackId = params["track-id"];
    const { user } = useAuthStore();

    if (!user) return null;

    // return <TrackUpdateForm trackId={trackId} userId={user.id} />;
    return null;
}
