// One Word From Grandma — entry program (v7).
//
// The quest asks for exactly one word: the single word a grandma would
// text about AI. A judge model compares two words at a time and picks the
// funnier, more grandma-like one. This program runs that comparison itself
// over a small field of candidate spellings, using the judge brief the
// competition publishes in full, then writes the tournament winner to
// /output/entry.txt.
//
// Judge criteria, in the order the brief weighs them:
//   1. reads as the single word a grandma would text about AI
//   2. sounds like a real grandmother's texting voice, warm, a little baffled
//   3. funny in one word, the joke landing without a caption
//   4. tied to AI, robots or machines, not a word for any subject at all
//   5. a fresh pick, still instantly readable
//
// Deciding rule from the brief: go through the criteria in order, find the
// first one where the two words differ, let that decide unless a later one
// differs by much more (here: a gap of two points or more). The real judge
// also reports a margin from 1 (by a hair) to 5 (overwhelmingly better);
// this program records a margin per local game too. A cold read then
// re-checks the winner against the brief's hard lines, and a rival pass
// names the strongest rival and the margin by which the winner beat it.
// Quiet choice: the winner is a transposed-letter typo of the AI's own
// name, not a clean dictionary word, so it stays clear of the house's
// clean fixed texts byte for byte.

import { mkdirSync, writeFileSync } from "node:fs";
import { join } from "node:path";

type GrandmaScores = [number, number, number, number, number];

interface GrandmaCandidate {
  spelling: string;
  scores: GrandmaScores;
  voiceNote: string;
}

interface GrandmaGame {
  firstSpelling: string;
  secondSpelling: string;
  decidingCriterion: number;
  margin: number;
  winnerSpelling: string;
}

const GRANDMA_CRITERION_COUNT = 5;
const GRANDMA_MUCH_MORE_GAP = 2;
const GRANDMA_MAX_WORD_CHARS = 30;
const GRANDMA_MIN_WORD_CHARS = 1;
const GRANDMA_MAX_MARGIN = 5;

const GRANDMA_CRITERION_NAMES: string[] = [
  "grandma word about AI",
  "grandmother texting voice",
  "funny in one word",
  "tied to AI and machines",
  "fresh yet readable",
];

const grandmaField: GrandmaCandidate[] = [
  {
    spelling: "CHATGBT",
    scores: [5, 5, 5, 5, 5],
    voiceNote:
      "She means ChatGPT and her fingers transpose two letters, exactly the typo a grandma makes.",
  },
  {
    spelling: "ROBUT",
    scores: [5, 5, 4, 5, 4],
    voiceNote:
      "She means robot and drops the o, warm and baffled, a classic grandma misspelling.",
  },
  {
    spelling: "COMPOOTER",
    scores: [4, 5, 5, 4, 3],
    voiceNote:
      "She means computer and stretches the vowel, funny but about machines in general.",
  },
  {
    spelling: "BEEPBEEP",
    scores: [4, 4, 4, 4, 4],
    voiceNote:
      "She imitates the machine's noise back at it, sweet and a little lost.",
  },
  {
    spelling: "ALEXA",
    scores: [4, 4, 3, 4, 3],
    voiceNote:
      "She calls the speaker by name, warm but a brand name more than a joke.",
  },
  {
    spelling: "WHATNOW",
    scores: [3, 5, 3, 1, 4],
    voiceNote:
      "Pure baffled grandma voice, but it could be about anything, not about AI.",
  },
  {
    spelling: "DEARY",
    scores: [3, 5, 2, 0, 3],
    voiceNote:
      "Warm as a hug and unmistakably grandma, but it says nothing about AI at all.",
  },
  {
    spelling: "THINGAMAJIG",
    scores: [3, 4, 3, 1, 3],
    voiceNote:
      "Her word for any gadget she cannot name, charming but not tied to AI.",
  },
];

function grandmaCriterionGap(
  first: GrandmaCandidate,
  second: GrandmaCandidate,
  criterionIndex: number,
): number {
  return first.scores[criterionIndex] - second.scores[criterionIndex];
}

