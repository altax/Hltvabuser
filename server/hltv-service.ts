import { HLTV } from "hltv";
import { storage } from "./storage";
import type { InsertTeam, InsertPlayer, InsertMatch, InsertDataCollectionJob } from "@shared/schema";

// Rate limiting helper
const delay = (ms: number) => new Promise((resolve) => setTimeout(resolve, ms));

// HLTV API rate limiter - be respectful to avoid IP bans
const RATE_LIMIT_MS = 3000;
let lastRequestTime = 0;

async function rateLimitedRequest<T>(fn: () => Promise<T>): Promise<T> {
  const now = Date.now();
  const timeSinceLastRequest = now - lastRequestTime;

  if (timeSinceLastRequest < RATE_LIMIT_MS) {
    await delay(RATE_LIMIT_MS - timeSinceLastRequest);
  }

  lastRequestTime = Date.now();
  return fn();
}

export async function fetchTop30Teams(): Promise<InsertTeam[]> {
  try {
    console.log("Fetching top 30 teams from HLTV...");

    const ranking = await rateLimitedRequest(() => HLTV.getTeamRanking());

    const top30 = ranking.slice(0, 30);
    const teams: InsertTeam[] = [];

    for (const teamRanking of top30) {
      try {
        await delay(1000);

        const teamId = teamRanking.team.id as number;
        const teamData = await rateLimitedRequest(() =>
          HLTV.getTeam({ id: teamId })
        );

        const team: InsertTeam = {
          id: teamId,
          name: teamRanking.team.name,
          logo: teamData.logo || null,
          rank: teamRanking.place,
          country: teamData.country?.name || null,
          hltvUrl: `https://www.hltv.org/team/${teamId}/${encodeURIComponent(teamRanking.team.name.toLowerCase().replace(/\s+/g, "-"))}`,
        };

        teams.push(team);

        // First create the team (must exist before players due to foreign key)
        await storage.createTeam(team);

        // Then fetch and store players
        if (teamData.players) {
          for (const playerData of teamData.players) {
            const playerId = playerData.id as number;
            const player: InsertPlayer = {
              id: playerId,
              name: playerData.name,
              teamId: teamId,
              country: null,
              avatar: null,
              hltvUrl: `https://www.hltv.org/player/${playerId}/${encodeURIComponent(playerData.name.toLowerCase().replace(/\s+/g, "-"))}`,
            };

            await storage.createPlayer(player);
          }
        }
        console.log(`Fetched team: ${team.name} (rank #${team.rank})`);
      } catch (teamError) {
        console.error(`Error fetching team ${teamRanking.team.name}:`, teamError);
        // Continue with basic data
        const teamId = teamRanking.team.id as number;
        const basicTeam: InsertTeam = {
          id: teamId,
          name: teamRanking.team.name,
          logo: null,
          rank: teamRanking.place,
          country: null,
          hltvUrl: `https://www.hltv.org/team/${teamId}`,
        };
        teams.push(basicTeam);
        await storage.createTeam(basicTeam);
      }
    }

    console.log(`Successfully fetched ${teams.length} teams`);
    return teams;
  } catch (error) {
    console.error("Error fetching teams from HLTV:", error);
    throw error;
  }
}

