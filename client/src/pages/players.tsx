import { useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { Search, SlidersHorizontal, RefreshCw } from "lucide-react";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import {
  Table,
  TableBody,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { PlayerRow } from "@/components/player-row";
import { TableSkeleton } from "@/components/loading-skeleton";
import { NoResultsState, ErrorState } from "@/components/empty-state";
import type { PlayerWithStats } from "@shared/schema";

export default function PlayersPage() {
  const [searchQuery, setSearchQuery] = useState("");
  const [sortBy, setSortBy] = useState<string>("rating");

  const {
    data: players,
    isLoading,
    error,
    refetch,
  } = useQuery<PlayerWithStats[]>({
    queryKey: ["/api/players"],
  });

  const filteredPlayers = players
    ?.filter(
      (player) =>
        player.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
        player.realName?.toLowerCase().includes(searchQuery.toLowerCase()) ||
        player.team?.name.toLowerCase().includes(searchQuery.toLowerCase())
    )
    .sort((a, b) => {
      switch (sortBy) {
        case "rating":
          return b.avgRating - a.avgRating;
        case "kills":
          return b.avgKills - a.avgKills;
        case "grenades":
          return b.totalGrenadeKills - a.totalGrenadeKills;
        case "name":
          return a.name.localeCompare(b.name);
        default:
          return 0;
      }
    });

  if (error) {
    return (
      <div className="p-6">
        <ErrorState
          message="Failed to load players data"
          onRetry={() => refetch()}
        />
      </div>
    );
  }

  return (
    <div className="p-6 space-y-6">
      <div className="flex items-center justify-between flex-wrap gap-4">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">Players</h1>
          <p className="text-muted-foreground">
            Individual player statistics from top 30 teams
          </p>
        </div>
        <Button
          variant="outline"
          onClick={() => refetch()}
          disabled={isLoading}
          data-testid="button-refresh-players"
        >
          <RefreshCw className={`mr-2 h-4 w-4 ${isLoading ? "animate-spin" : ""}`} />
          Refresh
        </Button>
      </div>

      <div className="flex flex-col sm:flex-row gap-4">
        <div className="relative flex-1">
          <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
          <Input
            placeholder="Search players by name or team..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="pl-10"
            data-testid="input-search-players"
          />
        </div>
        <div className="flex items-center gap-2">
          <SlidersHorizontal className="h-4 w-4 text-muted-foreground" />
          <Select value={sortBy} onValueChange={setSortBy}>
            <SelectTrigger className="w-[180px]" data-testid="select-sort-players">
              <SelectValue placeholder="Sort by" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="rating">By Rating</SelectItem>
              <SelectItem value="kills">By Avg Kills</SelectItem>
              <SelectItem value="grenades">By Grenade Kills</SelectItem>
              <SelectItem value="name">By Name</SelectItem>
            </SelectContent>
          </Select>
        </div>
      </div>

      <Card>
        <CardHeader>
          <CardTitle className="text-lg">Player Statistics</CardTitle>
        </CardHeader>
        <CardContent>
          {isLoading ? (
            <TableSkeleton rows={10} />
          ) : filteredPlayers && filteredPlayers.length > 0 ? (
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead className="w-12">#</TableHead>
                  <TableHead>Player</TableHead>
                  <TableHead>Team</TableHead>
                  <TableHead className="text-right">Avg K</TableHead>
                  <TableHead className="text-right">Avg D</TableHead>
                  <TableHead className="text-right">K/D</TableHead>
                  <TableHead className="text-right">Rating</TableHead>
                  <TableHead className="text-right">HE Kills</TableHead>
                  <TableHead className="text-right">Matches</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {filteredPlayers.map((player, index) => (
                  <PlayerRow key={player.id} player={player} rank={index + 1} />
                ))}
              </TableBody>
            </Table>
          ) : (
            <NoResultsState query={searchQuery} />
          )}
        </CardContent>
      </Card>
    </div>
  );
}
