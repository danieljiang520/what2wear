# Hide Right Panel Until Avatar + Auto-Use Location Implementation Plan

> **For Claude:** REQUIRED SUB-SKILL: Use superpowers:executing-plans to implement this plan task-by-task.

**Goal:** Hide the landing page right panel until a location is selected and an avatar image is generated; add a settings toggle to auto-use current location on site load.

**Architecture:** Gate the hero right-column UI behind `avatarUrl` being set, collapsing the grid to a single column until ready. Persist a new boolean preference and on Planner mount, trigger the existing geolocation flow once per session when enabled.

**Tech Stack:** React + TypeScript, Vite, Tailwind CSS, localStorage (existing preferences store), sessionStorage for one-per-session guard.

---

### Task 1: Collapse/hide right panel until avatar generated

**Files:**
- Modify: `src/pages/Planner.tsx`

**Step 1: Clear stale avatar when selecting a new location**
- In `handleLocationSelect`, set `setAvatarUrl('')` before starting async work so the previous avatar never renders for the new location.

**Step 2: Gate right column render**
- Add `const showRightPanel = Boolean(avatarUrl);`
- Change hero grid classes to `lg:grid-cols-1` when hidden, `lg:grid-cols-2` when shown.
- Wrap the entire right column `<div>...</div>` in `{showRightPanel && (...)}`.

**Step 3: Provide left-column progress feedback**
- When loading/generating, show a compact status line under the location controls:
  - `Loading weather data…` when `isLoading`
  - `Generating your avatar…` when `isGeneratingAvatar`

---

### Task 2: Add “auto-use current location on load” setting

**Files:**
- Modify: `src/services/preferencesStore.ts`
- Modify: `src/pages/Settings.tsx`
- Modify: `src/pages/Planner.tsx`

**Step 1: Extend preference shape**
- Add `autoUseCurrentLocationOnLoad?: boolean` to `UserPreferences`
- Set default in `DEFAULT_PREFERENCES` to `false`

**Step 2: Settings UI**
- Add a toggle control bound to `preferences.autoUseCurrentLocationOnLoad`
- Persist via existing `Save Preferences` button (no auto-save required)

**Step 3: Planner startup behavior**
- On first mount:
  - If preference enabled, attempt `handleUseCurrentLocation()` automatically.
  - Guard to **once per tab session** with `sessionStorage` (e.g. key `weatherfit-autolocate-ran`).
  - Do nothing if geolocation unsupported.

---

### Task 3: Verify

**Steps:**
- Run typecheck/lint (project default; e.g. `npm run lint` if present).
- Manual check:
  - Landing page shows only left column until avatar is ready (no empty box).
  - Enter city -> after avatar loads, right panel appears.
  - Toggle setting ON -> reload -> geolocation prompt -> upon allow, avatar generates and right panel appears.

