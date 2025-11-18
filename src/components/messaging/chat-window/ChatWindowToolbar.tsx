"use client";

import { memo } from "react";
import { CardAction, CardHeader } from "@/components/ui/card";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Crown, MoreVertical, User, Wifi, WifiOff } from "lucide-react";
import type { Conversation } from "@/types/socket-events";

type Participant = Conversation["otherParticipant"] | {
  id?: string | null;
  name?: string | null;
  username?: string | null;
  role?: string | null;
} | null | undefined;

interface ChatWindowToolbarProps {
  participant: Participant;
  isOnline: boolean;
}

export const ChatWindowToolbar = memo(({ participant, isOnline }: ChatWindowToolbarProps) => {
  const displayInitial = participant?.name?.charAt(0)?.toUpperCase()
    || participant?.username?.charAt(0)?.toUpperCase()
    || "?";

  return (
    <CardHeader className="flex-row items-center justify-between space-y-0 pb-3 border-b flex-shrink-0">
      <div className="flex items-center space-x-3">
        <Avatar className="h-8 w-8">
          <AvatarFallback className="bg-primary/10 text-primary text-sm">
            {displayInitial}
          </AvatarFallback>
        </Avatar>

        <div className="flex items-center gap-2 min-w-0">
          <h3 className="font-medium text-sm truncate">
            {participant?.name || participant?.username || "Unknown User"}
          </h3>

          <Badge variant="secondary" className="text-xs flex-shrink-0">
            {participant?.role === "super_admin" || participant?.role === "co_admin" ? (
              <>
                <Crown className="h-3 w-3 mr-1" />
                Administrator
              </>
            ) : (
              <>
                <User className="h-3 w-3 mr-1" />
                {participant?.username || "User"}
              </>
            )}
          </Badge>

          {isOnline ? (
            <Badge
              variant="secondary"
              className="text-green-600 bg-green-50 border-green-200 text-xs flex-shrink-0"
            >
              <Wifi className="h-3 w-3 mr-1" />
              Online
            </Badge>
          ) : (
            <Badge
              variant="secondary"
              className="text-orange-600 bg-orange-50 border-orange-200 text-xs flex-shrink-0"
            >
              <WifiOff className="h-3 w-3 mr-1" />
              Offline
            </Badge>
          )}
        </div>
      </div>

      <CardAction className="flex items-center gap-2">
        <Button variant="ghost" size="icon" className="h-8 w-8">
          <MoreVertical className="h-4 w-4" />
        </Button>
      </CardAction>
    </CardHeader>
  );
});

ChatWindowToolbar.displayName = "ChatWindowToolbar";