export async function fetchTeamMatches(teamId: number, limit: number = 50): Promise<void> {
  try {
    console.log(`Fetching matches for team ${teamId}...`);

    // Get or create collection job
    let job = await storage.getDataCollectionJob(teamId);
    if (!job) {
      const newJob: InsertDataCollectionJob = {
        teamId,
        status: "in_progress",
        matchesCollected: 0,
        matchesTarget: limit,
        startedAt: new Date(),
      };
      job = await storage.createDataCollectionJob(newJob);
    } else {
      await storage.updateDataCollectionJob(job.id, {
        status: "in_progress",
        startedAt: new Date(),
      });
    }

    try {
      const results = await rateLimitedRequest(() =>
        HLTV.getResults({
          teamIds: [teamId],
        })
      );

      const matchesToCollect = results.slice(0, limit);
      let collected = 0;

      for (const result of matchesToCollect) {
        try {
          await delay(2000);

          // Get team names from HLTV response
          const team1Name = typeof result.team1 === 'object' && result.team1 !== null 
            ? (result.team1 as any).name 
            : null;
          const team2Name = typeof result.team2 === 'object' && result.team2 !== null 
            ? (result.team2 as any).name 
            : null;

          // Look up team IDs from our database by name
          let team1Id: number | null = null;
          let team2Id: number | null = null;
          
          if (team1Name) {
            const team1 = await storage.getTeamByName(team1Name);
            team1Id = team1?.id ?? null;
          }
          if (team2Name) {
            const team2 = await storage.getTeamByName(team2Name);
            team2Id = team2?.id ?? null;
          }

          // Create match record
          const match: InsertMatch = {
            id: result.id,
            team1Id: team1Id,
            team2Id: team2Id,
            team1Score: result.result?.team1 ?? null,
            team2Score: result.result?.team2 ?? null,
            winnerId: null,
            mapName: result.map || null,
            eventName: (result as any).event?.name || null,
            date: result.date ? new Date(result.date) : null,
            hltvUrl: `https://www.hltv.org/matches/${result.id}`,
            demoParsed: false,
            statsCollected: false,
          };

          // Determine winner
          if (result.result) {
            if (result.result.team1 > result.result.team2) {
              match.winnerId = team1Id;
            } else if (result.result.team2 > result.result.team1) {
              match.winnerId = team2Id;
            }
          }

          await storage.createMatch(match);
          collected++;

          // Update job progress
          await storage.updateDataCollectionJob(job.id, {
            matchesCollected: collected,
          });

          console.log(`Collected match ${result.id}: ${result.team1?.name} vs ${result.team2?.name}`);
        } catch (matchError) {
          console.error(`Error collecting match ${result.id}:`, matchError);
        }
      }

      // Mark job as completed
      await storage.updateDataCollectionJob(job.id, {
        status: "completed",
        completedAt: new Date(),
        matchesCollected: collected,
      });

      console.log(`Completed collection for team ${teamId}: ${collected} matches`);
    } catch (fetchError) {
      await storage.updateDataCollectionJob(job.id, {
        status: "failed",
        error: String(fetchError),
      });
      throw fetchError;
    }
  } catch (error) {
    console.error(`Error fetching matches for team ${teamId}:`, error);
    throw error;
  }
}

export async function fetchMatchStats(matchId: number): Promise<void> {
  try {
    console.log(`Fetching stats for match ${matchId}...`);

    const matchStats = await rateLimitedRequest(() =>
      HLTV.getMatchStats({ id: matchId })
    );

    if (matchStats && matchStats.playerStats) {
      for (const team of Object.values(matchStats.playerStats)) {
        for (const playerStat of team) {
          // Store player stats - use type assertion for properties that may differ
          const stat = playerStat as any;
          await storage.createMatchPlayerStats({
            matchId,
            playerId: stat.player?.id ?? 0,
            teamId: null,
            kills: stat.kills ?? 0,
            deaths: stat.deaths ?? 0,
            assists: stat.assists ?? 0,
            adr: stat.ADR ?? stat.adr ?? null,
            kast: stat.KAST ?? null,
            rating: stat.rating1 ?? stat.rating2 ?? stat.rating ?? null,
            heGrenadeKills: 0,
            heGrenadeDamage: 0,
            heGrenadesBought: 0,
            molotovKills: 0,
            molotovDamage: 0,
            flashesThrown: 0,
            enemiesFlashed: 0,
            smokesThrown: 0,
            headshots: 0,
            headshotPercentage: null,
          });
        }
      }
    }

    // Mark match as stats collected
    await storage.updateMatch(matchId, { statsCollected: true });

    console.log(`Stats collected for match ${matchId}`);
  } catch (error) {
    console.error(`Error fetching stats for match ${matchId}:`, error);
    throw error;
  }
}

// Start collection for all teams
export async function startFullCollection(): Promise<void> {
  const teams = await storage.getTeams();

  for (const team of teams) {
    try {
      await fetchTeamMatches(team.id, 50);
      await delay(5000); // Extra delay between teams
    } catch (error) {
      console.error(`Error collecting matches for team ${team.name}:`, error);
    }
  }
}
