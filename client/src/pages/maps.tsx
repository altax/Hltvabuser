import { useQuery } from "@tanstack/react-query";
import { RefreshCw, Map, Bomb, Flame, Target } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Progress } from "@/components/ui/progress";
import { StatCard } from "@/components/stat-card";
import { StatCardSkeleton } from "@/components/loading-skeleton";
import { NoDataState, ErrorState } from "@/components/empty-state";
import type { MapGrenadeStats } from "@shared/schema";
import {
  PieChart,
  Pie,
  Cell,
  ResponsiveContainer,
  Tooltip,
  Legend,
} from "recharts";

interface MapAnalyticsData {
  maps: MapGrenadeStats[];
  summary: {
    totalMapsPlayed: number;
    totalGrenadeDeaths: number;
    mostDeadlyMap: string;
    avgDeathsPerMatch: number;
  };
}

const CHART_COLORS = [
  "hsl(var(--chart-1))",
  "hsl(var(--chart-2))",
  "hsl(var(--chart-3))",
  "hsl(var(--chart-4))",
  "hsl(var(--chart-5))",
  "hsl(210 85% 45%)",
  "hsl(160 70% 42%)",
];

const MAP_DISPLAY_NAMES: Record<string, string> = {
  de_mirage: "Mirage",
  de_inferno: "Inferno",
  de_nuke: "Nuke",
  de_dust2: "Dust 2",
  de_ancient: "Ancient",
  de_anubis: "Anubis",
  de_vertigo: "Vertigo",
};

export default function MapsPage() {
  const {
    data,
    isLoading,
    error,
    refetch,
  } = useQuery<MapAnalyticsData>({
    queryKey: ["/api/stats/maps"],
  });

  if (error) {
    return (
      <div className="p-6">
        <ErrorState
          message="Failed to load map analytics"
          onRetry={() => refetch()}
        />
      </div>
    );
  }

  const maxDeaths = Math.max(...(data?.maps?.map((m) => m.totalGrenadeDeaths) ?? [1]));

  const pieData = data?.maps?.map((map) => ({
    name: MAP_DISPLAY_NAMES[map.mapName] || map.mapName,
    value: map.totalGrenadeDeaths,
    he: map.heDeaths,
    molotov: map.molotovDeaths,
  }));

  return (
    <div className="p-6 space-y-6">
      <div className="flex items-center justify-between flex-wrap gap-4">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">Map Analysis</h1>
          <p className="text-muted-foreground">
            Grenade death statistics by map
          </p>
        </div>
        <Button
          variant="outline"
          onClick={() => refetch()}
          disabled={isLoading}
          data-testid="button-refresh-maps"
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
              title="Maps Analyzed"
              value={data?.summary?.totalMapsPlayed ?? 0}
              icon={Map}
            />
            <StatCard
              title="Total Grenade Deaths"
              value={data?.summary?.totalGrenadeDeaths ?? 0}
              icon={Bomb}
            />
            <StatCard
              title="Most Deadly Map"
              value={
                MAP_DISPLAY_NAMES[data?.summary?.mostDeadlyMap || ""] ||
                data?.summary?.mostDeadlyMap ||
                "N/A"
              }
              icon={Target}
            />
            <StatCard
              title="Avg Deaths/Match"
              value={(data?.summary?.avgDeathsPerMatch ?? 0).toFixed(1)}
              icon={Flame}
            />
          </>
        )}
      </div>

      <div className="grid gap-6 lg:grid-cols-2">
        <Card>
          <CardHeader>
            <CardTitle className="text-lg">Deaths Distribution</CardTitle>
          </CardHeader>
          <CardContent>
            {isLoading ? (
              <div className="h-[300px] flex items-center justify-center">
                <div className="text-muted-foreground">Loading chart...</div>
              </div>
            ) : pieData && pieData.length > 0 ? (
              <ResponsiveContainer width="100%" height={300}>
                <PieChart>
                  <Pie
                    data={pieData}
                    cx="50%"
                    cy="50%"
                    labelLine={false}
                    outerRadius={100}
                    fill="#8884d8"
                    dataKey="value"
                    label={({ name, percent }) =>
                      `${name} ${(percent * 100).toFixed(0)}%`
                    }
                  >
                    {pieData.map((_, index) => (
                      <Cell
                        key={`cell-${index}`}
                        fill={CHART_COLORS[index % CHART_COLORS.length]}
                      />
                    ))}
                  </Pie>
                  <Tooltip
                    contentStyle={{
                      backgroundColor: "hsl(var(--card))",
                      border: "1px solid hsl(var(--border))",
                      borderRadius: "8px",
                    }}
                    formatter={(value: number, name: string, props: any) => [
                      `${value} deaths (HE: ${props.payload.he}, Molotov: ${props.payload.molotov})`,
                      name,
                    ]}
                  />
                </PieChart>
              </ResponsiveContainer>
            ) : (
              <div className="h-[300px] flex items-center justify-center">
                <NoDataState />
              </div>
            )}
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle className="text-lg">Map Details</CardTitle>
          </CardHeader>
          <CardContent>
            {isLoading ? (
              <div className="space-y-4">
                {Array.from({ length: 5 }).map((_, i) => (
                  <div key={i} className="space-y-2">
                    <div className="h-4 w-24 bg-muted animate-pulse rounded" />
                    <div className="h-2 w-full bg-muted animate-pulse rounded" />
                  </div>
                ))}
              </div>
            ) : data?.maps && data.maps.length > 0 ? (
              <div className="space-y-4">
                {data.maps
                  .sort((a, b) => b.totalGrenadeDeaths - a.totalGrenadeDeaths)
                  .map((map, index) => (
                    <div key={map.mapName} className="space-y-2" data-testid={`map-stat-${map.mapName}`}>
                      <div className="flex items-center justify-between">
                        <div className="flex items-center gap-2">
                          <span className="font-medium">
                            {MAP_DISPLAY_NAMES[map.mapName] || map.mapName}
                          </span>
                          {index === 0 && (
                            <Badge variant="destructive" className="text-xs">
                              Most Deadly
                            </Badge>
                          )}
                        </div>
                        <span className="text-sm font-mono text-muted-foreground">
                          {map.totalGrenadeDeaths} deaths
                        </span>
                      </div>
                      <Progress
                        value={(map.totalGrenadeDeaths / maxDeaths) * 100}
                        className="h-2"
                      />
                      <div className="flex items-center gap-4 text-xs text-muted-foreground">
                        <div className="flex items-center gap-1">
                          <Bomb className="h-3 w-3 text-orange-500" />
                          <span className="font-mono">{map.heDeaths}</span> HE
                        </div>
                        <div className="flex items-center gap-1">
                          <Flame className="h-3 w-3 text-red-500" />
                          <span className="font-mono">{map.molotovDeaths}</span> Molotov
                        </div>
                        <div className="flex items-center gap-1">
                          <Target className="h-3 w-3" />
                          <span className="font-mono">{map.avgDeathsPerMatch.toFixed(1)}</span>/match
                        </div>
                      </div>
                    </div>
                  ))}
              </div>
            ) : (
              <NoDataState />
            )}
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
