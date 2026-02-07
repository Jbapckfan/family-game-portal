#!/usr/bin/env python3
"""
Spelling Bee Puzzle Generator
Follows NYT Spelling Bee rules:
  - 7 unique letters per puzzle, built from pangrams
  - Center letter must appear in every word
  - Minimum 4-letter words
  - S excluded entirely (prevents trivial pluralization)
  - At least 1 pangram per puzzle
  - S and X never used as center letter
  - 1-3 vowels in letter set
  - Minimum 25 words per puzzle
  - Dictionary: system dict filtered by word frequency (top 100K most common)

Usage:
  # First time: download frequency data
  curl -sL "https://raw.githubusercontent.com/hermitdave/FrequencyWords/master/content/2018/en/en_full.txt" -o /tmp/freq_full.txt

  # Generate puzzles
  python3 generate_puzzles.py
"""

import json
import os
import random
from collections import defaultdict

VOWELS = set('aeiou')
BAD_CENTER = {'s', 'x'}  # Never used as center in NYT
MIN_WORD_LENGTH = 4
MIN_WORDS = 25
MAX_WORDS = 80
MIN_VOWELS_IN_SET = 1
MAX_VOWELS_IN_SET = 3
TARGET_PUZZLE_COUNT = 350
FREQ_CUTOFF = 100000  # Use top 100K most frequent English words


def load_curated_dictionary():
    """
    Build a curated ~15K word dictionary by intersecting:
    - System dictionary (ensures proper spelling)
    - Top 100K most frequent English words (ensures recognizability)
    Then apply Spelling Bee filters (no S, 4+ letters, etc.)
    """
    freq_path = '/tmp/freq_full.txt'
    dict_path = '/usr/share/dict/words'

    if not os.path.exists(freq_path):
        print(f"ERROR: Frequency data not found at {freq_path}")
        print("Download it first:")
        print('  curl -sL "https://raw.githubusercontent.com/hermitdave/FrequencyWords/master/content/2018/en/en_full.txt" -o /tmp/freq_full.txt')
        exit(1)

    # Load top N most frequent English words
    freq_words = set()
    with open(freq_path) as f:
        for i, line in enumerate(f):
            if i >= FREQ_CUTOFF:
                break
            parts = line.strip().split()
            if parts:
                freq_words.add(parts[0].lower())

    # Load system dictionary (only lowercase = no proper nouns)
    dict_words = set()
    with open(dict_path) as f:
        for line in f:
            w = line.strip()
            if w and w[0].islower() and w.isalpha():
                dict_words.add(w.lower())

    # Intersection: common AND properly spelled
    common = freq_words & dict_words

    # Apply Spelling Bee filters
    words = set()
    for w in common:
        if len(w) < MIN_WORD_LENGTH:
            continue
        if 's' in w:  # NYT excludes S entirely
            continue
        if not w.isalpha():
            continue
        words.add(w)

    print(f"Curated dictionary: {len(words)} words")
    print(f"  (from {len(freq_words)} frequent + {len(dict_words)} dict = {len(common)} intersection)")
    return words


def build_word_index(words):
    """Index words by unique letter sets, find pangram candidates."""
    word_data = []
    pangram_sets = defaultdict(list)

    for word in words:
        unique = frozenset(word)
        if len(unique) > 7:
            continue
        word_data.append((word, unique))
        if len(unique) == 7:
            pangram_sets[unique].append(word)

    print(f"Words with ≤7 unique letters: {len(word_data)}")
    print(f"Unique pangram letter sets: {len(pangram_sets)}")
    return word_data, pangram_sets


def generate_puzzles(word_data, pangram_sets):
    """Generate puzzles from pangram letter sets, following NYT rules."""
    puzzles = []

    for letter_set, pangrams in pangram_sets.items():
        # Check vowel count
        vowel_count = len(letter_set & VOWELS)
        if vowel_count < MIN_VOWELS_IN_SET or vowel_count > MAX_VOWELS_IN_SET:
            continue

        # Find ALL valid words for this letter set
        all_words = [w for w, u in word_data if u <= letter_set]

        # Try each letter as center
        for center in letter_set:
            if center in BAD_CENTER:
                continue

            center_words = [w for w in all_words if center in w]
            center_pangrams = [w for w in pangrams if center in w]

            if len(center_words) < MIN_WORDS or len(center_words) > MAX_WORDS:
                continue
            if not center_pangrams:
                continue

            # NYT scoring: 4-letter = 1pt, 5+ = length pts, pangram = +7
            score = 0
            for w in center_words:
                score += 1 if len(w) == 4 else len(w)
                if frozenset(w) == letter_set:
                    score += 7

            puzzles.append({
                "letters": sorted(letter_set - {center}),
                "center": center,
                "words": sorted(center_words),
                "pangrams": sorted(center_pangrams),
                "maxScore": score,
                "wordCount": len(center_words)
            })

    print(f"Generated {len(puzzles)} valid puzzles")
    return puzzles


def select_best_puzzles(puzzles, target_count):
    """Select diverse, high-quality puzzles with even center letter distribution."""
    def quality_score(p):
        wc = p['wordCount']
        q = 100 if 30 <= wc <= 50 else (80 if 25 <= wc < 30 else (70 if 50 < wc <= 60 else 50))
        q += min(len(p['pangrams']) * 5, 20)
        return q

    # Group by center letter
    by_center = defaultdict(list)
    for p in puzzles:
        by_center[p['center']].append(p)

    for center in by_center:
        by_center[center].sort(key=quality_score, reverse=True)

    # Round-robin across center letters
    selected = []
    center_letters = sorted(by_center.keys())
    indices = {c: 0 for c in center_letters}

    while len(selected) < target_count:
        added = False
        for c in center_letters:
            if len(selected) >= target_count:
                break
            if indices[c] < len(by_center[c]):
                selected.append(by_center[c][indices[c]])
                indices[c] += 1
                added = True
        if not added:
            break

    random.shuffle(selected)

    # Stats
    center_dist = defaultdict(int)
    wcs = [p['wordCount'] for p in selected]
    for p in selected:
        center_dist[p['center']] += 1

    print(f"\nSelected {len(selected)} puzzles")
    print(f"Word count: {min(wcs)}-{max(wcs)} (avg {sum(wcs)/len(wcs):.0f})")
    print(f"Center letters: {dict(sorted(center_dist.items()))}")
    return selected


def main():
    print("=== Spelling Bee Puzzle Generator ===\n")
    words = load_curated_dictionary()
    word_data, pangram_sets = build_word_index(words)
    puzzles = generate_puzzles(word_data, pangram_sets)

    if len(puzzles) < TARGET_PUZZLE_COUNT:
        print(f"Warning: Only {len(puzzles)} puzzles (target: {TARGET_PUZZLE_COUNT})")

    selected = select_best_puzzles(puzzles, TARGET_PUZZLE_COUNT)

    out_path = os.path.join(os.path.dirname(os.path.abspath(__file__)), 'puzzles.json')
    with open(out_path, 'w') as f:
        json.dump(selected, f)

    print(f"\nSaved to {out_path} ({os.path.getsize(out_path) / 1024:.0f} KB)")


if __name__ == '__main__':
    main()
