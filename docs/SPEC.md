# Table Tennis Availability Application

Your job is to develop a mobile-friendly web application allowing Table Tennis clubs to manage their players, teams, player availability for games and following who plays which games.

## General Instructions

* Although I'm prompting in English, the application should be localized in French.
* I'd like you to create an implementation plan so that we get to iterative progress.
* Modern look and feel.

### Technical

* Needs to be a web application
* Once validated locally, I would want to deploy to Cloudflare, including database and workers if needed
* Let's start with validating locally using mock data
* In development phase, I'd like to be able to login with any user without password (in dev, login field could be an auto-complete of all users)

## Profiles

The application has the following roles:
- *General Admin* - Who has ability to create/approve new clubs to use the application. There could eventually be multiple General Admins. A general admin is potentially a Club Admin, a Captain or Player of a club.
- *Club Admin* - Who has full control over his own club. There can be multiple admins per club.
- *Captain* - This special player is responsible for his team(s). There's only one captain per team.
- *Player* - A player is part of a club, and assigned to maximum one team per phase.

## Club

A club is identifiable by an identifier (user driven, it's the affiliation number) and a display name, e.g. 06680011 for "PPA Rixheim".

It also has multiple addresses where games can be played, one of them being the default.

## Season
 
A season is something that only a General Admin can create.

It has a display name like "2025/2026" that identifies which years it overlaps (season is always lasting over 2 calendar years, usually starting in Fall and ending late Spring).

### Other
- A season can be archived
- There's only one active season

## Phase

A season is made out of 2 phases, Phase 1 and Phase 2.
Display name of a phase should contatenate the season name and the phase name - for instance "2025/2026 Phase 1".

Only Global Admin can create those phases.

### Other
- A phase can be archived
- There's only one active phase

## Match-day

A phase is made out of match-days. Default count is 7 (one less than amount of teams in the group).

## Division

In each phase, there's a list of divisions. Global Admin should be able to rank those divisions (from highest to lowest levels).

When creating a new phase, global admin should have a way to copy from previous phase.

A division has a display name, for instance "GE1".

The division will determine how many players per game are required.

## Group

A group is made of multiple teams, which might even be from the same club.

Usually, there are 8 teams but sometimes less. There will always be as many match-days as required to have each team of the group play against another team.
For instance
- 7 or 8 teams will result in 7 match-days
- 6 teams will result in 5 match-days

In each division, there could be multiple groups identified by a number, for instance Group 2 in division GE1.

## Team

A team has a number and is associated with a club and a phase, for instance "PPA Rixheim 1* is associated with "PPA Rixheim" club and Phase 1 of the "2025/2026" season.

A team also has
- A division that describes in which level it plays.
- A group that describes in which group of that division it plays
- A game location, to be picked by what has been defined in the club
- A default time for the games, for instance Thursdays at 8pm - this can eventually be overridden
- Number of players per game is inherited from the division it is part of
- One player of the team is designated the captain of the team
- An optional WhatsApp link

A team will have as many games as number of match-days in a season.

When there are less than 8 teams in the group, it could be that a team is exempted from a given match-day.

## Game

A game is opposing two teams (eventually from the same club) for a given match-day.

## Game Availability

For each game, every player will determine his availability.

## Player

A player has
- First name and last name
- A license number, e.g. 6814426
- An email (that will also be his acount identifier)
- A phone number
- A birth date (optional)
- A birth place (optional)

For each new phase, a player will have a locked amount of points, that will be valid for the entire season.

A player is either
- Active
- Pending Validation
- Archived

## Captain

One player of the team is promoted captain, he has the ability to decide which players of the team are selected for each game.

The captain can also override the values for availability of the players.

A player can only play in a single team for a given match-day.
Default list shows players of the team for game selection, but it's possible to take any active player from the club.

There are also rules determining if a player is allowed to play in a certain team. But we'll save this for later.

## Admin

### Club Admin

Each club has one or more admins that are able:
- To register teams in a phase / division / group - in case a global admin didn't create them
- To define the list of players of a team, which includes defining how many points that player has at the beginning of the phase, once assigned to that team
- To perform the actions of any captain of his club on any team of the club

### Global Admin

Global admin is able
- To create clubs
- To create divisions, phases, groups
- To create teams
