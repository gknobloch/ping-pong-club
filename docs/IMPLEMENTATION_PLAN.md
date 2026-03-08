# Implementation plan and suggested GitHub issues

This doc maps the SPEC to a phased plan and suggests GitHub issues so we can track work per issue and never push directly to main (see [working rules](../.cursor/rules/workflow.mdc)).

---

## Done (branch `2-initial-app`, refs #2)

- **Phase 0+**: Vite + React + TypeScript + Tailwind, French UI, dev login (user autocomplete, no password), mock data.
- **General Admin**: CRUD for clubs, seasons, phases, divisions, groups, teams; division reorder (up/down).
- **Club Admin**: Club context in header and home, teams filtered by club, Joueurs page (list / add / edit players for the club).

---

## Suggested issues for later phases

Create these (or equivalents) in GitHub and use one branch per issue.

| Issue (suggested title) | Scope |
|-------------------------|--------|
| **Match-days and games** | Define match-days per phase (default 7 for 8-team group). Generate games (pairs of teams per match-day). Handle “exempt” when &lt; 8 teams. List/view match-days and games. |
| **Game availability** | Per game, each player of the team can set availability. Captain (and Club Admin) can override. Enforce “one player per team per match-day” in UI/API. |
| **Captain: game selection** | For each game, captain picks which players actually play (from team roster; later: from club active players with rules). Default list from team. |
| **Persist data (replace mock)** | Replace in-memory mock with real storage: e.g. D1 (SQL) or KV on Cloudflare; or SQLite locally then D1. Expose same operations via API or context. |
| **Auth (replace dev login)** | Replace “login as any user” with real auth (e.g. Cloudflare Access, or OAuth / magic link). Store user/club/role in DB. |
| **Deploy to Cloudflare** | Frontend on Pages (or Workers); API on Workers; D1/KV bound. Env config for prod. |
| **Player–team assignment and points** | Per phase: assign player to at most one team; set “locked” points for the phase. Club Admin: define team roster and initial points. (Spec: “define how many points that player has at the beginning of the phase”.) |
| **Club addresses CRUD** | Add/edit/delete addresses for a club; set default address. Used for team game location. |
| **Rules for player eligibility** | “Rules determining if a player is allowed to play in a certain team” – defer to later; optional issue when needed. |

---

## Optional / polish

- **UX and i18n pass**: Consistent French copy, mobile-friendly layout, accessibility.
- **Delete for entities**: Add “Supprimer” (and confirmation) for clubs, seasons, phases, divisions, groups, teams, players where spec allows.
- **Copy divisions from previous phase**: When creating a new phase, “copy from previous phase” for divisions (and optionally groups).

---

## Workflow reminder

- Before starting a new feature: find or create the GitHub issue, then create a branch from that issue (e.g. `3-match-days`, `issue/4-availability`).
- All merges to `main` via Pull Request; no direct push to `main`.
