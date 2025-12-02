import { Link } from "wouter";
import { Card, CardContent, CardFooter } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Trophy, ChevronRight, Users } from "lucide-react";
import type { Team } from "@shared/schema";

interface TeamCardProps {
  team: Team;
  matchCount?: number;
  winRate?: number;
}

export function TeamCard({ team, matchCount = 0, winRate }: TeamCardProps) {
  return (
    <Card className="hover-elevate group" data-testid={`card-team-${team.id}`}>
      <CardContent className="p-4">
        <div className="flex items-start gap-4">
          <Avatar className="h-16 w-16 rounded-lg border">
            <AvatarImage src={team.logo || undefined} alt={team.name} />
            <AvatarFallback className="rounded-lg bg-muted text-lg font-bold">
              {team.name.substring(0, 2).toUpperCase()}
            </AvatarFallback>
          </Avatar>
          <div className="flex-1 min-w-0">
            <div className="flex items-center gap-2 flex-wrap">
              <h3 className="font-semibold text-lg truncate">{team.name}</h3>
              {team.rank && team.rank <= 10 && (
                <Badge variant="default" className="shrink-0">
                  <Trophy className="h-3 w-3 mr-1" />
                  #{team.rank}
                </Badge>
              )}
              {team.rank && team.rank > 10 && (
                <Badge variant="secondary" className="shrink-0">
                  #{team.rank}
                </Badge>
              )}
            </div>
            <p className="text-sm text-muted-foreground mt-1">
              {team.country || "Unknown region"}
            </p>
            <div className="flex items-center gap-4 mt-3">
              <div className="flex items-center gap-1.5 text-sm text-muted-foreground">
                <Users className="h-4 w-4" />
                <span className="font-mono">{matchCount}</span>
                <span>matches</span>
              </div>
              {winRate !== undefined && (
                <div className="text-sm">
                  <span className="text-muted-foreground">Win rate: </span>
                  <span className="font-mono font-medium">{winRate.toFixed(1)}%</span>
                </div>
              )}
            </div>
          </div>
        </div>
      </CardContent>
      <CardFooter className="px-4 pb-4 pt-0">
        <Button asChild variant="ghost" className="w-full group-hover:bg-muted">
          <Link href={`/teams/${team.id}`} data-testid={`link-team-detail-${team.id}`}>
            View Details
            <ChevronRight className="ml-2 h-4 w-4 transition-transform group-hover:translate-x-1" />
          </Link>
        </Button>
      </CardFooter>
    </Card>
  );
}
