import { useState, useRef, useCallback, useMemo } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Card, CardContent } from "@/components/ui/card";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog";
import { Progress } from "@/components/ui/progress";
import { Separator } from "@/components/ui/separator";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "@/hooks/use-toast";
import { Search, PenLine, Quote, Lightbulb, BookOpen } from "lucide-react";

const countWords = (text: string) => text.trim().split(/\s+/).filter(Boolean).length;

interface ExerciseField {
  id: string;
  label: string;
}

interface Exercise {
  id: number;
  title: string;
  instruction: string;
  texts: { speaker: string; text: string }[];
  partA: { label: string; fields: ExerciseField[] }[];
  template: string;
  isAdvanced?: boolean;
}

const exercises: Exercise[] = [
  {
    id: 1,
    title: "תרגיל 1",
    instruction: "קראו את שני התיאורים. זהו מידע שחוזר על עצמו (משותף) ומידע ייחודי שמופיע רק אצל אחד מהם.",
    texts: [
      { speaker: "תומר אומר:", text: "\"המורה שלנו מעולה כי היא מסבירה בצורה ברורה. וגם היא תמיד מוכנה לעזור אחרי השיעור.\"" },
      { speaker: "מיכל אומרת:", text: "\"אני אוהבת את המורה כי ההסברים שלה ממש קלים להבנה. ומה שמיוחד שהיא מכניסה הומור לשיעורים.\"" },
    ],
    partA: [
      { label: "שאלות:", fields: [
        { id: "1_shared", label: "איזה מידע משותף לשניהם? (שימו לב - זה לא חייב להיות באותן מילים!)" },
        { id: "1_unique_tomer", label: "מה ייחודי לתומר?" },
        { id: "1_unique_michal", label: "מה ייחודי למיכל?" },
      ]},
    ],
    template: "התלמידים אוהבים את המורה מסיבות שונות. _______  (תומר) וכמו כן _______  (מיכל). שניהם חושבים ש_______ (תומר ומיכל), בנוסף, _______ (מיכל).",
  },
  {
    id: 2,
    title: "תרגיל 2 - פורטנייט",
    instruction: "קראו את שני התיאורים. זהו מידע משותף על הסיבות שבגללן הילדים אוהבים לשחק, ומידע ייחודי שמופיע רק אצל אחד מהם.",
    texts: [
      { speaker: "רועי אומר:", text: "\"אני אוהב לשחק פורטנייט כי יש שם הרבה אקשן מרגש. וגם אפשר לשחק עם חברים באינטרנט ולדבר איתם.\"" },
      { speaker: "נועה אומרת:", text: "\"פורטנייט זה המשחק האהוב עליי בגלל שיש המון קרבות מעניינים. ומה שכיף ממש זה כל הסקינים והריקודים שאפשר לקנות.\"" },
    ],
    partA: [
      { label: "שאלות:", fields: [
        { id: "2_shared", label: "איזה מידע משותף לשניהם? (שימו לב - זה לא חייב להיות באותן מילים!)" },
        { id: "2_unique_roi", label: "מה ייחודי לרועי?" },
        { id: "2_unique_noa", label: "מה ייחודי לנועה?" },
      ]},
    ],
    template: "פורטנייט הוא משחק אהוב בקרב בני נוער. שחקנים רבים אוהבים לשחק בו מפני ש_______ (רועי) _______  גם _______ (רועי). _______  (נועה) מוסיפים לחוויית המשחק.",
  },
  {
    id: 3,
    title: "תרגיל 3",
    instruction: "קראו את שני התיאורים. זהו מידע משותף על התרומה של קריאת ספרים, ומידע ייחודי שמופיע רק אצל אחד מהם.",
    texts: [
      { speaker: "עומר אומר:", text: "\"אני חושב שכדאי לקרוא ספרים כי זה מרחיב את אוצר המילים שלנו. כשאנחנו קוראים, אנחנו נחשפים למילים חדשות ולומדים איך להשתמש בהן. בנוסף, קריאה משפרת את היכולת שלנו לכתוב יותר טוב. ועוד דבר חשוב שלי הוא שקריאה מפתחת את הדמיון.\"" },
      { speaker: "רחל אומרת:", text: "\"לדעתי, קריאת ספרים היא הרגל מצוין. היא עוזרת לנו ללמוד מילים שלא הכרנו קודם ולהעשיר את השפה שלנו. גם שהכתיבה שלנו משתפרת כשאנחנו קוראים הרבה. ומה שאני הכי אוהבת זה שקריאה מרגיעה אותי ועוזרת לי להפחית מתח.\"" },
    ],
    partA: [
      { label: "שאלות:", fields: [
        { id: "3_shared_a", label: "איזה מידע משותף לשניהם? א." },
        { id: "3_shared_b", label: "ב." },
        { id: "3_unique_omer", label: "מה ייחודי לעומר?" },
        { id: "3_unique_rachel", label: "מה ייחודי לרחל?" },
      ]},
    ],
    template: "לקריאת ספרים יש יתרונות רבים. היא _______ וגם _______ (עומר ורחל). בנוסף, _______ (עומר) ו_______ (רחל) מוסיפים לחשיבות הקריאה.",
  },
  {
    id: 4,
    title: "תרגיל 4",
    instruction: "קראו את שני התיאורים. זהו מידע משותף על יתרונות של פעילות ספורטיבית, ומידע ייחודי שמופיע רק אצל אחד מהם.",
    texts: [
      { speaker: "דני אומר:", text: "\"אני חושב שספורט זה הדבר הכי חשוב לבני נוער. קודם כל, זה בונה ביטחון עצמי - כשאתה מצליח להשיג יעדים, אתה מרגיש גאה בעצמך. ספורט גם משפר את הבריאות הגופנית ועוזר לשמור על כושר. בנוסף, הוא מלמד אותנו משמעת והתמדה - צריך להתאמן גם כשקשה. ועוד דבר חשוב הוא שספורט מלמד איך לעבוד בצוות - צריך לשתף פעולה עם השחקנים האחרים כדי לנצח.\"" },
      { speaker: "שרה אומרת:", text: "\"לדעתך, פעילות גופנית קבועה היא הכרחית לכל מתבגר. היא תורמת הרבה לבריאות ועוזרת לנו להישאר בכושר טוב. ספורט גם מחזק את המשמעת - אתה לומד להגיע לאימונים גם כשלא בא לך ולהתמיד. בנוסף, מבחינה נפשית זה עוזר - ספורט משחרר מתחים ומפחית לחץ. ועוד יתרון הוא שספורט מפתח מנהיגות - אתה לומד לקחת אחריות ולהוביל את הקבוצה.\"" },
    ],
    partA: [
      { label: "שאלות:", fields: [
        { id: "4_shared_a", label: "איזה מידע משותף לשניהם? א." },
        { id: "4_shared_b", label: "ב." },
        { id: "4_unique_dani_a", label: "מידע ייחודי לדני? א." },
        { id: "4_unique_dani_b", label: "ב." },
        { id: "4_unique_sara_a", label: "מידע ייחודי לשרה? א." },
        { id: "4_unique_sara_b", label: "ב." },
      ]},
    ],
    template: "לספורט יש השפעות חיוביות רבות על בני נוער. הוא _______ וגם _______ (דני ושרה). כן, כמו _______ (דני). וכן _______ בנוסף, _______ וגם _______ (שרה).",
  },
  {
    id: 5,
    title: "תרגיל 5 - תרגיל מסכם",
    instruction: "קראו את שני המאמרים. זהו מידע משותף על ההשלכות של שימוש רב במסכים, ומידע ייחודי שמופיע רק באחד מהמאמרים. לאחר מכן השלימו את המטלות.",
    isAdvanced: true,
    texts: [
      { speaker: "מאמר 1 - ד\"ר אורי רוזן (2024): \"השפעות השימוש המופרז במסכים על בריאות בני נוער\"", text: "השימוש הממושך במכשירים דיגיטליים הפך לחלק בלתי נפרד מחיי המתבגרים בעשור האחרון. בני נוער רבים מבלים שעות ארוכות מול מסכים, דבר המשפיע על בריאותם הגופנית. אחת ההשלכות המשמעותיות היא פגיעה ביציבה ובעמוד השדרה. ישיבה ממושכת עם ראש כפוף כלפי מטה גורמת ללחץ על צוואר והגב, מה שעלול להוביל לכאבים כרוניים ובעיות שלד-שריר בגיל צעיר. בנוסף, חשיפה למסכים בשעות הערב מפריעה לתהליכי השינה הטבעיים. האור הכחול הנפלט מהמסכים מדכא את ייצור המלטונין, ההורמון האחראי על ויסות השינה, מה שגורם לקשיי הירדמות ולאיכות שינה ירודה. כמו כן, שימוש מרובה במכשירים דיגיטליים פוגע ביכולת הריכוז וההתמקדות. המעבר המתמיד בין אפליקציות ותכנים שונים מקשה על המוח לשמור על קשב ממושך, דבר המשפיע לרעה על הביצועים הלימודיים. מומחים ממליצים להגביל את זמן המסך לשעתיים ביום, לכל היותר, ולהימנע משימוש במכשירים לפחות שעה לפני השינה." },
      { speaker: "מאמר 2 - פרופ' מיכל כהן (2023): \"השפעה של מסכים על התפתחות חברתית ונפשית של מתבגרים\"", text: "מחקרים עדכניים מצביעים על כך שחשיפה ממושכת למסכים משפיעה על התפקוד הנפשי והחברתי של בני נוער. אחת הבעיות המרכזיות היא הפגיעה בשינה. שימוש במכשירים אלקטרוניים בשעות הלילה משבש את מחזור השינה הטבעי, שכן הקרינה הכחולה המוקרנת מהמסכים מונעת מהגוף לייצר מלטונין ברמות מספקות. כתוצאה מכך, מתבגרים סובלים מעייפות כרונית המשפיעה על מצב הרוח והתפקוד היומיומי. יתרה מכך, השימוש התכוף במדיה דיגיטלית פוגע ביכולת לשמור על ריכוז. מתבגרים המורגלים לגירויים מהירים ומתחלפים מתקשים להתמקד במשימות הדורשות קשב ממושך. בנוסף לכך, שימוש הרבה במסכים פוגע ביחסים החברתיים הישירים. בני נוער המבלים זמן רב בעולם הווירטואלי מפתחים פחות מיומנויות תקשורת פנים אל פנים, מה שעלול להוביל לקשיים ביצירת קשרים עמוקים ובתקשורת רגשית. מנת על להפחית את הנזקים, מומלץ לקבוע מגבלות ברורות על זמן השימוש במכשירים ולעודד פעילויות חלופיות ללא מסכים." },
    ],
    partA: [
      { label: "שאלות:", fields: [
        { id: "5_shared_a", label: "איזה מידע משותף לשני המאמרים? (לפחות 2 מתוך 3) א." },
        { id: "5_shared_b", label: "ב." },
        { id: "5_shared_c", label: "ג. (אופציונלי)" },
        { id: "5_unique_rosen", label: "מה ייחודי למאמר של רוזן?" },
        { id: "5_unique_cohen", label: "מה ייחודי למאמר של כהן?" },
      ]},
    ],
    template: `הסבר איך לבנות את הפסקה:

משפט פתיחה: הציגו את הנושא הכללי - השימוש במסכים והשפעותיו על בני נוער.
המידע המשותף: הציגו את ההשפעות המשותפות.
  o דוגמה: "נמצא שימוש במסכים פוגע בשינה ובריכוז (רוזן, 2024 וכהן, 2023)"
מידע מייחד לרוזן: הציגו את ההשפעה הייחודית.
  o דוגמה: "בנוסף, נמצא כי ישיבה ממושכת גורמת לבעיות ביציבה (רוזן, 2024)"
מידע מייחד לכהן: הציגו את ההשפעה הייחודית.
  o דוגמה: "כמו כן, השימוש במסכים פוגע ביחסים חברתיים (כהן, 2023)"

בנק מילות קישור:
להצגת מידע משותף: כמו כן, בנוסף, נמצא כי...
להוספת מידע: יתרה מכך, נוסף על כך
מקורות: (שם, שנה ושם, שנה)`,
  },
];

