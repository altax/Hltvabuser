# CS2 Analytics Platform

## Overview

This is a CS2 (Counter-Strike 2) esports analytics platform that provides deep statistical analysis of professional matches. The application focuses on tracking grenade kills, player performance metrics, and team statistics for the top 30 HLTV-ranked teams. It features comprehensive data collection from HLTV, demo parsing capabilities, and interactive dashboards for analyzing match data, player statistics, and grenade effectiveness across different maps.

## User Preferences

Preferred communication style: Simple, everyday language.

## System Architecture

### Frontend Architecture

**Framework**: React with TypeScript using Vite as the build tool

**UI Component System**: Shadcn/ui components built on Radix UI primitives with Tailwind CSS for styling
- Design follows Material Design 3 principles for data-intensive interfaces
- Custom theme system with dark/light mode support
- Typography: Inter for general UI, JetBrains Mono for numerical/statistical data

**State Management**: 
- TanStack Query (React Query) for server state management and API data fetching
- Local component state with React hooks
- No global state management library (Redux/Zustand) required

**Routing**: Wouter for lightweight client-side routing

**Key Pages**:
- Dashboard: Overview statistics with charts and recent matches
- Teams: Browse and filter top 30 HLTV teams
- Players: Player statistics and rankings
- Matches: Match history with filtering by map/status
- Grenades: Grenade kill analytics and heatmaps
- Maps: Map-specific statistics
- Rankings: Team and player leaderboards
- Collection: Data collection job management
- Settings: Theme and configuration options

### Backend Architecture

**Runtime**: Node.js with Express.js server

**API Design**: RESTful JSON API with endpoints organized by resource type:
- `/api/teams` - Team data and statistics
- `/api/players` - Player profiles and performance metrics
- `/api/matches` - Match results and details
- `/api/stats/*` - Aggregated statistics endpoints
- `/api/collection` - Data collection job management

**Data Collection Service** (`hltv-service.ts`):
- Integrates with HLTV API to fetch team rankings, match data, and player information
- Implements rate limiting (3-second delay between requests) to avoid IP bans
- Supports incremental data collection with job tracking
- Handles demo file parsing for detailed match statistics

**Storage Layer** (`storage.ts`):
- Abstraction layer over database operations
- Provides typed interfaces for all data access patterns
- Handles complex queries for statistics aggregation

### Database Architecture

**ORM**: Drizzle ORM with Neon serverless PostgreSQL driver

**Schema Design** (defined in `shared/schema.ts`):

**Core Tables**:
- `teams` - HLTV team data (id, name, logo, rank, country)
- `players` - Player profiles linked to teams
- `matches` - Match results with team references and scores
- `rounds` - Individual round data within matches
- `kills` - Kill events with weapon type and player references
- `matchPlayerStats` - Per-match player performance metrics
- `grenadeDeathLocations` - Spatial data for grenade kills on maps
- `dataCollectionJobs` - Background job tracking for data fetching

**Relationships**:
- Teams have many players and matches (as team1 or team2)
- Matches contain many rounds and player stats
- Rounds contain many kills
- Players have kills and deaths (self-referential through kills table)

**Custom Types**: Extensive use of derived types for joined queries:
- `MatchWithTeams` - Matches with full team objects
- `PlayerWithStats` - Players with aggregated statistics
- `GrenadeStats` - Grenade effectiveness metrics
- `DashboardStats` - Aggregated platform-wide statistics

### Build System

**Development**: 
- Vite dev server with HMR for frontend
- tsx for running TypeScript directly in development
- Express middleware integration with Vite in dev mode

**Production**:
- esbuild bundles server code with selective dependency bundling
- Vite builds optimized frontend bundle
- Single-file server output (`dist/index.cjs`) with embedded public assets

**Optimization**: Server dependencies are selectively bundled to reduce cold start times by minimizing file system calls

## External Dependencies

### Third-Party APIs
- **HLTV API** (via `hltv` npm package): Primary data source for CS2 esports data including team rankings, match results, and player statistics

### Database Services
- **Neon Serverless PostgreSQL**: Cloud-hosted PostgreSQL database with WebSocket support for serverless environments
- Connection pooling via `@neondatabase/serverless`

### UI Component Libraries
- **Radix UI**: Comprehensive suite of accessible, unstyled UI primitives (@radix-ui/react-*)
- **Recharts**: Charting library for data visualization (bar charts, pie charts, responsive containers)

### Styling and Theming
- **Tailwind CSS**: Utility-first CSS framework with custom theme configuration
- **class-variance-authority**: Type-safe component variants
- **Google Fonts**: Inter (primary) and JetBrains Mono (monospace) typefaces

### Development Tools
- **Replit Integration**: Vite plugins for error overlays, cartographer, and dev banner in Replit environment
- **Drizzle Kit**: Database schema migrations and management

### Supporting Libraries
- **date-fns**: Date formatting and manipulation
- **zod**: Runtime type validation with Drizzle schema integration
- **wouter**: Lightweight routing
- **react-hook-form**: Form state management (with @hookform/resolvers)