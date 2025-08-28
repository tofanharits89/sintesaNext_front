'use client';

import React, { useState } from 'react';
import {
  StatCardSkeleton,
  QuickStatCardSkeleton,
  MapSearchCardSkeleton,
  StatsRankingCardSkeleton,
  ChartCardSkeleton,
  GenericCardSkeleton,
  FilterCardSkeleton,
  TabsCardSkeleton,
} from '@/components/ui/dashboard-skeletons';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';

export default function TestSkeletonsPage() {
  const [showSkeletons, setShowSkeletons] = useState(true);

  return (
    <div className="container mx-auto p-6 space-y-8">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">Dashboard Skeleton Components</h1>
          <p className="text-muted-foreground mt-2">
            Testing and demonstration of loading skeleton components for the Sintesa Finance Dashboard
          </p>
        </div>
        <Button 
          onClick={() => setShowSkeletons(!showSkeletons)}
          variant={showSkeletons ? "destructive" : "default"}
        >
          {showSkeletons ? 'Hide Skeletons' : 'Show Skeletons'}
        </Button>
      </div>

      {showSkeletons ? (
        <div className="space-y-8">
          {/* StatCardSkeleton Demo */}
          <section>
            <h2 className="text-2xl font-semibold mb-4">StatCardSkeleton</h2>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <StatCardSkeleton />
              <StatCardSkeleton />
              <StatCardSkeleton />
            </div>
          </section>

          {/* QuickStatCardSkeleton Demo */}
          <section>
            <h2 className="text-2xl font-semibold mb-4">QuickStatCardSkeleton</h2>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
              <QuickStatCardSkeleton />
              <QuickStatCardSkeleton />
              <QuickStatCardSkeleton />
              <QuickStatCardSkeleton />
            </div>
          </section>

          {/* MapSearchCardSkeleton Demo */}
          <section>
            <h2 className="text-2xl font-semibold mb-4">MapSearchCardSkeleton</h2>
            <MapSearchCardSkeleton className="max-w-4xl" />
          </section>

          {/* StatsRankingCardSkeleton Demo */}
          <section>
            <h2 className="text-2xl font-semibold mb-4">StatsRankingCardSkeleton</h2>
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
              <StatsRankingCardSkeleton />
              <StatsRankingCardSkeleton />
            </div>
          </section>

          {/* ChartCardSkeleton Demo */}
          <section>
            <h2 className="text-2xl font-semibold mb-4">ChartCardSkeleton</h2>
            <div className="grid grid-cols-1 xl:grid-cols-2 gap-6">
              <ChartCardSkeleton />
              <ChartCardSkeleton />
            </div>
          </section>

          {/* GenericCardSkeleton Demo */}
          <section>
            <h2 className="text-2xl font-semibold mb-4">GenericCardSkeleton Variants</h2>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
              <div className="space-y-2">
                <h3 className="text-sm font-medium text-muted-foreground">Basic</h3>
                <GenericCardSkeleton />
              </div>
              <div className="space-y-2">
                <h3 className="text-sm font-medium text-muted-foreground">With Description</h3>
                <GenericCardSkeleton showDescription={true} />
              </div>
              <div className="space-y-2">
                <h3 className="text-sm font-medium text-muted-foreground">With Footer</h3>
                <GenericCardSkeleton showFooter={true} />
              </div>
              <div className="space-y-2">
                <h3 className="text-sm font-medium text-muted-foreground">More Content</h3>
                <GenericCardSkeleton contentLines={5} />
              </div>
              <div className="space-y-2">
                <h3 className="text-sm font-medium text-muted-foreground">Full Featured</h3>
                <GenericCardSkeleton 
                  showDescription={true} 
                  showFooter={true} 
                  contentLines={4} 
                />
              </div>
              <div className="space-y-2">
                <h3 className="text-sm font-medium text-muted-foreground">No Header</h3>
                <GenericCardSkeleton showHeader={false} contentLines={3} />
              </div>
            </div>
          </section>

          {/* FilterCardSkeleton Demo */}
          <section>
            <h2 className="text-2xl font-semibold mb-4">FilterCardSkeleton</h2>
            <FilterCardSkeleton />
          </section>

          {/* TabsCardSkeleton Demo */}
          <section>
            <h2 className="text-2xl font-semibold mb-4">TabsCardSkeleton</h2>
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
              <TabsCardSkeleton />
              <TabsCardSkeleton />
            </div>
          </section>

          {/* Complete Dashboard Layout Demo */}
          <section>
            <h2 className="text-2xl font-semibold mb-4">Complete Dashboard Layout</h2>
            <div className="space-y-6">
              {/* Filter Section */}
              <FilterCardSkeleton />
              
              {/* Quick Stats Grid */}
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
                <QuickStatCardSkeleton />
                <QuickStatCardSkeleton />
                <QuickStatCardSkeleton />
                <QuickStatCardSkeleton />
              </div>
              
              {/* Main Content Grid */}
              <div className="grid grid-cols-1 xl:grid-cols-3 gap-6">
                {/* Map Card */}
                <div className="xl:col-span-2">
                  <MapSearchCardSkeleton className="h-96" />
                </div>
                
                {/* Stats Card */}
                <div className="xl:col-span-1">
                  <StatCardSkeleton />
                </div>
                
                {/* Chart Cards */}
                <div className="xl:col-span-2">
                  <ChartCardSkeleton />
                </div>
                
                {/* Ranking Card */}
                <div className="xl:col-span-1">
                  <StatsRankingCardSkeleton />
                </div>
              </div>
            </div>
          </section>
        </div>
      ) : (
        <Card>
          <CardHeader>
            <CardTitle>Skeleton Components Hidden</CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-muted-foreground">
              Click "Show Skeletons" to view all the loading skeleton components.
              These skeletons provide smooth loading transitions for dashboard cards.
            </p>
            <div className="mt-4 space-y-2">
              <h3 className="font-medium">Available Skeleton Components:</h3>
              <ul className="list-disc list-inside space-y-1 text-sm text-muted-foreground">
                <li>StatCardSkeleton - For stat cards with icons and values</li>
                <li>QuickStatCardSkeleton - For compact stat cards with trend badges</li>
                <li>MapSearchCardSkeleton - For map cards with search functionality</li>
                <li>StatsRankingCardSkeleton - For ranking lists (top/bottom)</li>
                <li>ChartCardSkeleton - For chart cards with legends and data</li>
                <li>GenericCardSkeleton - Flexible skeleton for any card layout</li>
                <li>FilterCardSkeleton - For filter cards with form inputs</li>
                <li>TabsCardSkeleton - For tabbed content cards</li>
              </ul>
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  );
}