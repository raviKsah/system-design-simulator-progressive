"use client";

import { useMemo, useState } from "react";
import { Badge } from "@/components/ui/badge";
import { ScrollArea } from "@/components/ui/scroll-area";
import { PROBLEMS } from "@/data/problems";
import { PRACTICE_LEVELS, getProblemLevel } from "@/data/practiceLevels";
import { useAppStore } from "@/store/appStore";
import { useCanvasStore } from "@/store/canvasStore";
import { useCustomProblemsStore } from "@/store/customProblemsStore";
import { usePracticeStore } from "@/store/practiceStore";
import type { CompanyQuestionCandidate, CompanyQuestionResponse } from "@/types/companyQuestions";
import { CheckCircle2, Circle, ExternalLink, Loader2, LockKeyhole, Map, Radar, RotateCcw, Search, Sparkles, Target, Trophy } from "lucide-react";

const inputClass =
  "w-full rounded-md border border-zinc-700 bg-zinc-800 px-2.5 py-1.5 text-xs text-zinc-100 placeholder-zinc-500 outline-none focus:border-cyan-500";

function difficultyColor(difficulty: string): string {
  if (difficulty === "Easy") return "border-emerald-500/30 bg-emerald-500/10 text-emerald-400";
  if (difficulty === "Medium") return "border-amber-500/30 bg-amber-500/10 text-amber-400";
  return "border-rose-500/30 bg-rose-500/10 text-rose-400";
}

function levelTone(level: number): string {
  if (level === 1) return "text-emerald-400";
  if (level === 2) return "text-amber-400";
  return "text-rose-400";
}

function compactDate(value?: string): string {
  if (!value) return "";
  try {
    return new Intl.DateTimeFormat("en-US", { month: "short", day: "numeric" }).format(new Date(value));
  } catch {
    return "";
  }
}

