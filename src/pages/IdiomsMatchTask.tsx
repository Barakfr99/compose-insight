import { useState, useRef, useEffect, useCallback, useMemo } from "react";
import { useParams } from "react-router-dom";
import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Progress } from "@/components/ui/progress";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from "@/components/ui/dialog";
import { getRounds, shuffleArray, calculateIdiomsGrade, type Idiom, type MatchResult } from "@/lib/idioms-data";
import { Sparkles, ArrowLeft, CheckCircle2 } from "lucide-react";

type Phase = "landing" | "name" | "playing" | "finished";

interface IdiomsMatchTaskProps {
  taskId: string;
  taskTitle: string;
}

const IdiomsMatchTask = ({ taskId, taskTitle }: IdiomsMatchTaskProps) => {
  const [phase, setPhase] = useState<Phase>("landing");
  const [studentName, setStudentName] = useState("");
  const [nameError, setNameError] = useState(false);
  const startTimeRef = useRef<number>(0);

  // Game state
  const [rounds, setRounds] = useState<Idiom[][]>([]);
  const [currentRound, setCurrentRound] = useState(0);
  const [shuffledMeanings, setShuffledMeanings] = useState<string[]>([]);
  const [selectedIdiom, setSelectedIdiom] = useState<number | null>(null);
  const [matchedPairs, setMatchedPairs] = useState<Set<number>>(new Set());
  const [attempts, setAttempts] = useState<Record<number, number>>({});
  const [allResults, setAllResults] = useState<MatchResult[]>([]);
  const [shakeId, setShakeId] = useState<string | null>(null);
  const [correctFlash, setCorrectFlash] = useState<number | null>(null);
  const [submitting, setSubmitting] = useState(false);
  const [finalGrade, setFinalGrade] = useState(0);

  // Initialize rounds
  const initGame = useCallback(() => {
    const r = getRounds();
    setRounds(r);
    setCurrentRound(0);
    setMatchedPairs(new Set());
    setAttempts({});
    setAllResults([]);
    setSelectedIdiom(null);
    if (r.length > 0) {
      setShuffledMeanings(shuffleArray(r[0].map(i => i.meaning)));
    }
    startTimeRef.current = Date.now();
  }, []);

  // When round changes, shuffle meanings
  useEffect(() => {
    if (rounds.length > 0 && currentRound < rounds.length) {
      setShuffledMeanings(shuffleArray(rounds[currentRound].map(i => i.meaning)));
      setMatchedPairs(new Set());
      setSelectedIdiom(null);
    }
  }, [currentRound, rounds]);

  const currentIdioms = rounds[currentRound] || [];

  const handleStartClick = () => setPhase("name");

  const handleNameSubmit = () => {
    if (!studentName.trim()) {
      setNameError(true);
      return;
    }
    setNameError(false);
    initGame();
    setPhase("playing");
  };

  const handleIdiomClick = (idiomId: number) => {
    if (matchedPairs.has(idiomId)) return;
    setSelectedIdiom(idiomId === selectedIdiom ? null : idiomId);
  };

  const handleMeaningClick = (meaning: string) => {
    if (selectedIdiom === null) return;
    const idiom = currentIdioms.find(i => i.id === selectedIdiom);
    if (!idiom) return;

    const newAttempts = { ...attempts, [idiom.id]: (attempts[idiom.id] || 0) + 1 };
    setAttempts(newAttempts);

    if (idiom.meaning === meaning) {
      // Correct!
      setCorrectFlash(idiom.id);
      setTimeout(() => setCorrectFlash(null), 600);
      const newMatched = new Set(matchedPairs);
      newMatched.add(idiom.id);
      setMatchedPairs(newMatched);
      setSelectedIdiom(null);

      const result: MatchResult = {
        idiomId: idiom.id,
        idiom: idiom.idiom,
        correctMeaning: idiom.meaning,
        selectedMeaning: meaning,
        attempts: newAttempts[idiom.id],
        correct: true,
      };
      const updatedResults = [...allResults, result];
      setAllResults(updatedResults);

      // Check if round complete
      if (newMatched.size === currentIdioms.length) {
        setTimeout(() => {
          if (currentRound < rounds.length - 1) {
            setCurrentRound(prev => prev + 1);
          } else {
            // Game finished — auto submit
            handleFinish(updatedResults);
          }
        }, 800);
      }
    } else {
      // Wrong
      setShakeId(`meaning-${meaning}`);
      setTimeout(() => setShakeId(null), 500);
    }
  };

  const handleFinish = async (results: MatchResult[]) => {
    setSubmitting(true);
    const grade = calculateIdiomsGrade(results);
    setFinalGrade(grade);

    const timeSpent = Math.round((Date.now() - startTimeRef.current) / 1000);
    const answerData = JSON.stringify({ matches: results });

    await supabase.from("submissions").insert({
      task_id: taskId,
      student_name: studentName.trim(),
      answer_text: answerData,
      task_type: "idioms-match",
      grade,
      time_spent_seconds: timeSpent,
      word_count: 0,
      paste_count: 0,
    });

    setSubmitting(false);
    setPhase("finished");
  };

  const totalIdioms = rounds.reduce((sum, r) => sum + r.length, 0);
  const completedIdioms = allResults.length;
  const progressPercent = totalIdioms > 0 ? (completedIdioms / totalIdioms) * 100 : 0;

  // ─── LANDING ───────────────────────────────────────────────
  if (phase === "landing") {
    return (
      <div className="min-h-[100dvh] flex flex-col items-center justify-center p-6 pb-safe bg-gradient-to-br from-primary/10 via-background to-accent-purple/10">
        <div className="max-w-lg w-full text-center space-y-8 animate-[fade-in_0.5s_ease-out]">
          <div className="space-y-2">
            <div className="inline-flex items-center gap-2 bg-primary/10 text-primary rounded-full px-4 py-1.5 text-sm font-medium mb-4">
              <Sparkles className="h-4 w-4" />
              משחק התאמה
            </div>
            <h1 className="text-3xl md:text-4xl font-bold text-foreground">{taskTitle}</h1>
          </div>

          <div className="bg-card rounded-2xl p-6 shadow-lg border text-right space-y-4">
            <h2 className="text-lg font-semibold text-foreground">מה צריך לעשות?</h2>
            <ul className="space-y-3 text-muted-foreground text-sm leading-relaxed">
              <li className="flex items-start gap-2">
                <span className="bg-primary text-primary-foreground rounded-full w-6 h-6 flex items-center justify-center text-xs font-bold shrink-0 mt-0.5">1</span>
                <span>לחצו על <strong className="text-foreground">ניב</strong> מהצד הימני</span>
              </li>
              <li className="flex items-start gap-2">
                <span className="bg-primary text-primary-foreground rounded-full w-6 h-6 flex items-center justify-center text-xs font-bold shrink-0 mt-0.5">2</span>
                <span>לחצו על <strong className="text-foreground">המשמעות</strong> המתאימה מהצד השמאלי</span>
              </li>
              <li className="flex items-start gap-2">
                <span className="bg-primary text-primary-foreground rounded-full w-6 h-6 flex items-center justify-center text-xs font-bold shrink-0 mt-0.5">3</span>
                <span>התאימו נכון בניסיון הראשון כדי לקבל את <strong className="text-foreground">הציון הגבוה ביותר</strong>!</span>
              </li>
            </ul>
            <p className="text-xs text-muted-foreground border-t pt-3">
              המשחק מחולק לסבבים. בכל סבב 5-6 ניבים להתאמה. בסיום — הציון יחושב אוטומטית.
            </p>
          </div>

          <Button
            size="lg"
            className="text-lg px-10 py-6 rounded-xl shadow-lg hover:shadow-xl transition-all active:scale-95 min-h-[56px]"
            onClick={handleStartClick}
          >
            <Sparkles className="h-5 w-5 ml-2" />
            !בואו נתחיל
          </Button>
        </div>
      </div>
    );
  }

  // ─── NAME DIALOG ───────────────────────────────────────────
  if (phase === "name") {
    return (
      <div className="min-h-[100dvh] flex items-center justify-center p-6 pb-safe bg-gradient-to-br from-primary/10 via-background to-accent-purple/10">
        <Dialog open onOpenChange={(open) => { if (!open) setPhase("landing"); }}>
          <DialogContent dir="rtl" className="sm:max-w-md">
            <DialogHeader>
              <DialogTitle className="text-xl">מה השם שלך?</DialogTitle>
              <DialogDescription>הזינו את שמכם המלא כדי להתחיל במשחק</DialogDescription>
            </DialogHeader>
            <div className="space-y-4 pt-2">
              <Input
                placeholder="שם מלא"
                value={studentName}
                onChange={(e) => { setStudentName(e.target.value); setNameError(false); }}
                onKeyDown={(e) => e.key === "Enter" && handleNameSubmit()}
                className={`text-base min-h-[48px] ${nameError ? "border-destructive" : ""}`}
                autoFocus
              />
              {nameError && <p className="text-destructive text-sm">נא להזין שם</p>}
              <Button className="w-full min-h-[48px] text-base active:scale-95" onClick={handleNameSubmit}>
                התחל משחק
              </Button>
            </div>
          </DialogContent>
        </Dialog>
      </div>
    );
  }

  // ─── FINISHED ──────────────────────────────────────────────
  if (phase === "finished") {
    const gradeColor = finalGrade >= 80 ? "text-success" : finalGrade >= 50 ? "text-warning" : "text-destructive";
    return (
      <div className="min-h-[100dvh] flex flex-col items-center justify-center p-6 pb-safe bg-gradient-to-br from-success/10 via-background to-primary/10 relative overflow-hidden">
        {/* CSS Sparkles */}
        <div className="absolute inset-0 pointer-events-none">
          {Array.from({ length: 20 }).map((_, i) => (
            <div
              key={i}
              className="absolute rounded-full bg-primary/20"
              style={{
                width: `${Math.random() * 8 + 4}px`,
                height: `${Math.random() * 8 + 4}px`,
                left: `${Math.random() * 100}%`,
                top: `${Math.random() * 100}%`,
                animation: `sparkle ${1.5 + Math.random() * 2}s ease-in-out infinite`,
                animationDelay: `${Math.random() * 2}s`,
              }}
            />
          ))}
        </div>

        <div className="text-center space-y-6 animate-[scale-in_0.4s_ease-out] relative z-10">
          <CheckCircle2 className="h-20 w-20 text-success mx-auto animate-[bounce_1s_ease-in-out]" />
          <h1 className="text-3xl font-bold text-foreground">!כל הכבוד</h1>
          <p className="text-muted-foreground text-lg">{studentName}, סיימת את המשחק</p>
          <div className={`text-7xl font-black ${gradeColor} animate-[fade-in_0.6s_ease-out_0.3s_both]`}>
            {finalGrade}
          </div>
          <p className="text-muted-foreground">מתוך 100</p>
          <p className="text-sm text-muted-foreground">התוצאות נשמרו ונשלחו למורה ✓</p>
        </div>
      </div>
    );
  }

  // ─── PLAYING ───────────────────────────────────────────────
  return (
    <div className="min-h-[100dvh] flex flex-col bg-background pb-safe" dir="rtl">
      {/* Header */}
      <div className="sticky top-0 z-10 bg-background/95 backdrop-blur border-b px-4 py-3 space-y-2">
        <div className="flex items-center justify-between">
          <span className="text-sm font-medium text-foreground">
            סבב {currentRound + 1} מתוך {rounds.length}
          </span>
          <span className="text-xs text-muted-foreground">
            {completedIdioms}/{totalIdioms} ניבים
          </span>
        </div>
        <Progress value={progressPercent} className="h-2" />
      </div>

      {/* Game area — mobile-first stacked layout */}
      <div className="flex-1 p-3 sm:p-4 overflow-auto">
        <div className="max-w-3xl mx-auto space-y-4">
          {/* Sentences with idioms */}
          <div className="space-y-2">
            <h3 className="text-xs font-semibold text-muted-foreground mb-1 text-center">לחצו על משפט ואז בחרו את המשמעות</h3>
            {currentIdioms.map((idiom) => {
              const isMatched = matchedPairs.has(idiom.id);
              const isSelected = selectedIdiom === idiom.id;
              const isFlashing = correctFlash === idiom.id;

              // Highlight the idiom within the example sentence
              const parts = idiom.example.split(new RegExp(`(${idiom.idiom.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')})`, 'i'));

              return (
                <button
                  key={idiom.id}
                  disabled={isMatched}
                  onClick={() => handleIdiomClick(idiom.id)}
                  className={`
                    w-full min-h-[56px] px-4 py-3 rounded-xl text-right
                    transition-all duration-200 active:scale-[0.97] border-2
                    ${isMatched
                      ? "bg-success/15 border-success/40 cursor-default"
                      : isSelected
                        ? "bg-primary/10 border-primary shadow-md scale-[1.01]"
                        : "bg-card border-border hover:border-primary/50 hover:bg-primary/5"
                    }
                    ${isFlashing ? "animate-[correct-pop_0.5s_ease-out]" : ""}
                  `}
                >
                  <span className={`text-sm leading-relaxed ${isMatched ? "text-success" : "text-foreground"}`}>
                    {isMatched && <CheckCircle2 className="h-4 w-4 inline ml-1.5 text-success align-text-bottom" />}
                    {parts.map((part, pi) => {
                      // Check if this part matches the idiom (case-insensitive for Hebrew)
                      const isIdiomPart = part.replace(/[.*+?^${}()|[\]\\]/g, '').trim() === idiom.idiom.replace(/[.*+?^${}()|[\]\\]/g, '').trim();
                      if (isIdiomPart) {
                        return (
                          <span key={pi} className={`font-bold ${isMatched ? "text-success" : isSelected ? "text-primary" : "text-primary"} underline decoration-2 underline-offset-2`}>
                            {part}
                          </span>
                        );
                      }
                      return <span key={pi}>{part}</span>;
                    })}
                  </span>
                </button>
              );
            })}
          </div>

          {/* Divider */}
          <div className="flex items-center gap-3">
            <div className="flex-1 border-t border-border" />
            <span className="text-xs text-muted-foreground font-medium">בחרו את המשמעות</span>
            <div className="flex-1 border-t border-border" />
          </div>

          {/* Meanings */}
          <div className="space-y-2">
            {shuffledMeanings.map((meaning) => {
              const matchedIdiom = currentIdioms.find(i => i.meaning === meaning && matchedPairs.has(i.id));
              const isMatched = !!matchedIdiom;
              const isShaking = shakeId === `meaning-${meaning}`;

              return (
                <button
                  key={meaning}
                  disabled={isMatched || selectedIdiom === null}
                  onClick={() => handleMeaningClick(meaning)}
                  className={`
                    w-full min-h-[52px] px-4 py-3 rounded-xl text-sm text-right leading-relaxed
                    transition-all duration-200 active:scale-[0.97] border-2
                    ${isMatched
                      ? "bg-success/15 border-success/40 text-success cursor-default"
                      : selectedIdiom !== null
                        ? "bg-card border-border hover:border-accent-purple/50 hover:bg-accent-purple/5 cursor-pointer"
                        : "bg-muted/50 border-transparent text-muted-foreground cursor-default"
                    }
                    ${isShaking ? "animate-[shake_0.4s_ease-in-out]" : ""}
                  `}
                >
                  {isMatched && <CheckCircle2 className="h-4 w-4 inline ml-1.5 text-success align-text-bottom" />}
                  {meaning}
                </button>
              );
            })}
          </div>
        </div>
      </div>

      {submitting && (
        <div className="fixed inset-0 z-50 bg-background/80 flex items-center justify-center">
          <p className="text-lg text-muted-foreground animate-pulse">שומר תוצאות...</p>
        </div>
      )}
    </div>
  );
};

export default IdiomsMatchTask;
