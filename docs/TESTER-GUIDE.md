# Alford Daily — friends beta guide

Updated October 28, 2026. This is a prepared local candidate, not a live invitation. James must confirm the exact tested link before sharing. The previous NAS addresses below are historical and were unreachable in this pass; use [the current private-sharing plan](PRIVATE-PLAYTEST-2026-10-28.md).

The collection has 32 games. You do not need to play all 32 every day. Start with Ringcount or Switchpath, then try one word game and one game you would not normally choose. Choose three favorites to revisit during the month.

## Opening the games

Use the HTTPS link James provides after deployment. The proposed `play.cursedtoasterstudios.com` hostname is not a live link until the host confirms it. The NAS address `http://192.168.1.155:8080/games/daily/` works only on the home network. A downloaded package opens through `Open-Alford-Daily.command` on a Mac with Python 3, or `python3 source/scripts/open-preview.py web`; opening an HTML file directly can prevent game modules from loading.

If an invitation-only sign-in is configured, use your invited email address. The game itself has no paid account or cross-device sync in this beta.

## What to try

1. Open the collection on your usual phone or computer. Pick a game and read its short instructions.
2. Play one Daily round without hints first. If stuck, try a hint; using one is useful feedback, not a failed test.
3. Open Practice for extra puzzles. Every game has at least 120 prepared records; Practice does not consume tomorrow's Daily.
4. Leave an unfinished Daily, reload, and check that it resumes. Return to the collection and try a different game.
5. Come back on another day using the same browser and hostname. Daily rollover follows America/Chicago time.

Progress is stored in your browser on that device. Private browsing, clearing site data, changing browsers or switching between the NAS address and the public hostname can give you a separate or empty history. There is no cloud account to recover it from. Practice behavior differs slightly by game; report unexpected resets with the exact game name.

Two games are called Tangle: **Tangle by Kimi** is a letter-grid word hunt, and **Tangle by Claude** separates interleaved words. Include the creator when reporting either.

## A useful report takes one minute

On the website, use **Leave a playtest note** near Today’s Three. Choose the game and your reaction, add a short note without answers or personal details, then **Prepare note**. Review the game/date/result/edition, add your device and whether you played Daily or Practice, and copy it into your existing conversation with James. It is not sent automatically. Your unsent draft disappears when you leave. App testers can use the template below; app and browser histories remain separate.

Copy this template to your usual conversation with James. Do not post puzzle answers where other testers will see spoilers.

```text
Game + creator:
Date, Daily/Practice, and puzzle number if shown:
Device + browser:
Approximate time spent:
Completed? Hints/reveal used?
Difficulty: too easy / about right / too hard
What I expected:
What happened:
Would I choose to play this again tomorrow? Why?
Screenshot, if helpful (hide unrelated personal information):
```

For a rejected word, include the word and the displayed rack/clues. For an unclear instruction, quote the confusing sentence. For a layout issue, say whether the keyboard was open and whether any control was hidden or too small to tap. For a blank page, include the full game address and whether the collection still opens.

## The 30-day test

For the current candidate, the actual schedules were checked for October 28 through November 26, 2026: all 32 games have 30 different daily puzzle IDs. This is scheduling evidence, not a human review of every clue.

## Taking the website offline

In the standalone website, open **Take the games offline** and choose **Save games for offline play** while online. Wait for **Ready offline** before disconnecting. If the download fails, stay online and retry; the app does not erase your progress. Use the same address/browser to reopen the games. An update downloads separately and waits until all collection tabs close. A browser may clear downloads to free space; saves and downloads are separate browser data. A home-network HTTP NAS address usually cannot install a service worker, so use the confirmed HTTPS route (or localhost for a local package).

The iPhone app already includes all game resources and needs no website download. No cloud account or cross-device sync is provided. Downloaded private games remain on a device until its site data is cleared, even if that device later loses hosting access; use a trusted personal device.

During the first week, focus on understanding the rules and finding favorites. In weeks two and three, tell James what makes you return, which clues feel unfair, and whether hints help. In the final week, describe the three games you would keep and the one improvement that would matter most.

The beta is free. Payment, advertising, subscriptions, cloud saves and cross-device accounts are not implemented. Prepared content is finite: some games reuse approved words or clue pools in different sets. The schedule was checked for 30 different puzzle IDs per game, not a promise that every word is new every day.
