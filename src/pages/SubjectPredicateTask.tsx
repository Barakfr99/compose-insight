import { useState, useRef, useCallback } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "@/hooks/use-toast";
import { Send, Info } from "lucide-react";

// ─── Data ───────────────────────────────────────────────────────────────────

const sentences = [
  "מחר נלמד את הנושא החדש.",
  "סגרו את הדלת בצאתכם החוצה!",
  "כתבו את המשפטים הבאים במחברת!",
  "בפגישה דחופה בבית הנשיא סוכם על הקמת ממשלה חדשה.",
  "במקרה של עומס תנועה אני אנסע בדרך אחרת.",
  "הספר החדש של יהושע קנז יצא לאור.",
  "הבחינה בלשון כבר כתובה.",
  "הנזקים הבריאותיים של העישון מטרידים כמעט כל מעשן.",
  "הבוקר דיווחו בהרחבה על ההצפות בצפון הארץ.",
  "מצאתי את האפיקומן בליל הסדר.",
  "ילדים אוהבים שוקולד.",
  "עברית כותבים מימין לשמאל.",
];

type Role = "נשוא" | "נושא" | "נשוא+נושא" | "נשוא+נושא סתמי";

const roles: { label: Role; colorClass: string }[] = [
  { label: "נשוא", colorClass: "bg-destructive text-destructive-foreground" },
  { label: "נושא", colorClass: "bg-primary text-primary-foreground" },
  { label: "נשוא+נושא", colorClass: "bg-accent-purple text-white" },
  { label: "נשוא+נושא סתמי", colorClass: "bg-warning text-warning-foreground" },
];

const roleStyleMap: Record<Role, string> = {
  "נשוא": "bg-destructive/15 text-destructive border-destructive/30",
  "נושא": "bg-primary/15 text-primary border-primary/30",
  "נשוא+נושא": "bg-accent-purple/15 text-accent-purple border-accent-purple/30",
  "נשוא+נושא סתמי": "bg-warning/15 text-warning border-warning/30",
};

// ─── Component ──────────────────────────────────────────────────────────────

interface SubjectPredicateTaskProps {
  taskId: string;
  taskTitle: string;
}

const SubjectPredicateTask = ({ taskId, taskTitle }: SubjectPredicateTaskProps) => {
  // selections[sentenceIdx][wordIdx] = Role
  const [selections, setSelections] = useState<Record<number, Record<number, Role>>>({});
  const [openPopover, setOpenPopover] = useState<string | null>(null);
  const [isSubmitted, setIsSubmitted] = useState(false);
  const [showNameModal, setShowNameModal] = useState(false);
  const [studentName, setStudentName] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [pasteCount, setPasteCount] = useState(0);
  const startTimeRef = useRef(Date.now());

  const handlePaste = useCallback(() => {
    setPasteCount((prev) => prev + 1);
  }, []);

  const selectRole = (sentenceIdx: number, wordIdx: number, role: Role) => {
    setSelections((prev) => {
      const sentence = { ...(prev[sentenceIdx] || {}) };
      if (sentence[wordIdx] === role) {
        delete sentence[wordIdx];
      } else {
        sentence[wordIdx] = role;
      }
      return { ...prev, [sentenceIdx]: sentence };
    });
    setOpenPopover(null);
  };

  const clearWord = (sentenceIdx: number, wordIdx: number) => {
    setSelections((prev) => {
      const sentence = { ...(prev[sentenceIdx] || {}) };
      delete sentence[wordIdx];
      return { ...prev, [sentenceIdx]: sentence };
    });
  };

  const totalSelections = Object.values(selections).reduce(
    (sum, s) => sum + Object.keys(s).length,
    0
  );

  const handleSubmit = async () => {
    if (!studentName.trim()) return;
    setIsSubmitting(true);
    const timeSpent = Math.round((Date.now() - startTimeRef.current) / 1000);

    const { error } = await supabase.from("submissions").insert({
      student_name: studentName.trim(),
      answer_text: JSON.stringify(selections),
      word_count: totalSelections,
      time_spent_seconds: timeSpent,
      paste_count: pasteCount,
      task_id: taskId,
    });

    setIsSubmitting(false);
    setShowNameModal(false);

    if (error) {
      toast({ title: "שגיאה בהגשה, נסו שוב", variant: "destructive" });
      return;
    }

    setIsSubmitted(true);
    toast({ title: "המשימה הוגשה בהצלחה ✅" });
  };

  return (
    <div className="min-h-screen bg-background pb-safe">
      {/* Header */}
      <div className="sticky top-0 z-50 bg-primary shadow-md px-4 py-3 text-center">
        <h1 className="text-lg font-bold text-primary-foreground">{taskTitle}</h1>
      </div>

      <div className="max-w-3xl mx-auto px-4 py-6 space-y-6">
        {/* Subtitle */}
        <div className="text-center space-y-1">
          <h2 className="text-xl font-bold text-foreground">סמנו בכל משפט את הנושא ואת הנשוא</h2>
          <p className="text-sm text-muted-foreground">לחצו על כל מילה כדי לבחור את תפקידה</p>
        </div>

        {/* Info box */}
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
              <span className="text-xs">למשל: "בישראל <b>נוהגים</b> בצד ימין" — מי נוהגים? לא צוין → נושא סתמי</span>
            </p>
            <p className="text-sm text-muted-foreground">
              <strong className="text-foreground">2.</strong> פועל סביל + מילת יחס —{" "}
              <span className="text-xs">למשל: "בישיבת המועצה <b>הוחלט</b> על סגירת הרחוב" — מי החליט? לא צוין → נושא סתמי</span>
            </p>
          </CardContent>
        </Card>

        {/* Legend */}
        <div className="flex flex-wrap gap-2 justify-center">
          {roles.map((r) => (
            <span
              key={r.label}
              className={`text-xs px-2.5 py-1 rounded-full font-medium ${r.colorClass}`}
            >
              {r.label}
            </span>
          ))}
        </div>

        {/* Sentences */}
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
                            className={`px-2 py-0.5 rounded-md border text-base font-medium cursor-pointer transition-all hover:opacity-80 ${roleStyleMap[role]}`}
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
                              className="px-1 py-0.5 text-base text-foreground rounded hover:bg-accent transition-colors cursor-pointer"
                            >
                              {word}
                            </button>
                          </PopoverTrigger>
                          <PopoverContent
                            side="top"
                            className="w-auto p-2 flex flex-col gap-1"
                            dir="rtl"
                          >
                            {roles.map((r) => (
                              <button
                                key={r.label}
                                onClick={() => selectRole(si, wi, r.label)}
                                className={`px-3 py-1.5 rounded-md text-sm font-medium transition-colors hover:opacity-90 ${r.colorClass}`}
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

        {/* Submit area */}
        {!isSubmitted ? (
          <div className="text-center pt-4">
            <Button
              size="lg"
              onClick={() => setShowNameModal(true)}
              className="gap-2 text-base px-8"
            >
              <Send className="h-4 w-4" />
              הגשת המשימה
            </Button>
            <p className="text-xs text-muted-foreground mt-2">
              סימנתם {totalSelections} מילים
            </p>
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

      {/* Name Modal */}
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
            <Button variant="outline" onClick={() => setShowNameModal(false)}>
              ביטול
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
};

export default SubjectPredicateTask;
