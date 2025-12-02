import { useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { Search, SlidersHorizontal, RefreshCw, Calendar } from "lucide-react";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { MatchCard } from "@/components/match-card";
import { MatchCardSkeleton } from "@/components/loading-skeleton";
import { NoResultsState, ErrorState } from "@/components/empty-state";
import type { MatchWithTeams } from "@shared/schema";

const MAPS = [
  "all",
  "de_mirage",
  "de_inferno",
  "de_nuke",
  "de_dust2",
  "de_ancient",
  "de_anubis",
  "de_vertigo",
];

export default function MatchesPage() {
  const [searchQuery, setSearchQuery] = useState("");
  const [mapFilter, setMapFilter] = useState<string>("all");
  const [statusFilter, setStatusFilter] = useState<string>("all");

  const {
    data: matches,
    isLoading,
    error,
    refetch,
  } = useQuery<MatchWithTeams[]>({
    queryKey: ["/api/matches"],
  });

  const filteredMatches = matches
    ?.filter((match) => {
      const matchesSearch =
        match.team1?.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
        match.team2?.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
        match.eventName?.toLowerCase().includes(searchQuery.toLowerCase());

      const matchesMap = mapFilter === "all" || match.mapName === mapFilter;

      const matchesStatus =
        statusFilter === "all" ||
        (statusFilter === "parsed" && match.demoParsed) ||
        (statusFilter === "pending" && !match.demoParsed);

      return matchesSearch && matchesMap && matchesStatus;
    })
    .sort((a, b) => {
      const dateA = a.date ? new Date(a.date).getTime() : 0;
      const dateB = b.date ? new Date(b.date).getTime() : 0;
      return dateB - dateA;
    });

  if (error) {
    return (
      <div className="p-6">
        <ErrorState
          message="Failed to load matches data"
          onRetry={() => refetch()}
        />
      </div>
    );
  }

  return (
    <div className="p-6 space-y-6">
      <div className="flex items-center justify-between flex-wrap gap-4">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">Matches</h1>
          <p className="text-muted-foreground">
            All collected matches from top 30 teams
          </p>
        </div>
        <Button
          variant="outline"
          onClick={() => refetch()}
          disabled={isLoading}
          data-testid="button-refresh-matches"
        >
          <RefreshCw className={`mr-2 h-4 w-4 ${isLoading ? "animate-spin" : ""}`} />
          Refresh
        </Button>
      </div>

      <div className="flex flex-col lg:flex-row gap-4">
        <div className="relative flex-1">
          <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
          <Input
            placeholder="Search by team name or event..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="pl-10"
            data-testid="input-search-matches"
          />
        </div>
        <div className="flex flex-wrap items-center gap-2">
          <SlidersHorizontal className="h-4 w-4 text-muted-foreground shrink-0" />
          <Select value={mapFilter} onValueChange={setMapFilter}>
            <SelectTrigger className="w-[140px]" data-testid="select-map-filter">
              <SelectValue placeholder="Map" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All Maps</SelectItem>
              {MAPS.slice(1).map((map) => (
                <SelectItem key={map} value={map}>
                  {map.replace("de_", "").charAt(0).toUpperCase() +
                    map.replace("de_", "").slice(1)}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
          <Select value={statusFilter} onValueChange={setStatusFilter}>
            <SelectTrigger className="w-[140px]" data-testid="select-status-filter">
              <SelectValue placeholder="Status" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All Status</SelectItem>
              <SelectItem value="parsed">Analyzed</SelectItem>
              <SelectItem value="pending">Pending</SelectItem>
            </SelectContent>
          </Select>
        </div>
      </div>

      <div className="space-y-3">
        {isLoading ? (
          <>
            {Array.from({ length: 10 }).map((_, i) => (
              <MatchCardSkeleton key={i} />
            ))}
          </>
        ) : filteredMatches && filteredMatches.length > 0 ? (
          filteredMatches.map((match) => (
            <MatchCard key={match.id} match={match} />
          ))
        ) : (
          <NoResultsState query={searchQuery} />
        )}
      </div>
    </div>
  );
}
