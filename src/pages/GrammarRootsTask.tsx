import { useState, useRef, useCallback } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card, CardContent } from "@/components/ui/card";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "@/hooks/use-toast";
import { ChevronRight, ChevronLeft, BookOpen, Lightbulb, Send } from "lucide-react";

// ─── Data ───────────────────────────────────────────────────────────────────

interface SentencePair {
  word: string;
  sentenceA: string;
  hintA: string;
  sentenceB: string;
  hintB: string;
}

const sentencePairs: SentencePair[] = [
  { word: "כָּפְתָה", sentenceA: "חברתי כָּפְתָה עליי את דעתה.", hintA: "עבר נסתר (הוא אתמול) – כָּפָה", sentenceB: "הסוהרת כָּפְתָה את ידי האסיר.", hintB: "עבר נסתר (הוא אתמול) – כָּפַת" },
  { word: "כָּרְתָה", sentenceA: "הנערה כָּרְתָה עצים רבים למדורה.", hintA: "עבר נסתר (הוא אתמול) – כָּרַת", sentenceB: "הנערה כָּרְתָה עם חברתה בור במרכז החורשה.", hintB: "עבר נסתר (הוא אתמול) – כָּרָה" },
  { word: "מַרְשִׁים", sentenceA: "הבחור מַרְשִׁים בהופעתו.", hintA: "עבר נסתר (הוא אתמול) – הִרְשִׁים", sentenceB: "הוריי מַרְשִׁים לי לצאת לטיול.", hintB: "עבר נסתר (הוא אתמול) – הִרְשָׁה" },
  { word: "מַפְנִים", sentenceA: "התלמיד מַפְנִים את המסר.", hintA: "עבר נסתר (הוא אתמול) – הִפְנִים", sentenceB: "המורים מַפְנִים את ההורים ליועצת.", hintB: "עבר נסתר (הוא אתמול) – הִפְנָה" },
  { word: "מַלְאִים", sentenceA: "המלך מַלְאִים קרקעות רבות.", hintA: "עבר נסתר (הוא אתמול) – הִלְאִים", sentenceB: "דבריך מַלְאִים אותנו.", hintB: "עבר נסתר (הוא אתמול) – הִלְאָה" },
  { word: "מַטְעִים", sentenceA: "המבצעים בעיתון מַטְעִים את הצרכנים.", hintA: "עבר נסתר (הוא אתמול) – הִטְעָה", sentenceB: "הנער מַטְעִים את שמו במלעיל.", hintB: "עבר נסתר (הוא אתמול) – הִטְעִים" },
  { word: "מַתְרִים", sentenceA: "הילד מַתְרִים כספים לאגודה למען החייל.", hintA: "עבר נסתר (הוא אתמול) – הִתְרִים", sentenceB: "הם מַתְרִים בו בשל מעשיו.", hintB: "עבר נסתר (הוא אתמול) – הִתְרָה" },
  { word: "מַשְׁלִים", sentenceA: "הוא מַשְׁלִים את חובותיו.", hintA: "עבר נסתר (הוא אתמול) – הִשְׁלִים", sentenceB: "הפוליטיקאים מַשְׁלִים את ציבור הבוחרים.", hintB: "עבר נסתר (הוא אתמול) – הִשְׁלָה" },
  { word: "תָּפְרוּ / תַּפְרוּ", sentenceA: "החייטים תָּפְרוּ את המעיל.", hintA: "עבר נסתר (הוא אתמול) – תָּפַר", sentenceB: "תַּפְרוּ את האדמה.", hintB: "עבר נסתר (הוא אתמול) – הִפְרָה" },
];

const binyanOptions = [
  "פָּעַל (קל)",
  "נִפְעַל",
  "פִּעֵל",
  "פֻּעַל",
  "הִפְעִיל",
  "הֻפְעַל",
  "הִתְפַּעֵל",
];

interface OddOneOutQuestion {
  options: string[];
}

const exercise1Questions: OddOneOutQuestion[] = [
  { options: ["נָטוּי", "שָׁבוּי", "לָקוּי", "סָמוּי"] },
  { options: ["בָּנוּי", "קָפוּא", "רָצוּי", "שָׁתוּי"] },
  { options: ["עֲשׂוּיָה", "כְּבוּיָה", "כְּלוּאָה", "גְּלוּיָה"] },
  { options: ["חָבוּי", "קָרוּי", "שָׁגוּי", "סָמוּי"] },
  { options: ["מְצוּיִים", "שִׁנּוּיִים", "רְאוּיִים", "פְּנוּיִים"] },
];

