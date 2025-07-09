import React from 'react';
import { Card, CardContent, CardHeader } from '@/components/ui/card';
import { Skeleton } from '@/components/ui/skeleton';

export const TournamentCardSkeleton = () => {
  return (
    <Card className="group cursor-pointer transition-all duration-300 overflow-hidden">
      {/* Banner Image Skeleton */}
      <div className="relative h-48 overflow-hidden bg-muted">
        <Skeleton className="w-full h-full" />
        {/* Status badge overlay skeleton */}
        <div className="absolute top-4 left-4">
          <Skeleton className="h-6 w-20 rounded-full" />
        </div>
        {/* Prize overlay skeleton */}
        <div className="absolute top-4 right-4 bg-background/90 backdrop-blur-sm rounded-lg px-3 py-1">
          <Skeleton className="h-5 w-16" />
        </div>
      </div>

      <CardHeader className="pb-3">
        <div className="flex items-start justify-between">
          <div className="flex-1 min-w-0">
            <Skeleton className="h-6 w-3/4 mb-2" />
            <Skeleton className="h-4 w-full mb-1" />
            <Skeleton className="h-4 w-2/3" />
          </div>
        </div>
      </CardHeader>

      <CardContent className="space-y-4">
        {/* Tournament Details Skeleton */}
        <div className="grid grid-cols-2 gap-3 text-sm">
          <div className="flex items-center">
            <Skeleton className="h-4 w-4 mr-2" />
            <Skeleton className="h-4 w-20" />
          </div>
          <div className="flex items-center">
            <Skeleton className="h-4 w-4 mr-2" />
            <Skeleton className="h-4 w-16" />
          </div>
        </div>

        {/* Date and Location Skeleton */}
        <div className="flex items-center">
          <Skeleton className="h-4 w-4 mr-2" />
          <div>
            <Skeleton className="h-4 w-24 mb-1" />
            <Skeleton className="h-3 w-16" />
          </div>
        </div>
        
        <div className="flex items-center">
          <Skeleton className="h-4 w-4 mr-2" />
          <Skeleton className="h-4 w-48" />
        </div>

        {/* Entry Fee Skeleton */}
        <div className="flex items-center">
          <Skeleton className="h-4 w-4 mr-2" />
          <Skeleton className="h-4 w-32" />
        </div>

        {/* Participants Progress Skeleton */}
        <div className="space-y-2">
          <div className="flex items-center justify-between text-sm">
            <div className="flex items-center">
              <Skeleton className="h-4 w-4 mr-1" />
              <Skeleton className="h-4 w-24" />
            </div>
            <Skeleton className="h-4 w-12" />
          </div>
          <Skeleton className="h-2 w-full" />
        </div>

        {/* Action Buttons Skeleton */}
        <div className="flex gap-2 pt-2">
          <Skeleton className="h-9 flex-1" />
          <Skeleton className="h-9 flex-1" />
        </div>
      </CardContent>
    </Card>
  );
};