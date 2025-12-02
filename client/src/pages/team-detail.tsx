import { useQuery } from "@tanstack/react-query";
import { useParams, Link } from "wouter";
import {
  ArrowLeft,
  Trophy,
  Users,
  Target,
  Bomb,
  ExternalLink,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { StatCard } from "@/components/stat-card";
import { MatchCard } from "@/components/match-card";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import {
  StatCardSkeleton,
  MatchCardSkeleton,
  PageSkeleton,
} from "@/components/loading-skeleton";
import { NoDataState, ErrorState } from "@/components/empty-state";
import type { Team, Player, MatchWithTeams, MatchPlayerStats } from "@shared/schema";

interface TeamDetailData {
  team: Team;
  players: Player[];
  matches: MatchWithTeams[];
  stats: {
    totalMatches: number;
    wins: number;
    losses: number;
    winRate: number;
    avgKills: number;
    avgDeaths: number;
    totalGrenadeKills: number;
  };
  playerStats: (MatchPlayerStats & { player: Player })[];
}

export default function TeamDetailPage() {
  const { id } = useParams();

  const {
    data,
    isLoading,
    error,
    refetch,
  } = useQuery<TeamDetailData>({
    queryKey: ["/api/teams", id],
    enabled: !!id,
  });

  if (error) {
    return (
      <div className="p-6">
        <ErrorState
          message="Failed to load team data"
          onRetry={() => refetch()}
        />
      </div>
    );
  }

  if (isLoading) {
    return <PageSkeleton />;
  }

  if (!data) {
    return (
      <div className="p-6">
        <NoDataState />
      </div>
    );
  }

  const { team, players, matches, stats, playerStats } = data;

  return (
    <div className="p-6 space-y-6">
      <div className="flex items-start gap-4 flex-wrap">
        <Button variant="ghost" size="icon" asChild>
          <Link href="/teams" data-testid="button-back-to-teams">
            <ArrowLeft className="h-4 w-4" />
          </Link>
        </Button>

        <div className="flex items-start gap-4 flex-1">
          <Avatar className="h-20 w-20 rounded-lg border">
            <AvatarImage src={team.logo || undefined} alt={team.name} />
            <AvatarFallback className="rounded-lg text-2xl font-bold">
              {team.name.substring(0, 2).toUpperCase()}
            </AvatarFallback>
          </Avatar>
          <div className="flex-1">
            <div className="flex items-center gap-3 flex-wrap">
              <h1 className="text-3xl font-bold tracking-tight">{team.name}</h1>
              {team.rank && (
                <Badge variant="default">
                  <Trophy className="h-3 w-3 mr-1" />
                  #{team.rank}
                </Badge>
              )}
            </div>
            <p className="text-muted-foreground">{team.country || "Unknown region"}</p>
            {team.hltvUrl && (
              <a
                href={team.hltvUrl}
                target="_blank"
                rel="noopener noreferrer"
                className="inline-flex items-center text-sm text-primary hover:underline mt-2"
              >
                View on HLTV
                <ExternalLink className="ml-1 h-3 w-3" />
              </a>
            )}
          </div>
        </div>
      </div>

      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
        <StatCard
          title="Win Rate"
          value={`${stats.winRate.toFixed(1)}%`}
          description={`${stats.wins}W - ${stats.losses}L`}
          icon={Trophy}
        />
        <StatCard
          title="Matches Analyzed"
          value={stats.totalMatches}
          icon={Target}
        />
        <StatCard
          title="Avg Kills/Match"
          value={stats.avgKills.toFixed(1)}
          icon={Users}
        />
        <StatCard
          title="Grenade Kills"
          value={stats.totalGrenadeKills}
          icon={Bomb}
        />
      </div>

      <Tabs defaultValue="roster" className="space-y-4">
        <TabsList>
          <TabsTrigger value="roster" data-testid="tab-roster">
            Roster
          </TabsTrigger>
          <TabsTrigger value="matches" data-testid="tab-matches">
            Match History
          </TabsTrigger>
          <TabsTrigger value="stats" data-testid="tab-stats">
            Player Stats
          </TabsTrigger>
        </TabsList>

        <TabsContent value="roster" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle className="text-lg">Active Roster</CardTitle>
            </CardHeader>
            <CardContent>
              {players.length > 0 ? (
                <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-5">
                  {players.map((player) => (
                    <Link
                      key={player.id}
                      href={`/players/${player.id}`}
                      className="flex flex-col items-center p-4 rounded-lg border hover-elevate cursor-pointer"
                      data-testid={`link-player-${player.id}`}
                    >
                      <Avatar className="h-16 w-16 mb-3 border">
                        <AvatarImage src={player.avatar || undefined} alt={player.name} />
                        <AvatarFallback>
                          {player.name.substring(0, 2).toUpperCase()}
                        </AvatarFallback>
                      </Avatar>
                      <p className="font-semibold text-center">{player.name}</p>
                      {player.realName && (
                        <p className="text-xs text-muted-foreground text-center">
                          {player.realName}
                        </p>
                      )}
                      <Badge variant="outline" className="mt-2">
                        {player.country || "Unknown"}
                      </Badge>
                    </Link>
                  ))}
                </div>
              ) : (
                <NoDataState />
              )}
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="matches" className="space-y-4">
          {matches.length > 0 ? (
            <div className="space-y-3">
              {matches.map((match) => (
                <MatchCard key={match.id} match={match} />
              ))}
            </div>
          ) : (
            <Card>
              <CardContent className="py-12">
                <NoDataState />
              </CardContent>
            </Card>
          )}
        </TabsContent>

        <TabsContent value="stats">
          <Card>
            <CardHeader>
              <CardTitle className="text-lg">Aggregated Player Statistics</CardTitle>
            </CardHeader>
            <CardContent>
              {playerStats.length > 0 ? (
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Player</TableHead>
                      <TableHead className="text-right">Avg K</TableHead>
                      <TableHead className="text-right">Avg D</TableHead>
                      <TableHead className="text-right">K/D</TableHead>
                      <TableHead className="text-right">Rating</TableHead>
                      <TableHead className="text-right">HE Kills</TableHead>
                      <TableHead className="text-right">Matches</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {playerStats.map((stat) => (
                      <TableRow key={stat.id} className="hover-elevate">
                        <TableCell>
                          <div className="flex items-center gap-2">
                            <Avatar className="h-8 w-8">
                              <AvatarImage
                                src={stat.player?.avatar || undefined}
                                alt={stat.player?.name}
                              />
                              <AvatarFallback>
                                {stat.player?.name?.substring(0, 2).toUpperCase() || "??"}
                              </AvatarFallback>
                            </Avatar>
                            <span className="font-medium">
                              {stat.player?.name || "Unknown"}
                            </span>
                          </div>
                        </TableCell>
                        <TableCell className="text-right font-mono">
                          {((stat.kills || 0)).toFixed(1)}
                        </TableCell>
                        <TableCell className="text-right font-mono">
                          {((stat.deaths || 0)).toFixed(1)}
                        </TableCell>
                        <TableCell className="text-right font-mono font-medium">
                          {stat.deaths && stat.deaths > 0
                            ? ((stat.kills || 0) / stat.deaths).toFixed(2)
                            : (stat.kills || 0).toFixed(2)}
                        </TableCell>
                        <TableCell className="text-right font-mono">
                          {(stat.rating || 0).toFixed(2)}
                        </TableCell>
                        <TableCell className="text-right font-mono text-orange-500">
                          {stat.heGrenadeKills || 0}
                        </TableCell>
                        <TableCell className="text-right font-mono text-muted-foreground">
                          1
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
