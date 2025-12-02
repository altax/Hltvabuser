import type { Express } from "express";
import { createServer, type Server } from "http";
import { storage } from "./storage";
import { fetchTop30Teams, fetchTeamMatches, startFullCollection } from "./hltv-service";

export async function registerRoutes(
  httpServer: Server,
  app: Express
): Promise<Server> {
  // === TEAMS ===
  app.get("/api/teams", async (req, res) => {
    try {
      const teams = await storage.getTeams();
      res.json(teams);
    } catch (error) {
      console.error("Error fetching teams:", error);
      res.status(500).json({ error: "Failed to fetch teams" });
    }
  });

  app.get("/api/teams/:id", async (req, res) => {
    try {
      const id = parseInt(req.params.id);
      const team = await storage.getTeam(id);

      if (!team) {
        return res.status(404).json({ error: "Team not found" });
      }

      const players = await storage.getPlayersByTeam(id);
      const matches = await storage.getMatchesByTeam(id);
      const allStats = await storage.getPlayersWithStats();

      // Calculate team stats
      const teamMatches = matches.filter(
        (m) => m.team1?.id === id || m.team2?.id === id
      );
      const wins = teamMatches.filter((m) => m.winner?.id === id).length;
      const losses = teamMatches.length - wins;
      const winRate = teamMatches.length > 0 ? (wins / teamMatches.length) * 100 : 0;

      const playerStats = allStats.filter((p) => p.teamId === id);
      const avgKills = playerStats.length > 0
        ? playerStats.reduce((sum, p) => sum + p.avgKills, 0) / playerStats.length
        : 0;
      const avgDeaths = playerStats.length > 0
        ? playerStats.reduce((sum, p) => sum + p.avgDeaths, 0) / playerStats.length
        : 0;
      const totalGrenadeKills = playerStats.reduce((sum, p) => sum + p.totalGrenadeKills, 0);

      res.json({
        team,
        players,
        matches: matches.slice(0, 50),
        stats: {
          totalMatches: teamMatches.length,
          wins,
          losses,
          winRate,
          avgKills,
          avgDeaths,
          totalGrenadeKills,
        },
        playerStats: playerStats.map((p) => ({
          ...p,
          player: { id: p.id, name: p.name, avatar: p.avatar },
        })),
      });
    } catch (error) {
      console.error("Error fetching team details:", error);
      res.status(500).json({ error: "Failed to fetch team details" });
    }
  });

  app.post("/api/teams/fetch", async (req, res) => {
    try {
      const teams = await fetchTop30Teams();
      res.json({ success: true, count: teams.length });
    } catch (error) {
      console.error("Error fetching teams from HLTV:", error);
      res.status(500).json({ error: "Failed to fetch teams from HLTV" });
    }
  });

  // === PLAYERS ===
  app.get("/api/players", async (req, res) => {
    try {
      const players = await storage.getPlayersWithStats();
      res.json(players);
    } catch (error) {
      console.error("Error fetching players:", error);
      res.status(500).json({ error: "Failed to fetch players" });
    }
  });

  app.get("/api/players/:id", async (req, res) => {
    try {
      const id = parseInt(req.params.id);
      const player = await storage.getPlayer(id);

      if (!player) {
        return res.status(404).json({ error: "Player not found" });
      }

      const allPlayers = await storage.getPlayersWithStats();
      const playerWithStats = allPlayers.find((p) => p.id === id);

      res.json(playerWithStats || player);
    } catch (error) {
      console.error("Error fetching player:", error);
      res.status(500).json({ error: "Failed to fetch player" });
    }
  });

  // === MATCHES ===
  app.get("/api/matches", async (req, res) => {
    try {
      const matches = await storage.getMatches();
      res.json(matches);
    } catch (error) {
      console.error("Error fetching matches:", error);
      res.status(500).json({ error: "Failed to fetch matches" });
    }
  });

  app.get("/api/matches/:id", async (req, res) => {
    try {
      const id = parseInt(req.params.id);
      const match = await storage.getMatch(id);

      if (!match) {
        return res.status(404).json({ error: "Match not found" });
      }

      const rounds = await storage.getRoundsByMatch(id);
      const playerStats = await storage.getMatchPlayerStats(id);

      res.json({
        match,
        rounds,
        playerStats,
      });
    } catch (error) {
      console.error("Error fetching match:", error);
      res.status(500).json({ error: "Failed to fetch match" });
    }
  });

  // === STATS ===
  app.get("/api/stats/dashboard", async (req, res) => {
    try {
      const stats = await storage.getDashboardStats();
      res.json(stats);
    } catch (error) {
      console.error("Error fetching dashboard stats:", error);
      res.status(500).json({ error: "Failed to fetch dashboard stats" });
    }
  });

  app.get("/api/stats/grenades", async (req, res) => {
    try {
      const topPlayers = await storage.getGrenadeStats();
      const playersWithStats = await storage.getPlayersWithStats();

      // Calculate summary
      const totalHEKills = topPlayers.reduce((sum, p) => sum + p.totalHEKills, 0);
      const totalMolotovKills = topPlayers.reduce((sum, p) => sum + p.totalMolotovKills, 0);
      const matches = await storage.getMatches();
      const matchCount = matches.length || 1;

      const mostDeadlyPlayer = topPlayers[0]?.playerName || "N/A";

      // Team stats
      const teamStatsMap = new Map<string, { heKills: number; molotovKills: number }>();
      for (const player of topPlayers) {
        if (!teamStatsMap.has(player.teamName)) {
          teamStatsMap.set(player.teamName, { heKills: 0, molotovKills: 0 });
        }
        const teamStat = teamStatsMap.get(player.teamName)!;
        teamStat.heKills += player.totalHEKills;
        teamStat.molotovKills += player.totalMolotovKills;
      }

      const teamStats = Array.from(teamStatsMap.entries())
        .map(([teamName, stats]) => ({
          teamName,
          heKills: stats.heKills,
          molotovKills: stats.molotovKills,
          totalKills: stats.heKills + stats.molotovKills,
        }))
        .sort((a, b) => b.totalKills - a.totalKills);

      const mostDeadlyTeam = teamStats[0]?.teamName || "N/A";

      res.json({
        topPlayers,
        summary: {
          totalHEKills,
          totalMolotovKills,
          avgHEPerMatch: totalHEKills / matchCount,
          avgMolotovPerMatch: totalMolotovKills / matchCount,
          mostDeadlyPlayer,
          mostDeadlyTeam,
        },
        teamStats,
      });
    } catch (error) {
      console.error("Error fetching grenade stats:", error);
      res.status(500).json({ error: "Failed to fetch grenade stats" });
    }
  });

  app.get("/api/stats/maps", async (req, res) => {
    try {
      const mapStats = await storage.getMapGrenadeStats();

      const totalGrenadeDeaths = mapStats.reduce((sum, m) => sum + m.totalGrenadeDeaths, 0);
      const mostDeadlyMap = mapStats[0]?.mapName || "N/A";
      const avgDeathsPerMatch = mapStats.length > 0
        ? mapStats.reduce((sum, m) => sum + m.avgDeathsPerMatch, 0) / mapStats.length
        : 0;

      res.json({
        maps: mapStats,
        summary: {
          totalMapsPlayed: mapStats.length,
          totalGrenadeDeaths,
          mostDeadlyMap,
          avgDeathsPerMatch,
        },
      });
    } catch (error) {
      console.error("Error fetching map stats:", error);
      res.status(500).json({ error: "Failed to fetch map stats" });
    }
  });

  app.get("/api/stats/rankings", async (req, res) => {
    try {
      const players = await storage.getPlayersWithStats();
      const teams = await storage.getTeams();
      const matches = await storage.getMatches();

      // Top players by rating
      const topPlayers = players
        .filter((p) => p.matchesPlayed > 0)
        .sort((a, b) => b.avgRating - a.avgRating)
        .slice(0, 20);

      // Top teams by win rate
      const teamStats = teams.map((team) => {
        const teamMatches = matches.filter(
          (m) => m.team1?.id === team.id || m.team2?.id === team.id
        );
        const wins = teamMatches.filter((m) => m.winner?.id === team.id).length;
        const winRate = teamMatches.length > 0 ? (wins / teamMatches.length) * 100 : 0;

        const teamPlayers = players.filter((p) => p.teamId === team.id);
        const avgRating = teamPlayers.length > 0
          ? teamPlayers.reduce((sum, p) => sum + p.avgRating, 0) / teamPlayers.length
          : 0;

        return {
          ...team,
          winRate,
          totalMatches: teamMatches.length,
          avgRating,
        };
      });

      const topTeams = teamStats
        .filter((t) => t.totalMatches > 0)
        .sort((a, b) => b.winRate - a.winRate)
        .slice(0, 15);

      // Top fraggers
      const topFraggers = players
        .filter((p) => p.matchesPlayed > 0)
        .sort((a, b) => b.avgKills - a.avgKills)
        .slice(0, 20);

      // Top grenade killers
      const topGrenadeKillers = players
        .filter((p) => p.totalGrenadeKills > 0)
        .sort((a, b) => b.totalGrenadeKills - a.totalGrenadeKills)
        .slice(0, 20);

      res.json({
        topPlayers,
        topTeams,
        topFraggers,
        topGrenadeKillers,
      });
    } catch (error) {
      console.error("Error fetching rankings:", error);
      res.status(500).json({ error: "Failed to fetch rankings" });
    }
  });

  // === COLLECTION ===
  app.get("/api/collection", async (req, res) => {
    try {
      const teams = await storage.getTeams();
      const jobs = await storage.getDataCollectionJobs();
      const matches = await storage.getMatches();

      const completedTeams = jobs.filter((j) => j.status === "completed").length;
      const inProgressTeams = jobs.filter((j) => j.status === "in_progress").length;
      const pendingTeams = teams.length - completedTeams - inProgressTeams;

      res.json({
        teams,
        jobs,
        summary: {
          totalTeams: teams.length,
          completedTeams,
          pendingTeams,
          inProgressTeams,
          totalMatches: matches.length,
        },
      });
    } catch (error) {
      console.error("Error fetching collection data:", error);
      res.status(500).json({ error: "Failed to fetch collection data" });
    }
  });

  app.post("/api/collection/start", async (req, res) => {
    try {
      const { teamId } = req.body;

      if (teamId) {
        // Start collection for a specific team (async)
        fetchTeamMatches(teamId, 50).catch((error) => {
          console.error(`Error collecting matches for team ${teamId}:`, error);
        });
        res.json({ success: true, message: `Started collection for team ${teamId}` });
      } else {
        // Start collection for all teams (async)
        startFullCollection().catch((error) => {
          console.error("Error in full collection:", error);
        });
        res.json({ success: true, message: "Started full collection" });
      }
    } catch (error) {
      console.error("Error starting collection:", error);
      res.status(500).json({ error: "Failed to start collection" });
    }
  });

  return httpServer;
}
