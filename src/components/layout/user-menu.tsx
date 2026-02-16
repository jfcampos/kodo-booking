"use client";

import React from "react";
import { useTranslations } from "next-intl";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { User, History, Shield, LogOut } from "lucide-react";
import Link from "next/link";

type UserMenuProps = {
  name: string | null;
  email: string | null;
  image: string | null;
  color: string;
  role: string;
  isImpersonating: boolean;
  signOutAction: () => Promise<void>;
};

export function UserMenu({
  name,
  email,
  image,
  color,
  role,
  isImpersonating,
  signOutAction,
}: UserMenuProps) {
  const t = useTranslations("Header");
  const initials = name
    ? name
        .split(" ")
        .map((n) => n[0])
        .join("")
        .toUpperCase()
        .slice(0, 2)
    : email?.[0]?.toUpperCase() ?? "?";

  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <button className="size-8 shrink-0 rounded-full outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2">
          <Avatar
            className="size-8 items-center justify-center ring-2"
            style={
              {
                "--tw-ring-color": color,
                backgroundColor: color,
              } as React.CSSProperties
            }
          >
            {image ? (
              <AvatarImage src={image} alt={name ?? ""} className="object-cover" />
            ) : (
              <span className="text-xs text-white">{initials}</span>
            )}
          </Avatar>
        </button>
      </DropdownMenuTrigger>
      <DropdownMenuContent align="end" className="w-48">
        <div className="px-2 py-1.5">
          <p className="text-sm font-medium truncate">{name}</p>
          <p className="text-xs text-muted-foreground truncate">{email}</p>
        </div>
        <DropdownMenuSeparator />
        <DropdownMenuItem asChild>
          <Link href="/settings" className="cursor-pointer">
            <User className="mr-2 h-4 w-4" />
            {t("profile")}
          </Link>
        </DropdownMenuItem>
        <DropdownMenuItem asChild>
          <Link href="/history" className="cursor-pointer">
            <History className="mr-2 h-4 w-4" />
            {t("history")}
          </Link>
        </DropdownMenuItem>
        {(role === "ADMIN" || isImpersonating) && (
          <>
            <DropdownMenuSeparator />
            <DropdownMenuItem asChild>
              <Link href="/admin" className="cursor-pointer">
                <Shield className="mr-2 h-4 w-4" />
                {t("admin")}
              </Link>
            </DropdownMenuItem>
          </>
        )}
        {!isImpersonating && (
          <>
            <DropdownMenuSeparator />
            <DropdownMenuItem
              onClick={() => signOutAction()}
              className="cursor-pointer text-destructive focus:text-destructive"
            >
              <LogOut className="mr-2 h-4 w-4" />
              {t("logOut")}
            </DropdownMenuItem>
          </>
        )}
      </DropdownMenuContent>
    </DropdownMenu>
  );
}