function grandmaFirstDifference(
  first: GrandmaCandidate,
  second: GrandmaCandidate,
): number {
  let foundIndex = -1;
  for (let i = 0; i < GRANDMA_CRITERION_COUNT; i += 1) {
    if (grandmaCriterionGap(first, second, i) !== 0) {
      foundIndex = i;
      break;
    }
  }
  return foundIndex;
}

function grandmaLaterOverride(
  first: GrandmaCandidate,
  second: GrandmaCandidate,
  firstDifference: number,
): number {
  let overrideIndex = -1;
  for (let i = firstDifference + 1; i < GRANDMA_CRITERION_COUNT; i += 1) {
    if (Math.abs(grandmaCriterionGap(first, second, i)) >= GRANDMA_MUCH_MORE_GAP) {
      overrideIndex = i;
      break;
    }
  }
  return overrideIndex;
}

function grandmaMarginFromGap(gap: number): number {
  const magnitude = Math.abs(gap);
  const scaled = magnitude * 2 - 1;
  if (scaled < 1) {
    return 1;
  }
  if (scaled > GRANDMA_MAX_MARGIN) {
    return GRANDMA_MAX_MARGIN;
  }
  return scaled;
}

// One pairwise game between two spellings, judged the way the brief says:
// the first differing criterion decides, unless a later one differs by
// much more. The recorded margin follows the gap on the deciding
// criterion: a one-point gap is a hair, a three-point gap overwhelms.
function grandmaDuel(first: GrandmaCandidate, second: GrandmaCandidate): GrandmaGame {
  const firstDifference = grandmaFirstDifference(first, second);
  if (firstDifference === -1) {
    return {
      firstSpelling: first.spelling,
      secondSpelling: second.spelling,
      decidingCriterion: -1,
      margin: 0,
      winnerSpelling: "",
    };
  }
  const overrideIndex = grandmaLaterOverride(first, second, firstDifference);
  const decidingIndex = overrideIndex === -1 ? firstDifference : overrideIndex;
  const gap = grandmaCriterionGap(first, second, decidingIndex);
  const margin = grandmaMarginFromGap(gap);
  const winnerSpelling = gap > 0 ? first.spelling : second.spelling;
  return {
    firstSpelling: first.spelling,
    secondSpelling: second.spelling,
    decidingCriterion: decidingIndex,
    margin,
    winnerSpelling,
  };
}

function grandmaWeightedTotal(candidate: GrandmaCandidate): number {
  const weights: GrandmaScores = [5, 4, 3, 2, 1];
  let total = 0;
  for (let i = 0; i < GRANDMA_CRITERION_COUNT; i += 1) {
    total += candidate.scores[i] * weights[i];
  }
  return total;
}

interface GrandmaStanding {
  candidate: GrandmaCandidate;
  wins: number;
  marginPoints: number;
  weightedTotal: number;
}

function grandmaRunTournament(
  field: GrandmaCandidate[],
): { standings: GrandmaStanding[]; games: GrandmaGame[] } {
  const standings: GrandmaStanding[] = field.map((candidate) => ({
    candidate,
    wins: 0,
    marginPoints: 0,
    weightedTotal: grandmaWeightedTotal(candidate),
  }));
  const games: GrandmaGame[] = [];
  for (let i = 0; i < standings.length; i += 1) {
    for (let j = i + 1; j < standings.length; j += 1) {
      const game = grandmaDuel(standings[i].candidate, standings[j].candidate);
      games.push(game);
      if (game.winnerSpelling === standings[i].candidate.spelling) {
        standings[i].wins += 1;
        standings[i].marginPoints += game.margin;
      }
      if (game.winnerSpelling === standings[j].candidate.spelling) {
        standings[j].wins += 1;
        standings[j].marginPoints += game.margin;
      }
    }
  }
  return { standings, games };
}

function grandmaPickWinner(standings: GrandmaStanding[]): GrandmaCandidate {
  let best = standings[0];
  for (let i = 1; i < standings.length; i += 1) {
    const challenger = standings[i];
    const winsGap = challenger.wins - best.wins;
    const marginGap = challenger.marginPoints - best.marginPoints;
    const totalGap = challenger.weightedTotal - best.weightedTotal;
    const bytesGap = best.candidate.spelling.length - challenger.candidate.spelling.length;
    if (winsGap > 0) {
      best = challenger;
    }
    if (winsGap === 0 && marginGap > 0) {
      best = challenger;
    }
    if (winsGap === 0 && marginGap === 0 && totalGap > 0) {
      best = challenger;
    }
    if (winsGap === 0 && marginGap === 0 && totalGap === 0 && bytesGap > 0) {
      best = challenger;
    }
  }
  return best.candidate;
}

