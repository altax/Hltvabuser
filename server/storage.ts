import {
  teams,
  players,
  matches,
  rounds,
  kills,
  matchPlayerStats,
  grenadeDeathLocations,
  dataCollectionJobs,
  type Team,
  type InsertTeam,
  type Player,
  type InsertPlayer,
  type Match,
  type InsertMatch,
  type Round,
  type InsertRound,
  type Kill,
  type InsertKill,
  type MatchPlayerStats,
  type InsertMatchPlayerStats,
  type GrenadeDeathLocation,
  type InsertGrenadeDeathLocation,
  type DataCollectionJob,
  type InsertDataCollectionJob,
  type MatchWithTeams,
  type PlayerWithStats,
  type GrenadeStats,
  type MapGrenadeStats,
  type DashboardStats,
} from "@shared/schema";
import { db } from "./db";
import { eq, desc, sql, and, or, inArray, count } from "drizzle-orm";

export interface IStorage {
  // Teams
  getTeams(): Promise<Team[]>;
  getTeam(id: number): Promise<Team | undefined>;
  createTeam(team: InsertTeam): Promise<Team>;
  updateTeam(id: number, team: Partial<InsertTeam>): Promise<Team | undefined>;

  // Players
  getPlayers(): Promise<Player[]>;
  getPlayer(id: number): Promise<Player | undefined>;
  getPlayersByTeam(teamId: number): Promise<Player[]>;
  createPlayer(player: InsertPlayer): Promise<Player>;

  // Matches
  getMatches(): Promise<MatchWithTeams[]>;
  getMatch(id: number): Promise<Match | undefined>;
  getMatchesByTeam(teamId: number): Promise<MatchWithTeams[]>;
  createMatch(match: InsertMatch): Promise<Match>;
  updateMatch(id: number, match: Partial<InsertMatch>): Promise<Match | undefined>;

  // Rounds
  getRoundsByMatch(matchId: number): Promise<Round[]>;
  createRound(round: InsertRound): Promise<Round>;

  // Kills
  getKillsByMatch(matchId: number): Promise<Kill[]>;
  getKillsByRound(roundId: string): Promise<Kill[]>;
  createKill(kill: InsertKill): Promise<Kill>;

  // Match Player Stats
  getMatchPlayerStats(matchId: number): Promise<MatchPlayerStats[]>;
  createMatchPlayerStats(stats: InsertMatchPlayerStats): Promise<MatchPlayerStats>;

  // Grenade Death Locations
  getGrenadeDeathLocations(mapName?: string): Promise<GrenadeDeathLocation[]>;
  createGrenadeDeathLocation(location: InsertGrenadeDeathLocation): Promise<GrenadeDeathLocation>;

  // Data Collection Jobs
  getDataCollectionJobs(): Promise<(DataCollectionJob & { team: Team | null })[]>;
  getDataCollectionJob(teamId: number): Promise<DataCollectionJob | undefined>;
  createDataCollectionJob(job: InsertDataCollectionJob): Promise<DataCollectionJob>;
  updateDataCollectionJob(id: string, job: Partial<InsertDataCollectionJob>): Promise<DataCollectionJob | undefined>;

  // Analytics
  getDashboardStats(): Promise<DashboardStats>;
  getPlayersWithStats(): Promise<PlayerWithStats[]>;
  getGrenadeStats(): Promise<GrenadeStats[]>;
  getMapGrenadeStats(): Promise<MapGrenadeStats[]>;
}

export class DatabaseStorage implements IStorage {
  // Teams
  async getTeams(): Promise<Team[]> {
    return db.select().from(teams).orderBy(teams.rank);
  }

  async getTeam(id: number): Promise<Team | undefined> {
    const [team] = await db.select().from(teams).where(eq(teams.id, id));
    return team || undefined;
  }

  async createTeam(team: InsertTeam): Promise<Team> {
    const [created] = await db
      .insert(teams)
      .values(team)
      .onConflictDoUpdate({
        target: teams.id,
        set: {
          name: team.name,
          logo: team.logo,
          rank: team.rank,
          country: team.country,
          hltvUrl: team.hltvUrl,
          lastUpdated: new Date(),
        },
      })
      .returning();
    return created;
  }

