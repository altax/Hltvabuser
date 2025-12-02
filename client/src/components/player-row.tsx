import { Link } from "wouter";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Badge } from "@/components/ui/badge";
import { TableCell, TableRow } from "@/components/ui/table";
import { Bomb, Crosshair, Skull } from "lucide-react";
import type { PlayerWithStats } from "@shared/schema";
import { cn } from "@/lib/utils";

interface PlayerRowProps {
  player: PlayerWithStats;
  rank?: number;
}

export function PlayerRow({ player, rank }: PlayerRowProps) {
  const kd = player.avgDeaths > 0 ? (player.avgKills / player.avgDeaths).toFixed(2) : player.avgKills.toFixed(2);

  return (
    <TableRow
      className="hover-elevate cursor-pointer"
      data-testid={`row-player-${player.id}`}
    >
      <TableCell className="w-12">
        {rank !== undefined && (
          <span className="font-mono text-sm text-muted-foreground">
            #{rank}
          </span>
        )}
      </TableCell>
      <TableCell>
        <Link href={`/players/${player.id}`} className="flex items-center gap-3">
          <Avatar className="h-9 w-9 border">
            <AvatarImage src={player.avatar || undefined} alt={player.name} />
            <AvatarFallback>
              {player.name.substring(0, 2).toUpperCase()}
            </AvatarFallback>
          </Avatar>
          <div>
            <p className="font-medium">{player.name}</p>
            {player.realName && (
              <p className="text-xs text-muted-foreground">{player.realName}</p>
            )}
          </div>
        </Link>
      </TableCell>
      <TableCell>
        {player.team && (
          <Badge variant="outline" className="font-normal">
            {player.team.name}
          </Badge>
        )}
      </TableCell>
      <TableCell className="text-right">
        <div className="flex items-center justify-end gap-1.5">
          <Crosshair className="h-3.5 w-3.5 text-muted-foreground" />
          <span className="font-mono">{player.avgKills.toFixed(1)}</span>
        </div>
      </TableCell>
      <TableCell className="text-right">
        <div className="flex items-center justify-end gap-1.5">
          <Skull className="h-3.5 w-3.5 text-muted-foreground" />
          <span className="font-mono">{player.avgDeaths.toFixed(1)}</span>
        </div>
      </TableCell>
      <TableCell className="text-right">
        <span
          className={cn(
            "font-mono font-medium",
            parseFloat(kd) >= 1.2
              ? "text-green-500"
              : parseFloat(kd) < 0.9
              ? "text-red-500"
              : ""
          )}
        >
          {kd}
        </span>
      </TableCell>
      <TableCell className="text-right">
        <span
          className={cn(
            "font-mono font-medium",
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
      <TableCell className="text-right">
        <div className="flex items-center justify-end gap-1.5">
          <Bomb className="h-3.5 w-3.5 text-orange-500" />
          <span className="font-mono font-medium text-orange-500">
            {player.totalGrenadeKills}
          </span>
        </div>
      </TableCell>
      <TableCell className="text-right text-muted-foreground">
        <span className="font-mono">{player.matchesPlayed}</span>
      </TableCell>
    </TableRow>
  );
}
