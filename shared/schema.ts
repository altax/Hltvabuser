import { sql } from "drizzle-orm";
import { pgTable, text, varchar, integer, real, timestamp, boolean, jsonb } from "drizzle-orm/pg-core";
import { relations } from "drizzle-orm";
import { createInsertSchema } from "drizzle-zod";
import { z } from "zod";

// Teams table - stores top 30 HLTV teams
export const teams = pgTable("teams", {
  id: integer("id").primaryKey(),
  name: text("name").notNull(),
  logo: text("logo"),
  rank: integer("rank"),
  country: text("country"),
  hltvUrl: text("hltv_url"),
  lastUpdated: timestamp("last_updated").defaultNow(),
});

export const teamsRelations = relations(teams, ({ many }) => ({
  players: many(players),
  matchesAsTeam1: many(matches, { relationName: "team1Matches" }),
  matchesAsTeam2: many(matches, { relationName: "team2Matches" }),
}));

// Players table
export const players = pgTable("players", {
  id: integer("id").primaryKey(),
  name: text("name").notNull(),
  realName: text("real_name"),
  teamId: integer("team_id").references(() => teams.id),
  country: text("country"),
  avatar: text("avatar"),
  hltvUrl: text("hltv_url"),
});

export const playersRelations = relations(players, ({ one, many }) => ({
  team: one(teams, {
    fields: [players.teamId],
    references: [teams.id],
  }),
  kills: many(kills),
  deaths: many(kills, { relationName: "victimKills" }),
}));

// Matches table
export const matches = pgTable("matches", {
  id: integer("id").primaryKey(),
  team1Id: integer("team1_id").references(() => teams.id),
  team2Id: integer("team2_id").references(() => teams.id),
  team1Score: integer("team1_score"),
  team2Score: integer("team2_score"),
  winnerId: integer("winner_id").references(() => teams.id),
  mapName: text("map_name"),
  eventName: text("event_name"),
  date: timestamp("date"),
  hltvUrl: text("hltv_url"),
  demoUrl: text("demo_url"),
  demoParsed: boolean("demo_parsed").default(false),
  statsCollected: boolean("stats_collected").default(false),
});

export const matchesRelations = relations(matches, ({ one, many }) => ({
  team1: one(teams, {
    fields: [matches.team1Id],
    references: [teams.id],
    relationName: "team1Matches",
  }),
  team2: one(teams, {
    fields: [matches.team2Id],
    references: [teams.id],
    relationName: "team2Matches",
  }),
  winner: one(teams, {
    fields: [matches.winnerId],
    references: [teams.id],
  }),
  rounds: many(rounds),
  playerStats: many(matchPlayerStats),
}));

// Rounds table - individual round data
export const rounds = pgTable("rounds", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  matchId: integer("match_id").references(() => matches.id),
  roundNumber: integer("round_number").notNull(),
  winnerTeamId: integer("winner_team_id").references(() => teams.id),
  winReason: text("win_reason"),
  ctScore: integer("ct_score"),
  tScore: integer("t_score"),
});

export const roundsRelations = relations(rounds, ({ one, many }) => ({
  match: one(matches, {
    fields: [rounds.matchId],
    references: [matches.id],
  }),
  winnerTeam: one(teams, {
    fields: [rounds.winnerTeamId],
    references: [teams.id],
  }),
  kills: many(kills),
}));

// Kills table - individual kill events
export const kills = pgTable("kills", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  roundId: varchar("round_id").references(() => rounds.id),
  matchId: integer("match_id").references(() => matches.id),
  attackerId: integer("attacker_id").references(() => players.id),
  victimId: integer("victim_id").references(() => players.id),
  weapon: text("weapon"),
  isHeadshot: boolean("is_headshot").default(false),
  isWallbang: boolean("is_wallbang").default(false),
  isGrenade: boolean("is_grenade").default(false),
  grenadeType: text("grenade_type"),
  positionX: real("position_x"),
  positionY: real("position_y"),
  positionZ: real("position_z"),
  tick: integer("tick"),
});

export const killsRelations = relations(kills, ({ one }) => ({
  round: one(rounds, {
    fields: [kills.roundId],
    references: [rounds.id],
  }),
  match: one(matches, {
    fields: [kills.matchId],
    references: [matches.id],
  }),
  attacker: one(players, {
    fields: [kills.attackerId],
    references: [players.id],
  }),
  victim: one(players, {
    fields: [kills.victimId],
    references: [players.id],
    relationName: "victimKills",
  }),
}));