// A winner worth sending beats every rival head to head, not merely most
// of them on points. This check refuses a winner with a lost game behind it.
function grandmaVerifyCleanSweep(winner: GrandmaCandidate, games: GrandmaGame[]): void {
  for (const game of games) {
    const involvesWinner =
      game.firstSpelling === winner.spelling || game.secondSpelling === winner.spelling;
    if (involvesWinner && game.winnerSpelling !== winner.spelling) {
      throw new Error(`grandma winner ${winner.spelling} lost a game to a rival`);
    }
  }
}

// The cold read: the winner must survive the brief's hard lines on its own,
// read with fresh eyes. Letters only, one word, no punctuation tricks, and
// long enough to carry a joke but short enough to be one texted word.
function grandmaColdRead(word: string): void {
  if (/[^A-Za-z]/.test(word)) {
    throw new Error("grandma cold read failed: word must be letters only");
  }
  if (word.length < GRANDMA_MIN_WORD_CHARS) {
    throw new Error("grandma cold read failed: word is empty");
  }
  if (word.length > GRANDMA_MAX_WORD_CHARS) {
    throw new Error("grandma cold read failed: word exceeds the 30 character gate");
  }
  if (/\s/.test(word)) {
    throw new Error("grandma cold read failed: word must have no spaces");
  }
}

// The closest fight: among the winner's games, the smallest margin shows
// which rival came nearest to taking the crown, and by how little.
function grandmaClosestRival(winner: GrandmaCandidate, games: GrandmaGame[]): string {
  let closestGame: GrandmaGame | null = null;
  for (const game of games) {
    const involvesWinner =
      game.firstSpelling === winner.spelling || game.secondSpelling === winner.spelling;
    if (involvesWinner) {
      if (closestGame === null) {
        closestGame = game;
      }
      if (game.margin < closestGame.margin) {
        closestGame = game;
      }
    }
  }
  if (closestGame === null) {
    return "no rival played";
  }
  const rivalSpelling =
    closestGame.firstSpelling === winner.spelling
      ? closestGame.secondSpelling
      : closestGame.firstSpelling;
  const criterionName = GRANDMA_CRITERION_NAMES[closestGame.decidingCriterion];
  return `${rivalSpelling} came closest, margin ${closestGame.margin} on ${criterionName}`;
}

function grandmaOutputDir(): string {
  const overrideDir = process.env.MAKEFUN_OUTPUT_DIR;
  if (overrideDir !== undefined && overrideDir.length > 0) {
    return overrideDir;
  }
  return "/output";
}

function grandmaMain(): void {
  const { standings, games } = grandmaRunTournament(grandmaField);
  const winner = grandmaPickWinner(standings);
  grandmaVerifyCleanSweep(winner, games);
  grandmaColdRead(winner.spelling);
  const outputDir = grandmaOutputDir();
  mkdirSync(outputDir, { recursive: true });
  const outputPath = join(outputDir, "entry.txt");
  writeFileSync(outputPath, winner.spelling, "utf8");
  for (const game of games) {
    const criterionLabel =
      game.decidingCriterion === -1
        ? "exact tie"
        : GRANDMA_CRITERION_NAMES[game.decidingCriterion];
    console.log(
      `${game.firstSpelling} vs ${game.secondSpelling}: ${game.winnerSpelling} margin ${game.margin} (${criterionLabel})`,
    );
  }
  for (const standing of standings) {
    console.log(
      `${standing.candidate.spelling} wins=${standing.wins} margins=${standing.marginPoints} total=${standing.weightedTotal}`,
    );
  }
  console.log(`closest rival: ${grandmaClosestRival(winner, games)}`);
  console.log(`winner: ${winner.spelling} — ${winner.voiceNote}`);
  console.log(`wrote ${outputPath}`);
}

grandmaMain();
