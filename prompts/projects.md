# Metricool API Middleware Documentation

## 1. Meta & Status
- **Project Name**: Metricool API Middleware
- **Version**: 1.0.2
- **Last Updated**: 2026-01-19
- **Status**: Active Development
- **Lead Developer**: Trae (AI Assistant)
- **Mandor**: Suryahadiningrat

## 2. Overview
This project is a **Node.js/Express Middleware API** designed to interface with the [Metricool API v2](https://app.metricool.com/api/v2). It aggregates social media analytics for various platforms (Facebook, Instagram, Twitter, TikTok, YouTube, LinkedIn) and exposes a unified internal API for consumption by frontend applications or dashboards.

The core goal is to abstract the complexity of Metricool's API, handle data synchronization/caching in a local PostgreSQL database (specifically for Instagram currently), and provide fast, aggregated data access for the frontend.

## 3. User Flow
The following workflows define the data acquisition and processing strategy.

### A. Onboarding & Setup
1.  **Database Init**: System initializes with Prisma & PostgreSQL (Multi-schema: `master`, `metric`).
2.  **User Registration**: User registers an account.
3.  **Project Creation**: User creates a project, providing Metricool credentials (`metricool_blog_id`, `metricool_user_id`).
4.  **Initial Sync Trigger**: Upon saving credentials, the system automatically triggers `engine/initial-sync.js`.

### B. Data Synchronization (Background)
1.  **Initial History**: Fetches 10 years of historical data (Posts, Stories, Reels). Then, iterates day-by-day from the earliest content date to today to backfill `instagram_account` growth history (Followers, Posts).
2.  **Continuous Monitoring (2-Hourly)**: Every 2 hours, `engine/fetch-account-data.js` runs to update account stats and today's post performance. It upserts the daily `instagram_account` row and updates `platform_account_summary` with the latest state.
3.  **Daily Aggregation (00:00)**: Every day at midnight, `engine/daily-aggregation.js` captures the final state of the previous day's content and stores it in history tables.

### C. Data Consumption (Frontend)
1.  **Dashboard Access**: Frontend requests data via `v1/instagram/*` endpoints.
2.  **Data Serving**: API serves data from `metric.instagram_content_summary` (fast access) or `metric.instagram_content` (historical analysis), bypassing direct Metricool calls for stored data.
3.  **Account Growth**: `instagram_account` table provides daily snapshots of followers and posts count, allowing efficient date-range queries (e.g., "Last 30 days growth").

## 4. User Experience per page
*Note: As this is an API-first project, "pages" refer to API Endpoint Groups consumed by the Client/Frontend.*

### A. Dashboard - Instagram Overview
-   **User Action**: Opens Instagram Analytics Dashboard.
-   **API Call**: `GET /api/v1/instagram/account`
-   **Experience**: Instant load of Account Growth (Followers, Following, Posts) and Content Summary. Data is served from local DB.

### B. Dashboard - Community / Demographics
-   **User Action**: Views Audience Demographics.
-   **API Call**: `GET /api/v1/instagram/community`
-   **Experience**: Fetches fresh data (proxied to Metricool if not cached) to show Age, Gender, and City distributions.

### C. Dashboard - Posts & Content
-   **User Action**: Views list of recent posts/stories/reels.
-   **API Call**: `GET /api/v1/instagram/posts`, `/reels`, or `/stories`
-   **Experience**: Displays paginated list of content with metrics (Reach, Impressions, Engagement). Data allows filtering by date range using `published_at`.
    -   **Posts**: Returns `id`, `media_url`, `caption`, `date`, `views` (impression+views), `interaction` (likes+comments+shares), etc.
    -   **Reels**: Returns similar to posts plus `reposts`.
    -   **Stories**: Returns `id`, `media_url`, `impressions`, `reach`.

## 5. Logic & Business Rules
1.  **Multi-Schema Strategy**:
    -   `master`: Stores structural data (Users, Projects, Plans).
    -   `metric`: Stores analytical data (Instagram Accounts, Content, Summaries).
2.  **Data Immutability vs Updates**:
    -   `instagram_content_summary`: Mutable. Always reflects the latest known state of a post.
    -   `instagram_content`: Immutable (mostly). Represents a historical snapshot of a post on a specific date.
3.  **Sync Logic**:
    -   **Initial Sync**: Must run chunked requests to avoid Metricool rate limits/timeouts when fetching years of history.
    -   **Missing Data**: If `contentId` is missing from Metricool response, the item is skipped with a warning log.
    -   **Fallback**: Uses `reelId` or `permalink` if `postId` is unavailable.
    -   **Account Growth**: Backfilled using `competitors` endpoint day-by-day.
        -   **Lag Correction**: The `competitors` endpoint has a **2-day data lag** (e.g., fetching '2026-01-15' returns data for '2026-01-13'). The engine automatically applies a `-2 days` date shift to store data against the correct historical date.
        -   **Historical Limit**: Data is only available from the date the account was added to Metricool's Competitors list. Pre-tracking dates (returning 0) are skipped.
        -   **Posts Count**: Calculated cumulatively from DB content (sum of stored Posts + Reels).
    -   **Latest State**: `platform_account_summary` is updated with the latest available data (effectively 2 days old due to API lag).
    -   **Metricool API Constraints**:
        -   `community` endpoint is inaccessible (404), forcing reliance on `competitors`.
        -   `following` count is often null in `competitors` response.
4.  **Comments Sync**:
    -   **Source**: Fetches from `inbox/post-comments` endpoint (using `provider=instagram`).
    -   **Storage**: Stored in `instagram_comments` table.
    -   **Linking**: Linked to `content_id` by matching Shortcode extracted from post link (e.g., `instagram.com/p/SHORTCODE`).
    -   **Deduplication**: Checks composite key (project_id, content_id, commenters_username, text, created_at).

## 6. Project Structure (File Tree)
```
/
├── controllers/
│   └── analyticsController.js  # Core logic for data fetching and aggregation
│   └── projectController.js    # Project management and sync triggers
├── routes/
│   └── analyticsRoutes.js      # API Endpoint definitions
├── prompts/                    # Documentation
│   └── projects.md             # Main project documentation (Context Memory)
│   └── erd.md                  # Entity Relationship Diagram
├── engine/                     # Sync Engine Scripts
│   ├── initial-sync.js         # Initial historical data fetch
│   ├── fetch-account-data.js   # Frequent account monitoring (2h)
│   └── daily-aggregation.js    # Daily content aggregation
├── prisma/                     # Database
│   └── schema.prisma           # DB Schema definition
├── services/                   # Business Logic
│   └── metricoolService.js     # Centralized Metricool API wrapper
├── test/                       # Testing
│   └── setup-and-test-sync.js  # End-to-end sync test
│   └── test-cron-scripts.js    # Cron job validation
│   └── test-instagram-content-list.js # Endpoint validation for Posts/Reels/Stories
├── utils/
│   └── prisma.js               # Prisma Client instance
├── server.js                   # Entry point
└── .env                        # Config
```

## 7. Logic & Flow per File
-   **`server.js`**: Initializes Express app, connects to DB, sets up routes.
-   **`services/metricoolService.js`**: Handles all Axios requests to Metricool. Includes retry logic and parameter formatting.
-   **`engine/initial-sync.js`**:
    -   triggered manually or by project creation.
    -   Iterates date ranges to fetch full history (10 years).
    -   Populates `InstagramContent`.
    -   Backfills `InstagramAccount` (Daily History) by iterating days and fetching competitors data + calculating cumulative posts.
-   **`engine/fetch-account-data.js`**:
    -   Cron script (2h).
    -   Fetches *current* account stats.
    -   Calculates total posts from DB.
    -   Upserts today's `InstagramAccount` row.
    -   Updates `PlatformAccountSummary` with latest state.
    -   Fetches *today's* posts to update engagement metrics in real-time.
-   **`engine/daily-aggregation.js`**:
    -   Cron script (Daily).
    -   Finalizes data for `Yesterday`.
    -   Moves data from "current state" to "historical record" if needed, or simply snapshots it.
-   **`controllers/analyticsController.js`**:
    -   Receives frontend requests.
    -   Queries Prisma (`InstagramContentSummary`) for fast responses.
    -   Formats JSON response.

## 8. Tech Stack
-   **Runtime**: Node.js
-   **Framework**: Express.js (v5.2.1)
-   **Language**: JavaScript (ES6+)
-   **Database**: PostgreSQL
-   **ORM**: Prisma (v7.2.0) with `@prisma/adapter-pg` and Multi-Schema support.
-   **Scheduling**: System Crontab (Linux/Unix).

## 9. Tasks (Kanban)

### Todo
- [ ] Add unit tests for `metricoolService.js`.
- [ ] Implement caching (Redis) for community/demographics endpoints.
- [ ] Add support for TikTok and YouTube sync engines.

### In Progress
- [ ] Monitor production sync performance.

### Done
- [x] Create `instagram_comments` table.
- [x] Implement `fetchInboxConversations` in `metricoolService.js`.
- [x] **Investigate Comments Data Source**: Confirmed `inbox/conversations` (DMs) vs `inbox/post-comments` (Comments).
- [x] **Implement Comment Sync**: Integrated `syncComments` into `initial-sync.js` with auto-creation of missing content.
- [x] Initialize Prisma with Multi-schema (`master`, `metric`).
- [x] Create `master.projects` and `master.users` tables.
- [x] Implement `engine/initial-sync.js` for Instagram.
- [x] Implement `engine/fetch-account-data.js` (2-hour cron).
- [x] Implement `engine/daily-aggregation.js` (Daily cron).
- [x] Expose API V1 endpoints for Instagram (`account`, `post`, `story`, `community`).
- [x] Fix Prisma P1012 and connection issues.
- [x] Add `published_at` to schema and update ERD.
- [x] **Implement Historical Backfill** (10-year loop) for `instagram_account` with cumulative post calculation.
- [x] **Implement Daily Upsert** logic in `fetch-account-data.js`.
- [x] **Verify API Accuracy** against Metricool responses (Followers verified, Posts/Following constrained by API availability).
- [x] **Fix Content Sync Accuracy**: Corrected `username` (fdrtire), `content_id` (shortcode), `caption`, and metrics (`saved` added).
- [x] **Implement Content List Endpoints**: `/instagram/posts`, `/instagram/reels`, `/instagram/stories` with specific JSON structures.

## 10. Testing Checklist
- [x] **Database Connection**: Verify Prisma connects to Postgres with Schema support.
- [x] **Initial Sync**: Run `node engine/initial-sync.js` for a test project.
    -   *Expected*: DB populated with months of data.
- [x] **Cron Scripts**: Run `node test/test-cron-scripts.js`.
    -   *Expected*: Account counts update, no errors.
- [x] **API Endpoints**:
    -   `GET /v1/instagram/account` -> Returns JSON with follower counts.
    -   `GET /v1/instagram/posts` -> Returns list of posts with metrics.
    -   `GET /v1/instagram/reels` -> Returns list of reels with metrics.
    -   `GET /v1/instagram/stories` -> Returns list of stories with metrics.
- [x] **Manual Sync Verification**:
    -   Run sync for past dates.
    -   *Expected*: `instagram_account` table populated with daily rows.
    -   *Expected*: `platform_account_summary` updated with latest data.
