import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Badge } from "@/components/ui/badge";
import { Bomb, Flame, Sparkles } from "lucide-react";
import type { GrenadeStats } from "@shared/schema";

interface GrenadeStatsCardProps {
  stats: GrenadeStats;
  rank: number;
}

export function GrenadeStatsCard({ stats, rank }: GrenadeStatsCardProps) {
  const totalKills = stats.totalHEKills + stats.totalMolotovKills;

  return (
    <Card className="hover-elevate" data-testid={`card-grenade-stats-${stats.playerId}`}>
      <CardHeader className="pb-2">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="flex h-8 w-8 items-center justify-center rounded-full bg-muted text-sm font-bold">
              #{rank}
            </div>
            <div>
              <CardTitle className="text-base">{stats.playerName}</CardTitle>
              <p className="text-xs text-muted-foreground">{stats.teamName}</p>
            </div>
          </div>
          <Badge variant="secondary" className="font-mono">
            <Sparkles className="h-3 w-3 mr-1 text-yellow-500" />
            {totalKills} kills
          </Badge>
        </div>
      </CardHeader>
      <CardContent>
        <div className="grid grid-cols-2 gap-4 mt-2">
          <div className="space-y-1">
            <div className="flex items-center gap-2 text-sm text-muted-foreground">
              <Bomb className="h-4 w-4 text-orange-500" />
              <span>HE Grenades</span>
            </div>
            <p className="text-xl font-mono font-bold">{stats.totalHEKills}</p>
            <p className="text-xs text-muted-foreground">
              Avg damage: <span className="font-mono">{stats.avgHEDamage.toFixed(1)}</span>
            </p>
          </div>
          <div className="space-y-1">
            <div className="flex items-center gap-2 text-sm text-muted-foreground">
              <Flame className="h-4 w-4 text-red-500" />
              <span>Molotovs</span>
            </div>
            <p className="text-xl font-mono font-bold">{stats.totalMolotovKills}</p>
            <p className="text-xs text-muted-foreground">
              Bought avg: <span className="font-mono">{stats.avgGrenadesBought.toFixed(1)}</span>
            </p>
          </div>
        </div>
        <div className="mt-3 pt-3 border-t">
          <p className="text-xs text-muted-foreground">
            Based on <span className="font-mono font-medium">{stats.matchesPlayed}</span> matches analyzed
          </p>
        </div>
      </CardContent>
    </Card>
  );
}
