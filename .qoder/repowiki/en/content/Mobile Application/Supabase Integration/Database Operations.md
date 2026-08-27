# Database Operations

<cite>
**Referenced Files in This Document**
- [supabase.ts](file://apps/mobile/src/services/supabase.ts)
- [useAuthStore.ts](file://apps/mobile/src/store/useAuthStore.ts)
- [useConfigStore.ts](file://apps/mobile/src/store/useConfigStore.ts)
- [_layout.tsx](file://apps/mobile/src/app/_layout.tsx)
- [database.ts](file://packages/types/src/database.ts)
- [auth.ts](file://packages/types/src/auth.ts)
- [initial_schema.sql](file://supabase/migrations/20240001000000_initial_schema.sql)
</cite>

## Table of Contents
1. Introduction
2. Project Structure
3. Core Components
4. Architecture Overview
5. Detailed Component Analysis
6. Dependency Analysis
7. Performance Considerations
8. Troubleshooting Guide
9. Conclusion

## Introduction
This document explains database operations for the mobile application with a focus on Supabase client configuration, secure storage adapter for cross-platform compatibility, data models and TypeScript types, Row Level Security (RLS), query patterns, real-time subscriptions, schema relationships, constraints, validation rules, offline synchronization strategies, caching, and performance considerations tailored for mobile environments.

## Project Structure
The mobile app integrates Supabase via a dedicated service module that configures the client with a secure storage adapter. Authentication state and configuration are managed by Zustand stores that perform queries and subscribe to real-time changes. Shared TypeScript types define the shape of database entities used across the app. The database schema is defined in migrations and includes RLS policies and Realtime publications.

```mermaid
graph TB
subgraph "Mobile App"
A["App Layout<br/>_layout.tsx"]
B["Auth Store<br/>useAuthStore.ts"]
C["Config Store<br/>useConfigStore.ts"]
D["Supabase Service<br/>services/supabase.ts"]
end
subgraph "Types"
T1["Database Types<br/>packages/types/src/database.ts"]
T2["Auth Types<br/>packages/types/src/auth.ts"]
end
subgraph "Supabase Backend"
S1["Schema & Policies<br/>migrations/.../initial_schema.sql"]
end
A --> B
A --> C
B --> D
C --> D
B --> T2
C --> T1
D --> S1
```

**Diagram sources**
- [_layout.tsx:68-97](file://apps/mobile/src/app/_layout.tsx#L68-L97)
- [useAuthStore.ts:1-90](file://apps/mobile/src/store/useAuthStore.ts#L1-L90)
- [useConfigStore.ts:1-66](file://apps/mobile/src/store/useConfigStore.ts#L1-L66)
- [supabase.ts:1-41](file://apps/mobile/src/services/supabase.ts#L1-L41)
- [database.ts:1-73](file://packages/types/src/database.ts#L1-L73)
- [auth.ts:1-25](file://packages/types/src/auth.ts#L1-L25)
- [initial_schema.sql:15-232](file://supabase/migrations/20240001000000_initial_schema.sql#L15-L232)

**Section sources**
- [_layout.tsx:68-97](file://apps/mobile/src/app/_layout.tsx#L68-L97)
- [supabase.ts:1-41](file://apps/mobile/src/services/supabase.ts#L1-L41)
- [useAuthStore.ts:1-90](file://apps/mobile/src/store/useAuthStore.ts#L1-L90)
- [useConfigStore.ts:1-66](file://apps/mobile/src/store/useConfigStore.ts#L1-L66)
- [database.ts:1-73](file://packages/types/src/database.ts#L1-L73)
- [auth.ts:1-25](file://packages/types/src/auth.ts#L1-L25)
- [initial_schema.sql:15-232](file://supabase/migrations/20240001000000_initial_schema.sql#L15-L232)

## Core Components
- Supabase Client Configuration: Creates a client with environment-based URL and key, and uses a custom secure storage adapter that switches between Expo SecureStore and localStorage based on platform.
- Authentication Store: Initializes auth session, fetches user profile, listens to auth state changes, and handles sign-out.
- Configuration Store: Fetches app configuration and subscribes to real-time updates for live theme/config changes.
- Data Models: Centralized TypeScript interfaces for posts, templates, configs, analytics, and user profiles.
- Schema and Security: SQL migration defines tables, enums, constraints, triggers, RLS policies, and Realtime publications.

**Section sources**
- [supabase.ts:1-41](file://apps/mobile/src/services/supabase.ts#L1-L41)
- [useAuthStore.ts:1-90](file://apps/mobile/src/store/useAuthStore.ts#L1-L90)
- [useConfigStore.ts:1-66](file://apps/mobile/src/store/useConfigStore.ts#L1-L66)
- [database.ts:1-73](file://packages/types/src/database.ts#L1-L73)
- [auth.ts:1-25](file://packages/types/src/auth.ts#L1-L25)
- [initial_schema.sql:15-232](file://supabase/migrations/20240001000000_initial_schema.sql#L15-L232)

## Architecture Overview
The mobile app initializes a React Query client and sets up global providers. It then starts authentication initialization and subscribes to real-time configuration updates. All database interactions go through the centralized Supabase service, which enforces secure session persistence and token refresh.

```mermaid
sequenceDiagram
participant UI as "App UI"
participant Layout as "Root Layout<br/>_layout.tsx"
participant Auth as "Auth Store<br/>useAuthStore.ts"
participant Config as "Config Store<br/>useConfigStore.ts"
participant SB as "Supabase Client<br/>services/supabase.ts"
participant DB as "Supabase Backend"
UI->>Layout : Mount root
Layout->>Auth : initializeAuth()
Auth->>SB : getSession()
SB-->>Auth : Session or null
Auth->>DB : Select profile by id
DB-->>Auth : UserProfile
Layout->>Config : subscribeToRealtimeConfig()
Config->>SB : channel('public : app_config')
SB-->>Config : postgres_changes events
Config-->>UI : Update config state
```

**Diagram sources**
- [_layout.tsx:68-97](file://apps/mobile/src/app/_layout.tsx#L68-L97)
- [useAuthStore.ts:24-57](file://apps/mobile/src/store/useAuthStore.ts#L24-L57)
- [useConfigStore.ts:39-66](file://apps/mobile/src/store/useConfigStore.ts#L39-L66)
- [supabase.ts:33-40](file://apps/mobile/src/services/supabase.ts#L33-L40)

## Detailed Component Analysis

### Supabase Client Configuration and Secure Storage Adapter
- Cross-platform storage adapter: Uses Platform detection to choose between Expo SecureStore (native) and localStorage (web).
- Client options: Enables auto-refresh tokens, persists sessions, and disables URL-based session detection for mobile safety.
- Environment variables: Reads Supabase URL and anon key from environment; exposes a placeholder flag to avoid network calls during development.

```mermaid
flowchart TD
Start(["Create Supabase Client"]) --> Detect["Detect Platform"]
Detect --> |Web| UseLocal["Use localStorage"]
Detect --> |Native| UseSecure["Use Expo SecureStore"]
UseLocal --> Options["Configure Client Options"]
UseSecure --> Options
Options --> Client["Export supabase client"]
```

**Diagram sources**
- [supabase.ts:5-26](file://apps/mobile/src/services/supabase.ts#L5-L26)
- [supabase.ts:28-40](file://apps/mobile/src/services/supabase.ts#L28-L40)

**Section sources**
- [supabase.ts:1-41](file://apps/mobile/src/services/supabase.ts#L1-L41)

### Authentication Flow and Profile Management
- Initialization: Retrieves existing session, loads user profile if present, and sets up an auth state change listener to keep UI in sync.
- Profile fetching: Queries the profiles table using the authenticated user’s id.
- Sign out: Clears session and resets local state.

```mermaid
sequenceDiagram
participant UI as "UI"
participant Auth as "useAuthStore.ts"
participant SB as "supabase.ts"
participant DB as "profiles table"
UI->>Auth : initializeAuth()
Auth->>SB : getSession()
SB-->>Auth : { session }
alt Session exists
Auth->>DB : select * from profiles where id = ?
DB-->>Auth : UserProfile
Auth->>SB : onAuthStateChange(...)
else No session
Auth-->>UI : Not authenticated
end
UI->>Auth : signOut()
Auth->>SB : signOut()
SB-->>Auth : Done
```

**Diagram sources**
- [useAuthStore.ts:24-57](file://apps/mobile/src/store/useAuthStore.ts#L24-L57)
- [useAuthStore.ts:68-89](file://apps/mobile/src/store/useAuthStore.ts#L68-L89)
- [supabase.ts:33-40](file://apps/mobile/src/services/supabase.ts#L33-L40)

**Section sources**
- [useAuthStore.ts:1-90](file://apps/mobile/src/store/useAuthStore.ts#L1-L90)

### Configuration Store and Real-Time Subscriptions
- Fetch config: Loads a single row from app_config with error handling and loading state management.
- Real-time subscription: Subscribes to all changes on app_config and updates store when new data arrives.
- Placeholder guard: Skips network calls when running against placeholder URLs to prevent timeouts.

```mermaid
sequenceDiagram
participant UI as "UI"
participant Config as "useConfigStore.ts"
participant SB as "supabase.ts"
participant DB as "app_config table"
UI->>Config : subscribeToRealtimeConfig()
Config->>SB : channel('public : app_config')
SB-->>Config : postgres_changes event
Config->>DB : select * from app_config limit 1
DB-->>Config : AppConfig
Config-->>UI : Update config state
```

**Diagram sources**
- [useConfigStore.ts:15-38](file://apps/mobile/src/store/useConfigStore.ts#L15-L38)
- [useConfigStore.ts:39-66](file://apps/mobile/src/store/useConfigStore.ts#L39-L66)
- [supabase.ts:33-40](file://apps/mobile/src/services/supabase.ts#L33-L40)

**Section sources**
- [useConfigStore.ts:1-66](file://apps/mobile/src/store/useConfigStore.ts#L1-L66)

### Data Models and Type Safety
- Database types: Define Post, PostTemplate, AppConfig, AIConfig, AnalyticsMetric with precise field types and arrays for platforms/hashtags/media.
- Auth types: Define UserRole, SubscriptionTier, UserProfile, and AuthSessionState for consistent typing across the app.

```mermaid
classDiagram
class UserProfile {
+string id
+string email
+string full_name
+string avatar_url
+UserRole role
+SubscriptionTier subscription_tier
+number credits_remaining
+number credits_limit
+boolean is_suspended
+boolean onboarding_completed
+string created_at
+string updated_at
}
class Post {
+string id
+string user_id
+string folder_id
+string title
+string content
+string[] hashtags
+string[] media_urls
+PlatformType[] platforms
+PostStatus status
+string scheduled_at
+string published_at
+string error_message
+string created_at
+string updated_at
}
class PostTemplate {
+string id
+string title
+string category
+string prompt_template
+string[] default_hashtags
+PlatformType suggested_platform
+boolean is_premium
+boolean is_active
+string created_at
}
class AppConfig {
+string id
+string app_name
+string logo_url
+string primary_color
+string secondary_color
+string accent_color
+string support_email
+string terms_url
+string privacy_url
+boolean enable_revenuecat
+boolean enable_social_login
+boolean maintenance_mode
+string updated_at
}
class AIConfig {
+string id
+string text_provider
+string text_model
+string image_provider
+string image_model
+number max_tokens
+number temperature
+string system_prompt
+string updated_at
}
class AnalyticsMetric {
+string id
+string user_id
+number total_posts_created
+number total_posts_scheduled
+number total_ai_generations
+number credits_used
+string date
}
```

**Diagram sources**
- [auth.ts:1-25](file://packages/types/src/auth.ts#L1-L25)
- [database.ts:1-73](file://packages/types/src/database.ts#L1-L73)

**Section sources**
- [auth.ts:1-25](file://packages/types/src/auth.ts#L1-L25)
- [database.ts:1-73](file://packages/types/src/database.ts#L1-L73)

### Database Schema, Relationships, Constraints, and Validation
- Tables and relationships:
  - profiles references auth.users (one-to-one)
  - folders and posts reference profiles (user ownership)
  - posts optionally reference folders
  - generated_images, analytics, notifications, admin_logs reference profiles
- Enums: user_role, subscription_tier, post_status, platform_type constrain values at the database level.
- Constraints:
  - Unique email in profiles
  - Unique (user_id, date) in analytics
  - Arrays for hashtags, media_urls, platforms with defaults
- Triggers:
  - Automatic creation of profiles on user signup
- Realtime:
  - Publications enabled for app_config, posts, notifications, templates

```mermaid
erDiagram
PROFILES {
uuid id PK
text email UK
text full_name
text avatar_url
enum role
enum subscription_tier
int credits_remaining
int credits_limit
boolean is_suspended
boolean onboarding_completed
timestamptz created_at
timestamptz updated_at
}
FOLDERS {
uuid id PK
uuid user_id FK
text name
text color
timestamptz created_at
}
POSTS {
uuid id PK
uuid user_id FK
uuid folder_id FK
text title
text content
text[] hashtags
text[] media_urls
enum[] platforms
enum status
timestamptz scheduled_at
timestamptz published_at
text error_message
timestamptz created_at
timestamptz updated_at
}
TEMPLATES {
uuid id PK
text title
text category
text prompt_template
text[] default_hashtags
enum suggested_platform
boolean is_premium
boolean is_active
timestamptz created_at
}
GENERATED_IMAGES {
uuid id PK
uuid user_id FK
text prompt
text image_url
text aspect_ratio
text style
timestamptz created_at
}
ANALYTICS {
uuid id PK
uuid user_id FK
int total_posts_created
int total_posts_scheduled
int total_ai_generations
int credits_used
date date
}
NOTIFICATIONS {
uuid id PK
uuid user_id FK
text title
text message
boolean is_read
jsonb data
timestamptz created_at
}
ADMIN_LOGS {
uuid id PK
uuid admin_id FK
text action
text target_resource
jsonb details
timestamptz created_at
}
PROFILES ||--o{ FOLDERS : "owns"
PROFILES ||--o{ POSTS : "creates"
FOLDERS ||--o{ POSTS : "contains"
PROFILES ||--o{ GENERATED_IMAGES : "generates"
PROFILES ||--o{ ANALYTICS : "tracks"
PROFILES ||--o{ NOTIFICATIONS : "receives"
PROFILES ||--o{ ADMIN_LOGS : "performs"
```

**Diagram sources**
- [initial_schema.sql:15-153](file://supabase/migrations/20240001000000_initial_schema.sql#L15-L153)

**Section sources**
- [initial_schema.sql:15-153](file://supabase/migrations/20240001000000_initial_schema.sql#L15-L153)

### Row Level Security Policies
- Profiles: Users can read/update their own profile; admins have full access.
- Posts: Users manage their own posts; admins can moderate.
- Folders: Users manage their own folders.
- Templates: Authenticated users read active templates; admins manage all.
- Generated images, notifications, analytics: Scoped to user or admin.
- Admin logs: Admin-only access.

```mermaid
flowchart TD
A["Request to Table"] --> B{"Is User Authenticated?"}
B --> |No| Deny["Deny Access"]
B --> |Yes| C{"Is Requested Row Owned By User?"}
C --> |Yes| AllowOwn["Allow Own Access"]
C --> |No| D{"Is User Admin?"}
D --> |Yes| AllowAdmin["Allow Admin Access"]
D --> |No| Deny["Deny Access"]
```

**Diagram sources**
- [initial_schema.sql:159-202](file://supabase/migrations/20240001000000_initial_schema.sql#L159-L202)

**Section sources**
- [initial_schema.sql:159-202](file://supabase/migrations/20240001000000_initial_schema.sql#L159-L202)

### Query Patterns and Optimization
- Single-row reads: Use .select('*').eq('id', userId).single() for profiles to ensure type safety and efficient retrieval.
- Limited selects: Use .limit(1).single() for singleton configurations like app_config.
- Real-time updates: Subscribe to specific channels per table to minimize bandwidth and keep UI current without polling.
- Placeholder guards: Skip network calls when using placeholder URLs to avoid long DNS timeouts and wasted resources.

**Section sources**
- [useAuthStore.ts:68-80](file://apps/mobile/src/store/useAuthStore.ts#L68-L80)
- [useConfigStore.ts:15-38](file://apps/mobile/src/store/useConfigStore.ts#L15-L38)
- [useConfigStore.ts:39-66](file://apps/mobile/src/store/useConfigStore.ts#L39-L66)

### Real-Time Subscriptions
- Channel naming: Uses Supabase channel names such as 'public:app_config'.
- Event handling: Listens to postgres_changes events for insert/update/delete and updates store accordingly.
- Cleanup: Returns an unsubscribe function to remove channels when components unmount.

**Section sources**
- [useConfigStore.ts:39-66](file://apps/mobile/src/store/useConfigStore.ts#L39-L66)
- [initial_schema.sql:227-231](file://supabase/migrations/20240001000000_initial_schema.sql#L227-L231)

### Offline Data Synchronization and Caching Strategies
- Local session persistence: Enabled via Supabase client options to maintain login state across app restarts.
- Token auto-refresh: Ensures sessions remain valid without manual re-authentication.
- React Query caching: Global staleTime configured to reduce redundant network requests and improve perceived performance.
- Placeholder bypass: Prevents unnecessary network attempts during development or when backend is unavailable.

```mermaid
flowchart TD
Start(["App Launch"]) --> CheckSession["Check Local Session"]
CheckSession --> HasSession{"Session Exists?"}
HasSession --> |Yes| LoadProfile["Load Profile From DB"]
HasSession --> |No| ShowLogin["Show Login Screen"]
LoadProfile --> CacheData["Cache With React Query"]
CacheData --> ListenRealtime["Subscribe To Realtime"]
ListenRealtime --> End(["Ready"])
ShowLogin --> End
```

**Diagram sources**
- [supabase.ts:33-40](file://apps/mobile/src/services/supabase.ts#L33-L40)
- [_layout.tsx:68-97](file://apps/mobile/src/app/_layout.tsx#L68-L97)
- [useAuthStore.ts:24-57](file://apps/mobile/src/store/useAuthStore.ts#L24-L57)

**Section sources**
- [supabase.ts:33-40](file://apps/mobile/src/services/supabase.ts#L33-L40)
- [_layout.tsx:68-97](file://apps/mobile/src/app/_layout.tsx#L68-L97)
- [useAuthStore.ts:24-57](file://apps/mobile/src/store/useAuthStore.ts#L24-L57)

## Dependency Analysis
- Mobile app depends on Supabase client for all data operations.
- Stores depend on shared types for compile-time safety.
- Schema and policies enforce data integrity and access control at the database layer.

```mermaid
graph LR
UI["Mobile UI"] --> AuthStore["useAuthStore.ts"]
UI --> ConfigStore["useConfigStore.ts"]
AuthStore --> Types["packages/types/*"]
ConfigStore --> Types
AuthStore --> Supabase["services/supabase.ts"]
ConfigStore --> Supabase
Supabase --> Schema["initial_schema.sql"]
```

**Diagram sources**
- [useAuthStore.ts:1-90](file://apps/mobile/src/store/useAuthStore.ts#L1-L90)
- [useConfigStore.ts:1-66](file://apps/mobile/src/store/useConfigStore.ts#L1-L66)
- [supabase.ts:1-41](file://apps/mobile/src/services/supabase.ts#L1-L41)
- [database.ts:1-73](file://packages/types/src/database.ts#L1-L73)
- [auth.ts:1-25](file://packages/types/src/auth.ts#L1-L25)
- [initial_schema.sql:15-232](file://supabase/migrations/20240001000000_initial_schema.sql#L15-L232)

**Section sources**
- [useAuthStore.ts:1-90](file://apps/mobile/src/store/useAuthStore.ts#L1-L90)
- [useConfigStore.ts:1-66](file://apps/mobile/src/store/useConfigStore.ts#L1-L66)
- [supabase.ts:1-41](file://apps/mobile/src/services/supabase.ts#L1-L41)
- [database.ts:1-73](file://packages/types/src/database.ts#L1-L73)
- [auth.ts:1-25](file://packages/types/src/auth.ts#L1-L25)
- [initial_schema.sql:15-232](file://supabase/migrations/20240001000000_initial_schema.sql#L15-L232)

## Performance Considerations
- Prefer single-row queries with .single() to reduce payload size and simplify error handling.
- Limit selections to necessary fields where possible to minimize bandwidth.
- Use real-time subscriptions instead of polling to keep UI synchronized efficiently.
- Configure React Query staleTime to balance freshness and network usage.
- Guard against placeholder URLs to avoid long DNS timeouts and wasted retries.
- Ensure RLS policies are correctly applied to avoid permission errors and unnecessary retries.

[No sources needed since this section provides general guidance]

## Troubleshooting Guide
- Empty results or permission denied:
  - Verify RLS policies are applied by executing the initial schema migration in the Supabase dashboard.
- Admin access issues:
  - Ensure the user’s role in profiles is set to admin or super_admin for admin features.
- Realtime not updating:
  - Confirm that the relevant tables are included in the supabase_realtime publication.
- Network timeouts during development:
  - Use placeholder URL checks to skip network calls when backend is unavailable.

**Section sources**
- [initial_schema.sql:159-231](file://supabase/migrations/20240001000000_initial_schema.sql#L159-L231)

## Conclusion
The mobile application implements a robust database integration with Supabase using a secure, cross-platform storage adapter, well-defined TypeScript types, and strict Row Level Security policies. Real-time subscriptions provide live updates for critical data, while caching and placeholder guards optimize performance for mobile environments. Following the documented patterns ensures reliable CRUD operations, scalable queries, and resilient error handling.

[No sources needed since this section summarizes without analyzing specific files]