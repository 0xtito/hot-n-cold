"use client";

import React, { useMemo } from "react";
import { Skeleton } from "@/components/ui/skeleton";
import { cn } from "@/lib/utils";

function FriendRowSkeleton({
  rows = 1,
  className,
}: {
  rows?: number;
  className?: string;
}) {
  const arr = useMemo(() => {
    return Array.from({ length: rows }).map((_, i) => i);
  }, [rows]);

  return (
    <div className="flex flex-col">
      {arr.map((i) => (
        <FriendRowSkeletonItem className={className} key={i} />
      ))}
    </div>
  );
}

function FriendRowSkeletonItem({ className }: { className?: string }) {
  return (
    <div
      className={cn(
        className,
        "flex items-center justify-between gap-x-4 py-5",
      )}
    >
      <div className="flex min-w-0">
        <Skeleton className="h-8 w-8 rounded-full" />
      </div>
      <div className="min-w-0 flex-auto">
        <Skeleton className="h-6 w-24 rounded-full" />
      </div>

      <Skeleton className="h-6 w-[3.25rem] rounded-full px-2.5 py-1" />
    </div>
  );
}

export { FriendRowSkeleton, FriendRowSkeletonItem };