export function PracticeCoach() {
  const selectedProblemId = useAppStore((s) => s.selectedProblemId);
  const setSelectedProblem = useAppStore((s) => s.setSelectedProblem);
  const showToast = useAppStore((s) => s.showToast);
  const addProblem = useCustomProblemsStore((s) => s.addProblem);
  const activeLevel = usePracticeStore((s) => s.activeLevel);
  const setActiveLevel = usePracticeStore((s) => s.setActiveLevel);
  const progressByProblemId = usePracticeStore((s) => s.progressByProblemId);
  const resetProgress = usePracticeStore((s) => s.resetProgress);

  const [company, setCompany] = useState("Meta");
  const [radar, setRadar] = useState<CompanyQuestionResponse | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const levelStats = useMemo(() => {
    return PRACTICE_LEVELS.map((level) => {
      const problems = PROBLEMS.filter((problem) => getProblemLevel(problem).level === level.level);
      const mastered = problems.filter((problem) => progressByProblemId[problem.id]?.mastered).length;
      const bestScore = problems.reduce((best, problem) => Math.max(best, progressByProblemId[problem.id]?.bestScore ?? 0), 0);
      return { ...level, problems, mastered, total: problems.length, bestScore };
    });
  }, [progressByProblemId]);

  const isLevelUnlocked = (levelNumber: 1 | 2 | 3) => {
    if (levelNumber === 1) return true;
    const previous = levelStats.find((level) => level.level === levelNumber - 1);
    if (!previous) return false;
    return previous.mastered >= Math.min(2, previous.total);
  };

  const recommendedLevel =
    levelStats.find((level) => isLevelUnlocked(level.level) && level.mastered < level.total) ??
    levelStats[levelStats.length - 1];

  const recommendedProblem =
    recommendedLevel.problems.find((problem) => !progressByProblemId[problem.id]?.mastered) ??
    PROBLEMS.find((problem) => !progressByProblemId[problem.id]?.mastered) ??
    PROBLEMS[0];

  const visibleProblems = useMemo(() => {
    if (activeLevel === "all") return PROBLEMS;
    return PROBLEMS.filter((problem) => getProblemLevel(problem).level === activeLevel);
  }, [activeLevel]);

  const masteredCount = PROBLEMS.filter((problem) => progressByProblemId[problem.id]?.mastered).length;

  const searchCompany = async () => {
    const trimmed = company.trim();
    if (!trimmed || loading) return;
    setLoading(true);
    setError(null);
    try {
      const response = await fetch(`/api/company-questions?company=${encodeURIComponent(trimmed)}`);
      if (!response.ok) throw new Error("Search failed");
      const data = (await response.json()) as CompanyQuestionResponse;
      setRadar(data);
    } catch {
      setError("Could not reach live search. Try again after deployment.");
    } finally {
      setLoading(false);
    }
  };

  const startProblem = (problemId: string) => {
    setSelectedProblem(problemId);
    useCanvasStore.getState().clearCanvas();
    useAppStore.getState().setActiveRightTab("properties");
    showToast("Practice canvas ready", "success");
  };

  const createCompanyProblem = (candidate: CompanyQuestionCandidate) => {
    const id = addProblem({
      title: `${radar?.company ?? company}: ${candidate.title}`,
      difficulty: candidate.difficulty,
      description: candidate.prompt,
      requirements: {
        readsPerSec: candidate.difficulty === "Hard" ? 150000 : 50000,
        writesPerSec: candidate.difficulty === "Hard" ? 25000 : 5000,
        storageGB: candidate.difficulty === "Hard" ? 100000 : 10000,
        latencyMs: candidate.difficulty === "Hard" ? 200 : 300,
        users: "Interview scale",
      },
      constraints: [
        "Define APIs, request paths, data model, and read/write bottlenecks.",
        "Call out consistency, availability, latency, cost, and failure-mode trade-offs.",
        "Include observability, degradation behavior, and launch or migration risks.",
      ],
      tags: candidate.tags,
    });
    startProblem(id);
  };

  return (
    <ScrollArea className="h-full">
      <div className="space-y-4 p-3">
        <div className="rounded-md border border-zinc-700 bg-zinc-800/50 p-3">
          <div className="flex items-center gap-2">
            <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-md bg-cyan-500/10 text-cyan-400">
              <Trophy className="h-4 w-4" />
            </div>
            <div className="min-w-0">
              <p className="text-xs font-semibold text-zinc-100">Practice Ladder</p>
              <p className="text-[11px] text-zinc-500">{masteredCount}/{PROBLEMS.length} mastered</p>
            </div>
          </div>

          <div className="mt-3 grid grid-cols-4 gap-1">
            <button
              onClick={() => setActiveLevel("all")}
              className={`rounded-md border px-2 py-1.5 text-[11px] font-medium ${
                activeLevel === "all" ? "border-cyan-500/40 bg-cyan-500/10 text-cyan-400" : "border-zinc-700 text-zinc-400 hover:bg-zinc-800"
              }`}
            >
              All
            </button>
            {PRACTICE_LEVELS.map((level) => (
              (() => {
                const unlocked = isLevelUnlocked(level.level);
                return (
                  <button
                    key={level.level}
                    onClick={() => {
                      if (unlocked) {
                        setActiveLevel(level.level);
                      } else {
                        showToast(`Master Level ${level.level - 1} first`, "info");
                      }
                    }}
                    className={`flex items-center justify-center gap-1 rounded-md border px-2 py-1.5 text-[11px] font-medium ${
                      activeLevel === level.level
                        ? "border-cyan-500/40 bg-cyan-500/10 text-cyan-400"
                        : unlocked
                          ? "border-zinc-700 text-zinc-400 hover:bg-zinc-800"
                          : "border-zinc-800 text-zinc-600"
                    }`}
                    aria-disabled={!unlocked}
                  >
                    {!unlocked && <LockKeyhole className="h-2.5 w-2.5" />}
                    L{level.level}
                  </button>
                );
              })()
            ))}
          </div>

          {recommendedProblem && (
            <div className="mt-3 rounded-md border border-cyan-500/30 bg-cyan-500/10 p-2.5">
              <div className="flex items-start gap-2">
                <Map className="mt-0.5 h-3.5 w-3.5 shrink-0 text-cyan-400" />
                <div className="min-w-0 flex-1">
                  <div className="flex items-center justify-between gap-2">
                    <p className="text-xs font-medium text-cyan-300">Current milestone</p>
                    <span className="font-mono text-[10px] text-cyan-300/80">
                      {recommendedLevel.mastered}/{recommendedLevel.total}
                    </span>
                  </div>
                  <p className="mt-1 truncate text-xs font-semibold text-zinc-100">{recommendedProblem.title}</p>
                  <p className="mt-1 text-[11px] leading-relaxed text-zinc-400">{recommendedLevel.summary}</p>
                  <button
                    onClick={() => startProblem(recommendedProblem.id)}
                    className="mt-2 rounded-md bg-cyan-500 px-2.5 py-1 text-[11px] font-medium text-white hover:bg-cyan-400"
                  >
                    Start milestone
                  </button>
                </div>
              </div>
            </div>
          )}

          {activeLevel !== "all" && (
            <div className="mt-3 space-y-2">
              {PRACTICE_LEVELS.filter((level) => level.level === activeLevel).map((level) => (
                <div key={level.level}>
                  <div className="flex items-center justify-between">
                    <span className={`text-xs font-medium ${levelTone(level.level)}`}>{level.label}</span>
                    <span className="font-mono text-[11px] text-zinc-500">Target {level.targetScore}</span>
                  </div>
                  <p className="mt-1 text-[11px] leading-relaxed text-zinc-400">{level.summary}</p>
                  <div className="mt-2 flex flex-wrap gap-1">
                    {level.focus.map((item) => (
                      <span key={item} className="rounded border border-zinc-700 px-1.5 py-0.5 text-[10px] text-zinc-500">
                        {item}
                      </span>
                    ))}
                  </div>
                  <div className="mt-2 space-y-1.5">
                    {level.missions.map((mission, index) => (
                      <div key={mission} className="flex items-start gap-1.5 rounded-md bg-zinc-900/50 px-2 py-1.5">
                        <span className="mt-0.5 flex h-3.5 w-3.5 shrink-0 items-center justify-center rounded-full bg-zinc-800 font-mono text-[9px] text-zinc-400">
                          {index + 1}
                        </span>
                        <span className="text-[11px] leading-relaxed text-zinc-400">{mission}</span>
                      </div>
                    ))}
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>

        <div className="space-y-2">
          <div className="flex items-center justify-between">
            <p className="text-xs font-semibold uppercase tracking-wider text-zinc-500">Queue</p>
            <Target className="h-3.5 w-3.5 text-zinc-500" />
          </div>

          <div className="space-y-1.5">
            {visibleProblems.map((problem) => {
              const level = getProblemLevel(problem);
              const progress = progressByProblemId[problem.id];
              const latest = progress?.attempts[0];
              const pct = Math.min(100, Math.round(((progress?.bestScore ?? 0) / level.targetScore) * 100));
              const selected = selectedProblemId === problem.id;

              return (
                <div
                  key={problem.id}
                  className={`rounded-md border px-2.5 py-2 ${
                    selected ? "border-cyan-500/40 bg-cyan-500/5" : "border-zinc-700 bg-zinc-800/50"
                  }`}
                >
                  <button onClick={() => startProblem(problem.id)} className="flex w-full items-start gap-2 text-left">
                    {progress?.mastered ? (
                      <CheckCircle2 className="mt-0.5 h-3.5 w-3.5 shrink-0 text-emerald-400" />
                    ) : (
                      <Circle className="mt-0.5 h-3.5 w-3.5 shrink-0 text-zinc-500" />
                    )}
                    <span className="min-w-0 flex-1">
                      <span className="block truncate text-xs font-medium text-zinc-200">{problem.title}</span>
                      <span className="mt-1 flex flex-wrap items-center gap-1.5">
                        <Badge variant="outline" className={`h-4 px-1.5 text-[10px] ${difficultyColor(problem.difficulty)}`}>
                          L{level.level}
                        </Badge>
                        <span className="font-mono text-[10px] text-zinc-500">
                          Best {progress?.bestScore ?? 0}/{level.targetScore}
                        </span>
                        {latest && <span className="text-[10px] text-zinc-600">{compactDate(latest.at)}</span>}
                      </span>
                    </span>
                  </button>
                  <div className="mt-2 h-1 overflow-hidden rounded-full bg-zinc-700/70">
                    <div className="h-full rounded-full bg-cyan-500" style={{ width: `${pct}%` }} />
                  </div>
                  {progress && (
                    <button
                      onClick={() => resetProgress(problem.id)}
                      className="mt-1.5 flex items-center gap-1 text-[10px] text-zinc-500 hover:text-zinc-300"
                    >
                      <RotateCcw className="h-3 w-3" />
                      Reset
                    </button>
                  )}
                </div>
              );
            })}
          </div>
        </div>

        <div className="rounded-md border border-zinc-700 bg-zinc-800/50 p-3">
          <div className="flex items-center gap-2">
            <Radar className="h-4 w-4 text-cyan-400" />
            <p className="text-xs font-semibold text-zinc-100">Company HLD Radar</p>
          </div>

          <div className="mt-3 flex gap-1.5">
            <input
              value={company}
              onChange={(event) => setCompany(event.target.value)}
              onKeyDown={(event) => {
                if (event.key === "Enter") searchCompany();
              }}
              className={inputClass}
              placeholder="Company"
            />
            <button
              onClick={searchCompany}
              disabled={loading || !company.trim()}
              className="flex h-8 w-8 shrink-0 items-center justify-center rounded-md bg-cyan-500 text-white hover:bg-cyan-400 disabled:opacity-50"
              title="Search recent HLD questions"
              aria-label="Search recent HLD questions"
            >
              {loading ? <Loader2 className="h-3.5 w-3.5 animate-spin" /> : <Search className="h-3.5 w-3.5" />}
            </button>
          </div>

          {error && <p className="mt-2 text-[11px] text-rose-400">{error}</p>}

          {radar && (
            <div className="mt-3 space-y-2">
              <div className="flex items-center justify-between">
                <Badge variant="outline" className="h-4 border-cyan-500/30 bg-cyan-500/10 px-1.5 text-[10px] text-cyan-400">
                  {radar.source === "web" ? "Live web" : "Curated"}
                </Badge>
                <span className="text-[10px] text-zinc-500">{compactDate(radar.generatedAt)}</span>
              </div>
              {radar.candidates.map((candidate) => (
                <div key={candidate.id} className="rounded-md border border-zinc-700 bg-zinc-900/60 p-2">
                  <div className="flex items-start gap-2">
                    <Sparkles className="mt-0.5 h-3.5 w-3.5 shrink-0 text-amber-400" />
                    <div className="min-w-0 flex-1">
                      <p className="text-xs font-medium text-zinc-200">{candidate.title}</p>
                      <p className="mt-1 text-[11px] leading-relaxed text-zinc-500">{candidate.prompt}</p>
                    </div>
                  </div>
                  <div className="mt-2 flex flex-wrap gap-1">
                    <Badge variant="outline" className={`h-4 px-1.5 text-[10px] ${difficultyColor(candidate.difficulty)}`}>
                      {candidate.difficulty}
                    </Badge>
                    <Badge variant="outline" className="h-4 border-zinc-700 px-1.5 text-[10px] text-zinc-500">
                      {candidate.recency}
                    </Badge>
                    <Badge variant="outline" className="h-4 border-zinc-700 px-1.5 text-[10px] text-zinc-500">
                      x{candidate.frequency}
                    </Badge>
                  </div>
                  <div className="mt-2 flex items-center justify-between gap-2">
                    <button
                      onClick={() => createCompanyProblem(candidate)}
                      className="rounded-md bg-cyan-500 px-2.5 py-1 text-[11px] font-medium text-white hover:bg-cyan-400"
                    >
                      Practice
                    </button>
                    {candidate.sourceUrls[0] && (
                      <a
                        href={candidate.sourceUrls[0]}
                        target="_blank"
                        rel="noreferrer"
                        className="flex items-center gap-1 text-[10px] text-zinc-500 hover:text-zinc-300"
                      >
                        Source
                        <ExternalLink className="h-3 w-3" />
                      </a>
                    )}
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
    </ScrollArea>
  );
}
