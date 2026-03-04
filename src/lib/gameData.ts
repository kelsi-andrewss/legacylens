// Static game data for LegacyLens interactive games

export type Trait = "solver" | "decomposer" | "multiplier" | "optimizer";

export interface QuizQuestion {
  question: string;
  answers: { text: string; trait: Trait }[];
}

export interface TraitResult {
  routine: string;
  tagline: string;
  description: string;
}

export type Difficulty = "yellow" | "green" | "blue" | "purple";

export interface ConnectionsCategory {
  label: string;
  routines: string[];
  difficulty: Difficulty;
}

export interface ConnectionsPuzzle {
  id: number;
  categories: ConnectionsCategory[];
}

export const QUIZ_QUESTIONS: QuizQuestion[] = [
  {
    question: "You find a mysterious bug in production. What do you do first?",
    answers: [
      { text: "Write a systematic script to reproduce it step by step", trait: "solver" },
      { text: "Break the system into parts and test each one in isolation", trait: "decomposer" },
      { text: "Check if other systems downstream are also affected", trait: "multiplier" },
      { text: "Profile the code path to find where performance degrades", trait: "optimizer" },
    ],
  },
  {
    question: "Your ideal weekend project is...",
    answers: [
      { text: "Building a specific tool that solves a real problem you have", trait: "solver" },
      { text: "Refactoring a messy codebase into clean, modular pieces", trait: "decomposer" },
      { text: "Connecting multiple APIs into one unified workflow", trait: "multiplier" },
      { text: "Making an existing application run 10x faster", trait: "optimizer" },
    ],
  },
  {
    question: "In a group project, you naturally gravitate toward...",
    answers: [
      { text: "Owning a feature end-to-end and delivering it fully working", trait: "solver" },
      { text: "Designing the architecture and defining module boundaries", trait: "decomposer" },
      { text: "Coordinating between teams and integrating their work", trait: "multiplier" },
      { text: "Reviewing code for performance issues and edge cases", trait: "optimizer" },
    ],
  },
  {
    question: "Which math concept excites you most?",
    answers: [
      { text: "Systems of equations — finding the one right answer", trait: "solver" },
      { text: "Eigenvalues — revealing hidden structure in data", trait: "decomposer" },
      { text: "Matrix multiplication — combining transformations", trait: "multiplier" },
      { text: "Numerical stability — getting precise results every time", trait: "optimizer" },
    ],
  },
  {
    question: "Your code review style is...",
    answers: [
      { text: "Does it produce the correct output for all inputs?", trait: "solver" },
      { text: "Is there clear separation of concerns?", trait: "decomposer" },
      { text: "How does this interact with the rest of the system?", trait: "multiplier" },
      { text: "Can we do this with fewer allocations?", trait: "optimizer" },
    ],
  },
];

export const TRAIT_TO_ROUTINE: Record<Trait, TraitResult> = {
  solver: {
    routine: "DGESV",
    tagline: "The Reliable Problem-Solver",
    description:
      "Like DGESV, you tackle problems head-on with a direct approach. You take a system of equations and deliver the answer — no fuss, no detours.",
  },
  decomposer: {
    routine: "DGESVD",
    tagline: "The Structure Revealer",
    description:
      "Like DGESVD, you see the hidden structure others miss. You break complex systems into their fundamental components and understand what really matters.",
  },
  multiplier: {
    routine: "DGEMM",
    tagline: "The Force Multiplier",
    description:
      "Like DGEMM, you combine things to create something greater than the sum of its parts. You thrive at the intersection of systems, making everything work together.",
  },
  optimizer: {
    routine: "DLANGE",
    tagline: "The Precision Guardian",
    description:
      "Like DLANGE, you measure what matters and keep everything in check. You care about the bounds, the norms, and making sure nothing drifts out of tolerance.",
  },
};

