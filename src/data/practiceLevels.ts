import type { Problem } from "@/types/problem";

export interface PracticeLevel {
  level: 1 | 2 | 3;
  label: string;
  targetScore: number;
  summary: string;
  focus: string[];
  missions: string[];
  difficulty: Problem["difficulty"][];
}

export const PRACTICE_LEVELS: PracticeLevel[] = [
  {
    level: 1,
    label: "Level 1",
    targetScore: 65,
    summary: "Core blocks, request path, and one clear database choice.",
    focus: ["Entry path", "API layer", "Primary storage", "Basic cache"],
    missions: [
      "Trace one user request from client to storage.",
      "Choose SQL vs NoSQL and explain the reason.",
      "Add one cache only after naming the read bottleneck.",
    ],
    difficulty: ["Easy"],
  },
  {
    level: 2,
    label: "Level 2",
    targetScore: 78,
    summary: "Scale reads and writes with queues, partitioning, and failure handling.",
    focus: ["Hot paths", "Async flows", "Replication", "Capacity estimates"],
    missions: [
      "Separate synchronous APIs from asynchronous work.",
      "Identify the partition key and the hottest entity.",
      "Describe what users see when one dependency fails.",
    ],
    difficulty: ["Medium"],
  },
  {
    level: 3,
    label: "Level 3",
    targetScore: 88,
    summary: "Senior-loop depth: trade-offs, bottlenecks, degradation, and operations.",
    focus: ["Consistency trade-offs", "Regional scale", "Observability", "Cost control"],
    missions: [
      "Name the main trade-off before adding components.",
      "Design for regional failure and stale-but-usable behavior.",
      "Add metrics, alerts, and a cost pressure point.",
    ],
    difficulty: ["Hard"],
  },
];

export function getProblemLevel(problem: Pick<Problem, "difficulty" | "practiceLevel">): PracticeLevel {
  const level = problem.practiceLevel ?? (problem.difficulty === "Easy" ? 1 : problem.difficulty === "Medium" ? 2 : 3);
  return PRACTICE_LEVELS.find((item) => item.level === level) ?? PRACTICE_LEVELS[0];
}

export function getLevelTarget(problem: Pick<Problem, "difficulty" | "practiceLevel">): number {
  return getProblemLevel(problem).targetScore;
}
