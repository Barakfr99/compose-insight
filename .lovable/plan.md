

## תוכנית: ארגון מחדש של מבנה האתר

### סיכום
- העמוד הראשי (`/`) יהיה דף ניהול המשימות (Admin)
- שתי המשימות הקיימות (משמעת + כתיבה ממזגת) יהפכו לרשומות בטבלת `tasks` עם סוג מיוחד
- אפשרות בניית משימות דרך הממשק (עורך טקסט) תישאר
- כל משימה — גם rich-text וגם ייחודית — נגישה דרך `/task/:taskId` עם דשבורד ב-`/task/:taskId/dashboard`

### שינויי בסיס נתונים

**מיגרציה — הוספת עמודות לטבלת `tasks`:**
- `task_page_type` (text, default `'rich_text'`) — `rich_text` למשימות שנבנות בעורך, `custom` למשימות עם עמוד React ייחודי
- `route` (text, nullable) — מזהה הקומפוננטה למשימות custom (למשל `discipline`, `merge-writing`)

**הכנסת נתונים — שתי משימות קיימות:**
- INSERT משימת "משמעת" עם `task_page_type = 'custom'`, `route = 'discipline'`
- INSERT משימת "כתיבה ממזגת" עם `task_page_type = 'custom'`, `route = 'merge-writing'`
- UPDATE הגשות קיימות: `task_type = 'default'` → `task_id = <discipline_id>`, `task_type = 'merge_writing'` → `task_id = <merge_id>`

### שינויי ניתוב (App.tsx)

```text
לפני:                          אחרי:
/              → Index          /              → Admin
/dashboard     → Dashboard      /admin/create  → CreateTask
/admin         → Admin          /admin/edit/:id→ CreateTask
/admin/create  → CreateTask     /task/:id      → TaskRouter
/task/:id      → TaskPage       /task/:id/dashboard → TaskDashboard
/merge-writing → MergeWriting   
/merge-writing/dashboard → ...  (הכל מאוחד תחת /task/:id)
```

### שינויי קוד

**TaskRouter (חדש או עדכון TaskPage.tsx):**
- שולף את המשימה מ-DB
- אם `task_page_type = 'rich_text'` → מציג את העמוד הנוכחי (HTML + textarea)
- אם `task_page_type = 'custom'` → טוען קומפוננטה לפי `route`:
  - `discipline` → DisciplineTask (Index.tsx המקורי, מקבל `taskId` כ-prop)
  - `merge-writing` → MergeWritingTask (מקבל `taskId` כ-prop)

**Index.tsx → DisciplineTask.tsx:**
- שינוי שם + קבלת `taskId` כ-prop
- שמירת `task_id` בהגשה במקום להשאיר null

**MergeWritingTask.tsx:**
- קבלת `taskId` כ-prop
- שמירת `task_id` בהגשה

**Admin.tsx:**
- הסרת הכרטיס הקבוע של "כתיבה ממזגת"
- כל המשימות (כולל custom) מוצגות ברשימה אחידה
- משימות `custom` מקבלות badge מיוחד ולא מציגות כפתור "עריכת תוכן"
- הנתיב הופך ל-`/`

**TaskDashboard.tsx:**
- בדיקת `task_page_type` מהDB
- אם `merge-writing` → מציג MergeWritingDashboard
- אחרת → מציג דשבורד רגיל (Dashboard.tsx הנוכחי, מותאם לסנן לפי `task_id`)

**Dashboard.tsx:**
- שינוי הסינון מ-`task_type = 'default'` ל-`task_id = <taskId>` (מקבל כ-prop או מ-URL params)

**MergeWritingDashboard.tsx:**
- סינון לפי `task_id` במקום `task_type = 'merge_writing'`

### קבצים שישתנו
- `App.tsx` — ניתוב חדש
- `src/pages/Admin.tsx` — עמוד ראשי, רשימה אחידה
- `src/pages/TaskPage.tsx` → TaskRouter — ניתוב לפי סוג
- `src/pages/Index.tsx` → `DisciplineTask.tsx` — קומפוננטה עם taskId
- `src/pages/MergeWritingTask.tsx` — קבלת taskId
- `src/pages/Dashboard.tsx` — סינון לפי task_id
- `src/pages/TaskDashboard.tsx` — ניתוב לדשבורד נכון
- `src/pages/MergeWritingDashboard.tsx` — סינון לפי task_id
- מיגרציית DB + הכנסת נתונים

