import { useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { RefreshCw, Trophy, Medal, Star } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Badge } from "@/components/ui/badge";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { StatCard } from "@/components/stat-card";
import { StatCardSkeleton, TableSkeleton } from "@/components/loading-skeleton";
import { NoDataState, ErrorState } from "@/components/empty-state";
import type { PlayerWithStats, Team } from "@shared/schema";
import { cn } from "@/lib/utils";

interface RankingsData {
  topPlayers: PlayerWithStats[];
  topTeams: (Team & {
    winRate: number;
    totalMatches: number;
    avgRating: number;
  })[];
  topFraggers: PlayerWithStats[];
  topGrenadeKillers: PlayerWithStats[];
}

export default function RankingsPage() {
  const {
    data,
    isLoading,
    error,
    refetch,
  } = useQuery<RankingsData>({
    queryKey: ["/api/stats/rankings"],
  });

  if (error) {
    return (
      <div className="p-6">
        <ErrorState
          message="Failed to load rankings"
          onRetry={() => refetch()}
        />
      </div>
    );
  }

  const getRankIcon = (rank: number) => {
    switch (rank) {
      case 1:
        return <Trophy className="h-4 w-4 text-yellow-500" />;
      case 2:
        return <Medal className="h-4 w-4 text-gray-400" />;
      case 3:
        return <Medal className="h-4 w-4 text-amber-600" />;
      default:
        return null;
    }
  };

  return (
    <div className="p-6 space-y-6">
      <div className="flex items-center justify-between flex-wrap gap-4">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">Rankings</h1>
          <p className="text-muted-foreground">
            Player and team performance rankings
          </p>
        </div>
        <Button
          variant="outline"
          onClick={() => refetch()}
          disabled={isLoading}
          data-testid="button-refresh-rankings"
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
              title="Top Player"
              value={data?.topPlayers?.[0]?.name ?? "N/A"}
              description={`Rating: ${data?.topPlayers?.[0]?.avgRating?.toFixed(2) ?? "0"}`}
              icon={Star}
            />
            <StatCard
              title="Top Team"
              value={data?.topTeams?.[0]?.name ?? "N/A"}
              description={`Win rate: ${data?.topTeams?.[0]?.winRate?.toFixed(1) ?? 0}%`}
              icon={Trophy}
            />
            <StatCard
              title="Top Fragger"
              value={data?.topFraggers?.[0]?.name ?? "N/A"}
              description={`Avg kills: ${data?.topFraggers?.[0]?.avgKills?.toFixed(1) ?? 0}`}
              icon={Medal}
            />
            <StatCard
              title="Grenade Master"
              value={data?.topGrenadeKillers?.[0]?.name ?? "N/A"}
              description={`Total: ${data?.topGrenadeKillers?.[0]?.totalGrenadeKills ?? 0} kills`}
              icon={Medal}
            />
          </>
        )}
      </div>

      <Tabs defaultValue="players" className="space-y-4">
        <TabsList>
          <TabsTrigger value="players" data-testid="tab-ranking-players">
            Players by Rating
          </TabsTrigger>
          <TabsTrigger value="teams" data-testid="tab-ranking-teams">
            Teams by Win Rate
          </TabsTrigger>
          <TabsTrigger value="fraggers" data-testid="tab-ranking-fraggers">
            Top Fraggers
          </TabsTrigger>
          <TabsTrigger value="grenades" data-testid="tab-ranking-grenades">
            Grenade Specialists
          </TabsTrigger>
        </TabsList>

        <TabsContent value="players">
          <Card>
            <CardHeader>
              <CardTitle className="text-lg">Top Players by Rating</CardTitle>
            </CardHeader>
            <CardContent>
              {isLoading ? (
                <TableSkeleton rows={10} />
              ) : data?.topPlayers && data.topPlayers.length > 0 ? (
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead className="w-16">Rank</TableHead>
                      <TableHead>Player</TableHead>
                      <TableHead>Team</TableHead>
                      <TableHead className="text-right">Rating</TableHead>
                      <TableHead className="text-right">K/D</TableHead>
                      <TableHead className="text-right">Matches</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {data.topPlayers.map((player, index) => (
                      <TableRow key={player.id} className="hover-elevate">
                        <TableCell>
                          <div className="flex items-center gap-1">
                            {getRankIcon(index + 1)}
                            <span className="font-mono">#{index + 1}</span>
                          </div>
                        </TableCell>
                        <TableCell>
                          <div className="flex items-center gap-2">
                            <Avatar className="h-8 w-8">
                              <AvatarImage src={player.avatar || undefined} />
                              <AvatarFallback>
                                {player.name.substring(0, 2).toUpperCase()}
                              </AvatarFallback>
                            </Avatar>
                            <span className="font-medium">{player.name}</span>
                          </div>
                        </TableCell>
                        <TableCell>
                          <Badge variant="outline">{player.team?.name || "N/A"}</Badge>
                        </TableCell>
                        <TableCell className="text-right">
                          <span
                            className={cn(
                              "font-mono font-bold",
                              player.avgRating >= 1.1
                                ? "text-green-500"
                                : player.avgRating < 0.95
                                ? "text-red-500"
                                : ""
                            )}
                          >
                            {player.avgRating.toFixed(2)}
                          </span>
                        </TableCell>
                        <TableCell className="text-right font-mono">
                          {player.avgDeaths > 0
                            ? (player.avgKills / player.avgDeaths).toFixed(2)
                            : player.avgKills.toFixed(2)}
                        </TableCell>
                        <TableCell className="text-right font-mono text-muted-foreground">
                          {player.matchesPlayed}
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              ) : (
                <NoDataState />
              )}
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="teams">
          <Card>
            <CardHeader>
              <CardTitle className="text-lg">Top Teams by Win Rate</CardTitle>
            </CardHeader>
            <CardContent>
              {isLoading ? (
                <TableSkeleton rows={10} />
              ) : data?.topTeams && data.topTeams.length > 0 ? (
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead className="w-16">Rank</TableHead>
                      <TableHead>Team</TableHead>
                      <TableHead className="text-right">Win Rate</TableHead>
                      <TableHead className="text-right">Avg Rating</TableHead>
                      <TableHead className="text-right">Matches</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {data.topTeams.map((team, index) => (
                      <TableRow key={team.id} className="hover-elevate">
                        <TableCell>
                          <div className="flex items-center gap-1">
                            {getRankIcon(index + 1)}
                            <span className="font-mono">#{index + 1}</span>
                          </div>
                        </TableCell>
                        <TableCell>
                          <div className="flex items-center gap-2">
                            <Avatar className="h-8 w-8 rounded-md">
                              <AvatarImage src={team.logo || undefined} />
                              <AvatarFallback className="rounded-md">
                                {team.name.substring(0, 2).toUpperCase()}
                              </AvatarFallback>
                            </Avatar>
                            <span className="font-medium">{team.name}</span>
                            {team.rank && (
                              <Badge variant="secondary" className="text-xs">
                                #{team.rank}
                              </Badge>
                            )}
                          </div>
                        </TableCell>
                        <TableCell className="text-right">
                          <span
                            className={cn(
                              "font-mono font-bold",
                              team.winRate >= 60
                                ? "text-green-500"
                                : team.winRate < 40
                                ? "text-red-500"
                                : ""
                            )}
                          >
                            {team.winRate.toFixed(1)}%
                          </span>
                        </TableCell>
                        <TableCell className="text-right font-mono">
                          {team.avgRating.toFixed(2)}
                        </TableCell>
                        <TableCell className="text-right font-mono text-muted-foreground">
                          {team.totalMatches}
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              ) : (
                <NoDataState />
              )}
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="fraggers">
          <Card>
            <CardHeader>
              <CardTitle className="text-lg">Top Fraggers by Average Kills</CardTitle>
            </CardHeader>
            <CardContent>
              {isLoading ? (
                <TableSkeleton rows={10} />
              ) : data?.topFraggers && data.topFraggers.length > 0 ? (
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead className="w-16">Rank</TableHead>
                      <TableHead>Player</TableHead>
                      <TableHead>Team</TableHead>
                      <TableHead className="text-right">Avg Kills</TableHead>
                      <TableHead className="text-right">Avg Deaths</TableHead>
                      <TableHead className="text-right">Matches</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {data.topFraggers.map((player, index) => (
                      <TableRow key={player.id} className="hover-elevate">
                        <TableCell>
                          <div className="flex items-center gap-1">
                            {getRankIcon(index + 1)}
                            <span className="font-mono">#{index + 1}</span>
                          </div>
                        </TableCell>
                        <TableCell>
                          <div className="flex items-center gap-2">
                            <Avatar className="h-8 w-8">
                              <AvatarImage src={player.avatar || undefined} />
                              <AvatarFallback>
                                {player.name.substring(0, 2).toUpperCase()}
                              </AvatarFallback>
                            </Avatar>
                            <span className="font-medium">{player.name}</span>
                          </div>
                        </TableCell>
                        <TableCell>
                          <Badge variant="outline">{player.team?.name || "N/A"}</Badge>
                        </TableCell>
                        <TableCell className="text-right font-mono font-bold text-green-500">
                          {player.avgKills.toFixed(1)}
                        </TableCell>
                        <TableCell className="text-right font-mono">
                          {player.avgDeaths.toFixed(1)}
                        </TableCell>
                        <TableCell className="text-right font-mono text-muted-foreground">
                          {player.matchesPlayed}
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              ) : (
                <NoDataState />
              )}
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="grenades">
          <Card>
            <CardHeader>
              <CardTitle className="text-lg">Top Grenade Specialists</CardTitle>
            </CardHeader>
            <CardContent>
              {isLoading ? (
                <TableSkeleton rows={10} />
              ) : data?.topGrenadeKillers && data.topGrenadeKillers.length > 0 ? (
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead className="w-16">Rank</TableHead>
                      <TableHead>Player</TableHead>
                      <TableHead>Team</TableHead>
                      <TableHead className="text-right">Grenade Kills</TableHead>
                      <TableHead className="text-right">Matches</TableHead>
                      <TableHead className="text-right">Kills/Match</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {data.topGrenadeKillers.map((player, index) => (
                      <TableRow key={player.id} className="hover-elevate">
                        <TableCell>
                          <div className="flex items-center gap-1">
                            {getRankIcon(index + 1)}
                            <span className="font-mono">#{index + 1}</span>
                          </div>
                        </TableCell>
                        <TableCell>
                          <div className="flex items-center gap-2">
                            <Avatar className="h-8 w-8">
                              <AvatarImage src={player.avatar || undefined} />
                              <AvatarFallback>
                                {player.name.substring(0, 2).toUpperCase()}
                              </AvatarFallback>
                            </Avatar>
                            <span className="font-medium">{player.name}</span>
                          </div>
                        </TableCell>
                        <TableCell>
                          <Badge variant="outline">{player.team?.name || "N/A"}</Badge>
                        </TableCell>
                        <TableCell className="text-right font-mono font-bold text-orange-500">
                          {player.totalGrenadeKills}
                        </TableCell>
                        <TableCell className="text-right font-mono text-muted-foreground">
                          {player.matchesPlayed}
                        </TableCell>
                        <TableCell className="text-right font-mono">
                          {player.matchesPlayed > 0
                            ? (player.totalGrenadeKills / player.matchesPlayed).toFixed(2)
                            : "0.00"}
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              ) : (
                <NoDataState />
              )}
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
}