const speakerColors = [
  "bg-blue-50 border-blue-200",
  "bg-emerald-50 border-emerald-200",
];

const MergeWritingTask = () => {
  const [answers, setAnswers] = useState<Record<string, string>>({});
  const [pasteCount, setPasteCount] = useState(0);
  const [isSubmitted, setIsSubmitted] = useState(false);
  const [showNameModal, setShowNameModal] = useState(false);
  const [studentName, setStudentName] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);
  const startTimeRef = useRef(Date.now());

  const updateAnswer = (key: string, value: string) => {
    setAnswers(prev => ({ ...prev, [key]: value }));
  };

  const handlePaste = useCallback((e: React.ClipboardEvent) => {
    const pastedText = e.clipboardData.getData("text");
    const pastedWordCount = countWords(pastedText);
    setPasteCount(prev => prev + 1);
    if (pastedWordCount > 20) {
      e.preventDefault();
      toast({
        title: "⚠️ לא ניתן להדביק טקסט שנכתב על ידי בינה מלאכותית",
        variant: "destructive",
      });
    }
  }, []);

  const totalWordCount = Object.entries(answers)
    .filter(([key]) => key.startsWith("writing_"))
    .reduce((sum, [, val]) => sum + countWords(val), 0);

  const hasContent = Object.values(answers).some(v => v.trim().length > 0);

  // Calculate progress
  const progress = useMemo(() => {
    let filled = 0;
    let total = 0;
    exercises.forEach(ex => {
      ex.partA.forEach(section => {
        section.fields.forEach(field => {
          total++;
          if (answers[field.id]?.trim()) filled++;
        });
      });
      total++; // writing part
      if (answers[`writing_${ex.id}`]?.trim()) filled++;
    });
    return total > 0 ? Math.round((filled / total) * 100) : 0;
  }, [answers]);

  const handleSubmit = async () => {
    if (!studentName.trim()) return;
    setIsSubmitting(true);
    const timeSpent = Math.round((Date.now() - startTimeRef.current) / 1000);

    const { error } = await (supabase.from("submissions") as any).insert({
      student_name: studentName.trim(),
      answer_text: JSON.stringify(answers),
      task_type: "merge_writing",
      word_count: totalWordCount,
      time_spent_seconds: timeSpent,
      paste_count: pasteCount,
      task_id: null,
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

  const getWordCountColor = (count: number) => {
    if (count === 0) return "text-muted-foreground";
    if (count >= 100 && count <= 200) return "text-green-600";
    if (count > 200) return "text-destructive";
    return "text-muted-foreground";
  };

  return (
    <div className="min-h-screen bg-background py-6 px-4" dir="rtl">
      <div className="max-w-3xl mx-auto space-y-8">
        {/* Header */}
        <div className="text-center space-y-3">
          <div className="inline-flex items-center gap-2 bg-primary/10 text-primary px-4 py-1.5 rounded-full text-sm font-medium">
            <BookOpen size={16} />
            <span>דף עבודה</span>
          </div>
          <h1 className="text-3xl font-bold text-foreground">{localStorage.getItem("merge_task_title") || "למידת כתיבה ממזגת"}</h1>
          <p className="text-muted-foreground text-sm">מלאו את כל התרגילים ולחצו על &quot;הגשה&quot; בתחתית העמוד</p>
        </div>

        {/* Progress */}
        <div className="space-y-1.5">
          <div className="flex justify-between text-xs text-muted-foreground">
            <span>התקדמות</span>
            <span>{progress}%</span>
          </div>
          <Progress value={progress} className="h-2" />
        </div>

        {/* Exercises */}
        {exercises.map((ex) => (
          <Card key={ex.id} className="overflow-hidden shadow-sm">
            {/* Exercise header */}
            <div className="bg-primary px-5 py-3 flex items-center gap-3">
              <span className="inline-flex items-center justify-center w-8 h-8 rounded-full bg-primary-foreground text-primary font-bold text-sm shrink-0">
                {ex.id}
              </span>
              <h2 className="text-lg font-bold text-primary-foreground">{ex.title}</h2>
            </div>

            <CardContent className="p-5 space-y-6">
              {/* Instruction */}
              <div className="flex gap-3 items-start bg-amber-50 border border-amber-200 p-4 rounded-lg">
                <Lightbulb size={20} className="text-amber-500 shrink-0 mt-0.5" />
                <p className="text-sm text-foreground leading-relaxed">{ex.instruction}</p>
              </div>

              {/* Texts */}
              <div className="space-y-3">
                {ex.texts.map((t, i) => (
                  <div key={i} className={`p-4 rounded-lg border ${speakerColors[i % 2]}`}>
                    <div className="flex items-center gap-2 mb-2">
                      <Quote size={16} className="text-muted-foreground shrink-0" />
                      <p className="font-semibold text-foreground text-sm">{t.speaker}</p>
                    </div>
                    <p className="text-foreground/90 leading-relaxed text-sm whitespace-pre-wrap pr-6">{t.text}</p>
                  </div>
                ))}
              </div>

              <Separator />

              {/* Part A - Identification */}
              <div className="space-y-4">
                <div className="flex items-center gap-2">
                  <Search size={18} className="text-primary" />
                  <h3 className="font-bold text-foreground">חלק א&apos;: זיהוי</h3>
                </div>
                {ex.partA.map((section, si) => (
                  <div key={si} className="space-y-3">
                    {section.fields.map((field) => (
                      <div key={field.id} className="space-y-1.5">
                        <label className="text-sm font-medium text-foreground block whitespace-pre-wrap">
                          {field.label}
                        </label>
                        <Input
                          dir="rtl"
                          placeholder="הקלידו תשובה..."
                          value={answers[field.id] || ""}
                          onChange={(e) => updateAnswer(field.id, e.target.value)}
                          onPaste={handlePaste}
                          disabled={isSubmitted}
                          className="text-sm bg-muted/30 focus:bg-background transition-colors"
                        />
                      </div>
                    ))}
                  </div>
                ))}
              </div>

              <Separator />

              {/* Part B - Writing */}
              <div className="space-y-4">
                <div className="flex items-center gap-2">
                  <PenLine size={18} className="text-primary" />
                  <h3 className="font-bold text-foreground">חלק ב&apos;: כתיבה</h3>
                </div>

                {/* Template tip box */}
                <div className="border-r-4 border-primary bg-primary/5 p-4 rounded-lg rounded-r-none">
                  <div className="flex items-center gap-2 mb-2">
                    <Lightbulb size={16} className="text-primary" />
                    <span className="text-sm font-semibold text-primary">תבנית עזרה</span>
                  </div>
                  <p className="text-sm text-muted-foreground leading-relaxed whitespace-pre-wrap">{ex.template}</p>
                </div>

                <Textarea
                  dir="rtl"
                  placeholder="כתבו את הפסקה הממזגת כאן..."
                  value={answers[`writing_${ex.id}`] || ""}
                  onChange={(e) => updateAnswer(`writing_${ex.id}`, e.target.value)}
                  onPaste={handlePaste}
                  disabled={isSubmitted}
                  className="min-h-[140px] text-sm leading-relaxed resize-none bg-muted/30 focus:bg-background transition-colors"
                />
                <p className={`text-xs font-medium ${getWordCountColor(countWords(answers[`writing_${ex.id}`] || ""))}`}>
                  {countWords(answers[`writing_${ex.id}`] || "")} מילים
                </p>
              </div>
            </CardContent>
          </Card>
        ))}

        {/* Submit */}
        <div className="flex flex-col items-center gap-3 pb-8">
          <Button
            size="lg"
            onClick={() => setShowNameModal(true)}
            disabled={isSubmitted || !hasContent}
            className="px-12 text-base"
          >
            {isSubmitted ? "הוגש ✅" : "הגשה"}
          </Button>
          {isSubmitted && (
            <p className="text-sm text-green-600 font-medium">
              המשימה הוגשה בהצלחה. לא ניתן לערוך או להגיש שוב.
            </p>
          )}
        </div>
      </div>

      {/* Name Modal */}
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
          />
          <DialogFooter className="flex gap-2 sm:justify-start">
            <Button onClick={handleSubmit} disabled={!studentName.trim() || isSubmitting}>
              {isSubmitting ? "שולח..." : "אישור והגשה"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
};

export default MergeWritingTask;
