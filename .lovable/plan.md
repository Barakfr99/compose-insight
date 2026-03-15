

## תוכנית: משחק התאמת ניבים — עם עמוד נחיתה, אפקטים משחקיים, והגשה אוטומטית

### זרימת המשתמש (תלמיד)

```text
קישור → עמוד נחיתה (הסבר + כפתור "התחל")
       → מודל שם תלמיד
       → משחק tap-tap ב-4 סבבים (5-6 ניבים כל סבב)
       → הגשה אוטומטית + מסך ציון סופי עם אנימציות
```

### קבצים חדשים

**1. `src/lib/idioms-data.ts`**
- מאגר 22 הניבים: `idiom`, `meaning`, `example`
- פונקציית `shuffleArray` לערבוב
- פונקציית `calculateIdiomsGrade` — ניסיון ראשון = 100%, שני = 50%, שלישי+ = 0

**2. `src/pages/IdiomsMatchTask.tsx`**
קומפוננטה אחת עם 3 מצבים פנימיים (state machine):

- **מצב `landing`**: עמוד נחיתה עם הסבר על המטלה, רקע צבעוני/גרדיאנט, כפתור "התחל" בולט עם אנימציה
- **מצב `name`**: Dialog למילוי שם תלמיד (כמו בשאר המשימות)
- **מצב `playing`**: המשחק עצמו — 4 סבבים, tap-tap matching:
  - טור ניבים + טור משמעויות (מעורבבות)
  - בחירת ניב → הדגשה צבעונית → בחירת משמעות → בדיקה מיידית
  - נכון: אנימציית scale-in ירוקה, confetti-like אפקט CSS, ננעל
  - שגוי: shake animation אדום, ספירת ניסיונות עולה
  - פס התקדמות בראש עם מספר סבב
  - כפתורי touch בגודל min-h-[48px], active:scale-95
  - safe-area padding למובייל
- **מצב `finished`**: מסך ציון סופי (1-100) עם אנימציות כניסה, אפקטים צבעוניים (גרדיאנט רקע, כוכבים/ניצוצות CSS), הגשה אוטומטית ל-DB

**3. `src/pages/IdiomsMatchDashboard.tsx`**
דשבורד למורה — לכל הגשה:
- שם תלמיד, ציון, זמן
- Accordion עם פירוט: כל ניב + האם הצליח + כמה ניסיונות
- כפתור העתקת קישור משוב
- צביעה ויזואלית — ירוק להצלחה מהניסיון הראשון, כתום לשני, אדום לשלישי+

**4. `src/pages/IdiomsMatchFeedback.tsx`**
דף משוב לתלמיד (lazy loaded) — רשימת כל 22 הניבים עם ✅/❌, מספר ניסיונות, המשמעות הנכונה, ציון סופי

### עדכון קבצים קיימים

- **`TaskRouter.tsx`**: הוספת `"idioms-match": IdiomsMatchTask` ל-customRouteMap
- **`TaskDashboard.tsx`**: הוספת `if route === "idioms-match"` → IdiomsMatchDashboard
- **`FeedbackRouter.tsx`**: הוספת lazy import ל-IdiomsMatchFeedback + route condition
- **`tailwind.config.ts`**: הוספת keyframe ל-shake animation ו-confetti/sparkle אפקט CSS

### שמירה ב-DB
`answer_text` ישמור JSON:
```json
{
  "matches": [
    { "idiom": "העלה חרס", "selectedMeaning": "...", "correctMeaning": "...", "attempts": 1, "correct": true }
  ]
}
```
`grade` — מחושב אוטומטית ונשמר, `task_type` = `"idioms-match"`

### התאמות מובייל
- Layout אנכי בנייד: ניבים למעלה, משמעויות למטה
- min-h-[100dvh], safe-area padding
- Touch targets 48px+, active:scale-95
- font-size 16px+ למניעת zoom ב-iOS

