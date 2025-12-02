import { useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { Search, RefreshCw, Bomb, Flame, Sparkles } from "lucide-react";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { GrenadeStatsCard } from "@/components/grenade-stats-card";
import { StatCard } from "@/components/stat-card";
import {
  GrenadeStatsCardSkeleton,
  StatCardSkeleton,
} from "@/components/loading-skeleton";
import { NoResultsState, ErrorState } from "@/components/empty-state";
import type { GrenadeStats } from "@shared/schema";
import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  Legend,
} from "recharts";

interface GrenadeAnalyticsData {
  topPlayers: GrenadeStats[];
  summary: {
    totalHEKills: number;
    totalMolotovKills: number;
    avgHEPerMatch: number;
    avgMolotovPerMatch: number;
    mostDeadlyPlayer: string;
    mostDeadlyTeam: string;
  };
  teamStats: {
    teamName: string;
    heKills: number;
    molotovKills: number;
    totalKills: number;
  }[];
}

export default function GrenadesPage() {
  const [searchQuery, setSearchQuery] = useState("");
  const [sortBy, setSortBy] = useState<string>("total");

  const {
    data,
    isLoading,
    error,
    refetch,
  } = useQuery<GrenadeAnalyticsData>({
    queryKey: ["/api/stats/grenades"],
  });

  const filteredPlayers = data?.topPlayers
    ?.filter(
      (player) =>
        player.playerName.toLowerCase().includes(searchQuery.toLowerCase()) ||
        player.teamName.toLowerCase().includes(searchQuery.toLowerCase())
    )
    .sort((a, b) => {
      switch (sortBy) {
        case "he":
          return b.totalHEKills - a.totalHEKills;
        case "molotov":
          return b.totalMolotovKills - a.totalMolotovKills;
        case "total":
        default:
          return (
            b.totalHEKills + b.totalMolotovKills - (a.totalHEKills + a.totalMolotovKills)
          );
      }
    });

  if (error) {
    return (
      <div className="p-6">
        <ErrorState
          message="Failed to load grenade analytics"
          onRetry={() => refetch()}
        />
      </div>
    );
  }

  return (
    <div className="p-6 space-y-6">
      <div className="flex items-center justify-between flex-wrap gap-4">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">Grenade Analytics</h1>
          <p className="text-muted-foreground">
            HE grenade and molotov kill statistics
          </p>
        </div>
        <Button
          variant="outline"
          onClick={() => refetch()}
          disabled={isLoading}
          data-testid="button-refresh-grenades"
        >
          <RefreshCw className={`mr-2 h-4 w-4 ${isLoading ? "animate-spin" : ""}`} />
          Refresh
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
              title="Total HE Kills"
              value={data?.summary?.totalHEKills ?? 0}
              description={`${data?.summary?.avgHEPerMatch?.toFixed(1) ?? 0} per match avg`}
              icon={Bomb}
            />
            <StatCard
              title="Total Molotov Kills"
              value={data?.summary?.totalMolotovKills ?? 0}
              description={`${data?.summary?.avgMolotovPerMatch?.toFixed(1) ?? 0} per match avg`}
              icon={Flame}
            />
            <StatCard
              title="Top Grenade Killer"
              value={data?.summary?.mostDeadlyPlayer ?? "N/A"}
              description="Most grenade kills overall"
              icon={Sparkles}
            />
            <StatCard
              title="Top Grenade Team"
              value={data?.summary?.mostDeadlyTeam ?? "N/A"}
              description="Team with most grenade kills"
              icon={Bomb}
            />
          </>
        )}
      </div>

      <Tabs defaultValue="players" className="space-y-4">
        <TabsList>
          <TabsTrigger value="players" data-testid="tab-grenade-players">
            Top Players
          </TabsTrigger>
          <TabsTrigger value="teams" data-testid="tab-grenade-teams">
            Team Comparison
          </TabsTrigger>
        </TabsList>

        <TabsContent value="players" className="space-y-4">
          <div className="flex flex-col sm:flex-row gap-4">
            <div className="relative flex-1">
              <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
              <Input
                placeholder="Search players or teams..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="pl-10"
                data-testid="input-search-grenade-players"
              />
            </div>
            <Select value={sortBy} onValueChange={setSortBy}>
              <SelectTrigger className="w-[180px]" data-testid="select-sort-grenades">
                <SelectValue placeholder="Sort by" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="total">Total Kills</SelectItem>
                <SelectItem value="he">HE Kills</SelectItem>
                <SelectItem value="molotov">Molotov Kills</SelectItem>
              </SelectContent>
            </Select>
          </div>

          <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
            {isLoading ? (
              Array.from({ length: 9 }).map((_, i) => (
                <GrenadeStatsCardSkeleton key={i} />
              ))
            ) : filteredPlayers && filteredPlayers.length > 0 ? (
              filteredPlayers.map((player, index) => (
                <GrenadeStatsCard
                  key={player.playerId}
                  stats={player}
                  rank={index + 1}
                />
              ))
            ) : (
              <div className="col-span-full">
                <NoResultsState query={searchQuery} />
              </div>
            )}
          </div>
        </TabsContent>

        <TabsContent value="teams">
          <Card>
            <CardHeader>
              <CardTitle className="text-lg">Grenade Kills by Team</CardTitle>
            </CardHeader>
            <CardContent>
              {isLoading ? (
                <div className="h-[400px] flex items-center justify-center">
                  <div className="text-muted-foreground">Loading chart...</div>
                </div>
              ) : data?.teamStats && data.teamStats.length > 0 ? (
                <ResponsiveContainer width="100%" height={400}>
                  <BarChart
                    data={data.teamStats}
                    margin={{ top: 20, right: 30, left: 20, bottom: 100 }}
                  >
                    <CartesianGrid strokeDasharray="3 3" className="stroke-muted" />
                    <XAxis
                      dataKey="teamName"
                      tick={{ fontSize: 11 }}
                      angle={-45}
                      textAnchor="end"
                      height={100}
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
                    <Legend />
                    <Bar
                      dataKey="heKills"
                      name="HE Kills"
                      fill="hsl(var(--chart-2))"
                      radius={[4, 4, 0, 0]}
                    />
                    <Bar
                      dataKey="molotovKills"
                      name="Molotov Kills"
                      fill="hsl(var(--chart-3))"
                      radius={[4, 4, 0, 0]}
                    />
                  </BarChart>
                </ResponsiveContainer>
              ) : (
                <div className="h-[400px] flex items-center justify-center">
                  <NoResultsState />
                </div>
              )}
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
}
