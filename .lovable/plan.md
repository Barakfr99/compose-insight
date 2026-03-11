

## משימת דקדוק: שורשים, בניינים וגזרות

### שינויים

**1. DB — INSERT משימה חדשה**
- `title = 'זיהוי שורשים ובניינים'`, `task_page_type = 'custom'`, `route = 'grammar-roots'`

**2. קובץ חדש: `src/pages/GrammarRootsTask.tsx`**
- קומפוננטה שמקבלת `taskId` כ-prop
- זרימה מרובת שלבים עם כפתורי "הבא"/"הקודם":
  1. מסך פתיחה
  2. הוראות חלק א'
  3. 9 זוגות משפטים (שורש + בניין לכל משפט, tooltip רמז על מילה מודגשת)
  4. 3 מסכי הסבר (בינוני סביל, שם פעולה, ה'→א') עם טבלאות
  5. תרגיל 1: 5 שאלות בחירת מילה (פועל יוצא דופן)
  6. תרגיל 2: 5 שאלות בחירת מילה (שם יוצא דופן)
  7. מסך סיום
- הגשה: modal שם תלמיד (כמו DisciplineTask/MergeWritingTask), שמירה ב-`submissions` עם `task_id`, `answer_text = JSON.stringify(answers)`, `word_count`, `time_spent_seconds`, `paste_count`
- עיצוב: RTL מלא, פונט 18px+ (ניקוד 22px+), צבעים רכים, אנימציות fade-in, כפתורים 44px+, responsive (2x2 grid בנייד לשאלות בחירה)

**3. עדכון `src/pages/TaskRouter.tsx`**
- הוספת `"grammar-roots": GrammarRootsTask` ל-`customRouteMap`

### קבצים
- `src/pages/GrammarRootsTask.tsx` — חדש
- `src/pages/TaskRouter.tsx` — שורה אחת (import + מיפוי)
- מיגרציית DB — INSERT משימה

