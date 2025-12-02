import { Link } from "wouter";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Calendar, MapPin, CheckCircle2, Clock } from "lucide-react";
import { format } from "date-fns";
import type { MatchWithTeams } from "@shared/schema";
import { cn } from "@/lib/utils";

interface MatchCardProps {
  match: MatchWithTeams;
}

export function MatchCard({ match }: MatchCardProps) {
  const team1Won = match.winnerId === match.team1Id;
  const team2Won = match.winnerId === match.team2Id;

  return (
    <Link href={`/matches/${match.id}`}>
      <Card
        className="hover-elevate cursor-pointer"
        data-testid={`card-match-${match.id}`}
      >
        <CardContent className="p-4">
          <div className="flex items-center justify-between gap-4 mb-3">
            <div className="flex items-center gap-2 text-xs text-muted-foreground">
              <Calendar className="h-3.5 w-3.5" />
              <span>
                {match.date
                  ? format(new Date(match.date), "MMM d, yyyy")
                  : "Unknown date"}
              </span>
            </div>
            <div className="flex items-center gap-2">
              {match.mapName && (
                <Badge variant="outline" className="text-xs">
                  <MapPin className="h-3 w-3 mr-1" />
                  {match.mapName}
                </Badge>
              )}
              {match.demoParsed ? (
                <Badge variant="default" className="text-xs">
                  <CheckCircle2 className="h-3 w-3 mr-1" />
                  Analyzed
                </Badge>
              ) : (
                <Badge variant="secondary" className="text-xs">
                  <Clock className="h-3 w-3 mr-1" />
                  Pending
                </Badge>
              )}
            </div>
          </div>

          <div className="flex items-center justify-between">
            <div
              className={cn(
                "flex items-center gap-3 flex-1",
                team1Won && "font-semibold"
              )}
            >
              <Avatar className="h-10 w-10 border">
                <AvatarImage
                  src={match.team1?.logo || undefined}
                  alt={match.team1?.name}
                />
                <AvatarFallback>
                  {match.team1?.name?.substring(0, 2).toUpperCase() || "T1"}
                </AvatarFallback>
              </Avatar>
              <span className="truncate">{match.team1?.name || "Team 1"}</span>
            </div>

            <div className="flex items-center gap-2 px-4">
              <span
                className={cn(
                  "text-2xl font-mono font-bold tabular-nums",
                  team1Won && "text-green-500"
                )}
              >
                {match.team1Score ?? 0}
              </span>
              <span className="text-muted-foreground">:</span>
              <span
                className={cn(
                  "text-2xl font-mono font-bold tabular-nums",
                  team2Won && "text-green-500"
                )}
              >
                {match.team2Score ?? 0}
              </span>
            </div>

            <div
              className={cn(
                "flex items-center gap-3 flex-1 justify-end",
                team2Won && "font-semibold"
              )}
            >
              <span className="truncate text-right">
                {match.team2?.name || "Team 2"}
              </span>
              <Avatar className="h-10 w-10 border">
                <AvatarImage
                  src={match.team2?.logo || undefined}
                  alt={match.team2?.name}
                />
                <AvatarFallback>
                  {match.team2?.name?.substring(0, 2).toUpperCase() || "T2"}
                </AvatarFallback>
              </Avatar>
            </div>
          </div>

          {match.eventName && (
            <p className="text-xs text-muted-foreground mt-3 text-center truncate">
              {match.eventName}
            </p>
          )}
        </CardContent>
      </Card>
    </Link>
  );
}
