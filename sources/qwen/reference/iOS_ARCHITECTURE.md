# HEX MIND: iOS Architecture & Monetization

## Tech Stack
- **Frontend:** SwiftUI (Native performance, smooth animations, Apple Health/Game Center integration).
- **Backend:** Firebase (Auth, Firestore for leaderboards/stats, Cloud Functions for puzzle generation/validation).
- **Data Sync:** Offline-first architecture. Local storage for core gameplay; sync when online.

## User Experience Flow
1. **Onboarding:** Cognitive assessment quiz to recommend starting game order.
2. **Home Screen:** Honeycomb layout of 6 games. Completed games glow gold.
3. **Streak Engine:** Global streak (any game) + Individual mastery streaks.
4. **Social Layer:** Spoiler-free "Hex Codes" for sharing. Friend challenges.

## Monetization Strategy

### Tier 1: Free (Acquisition)
- Full access to all 6 daily puzzles.
- Basic stats (streak, total solved).
- No ads during gameplay.
- Optional rewarded video ads for hints/revives (limited to 1/day).

### Tier 2: HEX PRO Subscription ($4.99/mo or $39.99/yr)
- **Archive Access:** Play past 30 days of missed puzzles.
- **Advanced Analytics:** Skill breakdown charts (e.g., "Spatial Recall +12%"). Exportable PDF reports.
- **Custom Themes:** Dark/Light modes, colorblind palettes, minimalist skins.
- **Unlimited Hints/Undos:** Remove friction for struggling players.
- **Early Access:** Beta features.

### Tier 3: One-Time Purchases
- **Themed Puzzle Packs:** e.g., "Shakespearean Insults" for Syntax Siege, "Cold War Espionage" for Logic Lattice ($1.99 each).
- **Cosmetics:** Rare avatars/badges.

### B2B Expansion
- **Corporate Wellness Licenses:** Bulk subscriptions for employee "Brain Breaks" integrated into Slack/Teams.

## Retention Loops
1. **Variable Rewards:** Daily difficulty fluctuation.
2. **Social Proof:** Leaderboards showing friend scores.
3. **Loss Aversion:** Streak preservation motivation.
4. **Identity Formation:** Users identify as "Word People" or "Logic People," encouraged to balance via weekly quests.

## Launch Plan
1. **Soft Launch:** Release QUADRA + LOGIC LATTICE only to test server load.
2. **Influencer Seeding:** Codes for educational TikTok/YouTube creators.
3. **ASO Keywords:** "brain training," "daily puzzle," "logic games."
4. **Full Rollout:** Introduce remaining 4 games after stabilization.