const exercise2Questions: OddOneOutQuestion[] = [
  { options: ["הַתְרָאָה", "הַרְצָאָה", "הַשְׁרָאָה", "הַמְצָאָה"] },
  { options: ["גִּלּוּי", "מִלּוּי", "שִׁנּוּי", "מִצּוּי"] },
  { options: ["שִׁנּוּי", "נִבּוּי", "בִּטּוּי", "דִּכּוּי"] },
  { options: ["מְחָאָה", "הַבְרָאָה", "הַקְרָאָה", "כְּלִיאָה"] },
  { options: ["מְלַאי", "בְּלַאי", "תְּנַאי", "גְּנַאי"] },
];

// ─── Step definitions ───────────────────────────────────────────────────────

type StepType =
  | "intro"
  | "part1-instructions"
  | "pair"
  | "part2-explain1"
  | "part2-explain2"
  | "part2-explain3"
  | "exercise1"
  | "exercise2"
  | "done";

interface Step {
  type: StepType;
  index?: number; // for pair / exercise questions
}

function buildSteps(): Step[] {
  const steps: Step[] = [];
  steps.push({ type: "intro" });
  steps.push({ type: "part1-instructions" });
  for (let i = 0; i < 9; i++) steps.push({ type: "pair", index: i });
  steps.push({ type: "part2-explain1" });
  steps.push({ type: "part2-explain2" });
  steps.push({ type: "part2-explain3" });
  steps.push({ type: "exercise1" });
  steps.push({ type: "exercise2" });
  steps.push({ type: "done" });
  return steps;
}

const allSteps = buildSteps();

// ─── Component ──────────────────────────────────────────────────────────────

interface GrammarRootsTaskProps {
  taskId: string;
  taskTitle: string;
}

