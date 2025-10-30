import { useProfileByIdQuery } from "@/hooks/public/use-profiles";
import { useAuthStore } from "@/stores/auth-store";
import { Laptop, LogOut, Moon, Music, Sun, User } from "lucide-react";
import { useTheme } from "next-themes";
import { useRouter } from "next/navigation";
import React, { useEffect, useRef } from "react";

interface IUserIconMenuProps {
    closeMenu: () => void;
}

const UserIconMenu = (props: IUserIconMenuProps) => {
    const { closeMenu } = props;
    const router = useRouter();
    const menuRef = useRef<HTMLDivElement | null>(null);
    const { setTheme } = useTheme();
    const { user, signOut } = useAuthStore();
    const { data: profile } = useProfileByIdQuery(user?.id ?? "");

    // keep a stable ref to the latest closeMenu so the document listener can call it
    const closeMenuRef = useRef(closeMenu);
    closeMenuRef.current = closeMenu;

    useEffect(() => {
        // focus first focusable element inside menu for keyboard users
        const el = menuRef.current;
        const first = el?.querySelector<HTMLElement>('button[role="menuitem"], a[role="menuitem"], [tabindex="0"]');
        first?.focus();

        // listen to click (bubble) to avoid re-open race when clicking the trigger
        const onDocClick = (e: MouseEvent) => {
            if (!menuRef.current) return;
            if (e.target instanceof Node && !menuRef.current.contains(e.target)) {
                closeMenuRef.current();
            }
        };
        const onKey = (e: KeyboardEvent) => {
            if (e.key === "Escape") closeMenuRef.current();
        };

        document.addEventListener("click", onDocClick);
        document.addEventListener("keydown", onKey);
        return () => {
            document.removeEventListener("click", onDocClick);
            document.removeEventListener("keydown", onKey);
        };
    }, []); // no closeMenu dependency — we use closeMenuRef to access latest

    const onActivate = (fn: () => void) => (e: React.KeyboardEvent | React.MouseEvent) => {
        if ("key" in e && (e as React.KeyboardEvent).key) {
            const key = (e as React.KeyboardEvent).key;
            if (key !== "Enter" && key !== " ") return;
            e.preventDefault();
        }
        fn();
    };

    const handleSignOut = async () => {
        closeMenu();
        try {
            await signOut();
            router.refresh();
        } catch {
            router.refresh();
        }
    };

    // If the user is not signed in, show only Sign In / Sign Up and return early
    if (!user) {
        return (
            <div
                ref={menuRef}
                className="z-50 w-56 origin-top-right bg-white dark:bg-neutral-900 border border-neutral-200 dark:border-neutral-800 rounded-md shadow-lg absolute right-0 top-full mt-2 ring-1 ring-black/5 dark:ring-white/5"
                role="menu"
                aria-label="User menu"
            >
                <div className="px-2 py-2 flex flex-col gap-1">
                    <button
                        role="menuitem"
                        tabIndex={0}
                        className="w-full text-left px-3 py-2 text-sm rounded-md text-black hover:text-white hover:bg-green-400 dark:hover:bg-green-950 dark:text-white cursor-pointer transition-colors duration-150 focus:outline-none focus:ring-2 focus:ring-green-400"
                        onClick={() => {
                            closeMenu();
                            router.push("/sign-in");
                        }}
                        onKeyDown={onActivate(() => {
                            closeMenu();
                            router.push("/sign-in");
                        })}
                    >
                        Sign In / Sign Up
                    </button>
                </div>
            </div>
        );
    }

    // signed-in menu with header, clear sections, and accessible roles
    const displayName = (user as any)?.user_metadata?.full_name || user?.email || "User";
    const initials = String(displayName)
        .split(" ")
        .map((n) => n[0])
        .slice(0, 2)
        .join("")
        .toUpperCase();

    return (
        <div
            ref={menuRef}
            className="z-50 w-56 origin-top-right bg-white dark:bg-neutral-900 border border-neutral-200 dark:border-neutral-800 rounded-md shadow-lg absolute right-0 top-full mt-2 ring-1 ring-black/5 dark:ring-white/5"
            role="menu"
            aria-label="User menu"
        >
            {/* Header with initials + name */}
            <div className="flex items-center gap-3 px-3 py-3 border-b border-neutral-100 dark:border-neutral-800">
                <div className="w-8 h-8 rounded-full bg-neutral-100 dark:bg-neutral-700 flex items-center justify-center text-sm font-medium text-neutral-700 dark:text-neutral-100">
                    {initials || <User />}
                </div>
                <div className="flex flex-col text-sm">
                    <span className="font-medium text-neutral-900 dark:text-neutral-100">{profile?.username}</span>
                    <span className="text-[10px] text-neutral-500 dark:text-neutral-400">{user.email}</span>
                </div>
            </div>
            {/* Profile */}
            <div className="flex flex-col px-1 py-1">
                <button
                    role="menuitem"
                    tabIndex={0}
                    className="w-full text-left px-3 py-2 text-sm rounded-md text-black hover:text-white hover:bg-green-400 dark:hover:bg-green-950 dark:text-white cursor-pointer transition-colors duration-150 flex items-center gap-2 focus:outline-none focus:ring-2 focus:ring-green-400"
                    onClick={() => {
                        closeMenu();
                        router.push("/solo-queue/profile");
                    }}
                    onKeyDown={onActivate(() => {
                        closeMenu();
                        router.push("/solo-queue/profile");
                    })}
                >
                    <User className="mr-1" size={16} aria-hidden="true" /> Profile
                </button>
                {/* Divider */}
                <div className="my-1 border-t border-neutral-100 dark:border-neutral-800" />

                {/* Solo Queue */}
                <button
                    role="menuitem"
                    tabIndex={0}
                    className="w-full text-left px-3 py-2 text-sm rounded-md text-black hover:text-white hover:bg-green-400 dark:hover:bg-green-950 dark:text-white cursor-pointer transition-colors duration-150 flex items-center gap-2 focus:outline-none focus:ring-2 focus:ring-green-400"
                    onClick={() => {
                        closeMenu();
                        router.push("/solo-queue");
                    }}
                    onKeyDown={onActivate(() => {
                        closeMenu();
                        router.push("/solo-queue");
                    })}
                >
                    <Music className="mr-1" size={16} aria-hidden="true" /> Solo Queue
                </button>
                {/* Divider */}
                <div className="my-1 border-t border-neutral-100 dark:border-neutral-800" />

                {/* <div className="px-3 py-2">
                    <div className="text-sm text-neutral-500 dark:text-neutral-400 mb-2">Theme</div>
                    <div className="flex flex-col gap-1">
                        <button
                            role="menuitem"
                            tabIndex={0}
                            className="w-full text-left px-2 py-1 text-sm rounded-md cursor-pointer hover:bg-neutral-100 dark:hover:bg-neutral-800 flex items-center gap-2 focus:outline-none focus:ring-2 focus:ring-green-400"
                            onClick={() => {
                                setTheme("light");
                                closeMenu();
                            }}
                            onKeyDown={onActivate(() => {
                                setTheme("light");
                                closeMenu();
                            })}
                        >
                            <Sun className="mr-2 h-4 w-4" /> Light
                        </button>
                        <button
                            role="menuitem"
                            tabIndex={0}
                            className="w-full text-left px-2 py-1 text-sm rounded-md cursor-pointer hover:bg-neutral-100 dark:hover:bg-neutral-800 flex items-center gap-2 focus:outline-none focus:ring-2 focus:ring-green-400"
                            onClick={() => {
                                setTheme("dark");
                                closeMenu();
                            }}
                            onKeyDown={onActivate(() => {
                                setTheme("dark");
                                closeMenu();
                            })}
                        >
                            <Moon className="mr-2 h-4 w-4" /> Dark
                        </button>
                        <button
                            role="menuitem"
                            tabIndex={0}
                            className="w-full text-left px-2 py-1 text-sm rounded-md cursor-pointer hover:bg-neutral-100 dark:hover:bg-neutral-800 flex items-center gap-2 focus:outline-none focus:ring-2 focus:ring-green-400"
                            onClick={() => {
                                setTheme("system");
                                closeMenu();
                            }}
                            onKeyDown={onActivate(() => {
                                setTheme("system");
                                closeMenu();
                            })}
                        >
                            <Laptop className="mr-2 h-4 w-4" /> System
                        </button>
                    </div>
                </div> */}

                {/* <div className="my-1 border-t border-neutral-100 dark:border-neutral-800" /> */}

                <button
                    role="menuitem"
                    tabIndex={0}
                    className="w-full text-left px-3 py-2 text-sm text-red-600 dark:text-red-400 cursor-pointer transition-colors duration-150 flex items-center gap-2 rounded-md focus:outline-none focus:ring-2 focus:ring-red-400"
                    onClick={handleSignOut}
                    onKeyDown={onActivate(() => {
                        handleSignOut();
                    })}
                >
                    <LogOut className="mr-1 h-4 w-4" /> Log out
                </button>
            </div>
        </div>
    );
};

export default UserIconMenu;
