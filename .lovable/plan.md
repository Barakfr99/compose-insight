

## המרת דף ההנחיות לעמוד React

### מה ייעשה
יצירת קומפוננטת React חדשה `src/pages/TaskInstructions.tsx` שמכילה את כל התוכן והעיצוב של `public/task-instructions.html`, עם ניתוב `/task-instructions`.

### שינויים

1. **`src/pages/TaskInstructions.tsx`** (חדש)
   - קומפוננטת React עם כל ה-HTML של דף ההנחיות
   - העיצוב יועבר ל-inline styles או ל-Tailwind classes
   - פונט Heebo כבר זמין (Google Fonts link ב-index.html או שנוסיף אותו)

2. **`src/App.tsx`**
   - הוספת route: `/task-instructions` → `TaskInstructions`

3. **`src/pages/Index.tsx`**
   - שינוי הכפתור מ-`window.open("/task-instructions.html", "_blank")` ל-`window.open("/task-instructions", "_blank")` (או שימוש ב-Link)

4. **`public/task-instructions.html`** — נשאר כגיבוי, לא נמחק

