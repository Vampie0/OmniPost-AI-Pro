# Authentication Routing

<cite>
**Referenced Files in This Document**
- [_layout.tsx](file://apps/mobile/src/app/_layout.tsx)
- [index.tsx](file://apps/mobile/src/app/index.tsx)
- [_layout.tsx (auth)](file://apps/mobile/src/app/(auth)/_layout.tsx)
- [login.tsx](file://apps/mobile/src/app/(auth)/login.tsx)
- [register.tsx](file://apps/mobile/src/app/(auth)/register.tsx)
- [onboarding.tsx](file://apps/mobile/src/app/(auth)/onboarding.tsx)
- [forgot-password.tsx](file://apps/mobile/src/app/(auth)/forgot-password.tsx)
- [_layout.tsx (tabs)](file://apps/mobile/src/app/(tabs)/_layout.tsx)
- [useAuthStore.ts](file://apps/mobile/src/store/useAuthStore.ts)
- [supabase.ts](file://apps/mobile/src/services/supabase.ts)
</cite>

## Table of Contents
1. [Introduction](#introduction)
2. [Project Structure](#project-structure)
3. [Core Components](#core-components)
4. [Architecture Overview](#architecture-overview)
5. [Detailed Component Analysis](#detailed-component-analysis)
6. [Dependency Analysis](#dependency-analysis)
7. [Performance Considerations](#performance-considerations)
8. [Troubleshooting Guide](#troubleshooting-guide)
9. [Conclusion](#conclusion)

## Introduction
This document explains the authentication routing system for the mobile app built with Expo Router and Supabase Auth. It covers:
- The (auth) route group structure and its screens: onboarding, login, register, and forgot password
- Navigation guards that protect authenticated routes via the root index redirect logic
- Flow between authentication screens and how state changes drive navigation
- Examples of implementing redirects, handling auth state changes, and managing session transitions
- Security considerations for protected routes and best practices for robust authentication flows

## Project Structure
The authentication flow is organized into a dedicated route group under (auth), which groups all pre-authenticated screens together. The root layout defines the top-level stack and registers the (auth) and (tabs) groups. The root index acts as the entry point and enforces navigation based on authentication and onboarding state.

```mermaid
graph TB
A["Root Layout<br/>Stack Provider"] --> B["Index Entry<br/>Redirect Logic"]
B --> C["(auth) Group<br/>Onboarding / Login / Register / Forgot Password"]
B --> D["(tabs) Group<br/>Authenticated Screens"]
A --> E["Global Providers<br/>Theme / Query / Toast"]
```

**Diagram sources**
- [_layout.tsx:27-55](file://apps/mobile/src/app/_layout.tsx#L27-L55)
- [index.tsx:6-26](file://apps/mobile/src/app/index.tsx#L6-L26)
- [_layout.tsx (auth):5-22](file://apps/mobile/src/app/(auth)/_layout.tsx#L5-L22)
- [_layout.tsx (tabs):7-95](file://apps/mobile/src/app/(tabs)/_layout.tsx#L7-L95)

**Section sources**
- [_layout.tsx:27-55](file://apps/mobile/src/app/_layout.tsx#L27-L55)
- [index.tsx:6-26](file://apps/mobile/src/app/index.tsx#L6-L26)

## Core Components
- Root layout: Provides global providers and the main Stack with named groups (auth) and (tabs).
- Index entry: Central redirect logic that decides whether to show onboarding, login, or tabs based on auth store state.
- Auth group layout: Configures a minimal stack for auth screens without headers and with consistent animations.
- Auth screens: Onboarding, Login, Register, Forgot Password implement validation, API calls, and navigation.
- Auth store: Manages user profile, onboarding flag, session checks, and subscribes to auth state changes.
- Supabase service: Initializes client with secure storage adapter and environment configuration.

**Section sources**
- [_layout.tsx:27-55](file://apps/mobile/src/app/_layout.tsx#L27-L55)
- [index.tsx:6-26](file://apps/mobile/src/app/index.tsx#L6-L26)
- [_layout.tsx (auth):5-22](file://apps/mobile/src/app/(auth)/_layout.tsx#L5-L22)
- [useAuthStore.ts:18-90](file://apps/mobile/src/store/useAuthStore.ts#L18-L90)
- [supabase.ts:1-41](file://apps/mobile/src/services/supabase.ts#L1-L41)

## Architecture Overview
The app uses a simple but effective guard pattern at the root index:
- If onboarding is not completed, redirect to onboarding
- Else if no user session exists, redirect to login
- Otherwise, navigate to the authenticated tabs

The (auth) group provides a cohesive UI for pre-authentication flows. After successful sign-in or registration, users are redirected to (tabs). The auth store persists onboarding completion and listens to auth state changes to keep UI in sync.

```mermaid
sequenceDiagram
participant App as "App Root"
participant Index as "Index Entry"
participant Store as "Auth Store"
participant Router as "Expo Router"
participant Auth as "Supabase Auth"
App->>Store : initializeAuth()
Store-->>App : sessionChecked = true
Index->>Index : check isOnboarded
alt Not onboarded
Index->>Router : Redirect to /(auth)/onboarding
else Onboarded
Index->>Index : check user
alt No user
Index->>Router : Redirect to /(auth)/login
else User exists
Index->>Router : Redirect to /(tabs)
end
end
```

**Diagram sources**
- [index.tsx:6-26](file://apps/mobile/src/app/index.tsx#L6-L26)
- [useAuthStore.ts:24-61](file://apps/mobile/src/store/useAuthStore.ts#L24-L61)

## Detailed Component Analysis

### (auth) Route Group Layout
- Purpose: Groups all pre-authentication screens and applies consistent stack behavior (no header, slide animation).
- Registered screens: onboarding, login, register, forgot-password.

```mermaid
flowchart TD
Start(["Enter (auth) Group"]) --> Stack["Stack Container"]
Stack --> Onboarding["Screen: onboarding"]
Stack --> Login["Screen: login"]
Stack --> Register["Screen: register"]
Stack --> Forgot["Screen: forgot-password"]
```

**Diagram sources**
- [_layout.tsx (auth):5-22](file://apps/mobile/src/app/(auth)/_layout.tsx#L5-L22)

**Section sources**
- [_layout.tsx (auth):5-22](file://apps/mobile/src/app/(auth)/_layout.tsx#L5-L22)

### Onboarding Screen
- Behavior: Presents feature slides; on finish, marks onboarding as completed and navigates to login.
- State persistence: Uses secure storage to persist onboarding completion.

```mermaid
sequenceDiagram
participant User as "User"
participant Onboarding as "Onboarding Screen"
participant Store as "Auth Store"
participant Router as "Expo Router"
User->>Onboarding : Tap Continue/Finish
Onboarding->>Store : setOnboardingCompleted()
Store-->>Onboarding : isOnboarded = true
Onboarding->>Router : Replace to /(auth)/login
```

**Diagram sources**
- [onboarding.tsx:65-68](file://apps/mobile/src/app/(auth)/onboarding.tsx#L65-L68)
- [useAuthStore.ts:63-66](file://apps/mobile/src/store/useAuthStore.ts#L63-L66)

**Section sources**
- [onboarding.tsx:48-76](file://apps/mobile/src/app/(auth)/onboarding.tsx#L48-L76)
- [useAuthStore.ts:63-66](file://apps/mobile/src/store/useAuthStore.ts#L63-L66)

### Login Screen
- Behavior: Unified Sign In / Create Account tabbed interface. Validates input, then either signs in or signs up.
- Post-action navigation: On success, replaces route to (tabs); on verification required, informs user and remains in auth flow.

```mermaid
sequenceDiagram
participant User as "User"
participant Login as "Login Screen"
participant Auth as "Supabase Auth"
participant Store as "Auth Store"
participant Router as "Expo Router"
User->>Login : Submit credentials
Login->>Login : Validate fields
alt Sign In
Login->>Auth : signInWithPassword(...)
Auth-->>Login : Session or Error
alt Success
Login->>Store : setOnboardingCompleted()
Login->>Router : Replace to /(tabs)
else Error
Login-->>User : Show error toast
end
else Sign Up
Login->>Auth : signUp(..., options.data)
Auth-->>Login : Session or Verification Required
alt Session created
Login->>Router : Replace to /(tabs)
else Verification required
Login-->>User : Show info toast
end
end
```

**Diagram sources**
- [login.tsx:76-142](file://apps/mobile/src/app/(auth)/login.tsx#L76-L142)

**Section sources**
- [login.tsx:26-142](file://apps/mobile/src/app/(auth)/login.tsx#L26-L142)

### Register Screen
- Behavior: Dedicated registration form with validation and Supabase sign-up.
- Post-action navigation: If session created, go to (tabs); otherwise prompt email verification and return to login.

```mermaid
sequenceDiagram
participant User as "User"
participant Register as "Register Screen"
participant Auth as "Supabase Auth"
participant Router as "Expo Router"
User->>Register : Submit registration
Register->>Register : Validate fields
Register->>Auth : signUp(email, password, options.data)
Auth-->>Register : Session or Error
alt Session created
Register->>Router : Replace to /(tabs)
else Verification required
Register->>Router : Push to /(auth)/login
else Error
Register-->>User : Show error toast
end
```

**Diagram sources**
- [register.tsx:29-92](file://apps/mobile/src/app/(auth)/register.tsx#L29-L92)

**Section sources**
- [register.tsx:12-92](file://apps/mobile/src/app/(auth)/register.tsx#L12-L92)

### Forgot Password Screen
- Behavior: Validates email and triggers password reset flow. Shows success state and returns to login.

```mermaid
sequenceDiagram
participant User as "User"
participant Forgot as "Forgot Password Screen"
participant Auth as "Supabase Auth"
participant Router as "Expo Router"
User->>Forgot : Enter email and submit
Forgot->>Forgot : Validate email
Forgot->>Auth : resetPasswordForEmail(email)
Auth-->>Forgot : Success or Error
alt Success
Forgot-->>User : Show success state
Forgot->>Router : Replace to /(auth)/login
else Error
Forgot-->>User : Show error toast
end
```

**Diagram sources**
- [forgot-password.tsx:28-61](file://apps/mobile/src/app/(auth)/forgot-password.tsx#L28-L61)

**Section sources**
- [forgot-password.tsx:13-61](file://apps/mobile/src/app/(auth)/forgot-password.tsx#L13-L61)

### Root Index Guard
- Behavior: Centralized redirect logic based on onboarding and user session state.
- Ensures first-time users complete onboarding before accessing authenticated areas.

```mermaid
flowchart TD
Start(["App Launch"]) --> CheckSession["Check sessionChecked"]
CheckSession --> |False| Loading["Show loading"]
CheckSession --> |True| CheckOnboarded{"isOnboarded?"}
CheckOnboarded --> |No| ToOnboarding["Redirect to /(auth)/onboarding"]
CheckOnboarded --> |Yes| CheckUser{"user exists?"}
CheckUser --> |No| ToLogin["Redirect to /(auth)/login"]
CheckUser --> |Yes| ToTabs["Redirect to /(tabs)"]
```

**Diagram sources**
- [index.tsx:6-26](file://apps/mobile/src/app/index.tsx#L6-L26)

**Section sources**
- [index.tsx:6-26](file://apps/mobile/src/app/index.tsx#L6-L26)

### Auth Store and Session Management
- Responsibilities:
  - Initialize auth on app start, load onboarding flag from secure storage
  - Fetch user profile when session exists
  - Subscribe to auth state changes to update UI and user data
  - Persist onboarding completion
  - Provide sign-out capability

```mermaid
classDiagram
class AuthStore {
+user
+sessionChecked
+isOnboarded
+isLoading
+initializeAuth()
+setOnboardingCompleted()
+fetchProfile(userId)
+signOut()
}
class SupabaseClient {
+getSession()
+onAuthStateChange(callback)
+signInWithPassword(...)
+signUp(...)
+resetPasswordForEmail(...)
+signOut()
}
AuthStore --> SupabaseClient : "uses"
```

**Diagram sources**
- [useAuthStore.ts:18-90](file://apps/mobile/src/store/useAuthStore.ts#L18-L90)
- [supabase.ts:1-41](file://apps/mobile/src/services/supabase.ts#L1-L41)

**Section sources**
- [useAuthStore.ts:18-90](file://apps/mobile/src/store/useAuthStore.ts#L18-L90)
- [supabase.ts:1-41](file://apps/mobile/src/services/supabase.ts#L1-L41)

## Dependency Analysis
- Root layout depends on theme, query client, and stores to provide context and services.
- Index depends on auth store to determine initial navigation.
- Auth screens depend on:
  - Expo Router for navigation
  - Auth store for onboarding state
  - Supabase client for authentication operations
- Tabs layout is the authenticated destination after successful login/registration.

```mermaid
graph LR
RootLayout["Root Layout"] --> Index["Index Entry"]
Index --> AuthStore["Auth Store"]
Index --> Router["Expo Router"]
AuthScreens["Auth Screens"] --> AuthStore
AuthScreens --> Supabase["Supabase Client"]
AuthScreens --> Router
AuthStore --> Supabase
Router --> TabsLayout["Tabs Layout"]
```

**Diagram sources**
- [_layout.tsx:27-55](file://apps/mobile/src/app/_layout.tsx#L27-L55)
- [index.tsx:6-26](file://apps/mobile/src/app/index.tsx#L6-L26)
- [useAuthStore.ts:18-90](file://apps/mobile/src/store/useAuthStore.ts#L18-L90)
- [supabase.ts:1-41](file://apps/mobile/src/services/supabase.ts#L1-L41)
- [_layout.tsx (tabs):7-95](file://apps/mobile/src/app/(tabs)/_layout.tsx#L7-L95)

**Section sources**
- [_layout.tsx:27-55](file://apps/mobile/src/app/_layout.tsx#L27-L55)
- [index.tsx:6-26](file://apps/mobile/src/app/index.tsx#L6-L26)
- [useAuthStore.ts:18-90](file://apps/mobile/src/store/useAuthStore.ts#L18-L90)
- [supabase.ts:1-41](file://apps/mobile/src/services/supabase.ts#L1-L41)
- [_layout.tsx (tabs):7-95](file://apps/mobile/src/app/(tabs)/_layout.tsx#L7-L95)

## Performance Considerations
- Minimize network calls during startup by deferring non-critical work until after initial render.
- Use placeholder mode optimizations to avoid blocking network requests during development.
- Debounce or throttle repeated auth state updates if necessary to prevent excessive re-renders.
- Keep auth store actions lightweight; fetch profiles only when needed.

[No sources needed since this section provides general guidance]

## Troubleshooting Guide
Common issues and resolutions:
- Stuck on loading screen: Ensure initializeAuth completes and sets sessionChecked. Verify Supabase client configuration and network connectivity.
- Redirect loops: Confirm that onboarding flag is persisted correctly and that user session exists before redirecting to tabs.
- Email verification required: Handle cases where sign-up does not create an immediate session; guide users to verify email and return to login.
- Network errors: Wrap API calls in try/catch and display user-friendly messages; ensure fallbacks for placeholder environments.

**Section sources**
- [login.tsx:76-142](file://apps/mobile/src/app/(auth)/login.tsx#L76-L142)
- [register.tsx:29-92](file://apps/mobile/src/app/(auth)/register.tsx#L29-L92)
- [forgot-password.tsx:28-61](file://apps/mobile/src/app/(auth)/forgot-password.tsx#L28-L61)
- [useAuthStore.ts:24-61](file://apps/mobile/src/store/useAuthStore.ts#L24-L61)

## Conclusion
The authentication routing system leverages a clear separation between unauthenticated and authenticated flows using Expo Router groups and a centralized redirect strategy at the root index. The auth store manages session state and onboarding persistence, while Supabase handles credential-based authentication. This design ensures predictable navigation, robust error handling, and a smooth user experience across onboarding, login, registration, and password recovery flows.

[No sources needed since this section summarizes without analyzing specific files]