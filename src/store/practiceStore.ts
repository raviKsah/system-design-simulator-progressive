import { create } from "zustand";
import { createJSONStorage, persist } from "zustand/middleware";
import { safeLocalStorage } from "./safeStorage";
import type { ScoreResult } from "@/types/scoring";

interface PracticeAttempt {
  score: number;
  at: string;
}

interface ProblemProgress {
  attempts: PracticeAttempt[];
  bestScore: number;
  mastered: boolean;
  unlockedHintCount: number;
}

interface PracticeState {
  progressByProblemId: Record<string, ProblemProgress>;
  activeLevel: 1 | 2 | 3 | "all";
  setActiveLevel: (level: PracticeState["activeLevel"]) => void;
  recordAttempt: (problemId: string, result: ScoreResult, targetScore: number) => void;
  unlockNextHint: (problemId: string, maxHints: number) => void;
  resetProgress: (problemId: string) => void;
}

function emptyProgress(): ProblemProgress {
  return {
    attempts: [],
    bestScore: 0,
    mastered: false,
    unlockedHintCount: 1,
  };
}

export const usePracticeStore = create<PracticeState>()(
  persist(
    (set) => ({
      progressByProblemId: {},
      activeLevel: "all",

      setActiveLevel: (level) => set({ activeLevel: level }),

      recordAttempt: (problemId, result, targetScore) =>
        set((state) => {
          const current = state.progressByProblemId[problemId] ?? emptyProgress();
          const attempts = [
            { score: result.total, at: new Date().toISOString() },
            ...current.attempts,
          ].slice(0, 20);
          const mastered = result.total >= targetScore;
          const failedAttemptCount = attempts.filter((attempt) => attempt.score < targetScore).length;
          const unlockedHintCount = mastered
            ? current.unlockedHintCount
            : Math.max(current.unlockedHintCount, Math.min(6, failedAttemptCount + 1));

          return {
            progressByProblemId: {
              ...state.progressByProblemId,
              [problemId]: {
                attempts,
                bestScore: Math.max(current.bestScore, result.total),
                mastered: current.mastered || mastered,
                unlockedHintCount,
              },
            },
          };
        }),

      unlockNextHint: (problemId, maxHints) =>
        set((state) => {
          const current = state.progressByProblemId[problemId] ?? emptyProgress();
          return {
            progressByProblemId: {
              ...state.progressByProblemId,
              [problemId]: {
                ...current,
                unlockedHintCount: Math.min(maxHints, current.unlockedHintCount + 1),
              },
            },
          };
        }),

      resetProgress: (problemId) =>
        set((state) => {
          const next = { ...state.progressByProblemId };
          delete next[problemId];
          return { progressByProblemId: next };
        }),
    }),
    {
      name: "systemsim-practice-progress",
      version: 1,
      skipHydration: true,
      storage: createJSONStorage(() => safeLocalStorage),
    }
  )
);