  async updateTeam(id: number, team: Partial<InsertTeam>): Promise<Team | undefined> {
    const [updated] = await db
      .update(teams)
      .set({ ...team, lastUpdated: new Date() })
      .where(eq(teams.id, id))
      .returning();
    return updated || undefined;
  }

  // Players
  async getPlayers(): Promise<Player[]> {
    return db.select().from(players);
  }

  async getPlayer(id: number): Promise<Player | undefined> {
    const [player] = await db.select().from(players).where(eq(players.id, id));
    return player || undefined;
  }

  async getPlayersByTeam(teamId: number): Promise<Player[]> {
    return db.select().from(players).where(eq(players.teamId, teamId));
  }

  async createPlayer(player: InsertPlayer): Promise<Player> {
    const [created] = await db
      .insert(players)
      .values(player)
      .onConflictDoUpdate({
        target: players.id,
        set: {
          name: player.name,
          realName: player.realName,
          teamId: player.teamId,
          country: player.country,
          avatar: player.avatar,
          hltvUrl: player.hltvUrl,
        },
      })
      .returning();
    return created;
  }

  // Matches
  async getMatches(): Promise<MatchWithTeams[]> {
    const result = await db
      .select()
      .from(matches)
      .leftJoin(teams, eq(matches.team1Id, teams.id))
      .orderBy(desc(matches.date))
      .limit(100);

    const matchList: MatchWithTeams[] = [];
    for (const row of result) {
      const team1 = row.teams;
      const team2Data = row.matches.team2Id
        ? await db.select().from(teams).where(eq(teams.id, row.matches.team2Id))
        : [];
      const winner = row.matches.winnerId
        ? await db.select().from(teams).where(eq(teams.id, row.matches.winnerId))
        : [];

      matchList.push({
        ...row.matches,
        team1: team1 || null,
        team2: team2Data[0] || null,
        winner: winner[0] || null,
      });
    }

    return matchList;
  }

  async getMatch(id: number): Promise<Match | undefined> {
    const [match] = await db.select().from(matches).where(eq(matches.id, id));
    return match || undefined;
  }

  async getMatchesByTeam(teamId: number): Promise<MatchWithTeams[]> {
    const result = await db
      .select()
      .from(matches)
      .where(or(eq(matches.team1Id, teamId), eq(matches.team2Id, teamId)))
      .orderBy(desc(matches.date));

    const matchList: MatchWithTeams[] = [];
    for (const match of result) {
      const team1Data = match.team1Id
        ? await db.select().from(teams).where(eq(teams.id, match.team1Id))
        : [];
      const team2Data = match.team2Id
        ? await db.select().from(teams).where(eq(teams.id, match.team2Id))
        : [];
      const winnerData = match.winnerId
        ? await db.select().from(teams).where(eq(teams.id, match.winnerId))
        : [];

      matchList.push({
        ...match,
        team1: team1Data[0] || null,
        team2: team2Data[0] || null,
        winner: winnerData[0] || null,
      });
    }

    return matchList;
  }

  async createMatch(match: InsertMatch): Promise<Match> {
    const [created] = await db
      .insert(matches)
      .values(match)
      .onConflictDoUpdate({
        target: matches.id,
        set: match,
      })
      .returning();
    return created;
  }

  async updateMatch(id: number, match: Partial<InsertMatch>): Promise<Match | undefined> {
    const [updated] = await db.update(matches).set(match).where(eq(matches.id, id)).returning();
    return updated || undefined;
  }

  // Rounds
  async getRoundsByMatch(matchId: number): Promise<Round[]> {
    return db.select().from(rounds).where(eq(rounds.matchId, matchId)).orderBy(rounds.roundNumber);
  }

  async createRound(round: InsertRound): Promise<Round> {
    const [created] = await db.insert(rounds).values(round).returning();
    return created;
  }

  // Kills
  async getKillsByMatch(matchId: number): Promise<Kill[]> {
    return db.select().from(kills).where(eq(kills.matchId, matchId));
  }