export const CONNECTIONS_PUZZLES: ConnectionsPuzzle[] = [
  {
    id: 1,
    categories: [
      { label: "BLAS Level 3", routines: ["DGEMM", "DSYMM", "DTRMM", "DSYRK"], difficulty: "yellow" },
      { label: "Eigenvalue Solvers", routines: ["DSYEV", "DGEEV", "DSTEQR", "DSYEVD"], difficulty: "green" },
      { label: "LU Factorization", routines: ["DGETRF", "DGETRS", "DGETRI", "DGESV"], difficulty: "blue" },
      { label: "Triangular Solvers", routines: ["DTRSV", "DTRSM", "DTRTRS", "DTRTRI"], difficulty: "purple" },
    ],
  },
  {
    id: 2,
    categories: [
      { label: "QR Factorization", routines: ["DGEQRF", "DORGQR", "DORMQR", "DGEQP3"], difficulty: "yellow" },
      { label: "BLAS Level 1", routines: ["DSCAL", "DAXPY", "DDOT", "DNRM2"], difficulty: "green" },
      { label: "SVD Family", routines: ["DGESVD", "DGESDD", "DBDSQR", "DBDSDC"], difficulty: "blue" },
      { label: "Cholesky", routines: ["DPOTRF", "DPOTRS", "DPOTRI", "DPOSV"], difficulty: "purple" },
    ],
  },
  {
    id: 3,
    categories: [
      { label: "BLAS Level 2", routines: ["DGEMV", "DSYMV", "DTRMV", "DGER"], difficulty: "yellow" },
      { label: "Matrix Norms", routines: ["DLANGE", "DLANSY", "DGECON", "DLANGB"], difficulty: "green" },
      { label: "Tridiagonal", routines: ["DSTEQR", "DSTEVD", "DPTTRF", "DLAGTM"], difficulty: "blue" },
      { label: "Least Squares", routines: ["DGELS", "DGELSS", "DGELSD", "DGELSY"], difficulty: "purple" },
    ],
  },
  {
    id: 4,
    categories: [
      { label: "Schur Decomposition", routines: ["DGEES", "DGEESX", "DHSEQR", "DTRSEN"], difficulty: "yellow" },
      { label: "Generalized Eigenvalue", routines: ["DGGEV", "DGGES", "DSYGV", "DTGSEN"], difficulty: "green" },
      { label: "Banded Matrix", routines: ["DGBTRF", "DGBTRS", "DGBSV", "DPBTRF"], difficulty: "blue" },
      { label: "Utility / Helper", routines: ["DLASWP", "DLACPY", "DLASET", "DLASCL"], difficulty: "purple" },
    ],
  },
  {
    id: 5,
    categories: [
      { label: "Symmetric Eigenvalue D&C", routines: ["DSYEVD", "DSTEDC", "DLAED0", "DLAED1"], difficulty: "yellow" },
      { label: "Hessenberg", routines: ["DGEHRD", "DORGHR", "DHSEQR", "DTREVC"], difficulty: "green" },
      { label: "Balancing & Scaling", routines: ["DGEBAL", "DLABAD", "DLASCL", "DGEBAK"], difficulty: "blue" },
      { label: "Pivoted Factorizations", routines: ["DGEQP3", "DGETRF", "DSYTRF", "DPSTRF"], difficulty: "purple" },
    ],
  },
  {
    id: 6,
    categories: [
      { label: "Copy & Swap", routines: ["DCOPY", "DSWAP", "DLACPY", "DLASWP"], difficulty: "yellow" },
      { label: "Rotation", routines: ["DROT", "DROTG", "DLARTG", "DLASR"], difficulty: "green" },
      { label: "Sylvester Equation", routines: ["DTRSYL", "DTGSYL", "DLASY2", "DTRSYL3"], difficulty: "blue" },
      { label: "Reduction to Condensed Form", routines: ["DSYTRD", "DGEBRD", "DGEHRD", "DSBTRD"], difficulty: "purple" },
    ],
  },
];
