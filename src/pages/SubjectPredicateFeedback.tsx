import { useParams } from "react-router-dom";
import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { Card, CardContent } from "@/components/ui/card";
import { Check, X } from "lucide-react";
import {
  sentences, roles, roleStyleMap, roleBadgeMap, correctAnswers, getWordFeedback, calculateGrade,
  type Role,
} from "@/lib/subject-predicate-data";

// ─── Error explanation generator ─────────────────────────────────────────────
function getSentenceExplanation(
  sentenceIdx: number,
  studentAnswers: Record<number, Record<number, Role>>
): string | null {
  const correct = correctAnswers[sentenceIdx] || {};
  const student = studentAnswers[sentenceIdx] || {};
  const words = sentences[sentenceIdx].split(/\s+/);
  const errors: string[] = [];

  for (const [wi, correctRole] of Object.entries(correct)) {
    const studentRole = student[Number(wi)];
    const word = words[Number(wi)];
    if (!studentRole) {
      errors.push(`המילה "${word}" היא ${correctRole} — לא סומנה`);
    } else if (studentRole !== correctRole) {
      errors.push(`המילה "${word}" היא ${correctRole}, לא ${studentRole}`);
    }
  }

  for (const [wi, studentRole] of Object.entries(student)) {
    if (!(wi in correct)) {
      const word = words[Number(wi)];
      errors.push(`המילה "${word}" סומנה כ${studentRole} אך אינה נושא/נשוא במשפט זה`);
    }
  }

  return errors.length > 0 ? errors.join(" | ") : null;
}

const SubjectPredicateFeedback = () => {
  const { submissionId } = useParams<{ submissionId: string }>();

  const { data: submission, isLoading } = useQuery({
    queryKey: ["submission-feedback", submissionId],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("submissions")
        .select("*")
        .eq("id", submissionId!)
        .single();
      if (error) throw error;
      return data;
    },
    enabled: !!submissionId,
  });

  if (isLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <p className="text-muted-foreground">טוען משוב...</p>
      </div>
    );
  }

  if (!submission) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <p className="text-destructive font-medium">ההגשה לא נמצאה</p>
      </div>
    );
  }

  let studentAnswers: Record<number, Record<number, Role>> = {};
  try { studentAnswers = JSON.parse(submission.answer_text); } catch {}

  const grade = submission.grade ?? calculateGrade(studentAnswers);

  return (
    <div className="min-h-screen bg-background pb-safe">
      <div className="sticky top-0 z-50 bg-primary shadow-md px-4 py-3 text-center">
        <h1 className="text-lg font-bold text-primary-foreground">משוב — תרגול נושא ונשוא</h1>
      </div>

      <div className="max-w-3xl mx-auto px-4 py-6 space-y-6">
        {/* Header */}
        <Card className="bg-card">
          <CardContent className="p-6 text-center space-y-2">
            <p className="text-lg text-foreground">שם התלמיד/ה: <strong>{submission.student_name}</strong></p>
            <p className={`text-3xl font-bold ${grade >= 80 ? "text-success" : grade >= 60 ? "text-warning" : "text-destructive"}`}>
              ציון: {grade}
            </p>
          </CardContent>
        </Card>

        {/* Legend */}
        <div className="flex flex-wrap gap-2 justify-center">
          {roles.map((r) => (
            <span key={r.label} className={`text-xs px-2.5 py-1 rounded-full font-medium ${r.colorClass}`}>
              {r.label}
            </span>
          ))}
        </div>

        <div className="flex flex-wrap gap-3 justify-center text-xs">
          <span className="flex items-center gap-1 text-success"><Check className="h-3.5 w-3.5" /> נכון</span>
          <span className="flex items-center gap-1 text-destructive"><X className="h-3.5 w-3.5" /> שגוי / מיותר</span>
          <span className="flex items-center gap-1 text-muted-foreground border border-dashed border-success/50 px-1.5 py-0.5 rounded">חסר</span>
        </div>

        {/* Sentences with feedback */}
        <div className="space-y-4">
          {sentences.map((sentence, si) => {
            const words = sentence.split(/\s+/);
            const studentSel = studentAnswers[si] || {};
            const explanation = getSentenceExplanation(si, studentAnswers);
            const correct = correctAnswers[si] || {};
            const isFullyCorrect = !explanation;

            return (
              <Card key={si} className={isFullyCorrect ? "bg-success/5 border-success/20" : "bg-card border-destructive/20"}>
                <CardContent className="p-4 space-y-2">
                  <div className="flex items-start gap-2">
                    <span className="inline-flex items-center justify-center w-6 h-6 rounded-full bg-primary text-primary-foreground text-xs font-bold shrink-0 mt-0.5">
                      {si + 1}
                    </span>
                    <div className="flex flex-wrap items-center gap-1.5 leading-relaxed">
                      {words.map((word, wi) => {
                        const { feedback, studentRole, correctRole } = getWordFeedback(si, wi, studentAnswers);
                        const role = studentSel[wi];

                        if (feedback === "none") {
                          return <span key={wi} className="text-sm text-foreground px-1 py-0.5">{word}</span>;
                        }

                        return (
                          <span key={wi} className="inline-flex items-center gap-0.5">
                            {feedback === "correct" && <Check className="h-3.5 w-3.5 text-success shrink-0" />}
                            {(feedback === "wrong-role" || feedback === "extra") && <X className="h-3.5 w-3.5 text-destructive shrink-0" />}
                            {feedback === "missing" && <Check className="h-3.5 w-3.5 text-success/50 shrink-0" />}

                            <span className={`px-1.5 py-0.5 rounded border text-sm font-medium ${
                              feedback === "correct" ? roleStyleMap[role!] :
                              feedback === "wrong-role" ? "bg-destructive/10 text-destructive border-destructive/30" :
                              feedback === "extra" ? "bg-destructive/10 text-destructive border-destructive/30" :
                              feedback === "missing" ? `border-dashed ${roleBadgeMap[correctRole!]} opacity-50` : ""
                            }`}>
                              {word}
                            </span>
                          </span>
                        );
                      })}
                    </div>
                  </div>

                  {/* Error explanation below the sentence */}
                  {explanation && (
                    <div className="mr-8 mt-1 text-xs text-destructive bg-destructive/5 rounded px-3 py-1.5 border border-destructive/10">
                      💡 {explanation}
                    </div>
                  )}
                </CardContent>
              </Card>
            );
          })}
        </div>
      </div>
    </div>
  );
};

export default SubjectPredicateFeedback;