  async getKillsByRound(roundId: string): Promise<Kill[]> {
    return db.select().from(kills).where(eq(kills.roundId, roundId));
  }

  async createKill(kill: InsertKill): Promise<Kill> {
    const [created] = await db.insert(kills).values(kill).returning();
    return created;
  }

  // Match Player Stats
  async getMatchPlayerStats(matchId: number): Promise<MatchPlayerStats[]> {
    return db.select().from(matchPlayerStats).where(eq(matchPlayerStats.matchId, matchId));
  }

  async createMatchPlayerStats(stats: InsertMatchPlayerStats): Promise<MatchPlayerStats> {
    const [created] = await db.insert(matchPlayerStats).values(stats).returning();
    return created;
  }

  // Grenade Death Locations
  async getGrenadeDeathLocations(mapName?: string): Promise<GrenadeDeathLocation[]> {
    if (mapName) {
      return db.select().from(grenadeDeathLocations).where(eq(grenadeDeathLocations.mapName, mapName));
    }
    return db.select().from(grenadeDeathLocations);
  }

  async createGrenadeDeathLocation(location: InsertGrenadeDeathLocation): Promise<GrenadeDeathLocation> {
    const [created] = await db.insert(grenadeDeathLocations).values(location).returning();
    return created;
  }

  // Data Collection Jobs
  async getDataCollectionJobs(): Promise<(DataCollectionJob & { team: Team | null })[]> {
    const result = await db
      .select()
      .from(dataCollectionJobs)
      .leftJoin(teams, eq(dataCollectionJobs.teamId, teams.id));

    return result.map((row) => ({
      ...row.data_collection_jobs,
      team: row.teams || null,
    }));
  }

  async getDataCollectionJob(teamId: number): Promise<DataCollectionJob | undefined> {
    const [job] = await db
      .select()
      .from(dataCollectionJobs)
      .where(eq(dataCollectionJobs.teamId, teamId));
    return job || undefined;
  }

  async createDataCollectionJob(job: InsertDataCollectionJob): Promise<DataCollectionJob> {
    const [created] = await db.insert(dataCollectionJobs).values(job).returning();
    return created;
  }

  async updateDataCollectionJob(
    id: string,
    job: Partial<InsertDataCollectionJob>
  ): Promise<DataCollectionJob | undefined> {
    const [updated] = await db
      .update(dataCollectionJobs)
      .set(job)
      .where(eq(dataCollectionJobs.id, id))
      .returning();
    return updated || undefined;
  }

  // Analytics
  async getDashboardStats(): Promise<DashboardStats> {
    const [teamCount] = await db.select({ count: count() }).from(teams);
    const [matchCount] = await db.select({ count: count() }).from(matches);

    const grenadeKillsResult = await db
      .select({ count: count() })
      .from(kills)
      .where(eq(kills.isGrenade, true));

    const recentMatchesData = await this.getMatches();
    const topGrenadeKillers = await this.getGrenadeStats();
    const mapStats = await this.getMapGrenadeStats();

    const totalTeams = teamCount?.count || 0;
    const completedJobs = await db
      .select({ count: count() })
      .from(dataCollectionJobs)
      .where(eq(dataCollectionJobs.status, "completed"));

    const collectionProgress = totalTeams > 0 
      ? Math.round(((completedJobs[0]?.count || 0) / totalTeams) * 100)
      : 0;

    return {
      totalTeams: teamCount?.count || 0,
      totalMatches: matchCount?.count || 0,
      totalGrenadeKills: grenadeKillsResult[0]?.count || 0,
      collectionProgress,
      recentMatches: recentMatchesData.slice(0, 10),
      topGrenadeKillers: topGrenadeKillers.slice(0, 5),
      mapStats: mapStats.slice(0, 7),
    };
  }

