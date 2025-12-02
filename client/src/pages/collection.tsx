import { useState } from "react";
import { useQuery, useMutation } from "@tanstack/react-query";
import {
  Play,
  Pause,
  RefreshCw,
  CheckCircle2,
  Clock,
  AlertCircle,
  Loader2,
  Database,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Progress } from "@/components/ui/progress";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { StatCard } from "@/components/stat-card";
import { StatCardSkeleton } from "@/components/loading-skeleton";
import { ErrorState } from "@/components/empty-state";
import { useToast } from "@/hooks/use-toast";
import { apiRequest, queryClient } from "@/lib/queryClient";
import type { Team, DataCollectionJob } from "@shared/schema";

interface CollectionData {
  teams: Team[];
  jobs: (DataCollectionJob & { team: Team | null })[];
  summary: {
    totalTeams: number;
    completedTeams: number;
    pendingTeams: number;
    inProgressTeams: number;
    totalMatches: number;
  };
}

export default function CollectionPage() {
  const { toast } = useToast();

  const {
    data,
    isLoading,
    error,
    refetch,
  } = useQuery<CollectionData>({
    queryKey: ["/api/collection"],
  });

  const startCollectionMutation = useMutation({
    mutationFn: async (teamId?: number) => {
      return apiRequest("POST", "/api/collection/start", { teamId });
    },
    onSuccess: () => {
      toast({
        title: "Collection started",
        description: "Data collection has been initiated",
      });
      queryClient.invalidateQueries({ queryKey: ["/api/collection"] });
    },
    onError: (error: Error) => {
      toast({
        title: "Failed to start collection",
        description: error.message,
        variant: "destructive",
      });
    },
  });

  const fetchTeamsMutation = useMutation({
    mutationFn: async () => {
      return apiRequest("POST", "/api/teams/fetch");
    },
    onSuccess: () => {
      toast({
        title: "Teams fetched",
        description: "Top 30 teams have been fetched from HLTV",
      });
      queryClient.invalidateQueries({ queryKey: ["/api/collection"] });
      queryClient.invalidateQueries({ queryKey: ["/api/teams"] });
    },
    onError: (error: Error) => {
      toast({
        title: "Failed to fetch teams",
        description: error.message,
        variant: "destructive",
      });
    },
  });

  if (error) {
    return (
      <div className="p-6">
        <ErrorState
          message="Failed to load collection data"
          onRetry={() => refetch()}
        />
      </div>
    );
  }

  const getStatusBadge = (status: string | null) => {
    switch (status) {
      case "completed":
        return (
          <Badge variant="default">
            <CheckCircle2 className="h-3 w-3 mr-1" />
            Completed
          </Badge>
        );
      case "in_progress":
        return (
          <Badge variant="secondary">
            <Loader2 className="h-3 w-3 mr-1 animate-spin" />
            In Progress
          </Badge>
        );
      case "failed":
        return (
          <Badge variant="destructive">
            <AlertCircle className="h-3 w-3 mr-1" />
            Failed
          </Badge>
        );
      default:
        return (
          <Badge variant="outline">
            <Clock className="h-3 w-3 mr-1" />
            Pending
          </Badge>
        );
    }
  };

  const overallProgress = data?.summary
    ? (data.summary.completedTeams / data.summary.totalTeams) * 100
    : 0;

  return (
    <div className="p-6 space-y-6">
      <div className="flex items-center justify-between flex-wrap gap-4">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">Data Collection</h1>
          <p className="text-muted-foreground">
            Collect and parse match data from HLTV
          </p>
        </div>
        <div className="flex items-center gap-2 flex-wrap">
          <Button
            variant="outline"
            onClick={() => fetchTeamsMutation.mutate()}
            disabled={fetchTeamsMutation.isPending}
            data-testid="button-fetch-teams"
          >
            {fetchTeamsMutation.isPending ? (
              <Loader2 className="mr-2 h-4 w-4 animate-spin" />
            ) : (
              <RefreshCw className="mr-2 h-4 w-4" />
            )}
            Fetch Teams
          </Button>
          <Button
            onClick={() => startCollectionMutation.mutate()}
            disabled={startCollectionMutation.isPending}
            data-testid="button-start-all-collection"
          >
            {startCollectionMutation.isPending ? (
              <Loader2 className="mr-2 h-4 w-4 animate-spin" />
            ) : (
              <Play className="mr-2 h-4 w-4" />
            )}
            Collect All Teams
          </Button>
        </div>
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
              title="Total Teams"
              value={data?.summary?.totalTeams ?? 0}
              description="Top 30 HLTV ranking"
              icon={Database}
            />
            <StatCard
              title="Completed"
              value={data?.summary?.completedTeams ?? 0}
              description="50 matches collected"
              icon={CheckCircle2}
            />
            <StatCard
              title="In Progress"
              value={data?.summary?.inProgressTeams ?? 0}
              description="Currently collecting"
              icon={Loader2}
            />
            <StatCard
              title="Total Matches"
              value={data?.summary?.totalMatches ?? 0}
              description="Matches in database"
              icon={Database}
            />
          </>
        )}
      </div>

      <Card>
        <CardHeader>
          <div className="flex items-center justify-between gap-2 flex-wrap">
            <CardTitle className="text-lg">Overall Progress</CardTitle>
            <span className="font-mono text-lg font-bold">
              {overallProgress.toFixed(0)}%
            </span>
          </div>
        </CardHeader>
        <CardContent>
          <Progress value={overallProgress} className="h-3" />
          <p className="mt-2 text-sm text-muted-foreground">
            {data?.summary?.completedTeams ?? 0} of {data?.summary?.totalTeams ?? 0} teams completed
          </p>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle className="text-lg">Team Collection Status</CardTitle>
        </CardHeader>
        <CardContent>
          {isLoading ? (
            <div className="space-y-4">
              {Array.from({ length: 5 }).map((_, i) => (
                <div key={i} className="flex items-center gap-4">
                  <div className="h-10 w-10 bg-muted animate-pulse rounded-full" />
                  <div className="flex-1 space-y-2">
                    <div className="h-4 w-32 bg-muted animate-pulse rounded" />
                    <div className="h-2 w-full bg-muted animate-pulse rounded" />
                  </div>
                </div>
              ))}
            </div>
          ) : data?.teams && data.teams.length > 0 ? (
            <div className="space-y-4">
              {data.teams.map((team) => {
                const job = data.jobs.find((j) => j.teamId === team.id);
                const progress = job
                  ? ((job.matchesCollected || 0) / (job.matchesTarget || 50)) * 100
                  : 0;

                return (
                  <div
                    key={team.id}
                    className="flex items-center gap-4 p-3 rounded-lg border hover-elevate"
                    data-testid={`collection-team-${team.id}`}
                  >
                    <Avatar className="h-10 w-10 border">
                      <AvatarImage src={team.logo || undefined} alt={team.name} />
                      <AvatarFallback>
                        {team.name.substring(0, 2).toUpperCase()}
                      </AvatarFallback>
                    </Avatar>
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center justify-between gap-2 mb-1">
                        <div className="flex items-center gap-2">
                          <span className="font-medium truncate">{team.name}</span>
                          <Badge variant="outline" className="shrink-0">
                            #{team.rank || "?"}
                          </Badge>
                        </div>
                        {getStatusBadge(job?.status || null)}
                      </div>
                      <div className="flex items-center gap-2">
                        <Progress value={progress} className="h-1.5 flex-1" />
                        <span className="text-xs font-mono text-muted-foreground shrink-0">
                          {job?.matchesCollected || 0}/{job?.matchesTarget || 50}
                        </span>
                      </div>
                    </div>
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => startCollectionMutation.mutate(team.id)}
                      disabled={
                        startCollectionMutation.isPending || job?.status === "in_progress"
                      }
                      data-testid={`button-collect-team-${team.id}`}
                    >
                      {job?.status === "in_progress" ? (
                        <Loader2 className="h-4 w-4 animate-spin" />
                      ) : (
                        <Play className="h-4 w-4" />
                      )}
                    </Button>
                  </div>
                );
              })}
            </div>
          ) : (
            <div className="text-center py-8">
              <Database className="h-12 w-12 mx-auto text-muted-foreground mb-4" />
              <h3 className="font-semibold mb-2">No teams in database</h3>
              <p className="text-sm text-muted-foreground mb-4">
                Click "Fetch Teams" to get the top 30 HLTV teams
              </p>
              <Button
                onClick={() => fetchTeamsMutation.mutate()}
                disabled={fetchTeamsMutation.isPending}
              >
                {fetchTeamsMutation.isPending ? (
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                ) : (
                  <RefreshCw className="mr-2 h-4 w-4" />
                )}
                Fetch Teams
              </Button>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
