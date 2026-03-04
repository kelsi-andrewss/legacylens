export interface Challenge {
  question: string;
  options: string[];
  correctIndex: number;
  xpReward: number;
}

interface ChunkMetadata {
  subroutine_name: string;
  kind: string;
  file_path: string;
  line_start: number;
  line_end: number;
  parameters: string;
  dependencies: string;
  data_type_prefix: string;
  category: string;
  text: string;
}

const DATA_TYPE_LABELS: Record<string, string> = {
  S: "Single precision real",
  D: "Double precision real",
  C: "Single precision complex",
  Z: "Double precision complex",
};

const ALL_DATA_TYPES = Object.keys(DATA_TYPE_LABELS);
const ALL_CATEGORIES = ["LAPACK", "BLAS"];

/**
 * Returns true every 5th discovery (at 5, 10, 15, ...).
 * Reads the count at call time so it works across async boundaries.
 */
export function shouldTriggerChallenge(stats: { discovered: number }): boolean {
  return stats.discovered > 0 && stats.discovered % 5 === 0;
}

function fisherYatesShuffle<T>(arr: T[]): T[] {
  const a = [...arr];
  for (let i = a.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [a[i], a[j]] = [a[j], a[i]];
  }
  return a;
}

function pickDistractors(correct: string, pool: string[], count: number): string[] {
  const candidates = pool.filter((v) => v !== correct);
  return fisherYatesShuffle(candidates).slice(0, count);
}

function shuffleWithAnswer(
  correct: string,
  distractors: string[]
): { options: string[]; correctIndex: number } {
  const options = [correct, ...distractors];
  // Fisher-Yates shuffle
  for (let i = options.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [options[i], options[j]] = [options[j], options[i]];
  }
  return { options, correctIndex: options.indexOf(correct) };
}

type QuestionGenerator = (meta: ChunkMetadata) => Challenge | null;

const dataTypeQuestion: QuestionGenerator = (meta) => {
  const prefix = meta.data_type_prefix;
  if (!prefix || !DATA_TYPE_LABELS[prefix]) return null;

  const correctLabel = DATA_TYPE_LABELS[prefix];
  const distractors = pickDistractors(
    prefix,
    ALL_DATA_TYPES,
    2
  ).map((k) => DATA_TYPE_LABELS[k]);

  const { options, correctIndex } = shuffleWithAnswer(correctLabel, distractors);

  return {
    question: `What data type does ${meta.subroutine_name} operate on?`,
    options,
    correctIndex,
    xpReward: 25,
  };
};

const dependencyCountQuestion: QuestionGenerator = (meta) => {
  const deps = meta.dependencies
    ? meta.dependencies.split(",").map((d) => d.trim()).filter(Boolean)
    : [];
  if (deps.length === 0) return null;

  const correct = String(deps.length);
  const distractors: string[] = [];
  const used = new Set([deps.length]);

  while (distractors.length < 2) {
    const offset = Math.floor(Math.random() * 5) + 1;
    const candidate = Math.random() > 0.5 ? deps.length + offset : Math.max(1, deps.length - offset);
    if (!used.has(candidate)) {
      used.add(candidate);
      distractors.push(String(candidate));
    }
  }

  const { options, correctIndex } = shuffleWithAnswer(correct, distractors);

  return {
    question: `How many routines does ${meta.subroutine_name} call?`,
    options,
    correctIndex,
    xpReward: 25,
  };
};

const categoryQuestion: QuestionGenerator = (meta) => {
  if (!meta.category) return null;

  const distractors = pickDistractors(meta.category, ALL_CATEGORIES, 1);
  if (distractors.length === 0) {
    distractors.push("Utility");
  }
  distractors.push("Testing");

  const { options, correctIndex } = shuffleWithAnswer(meta.category, distractors);

  return {
    question: `What category is ${meta.subroutine_name}?`,
    options,
    correctIndex,
    xpReward: 25,
  };
};

const generators: QuestionGenerator[] = [
  dataTypeQuestion,
  dependencyCountQuestion,
  categoryQuestion,
];

/**
 * Generate a contextual challenge from routine metadata.
 * Tries each question type in random order until one succeeds.
 * Falls back to a category question if nothing else works.
 */
export function generateChallenge(metadata: ChunkMetadata): Challenge {
  const shuffled = fisherYatesShuffle(generators);

  for (const gen of shuffled) {
    const challenge = gen(metadata);
    if (challenge) return challenge;
  }

  // Guaranteed fallback: kind-based question
  const kindOptions = ["subroutine", "function", "program"];
  const correctKind = metadata.kind || "subroutine";
  const distractors = kindOptions.filter((k) => k !== correctKind).slice(0, 2);
  const { options, correctIndex } = shuffleWithAnswer(correctKind, distractors);

  return {
    question: `What kind of program unit is ${metadata.subroutine_name}?`,
    options,
    correctIndex,
    xpReward: 25,
  };
}
