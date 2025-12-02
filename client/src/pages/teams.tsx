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
import { TeamCard } from "@/components/team-card";
import { TeamCardSkeleton } from "@/components/loading-skeleton";
import { NoResultsState, ErrorState } from "@/components/empty-state";
import type { Team } from "@shared/schema";

export default function TeamsPage() {
  const [searchQuery, setSearchQuery] = useState("");
  const [sortBy, setSortBy] = useState<string>("rank");

  const {
    data: teams,
    isLoading,
    error,
    refetch,
  } = useQuery<Team[]>({
    queryKey: ["/api/teams"],
  });

  const filteredTeams = teams
    ?.filter(
      (team) =>
        team.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
        team.country?.toLowerCase().includes(searchQuery.toLowerCase())
    )
    .sort((a, b) => {
      switch (sortBy) {
        case "rank":
          return (a.rank ?? 999) - (b.rank ?? 999);
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
          message="Failed to load teams data"
          onRetry={() => refetch()}
        />
      </div>
    );
  }

  return (
    <div className="p-6 space-y-6">
      <div className="flex items-center justify-between flex-wrap gap-4">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">Teams</h1>
          <p className="text-muted-foreground">
            Top 30 HLTV ranked CS2 teams
          </p>
        </div>
        <Button
          variant="outline"
          onClick={() => refetch()}
          disabled={isLoading}
          data-testid="button-refresh-teams"
        >
          <RefreshCw className={`mr-2 h-4 w-4 ${isLoading ? "animate-spin" : ""}`} />
          Refresh
        </Button>
      </div>

      <div className="flex flex-col sm:flex-row gap-4">
        <div className="relative flex-1">
          <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
          <Input
            placeholder="Search teams by name or country..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="pl-10"
            data-testid="input-search-teams"
          />
        </div>
        <div className="flex items-center gap-2">
          <SlidersHorizontal className="h-4 w-4 text-muted-foreground" />
          <Select value={sortBy} onValueChange={setSortBy}>
            <SelectTrigger className="w-[160px]" data-testid="select-sort-teams">
              <SelectValue placeholder="Sort by" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="rank">By Rank</SelectItem>
              <SelectItem value="name">By Name</SelectItem>
            </SelectContent>
          </Select>
        </div>
      </div>

      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
        {isLoading ? (
          <>
            {Array.from({ length: 9 }).map((_, i) => (
              <TeamCardSkeleton key={i} />
            ))}
          </>
        ) : filteredTeams && filteredTeams.length > 0 ? (
          filteredTeams.map((team) => (
            <TeamCard key={team.id} team={team} />
          ))
        ) : (
          <div className="col-span-full">
            <NoResultsState query={searchQuery} />
          </div>
        )}
      </div>
    </div>
  );
}
