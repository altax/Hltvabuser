# CS2 Analytics Platform - Design Guidelines

## Design Approach

**Selected Framework:** Material Design 3  
**Rationale:** This is a data-intensive analytics platform requiring clear information hierarchy, efficient data density, and professional dashboard patterns. Material Design 3 provides robust components for data visualization, tables, and complex filtering interfaces essential for statistical analysis tools.

**Core Design Principles:**
- Information clarity over visual flair
- Dense but scannable data layouts
- Consistent component patterns for rapid learning
- Professional, trustworthy aesthetic for B2B positioning

---

## Typography System

**Font Stack:** 
- Primary: Inter (via Google Fonts CDN) - exceptional readability in dense interfaces
- Monospace: JetBrains Mono - for numerical data, statistics, and match IDs

**Hierarchy:**
- Page Titles: text-3xl font-bold (30px)
- Section Headers: text-xl font-semibold (20px)
- Card Titles: text-lg font-medium (18px)
- Body Text: text-base (16px)
- Data Labels: text-sm font-medium (14px)
- Metadata/Timestamps: text-xs text-gray-500 (12px)
- Statistics/Numbers: Use monospace, font-semibold for emphasis

---

## Layout System

**Spacing Primitives:** Tailwind units of 2, 4, 6, 8, 12, 16
- Tight spacing (p-2, gap-2): Between related data points, table cells
- Standard spacing (p-4, gap-4): Card padding, form fields
- Section spacing (p-6, p-8): Major content blocks, dashboard panels
- Page margins (p-12, p-16): Outer containers on desktop

**Grid Structure:**
- Dashboard: 12-column grid for flexible data panel layouts
- Data tables: Full-width with horizontal scroll on mobile
- Analytics cards: 2-3 columns on desktop (grid-cols-1 md:grid-cols-2 lg:grid-cols-3)

---

## Component Library

### Navigation
- **Sidebar Navigation** (fixed left, 240px width on desktop)
  - Team Rankings section with top-30 list
  - Analytics sections (Players, Grenades, Maps, Matches)
  - Settings and data collection status
  - Collapsible on mobile to hamburger menu

### Data Display Components

**Statistics Cards:**
- Compact elevated cards (shadow-md, rounded-lg)
- Large number display with label below
- Trend indicators (↑/↓ arrows with percentage change)
- Subtle background patterns for visual grouping

**Data Tables:**
- Sticky header rows with sorting indicators
- Alternating row backgrounds (hover states)
- Inline team/player avatars (32px circular)
- Right-aligned numerical columns
- Expandable rows for detailed match breakdowns

**Charts & Visualizations:**
- Bar charts for comparative statistics (player frags, grenade kills)
- Line charts for trends over time (team performance)
- Heatmaps for grenade death locations (map overlays)
- Pie/donut charts for weapon distribution
- All charts use consistent axis labeling and legends

**Filters Panel:**
- Top horizontal bar with dropdown selectors
- Team multi-select with search
- Date range picker
- Map selector with thumbnails
- Player search autocomplete
- Clear "Reset Filters" action

### Team & Player Components

**Team Card:**
- Team logo (64px), name, current rank
- Quick stats: Last 10 matches W/L, current streak
- "View Details" button to full team page

**Player Profile Snippet:**
- Avatar, in-game name, real name
- Key stats: K/D ratio, ADR, grenade kills
- Team affiliation badge

**Match Card:**
- Team logos facing each other
- Match score, map, date
- Event/tournament tag
- Status indicator (Parsed/Pending analysis)
- Click to expand round-by-round data

### Forms & Inputs
- Outlined text fields (Material Design style)
- Dropdown selectors with search capability
- Toggle switches for boolean filters
- Range sliders for numerical filters
- Clear validation states (error/success)

---

## Page Layouts

### Dashboard (Landing)
- Stats overview: 4 key metrics in cards (Total matches analyzed, Grenade kills tracked, Top teams processed, Database size)
- Recent activity feed: Latest parsed matches
- Top performers: 3-column grid (Players by frags, Grenade specialists, Team rankings)
- Data collection progress indicator

### Team Page
- Header: Team logo, name, rank, roster
- Tab navigation: Overview, Match History, Player Stats, Grenade Analytics
- Match history table with filtering
- Per-map statistics breakdown

### Analytics Pages
- Left sidebar: Filter panel
- Main content: Data table + visualization toggle
- Export data button (CSV/JSON)
- Pagination for large datasets

### Match Detail
- Match header: Teams, score, date, map
- Round timeline visualization (horizontal scrollable)
- Tabbed sections: Scoreboard, Round Analysis, Grenade Stats, Player Performance
- Heatmap overlays on map miniatures

---

## Images

**No Hero Image** - This is a data-first application, not marketing.

**Required Images:**
- Team logos (from HLTV, 64px standard size, 128px for detail pages)
- Player avatars (circular, 32px in lists, 64px in profiles)
- Map thumbnails for selectors (128x128px)
- CS2 map overhead views for heatmap overlays (full resolution, on-demand loading)
- Platform branding logo in navigation header

**Image Treatment:**
- Lazy loading for performance
- Placeholder states while loading (skeleton screens)
- Fallback to initials/default icon for missing assets

---

## Animations

**Minimal, purposeful only:**
- Smooth transitions for filter applications (200ms ease)
- Chart data entry animations (300ms stagger)
- Loading spinners for data fetching
- Hover states on interactive elements (subtle scale/shadow)
- NO decorative animations - performance and professionalism prioritized

---

## Accessibility

- Keyboard navigation for all filters and tables
- ARIA labels on all data visualizations
- High contrast ratio for all text (WCAG AA minimum)
- Screen reader announcements for dynamic data updates
- Focus indicators on all interactive elements