import { useState, useRef, useEffect, useCallback, useMemo } from "react";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Progress } from "@/components/ui/progress";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from "@/components/ui/dialog";
import { ALL_WORDS, shuffleArray, getDistractors, checkMatch, removeNikkud, calculateHalachmimGrade, type BlendWord, type HalachmimResult } from "@/lib/halachmim-data";
import { Sparkles, CheckCircle2 } from "lucide-react";

type Phase = "landing" | "name" | "playing" | "finished";
type QuizPhase = "typing" | "hints" | "options" | "explanation";

interface HalachmimTaskProps {
  taskId: string;
  taskTitle: string;
}

const HalachmimTask = ({ taskId, taskTitle }: HalachmimTaskProps) => {
  const [phase, setPhase] = useState<Phase>("landing");
  const [studentName, setStudentName] = useState("");
  const [nameError, setNameError] = useState(false);
  const startTimeRef = useRef<number>(0);

  const [questions, setQuestions] = useState<BlendWord[]>([]);
  const [currentIndex, setCurrentIndex] = useState(0);
  const [quizPhase, setQuizPhase] = useState<QuizPhase>("typing");
  const [attempt, setAttempt] = useState(0);
  const [input1, setInput1] = useState("");
  const [input2, setInput2] = useState("");
  const [selectedOption1, setSelectedOption1] = useState<string | null>(null);
  const [selectedOption2, setSelectedOption2] = useState<string | null>(null);
  const [feedback, setFeedback] = useState<"correct" | "wrong" | null>(null);
  const [allResults, setAllResults] = useState<HalachmimResult[]>([]);
  const [submitting, setSubmitting] = useState(false);
  const [finalGrade, setFinalGrade] = useState(0);
  const [shake, setShake] = useState(false);
  const input1Ref = useRef<HTMLInputElement>(null);

  const current = questions[currentIndex];

  const options = useMemo(() => {
    if (!current) return [];
    const distractors = getDistractors(current, ALL_WORDS, 4);
    return shuffleArray([current.word1, current.word2, ...distractors]);
  }, [current]);

  const hint = useMemo(() => {
    if (!current) return "";
    const w1 = removeNikkud(current.word1);
    const w2 = removeNikkud(current.word2);
    return `רמז: המילה מורכבת ממילה בת ${w1.length} אותיות ומילה בת ${w2.length} אותיות`;
  }, [current]);

  useEffect(() => {
    if (quizPhase === "typing" && input1Ref.current) {
      input1Ref.current.focus();
    }
  }, [quizPhase, currentIndex]);

  const triggerShake = () => {
    setShake(true);
    setTimeout(() => setShake(false), 500);
  };

  const initGame = useCallback(() => {
    setQuestions(shuffleArray(ALL_WORDS));
    setCurrentIndex(0);
    setQuizPhase("typing");
    setAttempt(0);
    setInput1("");
    setInput2("");
    setAllResults([]);
    startTimeRef.current = Date.now();
  }, []);

  const handleStartClick = () => setPhase("name");

  const handleNameSubmit = () => {
    if (!studentName.trim()) { setNameError(true); return; }
    setNameError(false);
    initGame();
    setPhase("playing");
  };

  const handleFinish = async (results: HalachmimResult[]) => {
    setSubmitting(true);
    const grade = calculateHalachmimGrade(results);
    setFinalGrade(grade);
    const timeSpent = Math.round((Date.now() - startTimeRef.current) / 1000);
    await supabase.from("submissions").insert({
      task_id: taskId,
      student_name: studentName.trim(),
      answer_text: JSON.stringify({ matches: results }),
      task_type: "halachmim",
      grade,
      time_spent_seconds: timeSpent,
      word_count: 0,
      paste_count: 0,
    });
    setSubmitting(false);
    setPhase("finished");
  };

  const goNext = (results: HalachmimResult[]) => {
    if (currentIndex + 1 >= questions.length) { handleFinish(results); return; }
    setCurrentIndex(i => i + 1);
    setQuizPhase("typing");
    setAttempt(0);
    setInput1("");
    setInput2("");
    setSelectedOption1(null);
    setSelectedOption2(null);
    setFeedback(null);
  };

  const handleTypingSubmit = () => {
    if (!input1.trim() || !input2.trim() || !current) return;
    const match1 = checkMatch(input1, current.word1) || checkMatch(input1, current.word2);
    const match2 = checkMatch(input2, current.word1) || checkMatch(input2, current.word2);
    const bothCorrect = match1 && match2 && removeNikkud(input1) !== removeNikkud(input2);

    if (bothCorrect) {
      const result: HalachmimResult = {
        blend: current.blend, word1: current.word1, word2: current.word2,
        correct: true, attempts: attempt + 1, phase: attempt >= 2 ? "hints" : "typing",
      };
      setAllResults(prev => { const updated = [...prev, result]; return updated; });
      setFeedback("correct");
      setQuizPhase("explanation");
    } else {
      const newAttempt = attempt + 1;
      setAttempt(newAttempt);
      triggerShake();
      if (newAttempt < 2) {
        setFeedback("wrong");
        setTimeout(() => setFeedback(null), 1200);
      } else if (newAttempt === 2) {
        setQuizPhase("hints");
        setFeedback("wrong");
        setTimeout(() => setFeedback(null), 1200);
      } else {
        setQuizPhase("options");
        setFeedback(null);
      }
    }
  };

  const handleOptionsSubmit = () => {
    if (!selectedOption1 || !selectedOption2 || !current) return;
    const m1 = checkMatch(selectedOption1, current.word1) || checkMatch(selectedOption1, current.word2);
    const m2 = checkMatch(selectedOption2, current.word1) || checkMatch(selectedOption2, current.word2);
    const bothCorrect = m1 && m2 && removeNikkud(selectedOption1) !== removeNikkud(selectedOption2);

    const result: HalachmimResult = {
      blend: current.blend, word1: current.word1, word2: current.word2,
      correct: bothCorrect, attempts: attempt + 1, phase: "options",
    };
    const updated = [...allResults, result];
    setAllResults(updated);
    setFeedback(bothCorrect ? "correct" : "wrong");
    setQuizPhase("explanation");
  };

  const progressPct = questions.length > 0 ? ((currentIndex + (quizPhase === "explanation" ? 1 : 0)) / questions.length) * 100 : 0;

  // ─── LANDING ─────────────────────────────────────────────
  if (phase === "landing") {
    return (
      <div className="min-h-[100dvh] flex flex-col items-center justify-center p-4 pb-safe bg-gradient-to-br from-primary/10 via-background to-accent-purple/10">
        <div className="max-w-lg w-full text-center space-y-6 animate-[fade-in_0.5s_ease-out]">
          <div className="space-y-2">
            <div className="inline-flex items-center gap-2 bg-primary/10 text-primary rounded-full px-4 py-1.5 text-sm font-medium mb-4">
              <Sparkles className="h-4 w-4" />
              תרגיל הלחמים
            </div>
            <h1 className="text-3xl md:text-4xl font-bold text-foreground">{taskTitle}</h1>
          </div>

          <div className="bg-card rounded-2xl shadow-lg border overflow-hidden">
            <div className="aspect-video w-full">
              <iframe
                src="https://www.youtube.com/embed/oI0JE91qNP8"
                title="שיעור הלחמים"
                className="w-full h-full"
                allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
                allowFullScreen
              />
            </div>
            <div className="p-4 text-right space-y-2">
              <h2 className="text-base font-semibold text-foreground">📺 צפו בשיעור ולאחר מכן התחילו את התרגיל</h2>
              <p className="text-sm text-muted-foreground">לאחר הצפייה, לחצו על כפתור ההתחלה למטה</p>
            </div>
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

  // ─── NAME ────────────────────────────────────────────────
  if (phase === "name") {
    return (
      <div className="min-h-[100dvh] flex items-center justify-center p-6 pb-safe bg-gradient-to-br from-primary/10 via-background to-accent-purple/10">
        <Dialog open onOpenChange={(open) => { if (!open) setPhase("landing"); }}>
          <DialogContent dir="rtl" className="sm:max-w-md">
            <DialogHeader>
              <DialogTitle className="text-xl">מה השם שלך?</DialogTitle>
              <DialogDescription>הזינו את שמכם המלא כדי להתחיל בתרגיל</DialogDescription>
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
                התחל תרגיל
              </Button>
            </div>
          </DialogContent>
        </Dialog>
      </div>
    );
  }

  // ─── FINISHED ────────────────────────────────────────────
  if (phase === "finished") {
    const gradeColor = finalGrade >= 80 ? "text-success" : finalGrade >= 50 ? "text-warning" : "text-destructive";
    return (
      <div className="min-h-[100dvh] flex flex-col items-center justify-center p-6 pb-safe bg-gradient-to-br from-success/10 via-background to-primary/10 relative overflow-hidden">
        <div className="absolute inset-0 pointer-events-none">
          {Array.from({ length: 20 }).map((_, i) => (
            <div key={i} className="absolute rounded-full bg-primary/20" style={{
              width: `${Math.random() * 8 + 4}px`, height: `${Math.random() * 8 + 4}px`,
              left: `${Math.random() * 100}%`, top: `${Math.random() * 100}%`,
              animation: `sparkle ${1.5 + Math.random() * 2}s ease-in-out infinite`,
              animationDelay: `${Math.random() * 2}s`,
            }} />
          ))}
        </div>
        <div className="text-center space-y-6 animate-[scale-in_0.4s_ease-out] relative z-10">
          <CheckCircle2 className="h-20 w-20 text-success mx-auto animate-[bounce_1s_ease-in-out]" />
          <h1 className="text-3xl font-bold text-foreground">!כל הכבוד</h1>
          <p className="text-muted-foreground text-lg">{studentName}, סיימת את התרגיל</p>
          <div className={`text-7xl font-black ${gradeColor} animate-[fade-in_0.6s_ease-out_0.3s_both]`}>{finalGrade}</div>
          <p className="text-muted-foreground">מתוך 100</p>
          <p className="text-sm text-muted-foreground">התוצאות נשמרו ונשלחו למורה ✓</p>
        </div>
      </div>
    );
  }

  // ─── PLAYING ─────────────────────────────────────────────
  if (!current) return null;

  return (
    <div className="min-h-[100dvh] flex flex-col bg-background pb-safe" dir="rtl">
      <div className="sticky top-0 z-10 bg-background/95 backdrop-blur border-b px-4 py-3 space-y-2">
        <div className="flex items-center justify-between">
          <span className="text-sm font-medium text-foreground">שאלה {currentIndex + 1} מתוך {questions.length}</span>
          <span className="text-xs text-muted-foreground">{allResults.length}/{questions.length} הושלמו</span>
        </div>
        <Progress value={progressPct} className="h-2" />
      </div>

      <div className="flex-1 p-3 sm:p-4 overflow-auto">
        <div className="max-w-lg mx-auto space-y-4">
          {/* Blend word card */}
          <div className={`bg-card rounded-2xl shadow-lg p-6 text-center border transition-transform ${shake ? "animate-[shake_0.5s_ease-in-out]" : ""}`}>
            <div className="text-xs text-muted-foreground font-medium mb-2">ההלחם</div>
            <div className="text-4xl sm:text-5xl font-bold text-foreground py-4">{current.blend}</div>
            <div className="text-sm text-muted-foreground">מאילו שתי מילים המילה הזו מורכבת?</div>
            <div className="flex justify-center gap-1.5 mt-4">
              {[0, 1, 2].map((i) => (
                <div key={i} className={`w-2.5 h-2.5 rounded-full transition-colors ${i < attempt ? "bg-destructive/50" : "bg-muted"}`} />
              ))}
            </div>
          </div>

          {/* Typing phase */}
          {quizPhase === "typing" && (
            <div className="bg-card rounded-2xl shadow-md p-5 space-y-4 border">
              <div className="text-center text-sm font-medium text-muted-foreground">
                {attempt === 0 ? "💭 חשבו ונסו לכתוב!" : "🤔 נסו שוב..."}
              </div>
              <div className="flex gap-3">
                <div className="flex-1 space-y-1.5">
                  <label className="text-xs font-medium text-muted-foreground">מילה ראשונה</label>
                  <Input ref={input1Ref} dir="rtl" value={input1} onChange={(e) => setInput1(e.target.value)}
                    onKeyDown={(e) => e.key === "Enter" && handleTypingSubmit()}
                    className="text-lg text-center font-medium min-h-[48px]" placeholder="?" />
                </div>
                <div className="flex items-end pb-3 text-2xl text-muted-foreground/50 font-bold">+</div>
                <div className="flex-1 space-y-1.5">
                  <label className="text-xs font-medium text-muted-foreground">מילה שנייה</label>
                  <Input dir="rtl" value={input2} onChange={(e) => setInput2(e.target.value)}
                    onKeyDown={(e) => e.key === "Enter" && handleTypingSubmit()}
                    className="text-lg text-center font-medium min-h-[48px]" placeholder="?" />
                </div>
              </div>
              <Button onClick={handleTypingSubmit} disabled={!input1.trim() || !input2.trim()}
                className="w-full min-h-[48px] text-base active:scale-95">בדיקה ✓</Button>
              {feedback === "wrong" && (
                <div className="text-center text-destructive text-sm font-medium animate-in fade-in-50 duration-300">❌ לא מדויק — נסו שוב!</div>
              )}
            </div>
          )}

          {/* Hints phase */}
          {quizPhase === "hints" && (
            <div className="bg-card rounded-2xl shadow-md p-5 space-y-4 border">
              <div className="bg-accent rounded-xl p-3 text-center">
                <span className="text-accent-foreground text-sm font-medium">💡 {hint}</span>
              </div>
              <div className="text-center text-sm font-medium text-muted-foreground">ניסיון אחרון לפני האפשרויות!</div>
              <div className="flex gap-3">
                <div className="flex-1">
                  <Input dir="rtl" value={input1} onChange={(e) => setInput1(e.target.value)}
                    onKeyDown={(e) => e.key === "Enter" && handleTypingSubmit()}
                    className="text-lg text-center font-medium min-h-[48px]" placeholder="מילה 1" />
                </div>
                <div className="flex items-center text-2xl text-muted-foreground/50 font-bold">+</div>
                <div className="flex-1">
                  <Input dir="rtl" value={input2} onChange={(e) => setInput2(e.target.value)}
                    onKeyDown={(e) => e.key === "Enter" && handleTypingSubmit()}
                    className="text-lg text-center font-medium min-h-[48px]" placeholder="מילה 2" />
                </div>
              </div>
              <Button onClick={handleTypingSubmit} disabled={!input1.trim() || !input2.trim()}
                className="w-full min-h-[48px] text-base active:scale-95">ניסיון אחרון 💪</Button>
              {feedback === "wrong" && (
                <div className="text-center text-destructive text-sm font-medium">❌ עדיין לא... עוברים לאפשרויות</div>
              )}
            </div>
          )}

          {/* Options phase */}
          {quizPhase === "options" && (
            <div className="bg-card rounded-2xl shadow-md p-5 space-y-4 border">
              <div className="text-center text-sm font-medium text-muted-foreground">🎯 בחרו שתי מילים מהרשימה</div>
              <div className="grid grid-cols-3 gap-2">
                {options.map((opt, i) => {
                  const isSelected1 = selectedOption1 === opt;
                  const isSelected2 = selectedOption2 === opt;
                  const isSelected = isSelected1 || isSelected2;
                  return (
                    <button key={i} onClick={() => {
                      if (isSelected1) setSelectedOption1(null);
                      else if (isSelected2) setSelectedOption2(null);
                      else if (!selectedOption1) setSelectedOption1(opt);
                      else if (!selectedOption2) setSelectedOption2(opt);
                    }} className={`py-3 px-2 rounded-xl border-2 text-base font-medium transition-all min-h-[48px] active:scale-95
                      ${isSelected ? "border-primary bg-primary/10 text-primary shadow-md scale-105" : "border-border bg-card text-foreground hover:border-primary/50 hover:bg-primary/5"}`}>
                      {opt}
                      {isSelected1 && <span className="block text-xs text-primary mt-0.5">①</span>}
                      {isSelected2 && <span className="block text-xs text-primary mt-0.5">②</span>}
                    </button>
                  );
                })}
              </div>
              {selectedOption1 && selectedOption2 && (
                <div className="text-center text-lg font-bold text-foreground py-2">
                  {selectedOption1} + {selectedOption2} = {current.blend} ?
                </div>
              )}
              <Button onClick={handleOptionsSubmit} disabled={!selectedOption1 || !selectedOption2}
                className="w-full min-h-[48px] text-base active:scale-95">בדיקה ✓</Button>
            </div>
          )}

          {/* Explanation phase */}
          {quizPhase === "explanation" && (
            <div className={`rounded-2xl shadow-md p-5 space-y-4 border-2 animate-in fade-in-50 slide-in-from-bottom-3 duration-500
              ${feedback === "correct" ? "bg-success/10 border-success/40" : "bg-warning/10 border-warning/40"}`}>
              <div className="text-center">
                <div className="text-3xl mb-2">{feedback === "correct" ? "🎉" : "📖"}</div>
                <div className="text-2xl font-bold text-foreground mb-1">
                  {current.word1} <span className="text-muted-foreground">+</span> {current.word2}
                </div>
                <div className="text-lg font-bold text-primary">= {current.blend}</div>
              </div>
              <div className={`rounded-xl p-4 text-sm leading-relaxed ${feedback === "correct" ? "bg-success/10 text-success" : "bg-warning/10 text-warning"}`}>
                <span className="font-bold">💡 הסבר: </span>{current.explanation}
              </div>
              {feedback === "correct" && attempt === 0 && <div className="text-center text-success font-bold text-sm">⚡ מושלם! ניסיון ראשון</div>}
              {feedback === "correct" && attempt === 1 && <div className="text-center text-success font-bold text-sm">👏 יפה! ניסיון שני</div>}
              {feedback === "correct" && attempt >= 2 && <div className="text-center text-success font-bold text-sm">✓ נכון!</div>}
              <Button onClick={() => goNext(allResults)} className="w-full min-h-[48px] text-base active:scale-95">
                {currentIndex + 1 >= questions.length ? "סיום 🏁" : "הבא ←"}
              </Button>
            </div>
          )}

          <div className="text-center text-xs text-muted-foreground space-x-2 space-x-reverse">
            <span>ניסיון ראשון = ⭐⭐⭐</span><span>·</span><span>שני = ⭐⭐</span><span>·</span><span>שלישי / אפשרויות = ⭐</span>
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

export default HalachmimTask;
