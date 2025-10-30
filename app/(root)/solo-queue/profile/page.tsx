"use client";

import ProfileForm from "@/components/layout/solo-queue/profile-form";
import { useProfileByIdQuery } from "@/hooks/public/use-profiles";
import { useAuthStore } from "@/stores/auth-store";
import Image from "next/image";
import { useRouter } from "next/navigation";
import { useEffect } from "react";

// Define component interface
interface LoadingScreenProps {
    message: string;
}

// Extract LoadingScreen component with proper typing
function LoadingScreen({ message }: LoadingScreenProps) {
    return (
        <div className="text-white flex items-center justify-center min-h-[400px]">
            <div className="text-center">
                <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-white mx-auto mb-4"></div>
                <p>{message}</p>
            </div>
        </div>
    );
}

// Main page component with explicit NextPage typing
export default function SoloQProfilePage() {
    const { user, loading } = useAuthStore();
    const { data: profile, isLoading: profileLoading } = useProfileByIdQuery(user?.id ?? "");

    const router = useRouter();

    // Redirect unauthenticated users - but only after loading is complete
    useEffect(() => {
        if (!loading && !user) {
            console.log("🔄 ProfilePage: Redirecting to sign-in");
            router.push("/sign-in");
        }
    }, [loading, user, router]);

    // Show loading while auth is still being determined
    if (loading) {
        return <LoadingScreen message="Loading authentication..." />;
    }

    // If no user after loading is complete, don't render anything (redirect will happen)
    if (!user) {
        return <LoadingScreen message="Redirecting to sign in..." />;
    }

    // Show loading while profile is being fetched
    if (profileLoading) {
        return <LoadingScreen message="Loading profile..." />;
    }

    // No profile found but user exists
    if (!profile) {
        return (
            <div className="text-white max-w-4xl mx-auto p-6 text-center">
                <h1 className="text-4xl font-bold mb-4">Profile Not Found</h1>
                <p className="text-neutral-400 mb-4">We couldn't find your profile data. Possible reasons:</p>
                <ul className="text-left text-neutral-400 mb-6 max-w-md mx-auto">
                    <li>• Your profile hasn't been created yet</li>
                    <li>• There was an error fetching your data</li>
                    <li>• Database connection issues</li>
                </ul>
                <button
                    onClick={() => window.location.reload()}
                    className="px-6 py-2 bg-blue-600 hover:bg-blue-700 rounded-lg font-medium transition-colors"
                >
                    Retry
                </button>
            </div>
        );
    }

    // Success state
    return (
        <div className="text-white max-w-4xl mx-auto p-6">
            <div className="mb-8">
                <h1 className="text-4xl font-bold mb-2">Your Profile</h1>
                <p className="text-neutral-400 text-lg">Manage your account settings and preferences</p>
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
                <div className="lg:col-span-1">
                    <div className="bg-neutral-900 rounded-lg p-6 text-center">
                        <Image
                            src={profile.avatar_url || "/user-default-image.png"}
                            alt={profile.username ? profile.username + " avatar" : "User avatar"}
                            className="w-24 h-24 rounded-full mx-auto mb-4 object-cover"
                            width={96}
                            height={96}
                        />
                        <h2 className="text-xl font-semibold">{profile.username}</h2>
                        <span className="inline-block px-3 py-1 bg-blue-600 text-xs rounded-full mt-2 capitalize">{profile.role}</span>
                        <p className="text-neutral-400 text-sm mt-2">Member since {new Date(profile.created_at).toLocaleDateString()}</p>
                    </div>
                </div>

                <div className="lg:col-span-2">
                    <ProfileForm profile={profile} />
                </div>
            </div>
        </div>
    );
}
