import { useParams } from "react-router-dom";
import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { Card, CardContent } from "@/components/ui/card";
import { CheckCircle2, XCircle, ArrowRight } from "lucide-react";
import { Button } from "@/components/ui/button";
import { useNavigate } from "react-router-dom";
import type { MatchResult } from "@/lib/idioms-data";

function parseResults(text: string): MatchResult[] {
  try {
    return JSON.parse(text).matches || [];
  } catch {
    return [];
  }
}

const IdiomsMatchFeedback = () => {
  const { taskId, submissionId } = useParams<{ taskId: string; submissionId: string }>();
  const navigate = useNavigate();

  const { data: submission, isLoading } = useQuery({
    queryKey: ["submission", submissionId],
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
    return <div className="min-h-screen flex items-center justify-center"><p className="text-muted-foreground">טוען...</p></div>;
  }

  if (!submission) {
    return <div className="min-h-screen flex items-center justify-center"><p className="text-destructive">ההגשה לא נמצאה</p></div>;
  }

  const results = parseResults(submission.answer_text);
  const grade = submission.grade ?? 0;
  const gradeColor = grade >= 80 ? "text-success" : grade >= 50 ? "text-warning" : "text-destructive";

  return (
    <div className="min-h-[100dvh] p-6 pb-safe max-w-2xl mx-auto space-y-6" dir="rtl">
      <div className="flex items-center gap-3">
        <Button variant="ghost" size="icon" onClick={() => navigate(-1)}>
          <ArrowRight className="h-5 w-5" />
        </Button>
        <h1 className="text-xl font-bold text-foreground">משוב – {submission.student_name}</h1>
      </div>

      <div className="text-center py-4">
        <p className="text-muted-foreground text-sm">ציון סופי</p>
        <p className={`text-5xl font-black ${gradeColor}`}>{grade}</p>
        <p className="text-muted-foreground text-sm mt-1">מתוך 100</p>
      </div>

      <div className="space-y-2">
        {results.map((r, i) => (
          <Card key={i} className={`border-2 ${r.attempts === 1 ? "border-success/30" : r.attempts === 2 ? "border-warning/30" : "border-destructive/30"}`}>
            <CardContent className="p-4 flex items-start gap-3">
              {r.attempts === 1 ? (
                <CheckCircle2 className="h-5 w-5 text-success shrink-0 mt-0.5" />
              ) : (
                <XCircle className="h-5 w-5 text-destructive shrink-0 mt-0.5" />
              )}
              <div className="flex-1 min-w-0">
                <p className="font-semibold text-foreground">{r.idiom}</p>
                <p className="text-sm text-muted-foreground mt-1">{r.correctMeaning}</p>
              </div>
              <span className={`text-xs font-bold shrink-0 ${r.attempts === 1 ? "text-success" : r.attempts === 2 ? "text-warning" : "text-destructive"}`}>
                {r.attempts === 1 ? "✓ ראשון" : `${r.attempts} ניסיונות`}
              </span>
            </CardContent>
          </Card>
        ))}
      </div>
    </div>
  );
};

export default IdiomsMatchFeedback;
