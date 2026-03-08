

## שינוי בקומפוננטת ArticlesPanel

### מה ייעשה
- הוספת `onCopy` handler על ה-div הראשי של `ArticlesPanel`
- בדיקת טקסט שנבחר: אם מכיל יותר מ-2 משפטים (לפי סימני פיסוק סיום) → חסימה עם toast "לא ניתן להעתיק"
- אם 2 משפטים או פחות → מותר

### קובץ: `src/components/ArticlesPanel.tsx`
- ייבוא `toast` מ-`@/hooks/use-toast`
- הוספת פונקציית `handleCopy` שבודקת `window.getSelection()?.toString()`, סופרת משפטים לפי regex `[.?!׃]`, ואם יותר מ-2 → `e.preventDefault()` + toast עם הודעה "לא ניתן להעתיק"
- הצמדת `onCopy={handleCopy}` ל-div הראשי