const GrammarRootsTask = ({ taskId }: GrammarRootsTaskProps) => {
  const [currentStep, setCurrentStep] = useState(0);
  const [answers, setAnswers] = useState<Record<string, string>>({});
  const [pasteCount, setPasteCount] = useState(0);
  const [isSubmitted, setIsSubmitted] = useState(false);
  const [showNameModal, setShowNameModal] = useState(false);
  const [studentName, setStudentName] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);
  const startTimeRef = useRef(Date.now());

  const step = allSteps[currentStep];

  const updateAnswer = (key: string, value: string) => {
    setAnswers((prev) => ({ ...prev, [key]: value }));
  };

  const handlePaste = useCallback((e: React.ClipboardEvent) => {
    setPasteCount((prev) => prev + 1);
  }, []);

  const next = () => setCurrentStep((s) => Math.min(s + 1, allSteps.length - 1));
  const prev = () => setCurrentStep((s) => Math.max(s - 1, 0));

  const handleSubmit = async () => {
    if (!studentName.trim()) return;
    setIsSubmitting(true);
    const timeSpent = Math.round((Date.now() - startTimeRef.current) / 1000);

    const filledCount = Object.values(answers).filter((v) => v.trim().length > 0).length;

    const { error } = await supabase.from("submissions").insert({
      student_name: studentName.trim(),
      answer_text: JSON.stringify(answers),
      word_count: filledCount,
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

  // ─── Render helpers ─────────────────────────────────────────────────────

  const renderHighlightedSentence = (sentence: string, word: string, hint: string) => {
    // Find the highlighted word in the sentence and wrap it in a popover
    const idx = sentence.indexOf(word);
    if (idx === -1) {
      // word might be split (e.g. "תָּפְרוּ / תַּפְרוּ"), try each part
      const parts = word.split(" / ");
      for (const part of parts) {
        const i = sentence.indexOf(part);
        if (i !== -1) {
          return (
            <p className="text-lg leading-relaxed">
              {sentence.slice(0, i)}
              <Popover>
                <PopoverTrigger asChild>
                   <button className="font-bold text-primary cursor-pointer hover:text-primary/80 transition-colors text-[22px]" style={{ minHeight: 44, minWidth: 44 }}>
                     {part}
                  </button>
                </PopoverTrigger>
                <PopoverContent side="top" className="text-center text-base font-medium" dir="rtl">
                  <div className="flex items-center gap-2 justify-center">
                    <Lightbulb size={16} className="text-warning shrink-0" />
                    <span>{hint}</span>
                  </div>
                </PopoverContent>
              </Popover>
              {sentence.slice(i + part.length)}
            </p>
          );
        }
      }
      return <p className="text-lg leading-relaxed">{sentence}</p>;
    }
    return (
      <p className="text-lg leading-relaxed">
        {sentence.slice(0, idx)}
        <Popover>
          <PopoverTrigger asChild>
             <button className="font-bold text-primary cursor-pointer hover:text-primary/80 transition-colors text-[22px]" style={{ minHeight: 44, minWidth: 44 }}>
               {word}
            </button>
          </PopoverTrigger>
          <PopoverContent side="top" className="text-center text-base font-medium" dir="rtl">
            <div className="flex items-center gap-2 justify-center">
              <Lightbulb size={16} className="text-warning shrink-0" />
              <span>{hint}</span>
            </div>
          </PopoverContent>
        </Popover>
        {sentence.slice(idx + word.length)}
      </p>
    );
  };

  const renderPair = (pairIndex: number) => {
    const pair = sentencePairs[pairIndex];
    return (
      <div className="space-y-6 animate-in fade-in-50 duration-300">
        <div className="text-center mb-2">
          <span className="inline-flex items-center gap-2 bg-primary/10 text-primary px-4 py-1.5 rounded-full text-sm font-medium">
            זוג {pairIndex + 1} מתוך 9
          </span>
        </div>

         <h2 className="text-2xl font-bold text-center text-foreground">המילה: <span className="text-primary text-[26px]">{pair.word}</span></h2>
        <p className="text-sm text-muted-foreground text-center">💡 ניתן ללחוץ על המילה המודגשת כדי לראות את צורת ה"הוא אתמול" — אך עדיף לנסות קודם לבד!</p>

         {/* Sentence A */}
        <Card className="border-2 border-blue-200 bg-blue-50/50">
          <CardContent className="p-5 space-y-4">
            <div className="flex items-center gap-2 text-sm font-semibold text-muted-foreground mb-1">
              <span className="inline-flex items-center justify-center w-6 h-6 rounded-full bg-primary text-primary-foreground text-xs font-bold">א</span>
              משפט א'
            </div>
            {renderHighlightedSentence(pair.sentenceA, pair.word, pair.hintA)}
            <div className="flex flex-col sm:flex-row gap-3 mt-3">
              <div className="flex-1">
                <label className="text-sm font-medium text-foreground mb-1 block">שורש</label>
                <Input
                  dir="rtl"
                  placeholder=""
                  value={answers[`pair${pairIndex}_a_root`] || ""}
                  onChange={(e) => updateAnswer(`pair${pairIndex}_a_root`, e.target.value)}
                  onPaste={handlePaste}
                  disabled={isSubmitted}
                  className="text-lg h-12"
                />
              </div>
              <div className="flex-1">
                <label className="text-sm font-medium text-foreground mb-1 block">בניין</label>
                <Select
                  value={answers[`pair${pairIndex}_a_binyan`] || ""}
                  onValueChange={(v) => updateAnswer(`pair${pairIndex}_a_binyan`, v)}
                  disabled={isSubmitted}
                  dir="rtl"
                >
                  <SelectTrigger className="text-lg h-12">
                    <SelectValue placeholder="בחרו בניין" />
                  </SelectTrigger>
                  <SelectContent dir="rtl">
                    {binyanOptions.map((b) => (
                      <SelectItem key={b} value={b} className="text-lg">{b}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Sentence B */}
        <Card className="border-2 border-emerald-200 bg-emerald-50/50">
          <CardContent className="p-5 space-y-4">
            <div className="flex items-center gap-2 text-sm font-semibold text-muted-foreground mb-1">
              <span className="inline-flex items-center justify-center w-6 h-6 rounded-full bg-primary text-primary-foreground text-xs font-bold">ב</span>
              משפט ב'
            </div>
            {renderHighlightedSentence(pair.sentenceB, pair.word, pair.hintB)}
            <div className="flex flex-col sm:flex-row gap-3 mt-3">
              <div className="flex-1">
                <label className="text-sm font-medium text-foreground mb-1 block">שורש</label>
                <Input
                  dir="rtl"
                  placeholder=""
                  value={answers[`pair${pairIndex}_b_root`] || ""}
                  onChange={(e) => updateAnswer(`pair${pairIndex}_b_root`, e.target.value)}
                  onPaste={handlePaste}
                  disabled={isSubmitted}
                  className="text-lg h-12"
                />
              </div>
              <div className="flex-1">
                <label className="text-sm font-medium text-foreground mb-1 block">בניין</label>
                <Select
                  value={answers[`pair${pairIndex}_b_binyan`] || ""}
                  onValueChange={(v) => updateAnswer(`pair${pairIndex}_b_binyan`, v)}
                  disabled={isSubmitted}
                  dir="rtl"
                >
                  <SelectTrigger className="text-lg h-12">
                    <SelectValue placeholder="בחרו בניין" />
                  </SelectTrigger>
                  <SelectContent dir="rtl">
                    {binyanOptions.map((b) => (
                      <SelectItem key={b} value={b} className="text-lg">{b}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>
    );
  };

  const renderOddOneOut = (
    title: string,
    subtitle: string,
    questions: OddOneOutQuestion[],
    keyPrefix: string
  ) => {
    return (
      <div className="space-y-6 animate-in fade-in-50 duration-300">
        <div className="text-center space-y-2 mb-4">
          <h2 className="text-2xl font-bold text-foreground">{title}</h2>
          <p className="text-muted-foreground text-base">{subtitle}</p>
        </div>
        {questions.map((q, qi) => {
          const selectedKey = `${keyPrefix}_q${qi}`;
          const selected = answers[selectedKey] || "";
          return (
            <Card key={qi} className="overflow-hidden">
              <CardContent className="p-5 space-y-3">
                <p className="font-semibold text-foreground">שאלה {qi + 1}</p>
                <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
                  {q.options.map((opt, oi) => {
                    const label = String.fromCharCode(1488 + oi); // א ב ג ד
                    const isSelected = selected === opt;
                    return (
                      <button
                        key={oi}
                        onClick={() => !isSubmitted && updateAnswer(selectedKey, opt)}
                        disabled={isSubmitted}
                        className={`
                          flex items-center justify-center gap-2 px-3 py-4 rounded-lg border-2 text-[20px] font-medium transition-all cursor-pointer
                          ${isSelected
                            ? "border-primary bg-primary text-primary-foreground shadow-md"
                            : "border-border bg-card text-foreground hover:border-primary/50 hover:bg-primary/5"
                          }
                        `}
                        style={{ minHeight: 56 }}
                      >
                        <span className="text-xs opacity-60">{label}.</span>
                        <span>{opt}</span>
                      </button>
                    );
                  })}
                </div>
              </CardContent>
            </Card>
          );
        })}
      </div>
    );
  };

  // ─── Explanation screens ──────────────────────────────────────────────

  const renderExplainScreen = (content: React.ReactNode) => (
    <div className="space-y-6 animate-in fade-in-50 duration-300">
      {content}
    </div>
  );

  const explain1Content = (
    <>
      <div className="text-center space-y-2">
        <h2 className="text-2xl font-bold text-foreground">שורשים שנגמרים באל"ף 🔤</h2>
        <p className="text-muted-foreground text-base">בצורת הווה (בינוני) סביל – פָּעוּל</p>
      </div>
      <Card>
        <CardContent className="p-5 space-y-4">
          <p className="text-lg leading-relaxed">
            יש שורשים שהאות האחרונה שלהם היא א', אבל בהרבה צורות האל"ף "נעלמת" ואנחנו לא שומעים אותה.
          </p>
          <p className="text-lg font-semibold">דוגמה בהווה (בינוני) סביל – פָּעוּל:</p>
          <div className="overflow-x-auto">
            <table className="w-full text-lg border-collapse">
              <thead>
                <tr className="bg-primary/10">
                  <th className="border border-border p-3 text-right font-bold">המילה</th>
                  <th className="border border-border p-3 text-right font-bold">השורש</th>
                  <th className="border border-border p-3 text-right font-bold">העבר נסתר (הוא אתמול)</th>
                </tr>
              </thead>
              <tbody className="text-[20px]">
                {[
                  ["קָרוּי", 'קר"א', "קָרָא"],
                  ["סָמוּי", 'סמ"א', "סָמָא (הסתיר)"],
                  ["מָצוּי", 'מצ"א', "מָצָא"],
                  ["חָבוּי", 'חב"א', "חָבָא (הסתתר)"],
                  ["נָשׂוּא", 'נשׂ"א', "נָשָׂא"],
                ].map(([word, root, past], i) => (
                  <tr key={i} className={i % 2 === 0 ? "bg-muted/30" : ""}>
                    <td className="border border-border p-3 font-medium">{word}</td>
                    <td className="border border-border p-3">{root}</td>
                    <td className="border border-border p-3">{past}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
          <div className="bg-amber-50 border border-amber-200 rounded-lg p-4 text-base">
            <p className="font-bold mb-2">כלל חשוב:</p>
            <p>הדרך היחידה לדעת מה השורש היא להטות את המילה לעבר נסתר – "הוא אתמול ___"</p>
          </div>
          <div className="bg-destructive/10 border border-destructive/30 rounded-lg p-4 text-base">
            <p className="font-bold mb-2">⚠️ שימו לב לניקוד!</p>
            <p>יש הבדל גדול בין:</p>
            <ul className="mt-2 space-y-1 text-lg">
              <li><strong>מִצוּי</strong> (חיריק – בניין פִּעֵל, שורש: מצ"י/ה) = שכיח, נפוץ</li>
              <li><strong>מָצוּי</strong> (קמץ – בניין קל, שורש: מצ"א) = נמצא</li>
            </ul>
            <p className="mt-2 font-semibold">הניקוד משנה הכול!</p>
          </div>
        </CardContent>
      </Card>
    </>
  );

  const explain2Content = (
    <>
      <div className="text-center space-y-2">
        <h2 className="text-2xl font-bold text-foreground">שורשים שנגמרים באל"ף – בשם הפעולה 📝</h2>
        <p className="text-muted-foreground text-base">בשם הפעולה של בניין פִּעֵל</p>
      </div>
      <Card>
        <CardContent className="p-5 space-y-4">
          <p className="text-lg leading-relaxed">
            גם בשם הפעולה של בניין פִּעֵל, שורשים שנגמרים בא' מתנהגים אחרת:
          </p>
          <div className="overflow-x-auto">
            <table className="w-full text-lg border-collapse">
              <thead>
                <tr className="bg-primary/10">
                  <th className="border border-border p-3 text-right font-bold">שם הפעולה</th>
                  <th className="border border-border p-3 text-right font-bold">השורש</th>
                  <th className="border border-border p-3 text-right font-bold">העבר נסתר (הוא אתמול)</th>
                </tr>
              </thead>
              <tbody className="text-[20px]">
                {[
                  ["נִבּוּי", 'נב"א', "נִבֵּא"],
                  ["דִּכּוּי", 'דכ"א', "דִּכֵּא"],
                  ["בִּטּוּי", 'בט"א', "בִּטֵּא"],
                  ["רִפּוּי", 'רפ"א', "רִפֵּא"],
                  ["מִלּוּי", 'מל"א', "מִלֵּא"],
                ].map(([name, root, past], i) => (
                  <tr key={i} className={i % 2 === 0 ? "bg-muted/30" : ""}>
                    <td className="border border-border p-3 font-medium">{name}</td>
                    <td className="border border-border p-3">{root}</td>
                    <td className="border border-border p-3">{past}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
          <p className="text-base text-muted-foreground">שימו לב – האל"ף לא מופיעה בשם הפעולה, אבל היא כן חלק מהשורש!</p>
        </CardContent>
      </Card>
    </>
  );

  const explain3Content = (
    <>
      <div className="text-center space-y-2">
        <h2 className="text-2xl font-bold text-foreground">מקרה מיוחד: ה' שהופכת לא' 🔄</h2>
      </div>
      <Card>
        <CardContent className="p-5 space-y-4">
          <p className="text-lg leading-relaxed">
            לפעמים שורש שנגמר ב-ה' מתנהג בשם הפעולה כאילו הוא נגמר ב-א':
          </p>
          <div className="overflow-x-auto">
            <table className="w-full text-lg border-collapse">
              <thead>
                <tr className="bg-primary/10">
                  <th className="border border-border p-3 text-right font-bold">שם הפעולה</th>
                  <th className="border border-border p-3 text-right font-bold">השורש</th>
                  <th className="border border-border p-3 text-right font-bold">העבר נסתר (הוא אתמול)</th>
                </tr>
              </thead>
              <tbody className="text-[20px]">
                {[
                  ["הַלְוָאָה", 'לו"ה', "הִלְוָה"],
                  ["הַבְרָאָה", 'בר"א', "הִבְרִיא"],
                ].map(([name, root, past], i) => (
                  <tr key={i} className={i % 2 === 0 ? "bg-muted/30" : ""}>
                    <td className="border border-border p-3 font-medium">{name}</td>
                    <td className="border border-border p-3">{root}</td>
                    <td className="border border-border p-3">{past}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
          <div className="bg-amber-50 border border-amber-200 rounded-lg p-4 text-base">
            <p>זה יכול לבלבל! המילה "הַלְוָאָה" מכילה א', אבל השורש הוא ל.ו.ה (הוא אתמול – הִלְוָה).</p>
            <p className="mt-2 font-semibold">הכלל תמיד אותו כלל: כשאתם לא בטוחים – הטו לעבר נסתר (הוא אתמול). זו הדרך הבטוחה ביותר למצוא את השורש!</p>
          </div>
        </CardContent>
      </Card>
    </>
  );

  // ─── Main render ──────────────────────────────────────────────────────

  const renderStep = () => {
    switch (step.type) {
      case "intro":
        return (
          <div className="space-y-6 animate-in fade-in-50 duration-300 text-center">
            <div className="inline-flex items-center gap-2 bg-primary/10 text-primary px-4 py-1.5 rounded-full text-sm font-medium">
              <BookOpen size={16} />
              <span>תרגול דקדוק</span>
            </div>
            <h1 className="text-3xl font-bold text-foreground">זיהוי שורשים ובניינים</h1>
            <p className="text-lg text-muted-foreground max-w-lg mx-auto leading-relaxed">
              במשימה זו תתרגלו זיהוי שורשים ובניינים במילים שנכתבות ונשמעות אותו הדבר אך יש להן משמעויות שונות. בנוסף, תתרגלו מציאת יוצא הדופן מבחינת הגזרה.
            </p>
            <p className="text-base text-muted-foreground">המשימה מחולקת לשני חלקים. בהצלחה! 🎯</p>
          </div>
        );

      case "part1-instructions":
        return (
          <div className="space-y-6 animate-in fade-in-50 duration-300">
            <div className="text-center">
              <h2 className="text-2xl font-bold text-foreground mb-2">חלק א': זיהוי שורשים ובניינים במילים זהות</h2>
            </div>
            <Card>
              <CardContent className="p-6 space-y-4">
                <div className="flex gap-3 items-start">
                  <span className="text-2xl">🔎</span>
                  <div className="space-y-3 text-lg leading-relaxed">
                    <p className="font-bold">שימו לב!</p>
                    <p>בעברית יש מילים שנכתבות ונשמעות בדיוק אותו הדבר, אבל יש להן שורש שונה לגמרי ומשמעות שונה.</p>
                    <p><strong>איך מוצאים את השורש?</strong> פשוט מאוד – הטו את המילה לעבר, בגוף "הוא אתמול":</p>
                    <div className="bg-muted/50 rounded-lg p-4 space-y-2">
                      <p>🔹 "כָּפְתָה עליי את דעתה" → הוא אתמול <strong>כָּפָה</strong> (שורש: כפ"ה) – בניין קל</p>
                      <p>🔹 "כָּפְתָה את ידי האסיר" → הוא אתמול <strong>כָּפַת</strong> (שורש: כפ"ת) – בניין קל</p>
                    </div>
                    <p><strong>המשימה שלכם:</strong> לכל זוג משפטים, מצאו את השורש ואת הבניין של המילה המודגשת.</p>
                    <div className="flex items-center gap-2 bg-primary/10 rounded-lg p-3">
                      <Lightbulb size={18} className="text-primary shrink-0" />
                      <p className="text-base">💡 טיפ: לחצו על המילה המודגשת כדי לקבל רמז!</p>
                    </div>
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>
        );

      case "pair":
        return renderPair(step.index!);

      case "part2-explain1":
        return renderExplainScreen(explain1Content);
      case "part2-explain2":
        return renderExplainScreen(explain2Content);
      case "part2-explain3":
        return renderExplainScreen(explain3Content);

      case "exercise1":
        return renderOddOneOut(
          "תרגיל 1: מצא את הפועל יוצא הדופן",
          'בכל שאלה יש 4 מילים. לשלוש מהן האות האחרונה בשורש זהה (למשל: שלוש נגמרות בא\' ואחת בה\'). מצאו את המילה שהאות האחרונה בשורש שלה שונה מהשאר. 💡 טיפ: הטו כל מילה ל"הוא אתמול" כדי לגלות את השורש!',
          exercise1Questions,
          "ex1"
        );

      case "exercise2":
        return renderOddOneOut(
          "תרגיל 2: מצא את השם יוצא הדופן",
          'בכל שאלה יש 4 שמות. לשלושה מהם האות האחרונה בשורש זהה, ולאחד – שונה. מצאו את השם שהאות האחרונה בשורש שלו שונה מהשאר.',
          exercise2Questions,
          "ex2"
        );

      case "done":
        return (
          <div className="space-y-6 animate-in fade-in-50 duration-300 text-center">
            <h2 className="text-2xl font-bold text-foreground">סיימתם! 🎉</h2>
            <p className="text-lg text-muted-foreground">
              {isSubmitted
                ? "המשימה הוגשה בהצלחה. תודה רבה!"
                : "אתם יכולים לחזור ולשנות תשובות לפני ההגשה."}
            </p>
            {!isSubmitted && (
              <Button
                size="lg"
                className="gap-2 text-lg px-10 py-4 h-auto"
                onClick={() => setShowNameModal(true)}
                style={{ minHeight: 56 }}
              >
                <Send size={20} />
                הגשת המשימה
              </Button>
            )}
          </div>
        );

      default:
        return null;
    }
  };

  return (
    <div className="min-h-screen bg-background py-6 px-4 pb-safe" dir="rtl">
      <div className="max-w-2xl mx-auto space-y-6">
        {/* Progress bar */}
        <div className="w-full bg-muted rounded-full h-2 overflow-hidden">
          <div
            className="h-full bg-primary rounded-full transition-all duration-500"
            style={{ width: `${((currentStep + 1) / allSteps.length) * 100}%` }}
          />
        </div>

        {/* Step content */}
        {renderStep()}

        {/* Navigation */}
        <div className="flex items-center justify-between pt-4">
          <Button
            variant="outline"
            onClick={prev}
            disabled={currentStep === 0}
            className="gap-2 text-base h-12 px-6"
            style={{ minHeight: 44 }}
          >
            <ChevronRight size={18} />
            הקודם
          </Button>

          <span className="text-sm text-muted-foreground">
            {currentStep + 1} / {allSteps.length}
          </span>

          {currentStep < allSteps.length - 1 ? (
            <Button
              onClick={next}
              className="gap-2 text-base h-12 px-6"
              style={{ minHeight: 44 }}
            >
              הבא
              <ChevronLeft size={18} />
            </Button>
          ) : (
            <div style={{ width: 120 }} />
          )}
        </div>
      </div>

      {/* Name modal */}
      <Dialog open={showNameModal} onOpenChange={setShowNameModal}>
        <DialogContent dir="rtl" className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle>הזינו את שמכם המלא</DialogTitle>
          </DialogHeader>
          <Input
            dir="rtl"
            placeholder="שם מלא"
            value={studentName}
            onChange={(e) => setStudentName(e.target.value)}
            onKeyDown={(e) => e.key === "Enter" && handleSubmit()}
            className="text-lg h-12"
          />
          <DialogFooter className="flex gap-2 sm:justify-start">
            <Button onClick={handleSubmit} disabled={!studentName.trim() || isSubmitting} className="h-12">
              {isSubmitting ? "שולח..." : "אישור והגשה"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
};

export default GrammarRootsTask;