  async getPlayersWithStats(): Promise<PlayerWithStats[]> {
    const allPlayers = await db.select().from(players);
    const allTeams = await db.select().from(teams);
    const allStats = await db.select().from(matchPlayerStats);

    const teamMap = new Map(allTeams.map((t) => [t.id, t]));

    return allPlayers.map((player) => {
      const playerStats = allStats.filter((s) => s.playerId === player.id);
      const matchesPlayed = playerStats.length;

      const avgKills = matchesPlayed > 0
        ? playerStats.reduce((sum, s) => sum + (s.kills || 0), 0) / matchesPlayed
        : 0;
      const avgDeaths = matchesPlayed > 0
        ? playerStats.reduce((sum, s) => sum + (s.deaths || 0), 0) / matchesPlayed
        : 0;
      const avgRating = matchesPlayed > 0
        ? playerStats.reduce((sum, s) => sum + (s.rating || 0), 0) / matchesPlayed
        : 0;
      const totalGrenadeKills = playerStats.reduce(
        (sum, s) => sum + (s.heGrenadeKills || 0) + (s.molotovKills || 0),
        0
      );

      return {
        ...player,
        team: player.teamId ? teamMap.get(player.teamId) || null : null,
        avgKills,
        avgDeaths,
        avgRating,
        totalGrenadeKills,
        matchesPlayed,
      };
    });
  }

  async getGrenadeStats(): Promise<GrenadeStats[]> {
    const allPlayers = await db.select().from(players);
    const allTeams = await db.select().from(teams);
    const allStats = await db.select().from(matchPlayerStats);

    const teamMap = new Map(allTeams.map((t) => [t.id, t]));

    return allPlayers
      .map((player) => {
        const playerStats = allStats.filter((s) => s.playerId === player.id);
        const matchesPlayed = playerStats.length;

        const totalHEKills = playerStats.reduce((sum, s) => sum + (s.heGrenadeKills || 0), 0);
        const totalMolotovKills = playerStats.reduce((sum, s) => sum + (s.molotovKills || 0), 0);
        const avgHEDamage = matchesPlayed > 0
          ? playerStats.reduce((sum, s) => sum + (s.heGrenadeDamage || 0), 0) / matchesPlayed
          : 0;
        const avgGrenadesBought = matchesPlayed > 0
          ? playerStats.reduce((sum, s) => sum + (s.heGrenadesBought || 0), 0) / matchesPlayed
          : 0;

        const team = player.teamId ? teamMap.get(player.teamId) : null;

        return {
          playerId: player.id,
          playerName: player.name,
          teamName: team?.name || "Unknown",
          totalHEKills,
          totalMolotovKills,
          avgHEDamage,
          avgGrenadesBought,
          matchesPlayed,
        };
      })
      .filter((s) => s.totalHEKills + s.totalMolotovKills > 0)
      .sort((a, b) => b.totalHEKills + b.totalMolotovKills - (a.totalHEKills + a.totalMolotovKills));
  }

  async getMapGrenadeStats(): Promise<MapGrenadeStats[]> {
    const matchesList = await db.select().from(matches);
    const killsList = await db.select().from(kills).where(eq(kills.isGrenade, true));

    const mapStats = new Map<string, { total: number; he: number; molotov: number; matches: Set<number> }>();

    for (const kill of killsList) {
      const match = matchesList.find((m) => m.id === kill.matchId);
      if (!match?.mapName) continue;

      if (!mapStats.has(match.mapName)) {
        mapStats.set(match.mapName, { total: 0, he: 0, molotov: 0, matches: new Set() });
      }

      const stats = mapStats.get(match.mapName)!;
      stats.total++;
      stats.matches.add(match.id);

      if (kill.grenadeType === "hegrenade") {
        stats.he++;
      } else if (kill.grenadeType === "molotov" || kill.grenadeType === "inferno") {
        stats.molotov++;
      }
    }

    return Array.from(mapStats.entries())
      .map(([mapName, stats]) => ({
        mapName,
        totalGrenadeDeaths: stats.total,
        heDeaths: stats.he,
        molotovDeaths: stats.molotov,
        avgDeathsPerMatch: stats.matches.size > 0 ? stats.total / stats.matches.size : 0,
      }))
      .sort((a, b) => b.totalGrenadeDeaths - a.totalGrenadeDeaths);
  }
}

export const storage = new DatabaseStorage();
