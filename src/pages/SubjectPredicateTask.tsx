import { useState, useRef, useCallback } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "@/hooks/use-toast";
import { Send, Info } from "lucide-react";
import { sentences, roles, roleStyleMap, wordGroups, calculateGrade, type Role } from "@/lib/subject-predicate-data";

interface SubjectPredicateTaskProps {
  taskId: string;
  taskTitle: string;
}

const SubjectPredicateTask = ({ taskId, taskTitle }: SubjectPredicateTaskProps) => {
  const [selections, setSelections] = useState<Record<number, Record<number, Role>>>({});
  const [openPopover, setOpenPopover] = useState<string | null>(null);
  const [isSubmitted, setIsSubmitted] = useState(false);
  const [showNameModal, setShowNameModal] = useState(false);
  const [studentName, setStudentName] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [pasteCount, setPasteCount] = useState(0);
  const startTimeRef = useRef(Date.now());

  const handlePaste = useCallback(() => setPasteCount((p) => p + 1), []);

  const selectRole = (sentenceIdx: number, wordIdx: number, role: Role) => {
    setSelections((prev) => {
      const sentence = { ...(prev[sentenceIdx] || {}) };
      const group = wordGroups[sentenceIdx]?.[wordIdx];

      if (group) {
        // Toggle group: if already this role, clear all; otherwise set all
        if (sentence[wordIdx] === role) {
          group.forEach((wi) => delete sentence[wi]);
        } else {
          group.forEach((wi) => (sentence[wi] = role));
        }
      } else {
        if (sentence[wordIdx] === role) {
          delete sentence[wordIdx];
        } else {
          sentence[wordIdx] = role;
        }
      }
      return { ...prev, [sentenceIdx]: sentence };
    });
    setOpenPopover(null);
  };

  const clearWord = (sentenceIdx: number, wordIdx: number) => {
    setSelections((prev) => {
      const sentence = { ...(prev[sentenceIdx] || {}) };
      const group = wordGroups[sentenceIdx]?.[wordIdx];
      if (group) {
        group.forEach((wi) => delete sentence[wi]);
      } else {
        delete sentence[wordIdx];
      }
      return { ...prev, [sentenceIdx]: sentence };
    });
  };

  const totalSelections = Object.values(selections).reduce(
    (sum, s) => sum + Object.keys(s).length, 0
  );

  const handleSubmit = async () => {
    if (!studentName.trim()) return;
    setIsSubmitting(true);
    const timeSpent = Math.round((Date.now() - startTimeRef.current) / 1000);
    const grade = calculateGrade(selections);

    const { error } = await supabase.from("submissions").insert({
      student_name: studentName.trim(),
      answer_text: JSON.stringify(selections),
      word_count: totalSelections,
      time_spent_seconds: timeSpent,
      paste_count: pasteCount,
      task_id: taskId,
      grade,
    });

    setIsSubmitting(false);
    setShowNameModal(false);

    if (error) {
      toast({ title: "שגיאה בהגשה, נסו שוב", variant: "destructive" });
      return;
    }

    setIsSubmitted(true);
    toast({ title: `המשימה הוגשה בהצלחה ✅ ציון: ${grade}` });
  };

  return (
    <div className="min-h-screen min-h-[100dvh] bg-background pb-safe">
      <div className="sticky top-0 z-50 bg-primary shadow-md px-4 py-3 text-center" style={{ paddingTop: 'max(0.75rem, env(safe-area-inset-top))' }}>
        <h1 className="text-lg font-bold text-primary-foreground">{taskTitle}</h1>
      </div>

      <div className="max-w-3xl mx-auto px-4 py-6 space-y-6">
        <div className="text-center space-y-1">
          <h2 className="text-xl font-bold text-foreground">סמנו בכל משפט את הנושא ואת הנשוא</h2>
          <p className="text-sm text-muted-foreground">לחצו על כל מילה כדי לבחור את תפקידה</p>
        </div>

        <Card className="border-r-4 border-r-primary bg-muted/50">
          <CardContent className="p-4 space-y-2">
            <div className="flex items-center gap-2">
              <Info className="h-4 w-4 text-primary shrink-0" />
              <h3 className="text-sm font-bold text-primary">מהו נושא סתמי?</h3>
            </div>
            <p className="text-sm text-muted-foreground">
              נושא סתמי הוא נושא שאינו מוזכר במפורש במשפט. לא ניתן לדעת מיהו עושה הפעולה.
            </p>
            <p className="text-sm font-semibold text-foreground mt-2">מתי נזהה נושא סתמי?</p>
            <p className="text-sm text-muted-foreground">
              <strong className="text-foreground">1.</strong> פועל ברבים ללא ציון עושה הפעולה —{" "}
              <span className="text-xs">למשל: &quot;בישראל <b>נוהגים</b> בצד ימין&quot; — מי נוהגים? לא צוין ← נושא סתמי</span>
            </p>
            <p className="text-sm text-muted-foreground">
              <strong className="text-foreground">2.</strong> פועל סביל + מילת יחס —{" "}
              <span className="text-xs">למשל: &quot;בישיבת המועצה <b>הוחלט</b> על סגירת הרחוב&quot; — מי החליט? לא צוין ← נושא סתמי</span>
            </p>
          </CardContent>
        </Card>

        <div className="flex flex-wrap gap-2 justify-center">
          {roles.map((r) => (
            <span key={r.label} className={`text-xs px-2.5 py-1 rounded-full font-medium ${r.colorClass}`}>
              {r.label}
            </span>
          ))}
        </div>

        <div className="space-y-3">
          {sentences.map((sentence, si) => {
            const words = sentence.split(/\s+/);
            const sentenceSelections = selections[si] || {};

            return (
              <Card key={si} className={si % 2 === 0 ? "bg-card" : "bg-muted/30"}>
                <CardContent className="p-4 flex items-start gap-3">
                  <span className="inline-flex items-center justify-center w-7 h-7 rounded-full bg-primary text-primary-foreground text-xs font-bold shrink-0 mt-1">
                    {si + 1}
                  </span>
                  <div className="flex flex-wrap gap-1.5 leading-loose">
                    {words.map((word, wi) => {
                      const role = sentenceSelections[wi];
                      const popoverKey = `${si}-${wi}`;

                      if (role) {
                        return (
                          <button
                            key={wi}
                            onClick={() => !isSubmitted && clearWord(si, wi)}
                            disabled={isSubmitted}
                            className={`px-2 py-1.5 min-h-[44px] rounded-md border text-base font-medium cursor-pointer transition-all active:scale-95 ${roleStyleMap[role]}`}
                            title={`${role} — לחצו להסרה`}
                          >
                            {word}
                          </button>
                        );
                      }

                      return (
                        <Popover
                          key={wi}
                          open={openPopover === popoverKey}
                          onOpenChange={(open) => setOpenPopover(open ? popoverKey : null)}
                        >
                          <PopoverTrigger asChild>
                            <button
                              disabled={isSubmitted}
                              className="px-1.5 py-1.5 min-h-[44px] text-base text-foreground rounded hover:bg-accent active:bg-accent/80 transition-colors cursor-pointer"
                            >
                              {word}
                            </button>
                          </PopoverTrigger>
                          <PopoverContent side="bottom" align="center" className="w-auto p-2 flex flex-col gap-1" dir="rtl">
                            {roles.map((r) => (
                              <button
                                key={r.label}
                                onClick={() => selectRole(si, wi, r.label)}
                                className={`px-4 py-2.5 min-h-[44px] rounded-md text-sm font-medium transition-colors active:scale-95 ${r.colorClass}`}
                              >
                                {r.label}
                              </button>
                            ))}
                          </PopoverContent>
                        </Popover>
                      );
                    })}
                  </div>
                </CardContent>
              </Card>
            );
          })}
        </div>

        {!isSubmitted ? (
          <div className="text-center pt-4">
            <Button size="lg" onClick={() => setShowNameModal(true)} className="gap-2 text-base px-8">
              <Send className="h-4 w-4" />
              הגשת המשימה
            </Button>
            <p className="text-xs text-muted-foreground mt-2">סימנתם {totalSelections} מילים</p>
          </div>
        ) : (
          <Card className="bg-primary/5 border-primary/20">
            <CardContent className="p-6 text-center space-y-2">
              <p className="text-xl font-bold text-primary">המשימה הוגשה בהצלחה ✅</p>
              <p className="text-muted-foreground">תודה רבה!</p>
            </CardContent>
          </Card>
        )}
      </div>

      <Dialog open={showNameModal} onOpenChange={setShowNameModal}>
        <DialogContent dir="rtl" className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle>הגשת המשימה</DialogTitle>
          </DialogHeader>
          <div className="space-y-3 py-2">
            <label className="text-sm font-medium text-foreground">שם מלא</label>
            <Input
              dir="rtl"
              placeholder="הקלידו את שמכם"
              value={studentName}
              onChange={(e) => setStudentName(e.target.value)}
              onPaste={handlePaste}
              onKeyDown={(e) => e.key === "Enter" && studentName.trim() && handleSubmit()}
              className="text-lg h-12"
            />
          </div>
          <DialogFooter className="sm:justify-start gap-2">
            <Button onClick={handleSubmit} disabled={!studentName.trim() || isSubmitting} className="gap-2">
              <Send className="h-4 w-4" />
              {isSubmitting ? "שולח..." : "שליחה"}
            </Button>
            <Button variant="outline" onClick={() => setShowNameModal(false)}>ביטול</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
};

export default SubjectPredicateTask;