// Match player stats - aggregated stats per player per match
export const matchPlayerStats = pgTable("match_player_stats", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  matchId: integer("match_id").references(() => matches.id),
  playerId: integer("player_id").references(() => players.id),
  teamId: integer("team_id").references(() => teams.id),
  kills: integer("kills").default(0),
  deaths: integer("deaths").default(0),
  assists: integer("assists").default(0),
  adr: real("adr"),
  kast: real("kast"),
  rating: real("rating"),
  heGrenadeKills: integer("he_grenade_kills").default(0),
  heGrenadeDamage: integer("he_grenade_damage").default(0),
  heGrenadesBought: integer("he_grenades_bought").default(0),
  molotovKills: integer("molotov_kills").default(0),
  molotovDamage: integer("molotov_damage").default(0),
  flashesThrown: integer("flashes_thrown").default(0),
  enemiesFlashed: integer("enemies_flashed").default(0),
  smokesThrown: integer("smokes_thrown").default(0),
  headshots: integer("headshots").default(0),
  headshotPercentage: real("headshot_percentage"),
});

export const matchPlayerStatsRelations = relations(matchPlayerStats, ({ one }) => ({
  match: one(matches, {
    fields: [matchPlayerStats.matchId],
    references: [matches.id],
  }),
  player: one(players, {
    fields: [matchPlayerStats.playerId],
    references: [players.id],
  }),
  team: one(teams, {
    fields: [matchPlayerStats.teamId],
    references: [teams.id],
  }),
}));

// Grenade death locations - for heatmap visualization
export const grenadeDeathLocations = pgTable("grenade_death_locations", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  mapName: text("map_name").notNull(),
  grenadeType: text("grenade_type").notNull(),
  positionX: real("position_x").notNull(),
  positionY: real("position_y").notNull(),
  positionZ: real("position_z"),
  deathCount: integer("death_count").default(1),
});

// Data collection jobs - track collection progress
export const dataCollectionJobs = pgTable("data_collection_jobs", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  teamId: integer("team_id").references(() => teams.id),
  status: text("status").default("pending"),
  matchesCollected: integer("matches_collected").default(0),
  matchesTarget: integer("matches_target").default(50),
  startedAt: timestamp("started_at"),
  completedAt: timestamp("completed_at"),
  error: text("error"),
});

export const dataCollectionJobsRelations = relations(dataCollectionJobs, ({ one }) => ({
  team: one(teams, {
    fields: [dataCollectionJobs.teamId],
    references: [teams.id],
  }),
}));

// Insert schemas
export const insertTeamSchema = createInsertSchema(teams).omit({ lastUpdated: true });
export const insertPlayerSchema = createInsertSchema(players);
export const insertMatchSchema = createInsertSchema(matches);
export const insertRoundSchema = createInsertSchema(rounds).omit({ id: true });
export const insertKillSchema = createInsertSchema(kills).omit({ id: true });
export const insertMatchPlayerStatsSchema = createInsertSchema(matchPlayerStats).omit({ id: true });
export const insertGrenadeDeathLocationSchema = createInsertSchema(grenadeDeathLocations).omit({ id: true });
export const insertDataCollectionJobSchema = createInsertSchema(dataCollectionJobs).omit({ id: true });

// Types
export type Team = typeof teams.$inferSelect;
export type InsertTeam = z.infer<typeof insertTeamSchema>;

export type Player = typeof players.$inferSelect;
export type InsertPlayer = z.infer<typeof insertPlayerSchema>;

export type Match = typeof matches.$inferSelect;
export type InsertMatch = z.infer<typeof insertMatchSchema>;

export type Round = typeof rounds.$inferSelect;
export type InsertRound = z.infer<typeof insertRoundSchema>;

export type Kill = typeof kills.$inferSelect;
export type InsertKill = z.infer<typeof insertKillSchema>;

export type MatchPlayerStats = typeof matchPlayerStats.$inferSelect;
export type InsertMatchPlayerStats = z.infer<typeof insertMatchPlayerStatsSchema>;

export type GrenadeDeathLocation = typeof grenadeDeathLocations.$inferSelect;
export type InsertGrenadeDeathLocation = z.infer<typeof insertGrenadeDeathLocationSchema>;

export type DataCollectionJob = typeof dataCollectionJobs.$inferSelect;
export type InsertDataCollectionJob = z.infer<typeof insertDataCollectionJobSchema>;

// Extended types for frontend
export type TeamWithPlayers = Team & {
  players: Player[];
};

export type MatchWithTeams = Match & {
  team1: Team | null;
  team2: Team | null;
  winner: Team | null;
};

export type PlayerWithStats = Player & {
  team: Team | null;
  avgKills: number;
  avgDeaths: number;
  avgRating: number;
  totalGrenadeKills: number;
  matchesPlayed: number;
};

export type GrenadeStats = {
  playerId: number;
  playerName: string;
  teamName: string;
  totalHEKills: number;
  totalMolotovKills: number;
  avgHEDamage: number;
  avgGrenadesBought: number;
  matchesPlayed: number;
};

export type MapGrenadeStats = {
  mapName: string;
  totalGrenadeDeaths: number;
  heDeaths: number;
  molotovDeaths: number;
  avgDeathsPerMatch: number;
};

// Dashboard stats type
export type DashboardStats = {
  totalTeams: number;
  totalMatches: number;
  totalGrenadeKills: number;
  collectionProgress: number;
  recentMatches: MatchWithTeams[];
  topGrenadeKillers: GrenadeStats[];
  mapStats: MapGrenadeStats[];
};
