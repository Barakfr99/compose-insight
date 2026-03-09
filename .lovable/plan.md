

## הבעיה

שני סוגי המשימות - המשימה הראשונה (`/`, Index) והכתיבה הממזגת (`/merge-writing`) - שומרים הגשות בטבלת `submissions` עם `task_id = null`. לכן הדשבורד של הכתיבה הממזגת (`MergeWritingDashboard`) מציג את כל ההגשות עם `task_id = null`, כולל הגשות מהמשימה הראשונה.

הדשבורד מנסה לסנן לפי JSON אבל גם טקסט רגיל (מהמשימה הראשונה) עובר את הסינון אם הוא לא JSON - ולכן חלק מהתשובות מהמשימה הראשונה מופיעות שם.

## הפתרון

הוסיף עמודת `task_type` (או שימוש במזהה קבוע) לטבלת `submissions` כדי להבדיל בין סוגי המשימות:

1. **הוספת עמודה `task_type`** לטבלת `submissions` - ערך `text` עם ברירת מחדל `'default'`
2. **עדכון Index.tsx** - שומר הגשות עם `task_type: 'default'`
3. **עדכון MergeWritingTask** - שומר הגשות עם `task_type: 'merge_writing'`
4. **עדכון MergeWritingDashboard** - מסנן לפי `task_type = 'merge_writing'` במקום לנסות לזהות JSON
5. **עדכון Dashboard (/)** - אם קיים, מסנן לפי `task_type = 'default'`

### פרטים טכניים

- מיגרציה: `ALTER TABLE submissions ADD COLUMN task_type text NOT NULL DEFAULT 'default'`
- עדכון הגשות קיימות: זיהוי הגשות ממזגות (שהן JSON) ועדכון ל-`merge_writing`
- הסרת הסינון לפי JSON מהדשבורד, החלפה בשאילתה פשוטה עם `.eq('task_type', 'merge_writing')`

