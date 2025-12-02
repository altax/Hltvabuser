import { useQuery } from "@tanstack/react-query";
import { Link } from "wouter";
import {
  Users,
  Trophy,
  Bomb,
  Database,
  ChevronRight,
  Zap,
} from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { StatCard } from "@/components/stat-card";
import { MatchCard } from "@/components/match-card";
import { GrenadeStatsCard } from "@/components/grenade-stats-card";
import {
  StatCardSkeleton,
  MatchCardSkeleton,
  GrenadeStatsCardSkeleton,
} from "@/components/loading-skeleton";
import { NoDataState, ErrorState } from "@/components/empty-state";
import type { DashboardStats } from "@shared/schema";
import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  Cell,
} from "recharts";

const CHART_COLORS = [
  "hsl(var(--chart-1))",
  "hsl(var(--chart-2))",
  "hsl(var(--chart-3))",
  "hsl(var(--chart-4))",
  "hsl(var(--chart-5))",
];

export default function Dashboard() {
  const {
    data: stats,
    isLoading,
    error,
    refetch,
  } = useQuery<DashboardStats>({
    queryKey: ["/api/stats/dashboard"],
  });

  if (error) {
    return (
      <div className="p-6">
        <ErrorState
          message="Failed to load dashboard data"
          onRetry={() => refetch()}
        />
      </div>
    );
  }

  return (
    <div className="p-6 space-y-6">
      <div className="flex items-center justify-between flex-wrap gap-4">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">Dashboard</h1>
          <p className="text-muted-foreground">
            CS2 match analytics and grenade statistics overview
          </p>
        </div>
        <Button asChild data-testid="button-start-collection">
          <Link href="/collection">
            <Zap className="mr-2 h-4 w-4" />
            Start Collection
          </Link>
        </Button>
      </div>

      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
        {isLoading ? (
          <>
            <StatCardSkeleton />
            <StatCardSkeleton />
            <StatCardSkeleton />
            <StatCardSkeleton />
          </>
        ) : (
          <>
            <StatCard
              title="Teams Tracked"
              value={stats?.totalTeams ?? 0}
              description="Top 30 HLTV teams"
              icon={Users}
            />
            <StatCard
              title="Matches Analyzed"
              value={stats?.totalMatches ?? 0}
              description="With detailed round data"
              icon={Trophy}
            />
            <StatCard
              title="Grenade Kills"
              value={stats?.totalGrenadeKills ?? 0}
              description="HE + Molotov kills tracked"
              icon={Bomb}
            />
            <StatCard
              title="Collection Progress"
              value={`${stats?.collectionProgress ?? 0}%`}
              description="50 matches per team target"
              icon={Database}
            />
          </>
        )}
      </div>

      <div className="grid gap-6 lg:grid-cols-2">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between gap-2">
            <CardTitle className="text-lg">Recent Matches</CardTitle>
            <Button variant="ghost" size="sm" asChild>
              <Link href="/matches" data-testid="link-view-all-matches">
                View all
                <ChevronRight className="ml-1 h-4 w-4" />
              </Link>
            </Button>
          </CardHeader>
          <CardContent className="space-y-3">
            {isLoading ? (
              <>
                <MatchCardSkeleton />
                <MatchCardSkeleton />
                <MatchCardSkeleton />
              </>
            ) : stats?.recentMatches && stats.recentMatches.length > 0 ? (
              stats.recentMatches.slice(0, 5).map((match) => (
                <MatchCard key={match.id} match={match} />
              ))
            ) : (
              <NoDataState />
            )}
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between gap-2">
            <CardTitle className="text-lg">Top Grenade Specialists</CardTitle>
            <Button variant="ghost" size="sm" asChild>
              <Link href="/grenades" data-testid="link-view-all-grenades">
                View all
                <ChevronRight className="ml-1 h-4 w-4" />
              </Link>
            </Button>
          </CardHeader>
          <CardContent className="space-y-3">
            {isLoading ? (
              <>
                <GrenadeStatsCardSkeleton />
                <GrenadeStatsCardSkeleton />
                <GrenadeStatsCardSkeleton />
              </>
            ) : stats?.topGrenadeKillers && stats.topGrenadeKillers.length > 0 ? (
              stats.topGrenadeKillers.slice(0, 3).map((player, index) => (
                <GrenadeStatsCard key={player.playerId} stats={player} rank={index + 1} />
              ))
            ) : (
              <NoDataState />
            )}
          </CardContent>
        </Card>
      </div>

      <Card>
        <CardHeader className="flex flex-row items-center justify-between gap-2">
          <CardTitle className="text-lg">Grenade Deaths by Map</CardTitle>
          <Button variant="ghost" size="sm" asChild>
            <Link href="/maps" data-testid="link-view-all-maps">
              View details
              <ChevronRight className="ml-1 h-4 w-4" />
            </Link>
          </Button>
        </CardHeader>
        <CardContent>
          {isLoading ? (
            <div className="h-[300px] flex items-center justify-center">
              <div className="text-muted-foreground">Loading chart...</div>
            </div>
          ) : stats?.mapStats && stats.mapStats.length > 0 ? (
            <ResponsiveContainer width="100%" height={300}>
              <BarChart data={stats.mapStats} margin={{ top: 20, right: 30, left: 20, bottom: 60 }}>
                <CartesianGrid strokeDasharray="3 3" className="stroke-muted" />
                <XAxis
                  dataKey="mapName"
                  tick={{ fontSize: 12 }}
                  angle={-45}
                  textAnchor="end"
                  height={80}
                  className="fill-muted-foreground"
                />
                <YAxis tick={{ fontSize: 12 }} className="fill-muted-foreground" />
                <Tooltip
                  contentStyle={{
                    backgroundColor: "hsl(var(--card))",
                    border: "1px solid hsl(var(--border))",
                    borderRadius: "8px",
                  }}
                  labelStyle={{ color: "hsl(var(--foreground))" }}
                />
                <Bar dataKey="totalGrenadeDeaths" name="Grenade Deaths" radius={[4, 4, 0, 0]}>
                  {stats.mapStats.map((_, index) => (
                    <Cell key={`cell-${index}`} fill={CHART_COLORS[index % CHART_COLORS.length]} />
                  ))}
                </Bar>
              </BarChart>
            </ResponsiveContainer>
          ) : (
            <div className="h-[300px] flex items-center justify-center">
              <NoDataState />
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
