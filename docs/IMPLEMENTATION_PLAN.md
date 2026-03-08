# Implementation plan

This doc maps the SPEC to a phased plan. Each row links to a GitHub issue; use one branch per issue and never push directly to main (see [working rules](../.cursor/rules/workflow.mdc)).

---

## Phases and issues

| # | Description | Status |
|---|-------------|--------|
| [**#2**](https://github.com/gknobloch/ping-pong-club/issues/2) | **Initial app (Phase 0+)** — Vite + React + TypeScript + Tailwind, French UI, dev login (user autocomplete, no password), mock data. General Admin: CRUD for clubs, seasons, phases, divisions, groups, teams; division reorder. Club Admin: club context in header and home, teams filtered by club, Joueurs page (list/add/edit players). | Done |
| [**#4**](https://github.com/gknobloch/ping-pong-club/issues/4) | **Match-days and games** — Match-days per group (phase → group → journées). Manual create/edit match-days (number, date) and games (home/away). Teams restricted to group; no duplicate team per match-day. Journées page with list/view. | Done |
| [**#5**](https://github.com/gknobloch/ping-pong-club/issues/5) | **Game availability** — Per game, each player of the team can set availability. Captain (and Club Admin) can override. Enforce “one player per team per match-day” in UI/API. | To do |
| [**#6**](https://github.com/gknobloch/ping-pong-club/issues/6) | **Captain: game selection** — For each game, captain picks which players actually play (from team roster; later: from club active players with rules). Default list from team. | To do |
| [**#7**](https://github.com/gknobloch/ping-pong-club/issues/7) | **Persist data (replace mock)** — Replace in-memory mock with real storage (e.g. D1 or KV on Cloudflare; or SQLite locally then D1). Expose same operations via API or context. | To do |
| [**#8**](https://github.com/gknobloch/ping-pong-club/issues/8) | **Auth (replace dev login)** — Replace “login as any user” with real auth (e.g. Cloudflare Access, or OAuth / magic link). Store user/club/role in DB. | To do |
| [**#9**](https://github.com/gknobloch/ping-pong-club/issues/9) | **Deploy to Cloudflare** — Frontend on Pages (or Workers); API on Workers; D1/KV bound. Env config for prod. | To do |
| [**#10**](https://github.com/gknobloch/ping-pong-club/issues/10) | **Player–team assignment and points** — Per phase: assign player to at most one team; set “locked” points for the phase. Club Admin: define team roster and initial points. | To do |
| [**#11**](https://github.com/gknobloch/ping-pong-club/issues/11) | **Club addresses CRUD** — Add/edit/delete addresses for a club; set default address. Used for team game location. | To do |
| [**#12**](https://github.com/gknobloch/ping-pong-club/issues/12) | **Rules for player eligibility** — Rules determining if a player is allowed to play in a certain team. Defer to later; optional. | To do |
| [**#13**](https://github.com/gknobloch/ping-pong-club/issues/13) | **UX and i18n pass** — Consistent French copy, mobile-friendly layout, accessibility. Optional/polish. | To do |
| [**#14**](https://github.com/gknobloch/ping-pong-club/issues/14) | **Delete for entities** — Add “Supprimer” (and confirmation) for clubs, seasons, phases, divisions, groups, teams, players where spec allows. Optional/polish. | To do |
| [**#15**](https://github.com/gknobloch/ping-pong-club/issues/15) | **Copy divisions from previous phase** — When creating a new phase, “copy from previous phase” for divisions (and optionally groups). Optional/polish. | To do |

---

## Workflow reminder

- Before starting a new feature: find or create the GitHub issue, then create a branch from that issue (e.g. `4-match-days`, `issue/5-availability`).
- All merges to `main` via Pull Request; no direct push to `main`.
- After a PR is merged: switch to `main`, pull, and [delete obsolete branches](../.cursor/rules/workflow.mdc).
