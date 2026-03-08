

# תכנון: מערכת יצירת וניהול משימות

## עיקרון מנחה
העמודים הקיימים (`/` ו-`/dashboard`) נשארים בדיוק כמו שהם, ללא שום שינוי. כל הפיצ'רים החדשים נבנים בעמודים ונתיבים חדשים.

## שינויי בסיס נתונים

### טבלת `tasks` חדשה
- `id` (uuid, PK), `title` (text), `content` (text - HTML), `created_at` (timestamptz, default now())
- RLS: קריאה/כתיבה/עדכון/מחיקה ציבוריים (כמו submissions)

### עמודת `task_id` בטבלת `submissions`
- `task_id` (uuid, nullable, FK → tasks.id ON DELETE CASCADE)
- nullable כדי שהגשות קיימות (של המשימה הקודמת) ימשיכו לעבוד ללא שינוי

## קבצים חדשים

### `src/components/RichTextEditor.tsx`
- עורך מבוסס `contentEditable` div עם toolbar: bold, italic, underline, כותרת, ציטוט, רשימה
- מקבל `value` (HTML string) ו-`onChange` callback
- תומך בהדבקת טקסט מעוצב

### `src/pages/Admin.tsx` — עמוד ניהול (`/admin`)
- רשימת כל המשימות מטבלת tasks
- לכל משימה: שיתוף (העתקת URL `/task/:id`), דשבורד, עריכה, שינוי שם, מחיקה
- כפתור "משימה חדשה"

### `src/pages/CreateTask.tsx` — יצירה/עריכה (`/admin/create`, `/admin/edit/:taskId`)
- שדה כותרת + RichTextEditor לתוכן
- שמירה לטבלת tasks

### `src/pages/TaskPage.tsx` — עמוד משימה לתלמיד (`/task/:taskId`)
- טוען תוכן מ-tasks לפי ID, מציג אותו עם הגבלת העתקה (כמו ArticlesPanel)
- אזור כתיבה זהה ל-Index (טיימר, הגבלת paste, ספירת מילים)
- ההגשה נשמרת עם `task_id`

### `src/pages/TaskDashboard.tsx` — דשבורד למשימה (`/task/:taskId/dashboard`)
- זהה ל-Dashboard הקיים אבל מסנן submissions לפי `task_id`

## שינויים בקבצים קיימים

### `src/App.tsx` — הוספת routes חדשים בלבד
```
/admin → Admin
/admin/create → CreateTask
/admin/edit/:taskId → CreateTask
/task/:taskId → TaskPage
/task/:taskId/dashboard → TaskDashboard
```

### קבצים שלא משתנים
- `src/pages/Index.tsx` — נשאר כמו שהוא
- `src/pages/Dashboard.tsx` — נשאר כמו שהוא
- `src/components/ArticlesPanel.tsx` — נשאר כמו שהוא

