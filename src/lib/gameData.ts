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

export interface SpellOption {
  id: string;
  spellName: string;
  routineId: string;
  flavorText: string;
}

export interface SpellbookEncounter {
  id: number;
  scenario: string;
  spellOptions: SpellOption[];
  correctRoutineId: string;
  outcomeCorrect: string;
  outcomeWrong: string;
}

export const SPELLBOOK_ENCOUNTERS: SpellbookEncounter[] = [
  {
    id: 1,
    scenario:
      "A stone golem blocks the dungeon gate. Ancient runes on its chest read: 'Solve me — balance the forces and reveal the unknown.' Three arcane variables must be reconciled to open the passage.",
    spellOptions: [
      {
        id: "a",
        spellName: "Arcana Solvus",
        routineId: "DGESV",
        flavorText: "Directly solve a system of linear equations using LU decomposition with pivoting.",
      },
      {
        id: "b",
        spellName: "Spectral Rift",
        routineId: "DGEEV",
        flavorText: "Shatter a matrix into its eigenvalues and eigenvectors, revealing hidden vibrations.",
      },
      {
        id: "c",
        spellName: "Norm Bolt",
        routineId: "DLANGE",
        flavorText: "Measure the magnitude of any enchantment matrix with one of four mystical norms.",
      },
      {
        id: "d",
        spellName: "Cholesky Ward",
        routineId: "DPOTRF",
        flavorText: "Factorize a positive-definite ward shield into a lower triangular protection layer.",
      },
    ],
    correctRoutineId: "DGESV",
    outcomeCorrect:
      "Arcana Solvus blazes golden — the golem's runes light up, the equations balance, and the gate grinds open. The unknown forces are resolved.",
    outcomeWrong:
      "The spell fizzles. The golem's runes stay dark. A balanced system demands a direct solver, not this incantation.",
  },
  {
    id: 2,
    scenario:
      "A dragon hoards secrets in crystalline matrices. You must multiply your party's combined battle formation (matrix A) against the dragon's defensive lattice (matrix B) to find the total strike potential.",
    spellOptions: [
      {
        id: "a",
        spellName: "Force Multiplier",
        routineId: "DGEMM",
        flavorText: "Perform general matrix-matrix multiplication: C = alpha*A*B + beta*C.",
      },
      {
        id: "b",
        spellName: "Vector Lance",
        routineId: "DGEMV",
        flavorText: "Multiply a matrix by a single vector, launching a concentrated piercing strike.",
      },
      {
        id: "c",
        spellName: "Rank-One Bolt",
        routineId: "DGER",
        flavorText: "Add a rank-one outer product to a matrix, expanding influence by one layer.",
      },
      {
        id: "d",
        spellName: "Scale Rune",
        routineId: "DSCAL",
        flavorText: "Scale every element of a vector by a constant enchantment factor.",
      },
    ],
    correctRoutineId: "DGEMM",
    outcomeCorrect:
      "Force Multiplier erupts — formation meets lattice in a cascade of computation. The dragon's total strike potential is exposed and the hoard is yours.",
    outcomeWrong:
      "Sparks fly but the calculation is incomplete. Combining two full matrices requires matrix-matrix multiplication, not this narrower spell.",
  },
  {
    id: 3,
    scenario:
      "The Oracle's mirror is cracked — it no longer reflects reality faithfully. To restore it, you must decompose the mirror's enchantment matrix into its singular values and uncover the hidden distortions.",
    spellOptions: [
      {
        id: "a",
        spellName: "Veil Splitter",
        routineId: "DGESVD",
        flavorText: "Compute the full Singular Value Decomposition, revealing all singular values and singular vectors.",
      },
      {
        id: "b",
        spellName: "LU Fracture",
        routineId: "DGETRF",
        flavorText: "Factorize a general matrix into lower and upper triangular factors using partial pivoting.",
      },
      {
        id: "c",
        spellName: "Cholesky Ward",
        routineId: "DPOTRF",
        flavorText: "Factorize a positive-definite ward shield into a lower triangular protection layer.",
      },
      {
        id: "d",
        spellName: "Hessenberg Veil",
        routineId: "DGEHRD",
        flavorText: "Reduce a general matrix to Hessenberg form, the first step toward revealing spectral secrets.",
      },
    ],
    correctRoutineId: "DGESVD",
    outcomeCorrect:
      "Veil Splitter tears through the mirror's enchantment. Singular values cascade like shards of light — every distortion is mapped. The Oracle sees clearly again.",
    outcomeWrong:
      "The mirror shudders but stays cracked. Singular distortions can only be revealed by a true SVD decomposition.",
  },
  {
    id: 4,
    scenario:
      "A troll demands tribute: the exact condition number of the enchanted bridge it guards. Too ill-conditioned and the bridge collapses. You must estimate how sensitive the bridge's stability is to perturbations.",
    spellOptions: [
      {
        id: "a",
        spellName: "Stability Gauge",
        routineId: "DGECON",
        flavorText: "Estimate the reciprocal condition number of a factored matrix, revealing its numerical stability.",
      },
      {
        id: "b",
        spellName: "Norm Bolt",
        routineId: "DLANGE",
        flavorText: "Measure the magnitude of any enchantment matrix with one of four mystical norms.",
      },
      {
        id: "c",
        spellName: "Arcana Solvus",
        routineId: "DGESV",
        flavorText: "Directly solve a system of linear equations using LU decomposition with pivoting.",
      },
      {
        id: "d",
        spellName: "Balance Ward",
        routineId: "DGEBAL",
        flavorText: "Balance a matrix to improve eigenvalue computation accuracy by reducing its norm.",
      },
    ],
    correctRoutineId: "DGECON",
    outcomeCorrect:
      "Stability Gauge pulses — the bridge's reciprocal condition number appears above the arch in glowing numerals. The troll steps aside, satisfied.",
    outcomeWrong:
      "The troll shakes its head. A condition number requires reciprocal condition estimation, not just a norm measurement.",
  },
  {
    id: 5,
    scenario:
      "An ancient sphinx guards a vault of knowledge. Its riddle: 'What are my eigenvalues?' The sphinx's enchantment matrix is symmetric — only by finding its spectral secrets may you pass.",
    spellOptions: [
      {
        id: "a",
        spellName: "Spectral Harmony",
        routineId: "DSYEV",
        flavorText: "Compute all eigenvalues and optionally eigenvectors of a real symmetric matrix.",
      },
      {
        id: "b",
        spellName: "Spectral Rift",
        routineId: "DGEEV",
        flavorText: "Compute eigenvalues and eigenvectors of a general (non-symmetric) matrix.",
      },
      {
        id: "c",
        spellName: "Veil Splitter",
        routineId: "DGESVD",
        flavorText: "Compute the full Singular Value Decomposition, revealing all singular values and singular vectors.",
      },
      {
        id: "d",
        spellName: "Tridiagonal Resonance",
        routineId: "DSTEQR",
        flavorText: "Compute eigenvalues of a real symmetric tridiagonal matrix using QR iteration.",
      },
    ],
    correctRoutineId: "DSYEV",
    outcomeCorrect:
      "Spectral Harmony rings out — the sphinx's real, symmetric eigenvalues materialize in ascending order. The vault door swings open.",
    outcomeWrong:
      "Wrong spell. The sphinx is symmetric — it demands a solver that exploits symmetry, not a general approach.",
  },
  {
    id: 6,
    scenario:
      "The Crystalmancer needs to solve a least-squares fitting problem: the enchanted line through a cloud of magical coordinates. The system is overdetermined — more equations than unknowns.",
    spellOptions: [
      {
        id: "a",
        spellName: "Least Runes",
        routineId: "DGELS",
        flavorText: "Solve overdetermined or underdetermined linear systems using QR or LQ factorization.",
      },
      {
        id: "b",
        spellName: "Arcana Solvus",
        routineId: "DGESV",
        flavorText: "Directly solve a square system of linear equations using LU decomposition.",
      },
      {
        id: "c",
        spellName: "QR Forge",
        routineId: "DGEQRF",
        flavorText: "Compute the QR factorization of a matrix — an intermediate step in many solves.",
      },
      {
        id: "d",
        spellName: "Veil Splitter",
        routineId: "DGESVD",
        flavorText: "Compute the full Singular Value Decomposition.",
      },
    ],
    correctRoutineId: "DGELS",
    outcomeCorrect:
      "Least Runes weaves through the cloud — a minimum-norm solution crystallizes, fitting every coordinate in the overdetermined sense. The Crystalmancer applauds.",
    outcomeWrong:
      "The fitting fails. An overdetermined system needs a least-squares solver, not a square system solver.",
  },
  {
    id: 7,
    scenario:
      "A spectral wraith's power is encoded as an upper Hessenberg matrix. To banish it you must compute its Schur decomposition, turning its form into triangular truth.",
    spellOptions: [
      {
        id: "a",
        spellName: "Schur Exorcism",
        routineId: "DHSEQR",
        flavorText: "Compute the eigenvalues and Schur factorization of an upper Hessenberg matrix.",
      },
      {
        id: "b",
        spellName: "Hessenberg Veil",
        routineId: "DGEHRD",
        flavorText: "Reduce a general matrix to upper Hessenberg form.",
      },
      {
        id: "c",
        spellName: "Spectral Rift",
        routineId: "DGEEV",
        flavorText: "Compute eigenvalues and eigenvectors of a general matrix.",
      },
      {
        id: "d",
        spellName: "Triangular Shield",
        routineId: "DTRTRS",
        flavorText: "Solve a triangular system of equations.",
      },
    ],
    correctRoutineId: "DHSEQR",
    outcomeCorrect:
      "Schur Exorcism blazes — the Hessenberg wraith collapses into upper triangular form. Its eigenvalues are pinned and it dissolves into harmless mist.",
    outcomeWrong:
      "The wraith laughs. It is already Hessenberg — you need the QR iteration to complete the Schur form, not reduction or a general solver.",
  },
  {
    id: 8,
    scenario:
      "The enchanted bridge can only bear loads described by a Cholesky-factored stiffness matrix. You must solve the bridge's load equations given that the stiffness matrix is symmetric positive definite.",
    spellOptions: [
      {
        id: "a",
        spellName: "Cholesky Channel",
        routineId: "DPOTRS",
        flavorText: "Solve a symmetric positive definite system using a previously computed Cholesky factorization.",
      },
      {
        id: "b",
        spellName: "Cholesky Ward",
        routineId: "DPOTRF",
        flavorText: "Compute the Cholesky factorization of a symmetric positive definite matrix.",
      },
      {
        id: "c",
        spellName: "LU Resolve",
        routineId: "DGETRS",
        flavorText: "Solve a system using a previously computed LU factorization.",
      },
      {
        id: "d",
        spellName: "Arcana Solvus",
        routineId: "DGESV",
        flavorText: "Solve a general square linear system from scratch.",
      },
    ],
    correctRoutineId: "DPOTRS",
    outcomeCorrect:
      "Cholesky Channel flows through the factored stiffness — the load equations are solved in a fraction of the time. The bridge holds firm.",
    outcomeWrong:
      "The bridge groans. The factorization is already done — you need the solve step that builds on Cholesky, not a fresh factorization.",
  },
  {
    id: 9,
    scenario:
      "A cursed knight bears an armor matrix that must be balanced before its eigenvalues can be trusted. Reduce the norm of its rows and columns without changing its spectrum.",
    spellOptions: [
      {
        id: "a",
        spellName: "Balance Ward",
        routineId: "DGEBAL",
        flavorText: "Balance a general matrix to reduce its norm and improve eigenvalue accuracy.",
      },
      {
        id: "b",
        spellName: "Scale Rune",
        routineId: "DSCAL",
        flavorText: "Scale a vector by a constant factor.",
      },
      {
        id: "c",
        spellName: "Diagonal Leveler",
        routineId: "DLASCL",
        flavorText: "Multiply a general rectangular matrix by a scalar, adjusting its scale.",
      },
      {
        id: "d",
        spellName: "Spectral Harmony",
        routineId: "DSYEV",
        flavorText: "Compute eigenvalues of a symmetric matrix directly.",
      },
    ],
    correctRoutineId: "DGEBAL",
    outcomeCorrect:
      "Balance Ward settles over the armor — rows and columns equalize, the norm shrinks, and the knight's spectral curse is ready to be lifted.",
    outcomeWrong:
      "The armor stays lopsided. Balancing a general matrix for eigenvalue computation requires DGEBAL — scaling a vector or scalar multiply won't do.",
  },
  {
    id: 10,
    scenario:
      "You discover the Tome of Rotations. To decode its next page you must apply a Givens rotation to a vector, using a precomputed cosine and sine of the rotation angle.",
    spellOptions: [
      {
        id: "a",
        spellName: "Givens Twist",
        routineId: "DROT",
        flavorText: "Apply a Givens plane rotation to two vectors using precomputed cos and sin values.",
      },
      {
        id: "b",
        spellName: "Rotation Forge",
        routineId: "DROTG",
        flavorText: "Construct the parameters for a Givens rotation from two scalars.",
      },
      {
        id: "c",
        spellName: "Sequence Twist",
        routineId: "DLASR",
        flavorText: "Apply a sequence of plane rotations to a general rectangular matrix.",
      },
      {
        id: "d",
        spellName: "Copy Rune",
        routineId: "DCOPY",
        flavorText: "Copy elements from one vector into another.",
      },
    ],
    correctRoutineId: "DROT",
    outcomeCorrect:
      "Givens Twist activates — the two vector components spin by the exact angle. The page decodes and the Tome reveals the next chapter.",
    outcomeWrong:
      "The page stays encrypted. Applying an already-computed rotation to a vector is DROT — constructing the parameters is a different step.",
  },
  {
    id: 11,
    scenario:
      "The Phantom Swapper enchants your party's formation: it demands you swap two vectors of coordinates, exchanging positions in the magical field without a temporary buffer.",
    spellOptions: [
      {
        id: "a",
        spellName: "Exchange Hex",
        routineId: "DSWAP",
        flavorText: "Exchange the elements of two vectors.",
      },
      {
        id: "b",
        spellName: "Copy Rune",
        routineId: "DCOPY",
        flavorText: "Copy elements from one vector into another.",
      },
      {
        id: "c",
        spellName: "Axpy Arrow",
        routineId: "DAXPY",
        flavorText: "Compute y = alpha*x + y — add a scaled vector to another.",
      },
      {
        id: "d",
        spellName: "Scale Rune",
        routineId: "DSCAL",
        flavorText: "Scale every element of a vector by a constant.",
      },
    ],
    correctRoutineId: "DSWAP",
    outcomeCorrect:
      "Exchange Hex fires — the two formation vectors trade places instantly. The Phantom Swapper nods and retreats.",
    outcomeWrong:
      "Wrong move. Copying overwrites but does not swap. To exchange two vectors you need DSWAP.",
  },
  {
    id: 12,
    scenario:
      "The Arch-Wizard needs the Frobenius norm of a battle grid to assess total destructive power. This measures the square root of the sum of all squared elements across the entire matrix.",
    spellOptions: [
      {
        id: "a",
        spellName: "Norm Bolt",
        routineId: "DLANGE",
        flavorText: "Compute the Frobenius, one-norm, infinity-norm, or max-norm of a general matrix.",
      },
      {
        id: "b",
        spellName: "Vector Magnitude",
        routineId: "DNRM2",
        flavorText: "Compute the Euclidean norm of a vector.",
      },
      {
        id: "c",
        spellName: "Symmetric Norm",
        routineId: "DLANSY",
        flavorText: "Compute the norm of a symmetric matrix.",
      },
      {
        id: "d",
        spellName: "Stability Gauge",
        routineId: "DGECON",
        flavorText: "Estimate the reciprocal condition number of a general matrix.",
      },
    ],
    correctRoutineId: "DLANGE",
    outcomeCorrect:
      "Norm Bolt blazes across the battle grid — the Frobenius norm materializes as a glowing scalar. The Arch-Wizard notes it in the war ledger.",
    outcomeWrong:
      "Insufficient. DNRM2 works on vectors and DLANSY is for symmetric matrices — for a general matrix you need DLANGE.",
  },
  {
    id: 13,
    scenario:
      "A lich's power is locked behind a triangular system of curses. The upper triangular enchantment matrix and the right-hand side are known. Solve directly without factoring again.",
    spellOptions: [
      {
        id: "a",
        spellName: "Triangular Shield",
        routineId: "DTRTRS",
        flavorText: "Solve a triangular system of equations without factoring.",
      },
      {
        id: "b",
        spellName: "LU Resolve",
        routineId: "DGETRS",
        flavorText: "Solve using a previously computed LU factorization.",
      },
      {
        id: "c",
        spellName: "Arcana Solvus",
        routineId: "DGESV",
        flavorText: "Solve a general square system including factorization.",
      },
      {
        id: "d",
        spellName: "Triangular Vector Lance",
        routineId: "DTRSV",
        flavorText: "Solve a triangular system with a single right-hand side vector.",
      },
    ],
    correctRoutineId: "DTRTRS",
    outcomeCorrect:
      "Triangular Shield activates — the lich's upper-triangular curse is back-substituted in an instant. The lich crumbles.",
    outcomeWrong:
      "The curse holds. The system is already triangular and needs multiple right-hand sides — DTRTRS handles this directly.",
  },
  {
    id: 14,
    scenario:
      "The Grand Enchantress needs the QR factorization of a rectangular portal matrix so she can later solve least-squares problems with different right-hand sides efficiently.",
    spellOptions: [
      {
        id: "a",
        spellName: "QR Forge",
        routineId: "DGEQRF",
        flavorText: "Compute the QR factorization of a general rectangular matrix using Householder reflectors.",
      },
      {
        id: "b",
        spellName: "Least Runes",
        routineId: "DGELS",
        flavorText: "Solve a least-squares system directly in one call.",
      },
      {
        id: "c",
        spellName: "Hessenberg Veil",
        routineId: "DGEHRD",
        flavorText: "Reduce to upper Hessenberg form.",
      },
      {
        id: "d",
        spellName: "LU Fracture",
        routineId: "DGETRF",
        flavorText: "Factorize using LU decomposition.",
      },
    ],
    correctRoutineId: "DGEQRF",
    outcomeCorrect:
      "QR Forge activates — Householder reflectors fold the portal matrix into QR form. The Grand Enchantress stores the factors for future use.",
    outcomeWrong:
      "Not the right spell. She needs the raw QR factorization stored for reuse — DGELS solves immediately but does not expose the factors.",
  },
  {
    id: 15,
    scenario:
      "The Final Boss: the Void Matrix tears reality. Its power is described by a massive general eigenvalue problem. Both the eigenvalues AND eigenvectors of a non-symmetric matrix must be computed to seal it.",
    spellOptions: [
      {
        id: "a",
        spellName: "Spectral Rift",
        routineId: "DGEEV",
        flavorText: "Compute all eigenvalues and, optionally, left and right eigenvectors of a general non-symmetric matrix.",
      },
      {
        id: "b",
        spellName: "Spectral Harmony",
        routineId: "DSYEV",
        flavorText: "Compute eigenvalues of a symmetric matrix.",
      },
      {
        id: "c",
        spellName: "Schur Exorcism",
        routineId: "DHSEQR",
        flavorText: "Compute Schur decomposition from Hessenberg form.",
      },
      {
        id: "d",
        spellName: "Divide-and-Conquer Eigen",
        routineId: "DSYEVD",
        flavorText: "Compute eigenvalues of a symmetric matrix using divide-and-conquer.",
      },
    ],
    correctRoutineId: "DGEEV",
    outcomeCorrect:
      "Spectral Rift tears open — all eigenvalues and eigenvectors of the non-symmetric Void Matrix are computed simultaneously. Reality seals itself. You are victorious.",
    outcomeWrong:
      "The void laughs. The matrix is not symmetric and needs eigenvectors too — only DGEEV handles the full general non-symmetric eigenvalue problem.",
  },
];

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
