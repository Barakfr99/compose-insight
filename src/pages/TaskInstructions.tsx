const TaskInstructions = () => {
  return (
    <div
      dir="rtl"
      style={{
        fontFamily: "'Heebo', sans-serif",
        fontSize: "11.5pt",
        lineHeight: 1.65,
        color: "#1a1a1a",
        background: "#fff",
        padding: "24px 38px",
        maxWidth: 850,
        margin: "0 auto",
      }}
    >
      {/* HEADER */}
      <div style={{ textAlign: "center", marginBottom: 12, paddingBottom: 10, borderBottom: "3px solid #2a5a8a" }}>
        <h1 style={{ fontSize: "18pt", fontWeight: 700, color: "#2a5a8a", marginBottom: 2 }}>📝 הנחיות למשימת הכתיבה</h1>
        <div style={{ fontSize: "10.5pt", color: "#666" }}>משמעת בבתי הספר – סקירה ממזגת על פי מאמרים 2 ו-3</div>
      </div>

      {/* ALERT */}
      <div style={{ background: "#fff0f0", border: "2px solid #cc4444", borderRadius: 8, padding: "8px 14px", marginBottom: 12, textAlign: "center", fontSize: "12pt", fontWeight: 700, color: "#aa2222" }}>
        ⚠️ אל תסכמו כל מאמר בנפרד! המטרה: טקסט אחד חדש שממזג את שני המאמרים יחד.
      </div>

      {/* STEPS BEFORE WRITING */}
      <div style={{ background: "#f5f0ff", border: "1px solid #b8a0d8", borderRadius: 8, padding: "10px 16px", marginBottom: 12 }}>
        <h2 style={{ fontSize: "13pt", color: "#5a3d8a", marginBottom: 4 }}>🔍 לפני שמתחילים לכתוב</h2>
        {[
          { num: "1", text: <><strong>קראו את המטלה</strong> – סמנו מה בדיוק מבקשים מכם (סיבות? דרכי התמודדות?)</> },
          { num: "2", text: <><strong>קראו את המאמרים</strong> – סמנו בצבע אחד מידע על <strong>סיבות</strong> ובצבע אחר מידע על <strong>דרכי התמודדות</strong></> },
          { num: "3", text: <><strong>ארגנו בטבלה</strong> – מה <strong>מאחד</strong> (משותף לשניהם)? מה <strong>מייחד</strong> (רק בקון / רק בהרפז)?</> },
          { num: "4", text: <><strong>עכשיו כתבו</strong> – לפי המבנה שלמטה ⬇️</> },
        ].map((step) => (
          <div key={step.num} style={{ display: "flex", gap: 6, alignItems: "flex-start", marginBottom: 3 }}>
            <div style={{ background: "#5a3d8a", color: "#fff", fontWeight: 700, fontSize: "10pt", borderRadius: "50%", width: 22, height: 22, display: "flex", alignItems: "center", justifyContent: "center", flexShrink: 0, marginTop: 2 }}>{step.num}</div>
            <div style={{ fontSize: "10.5pt" }}>{step.text}</div>
          </div>
        ))}
      </div>

      {/* TASK */}
      <div style={{ background: "#eef3fa", border: "2px solid #2a5a8a", borderRadius: 8, padding: "10px 16px", marginBottom: 12 }}>
        <h2 style={{ fontSize: "13pt", color: "#2a5a8a", marginBottom: 4 }}>🎯 המשימה: שתי פסקאות בלבד (100–200 מילים)</h2>
        <div style={{ display: "flex", gap: 10, marginTop: 6 }}>
          <div style={{ flex: 1, background: "#fff", border: "1px solid #b0c4de", borderRadius: 6, padding: "8px 12px" }}>
            <div style={{ fontWeight: 700, fontSize: "11pt", color: "#2a5a8a", marginBottom: 2 }}>פסקה 1 – הסיבות</div>
            <p style={{ fontSize: "10.5pt", margin: 0 }}>מהן הסיבות לבעיות המשמעת?<br />מידע <strong>מאחד</strong> + <strong>מייחד</strong> לכל מאמר</p>
          </div>
          <div style={{ flex: 1, background: "#fff", border: "1px solid #b0c4de", borderRadius: 6, padding: "8px 12px" }}>
            <div style={{ fontWeight: 700, fontSize: "11pt", color: "#2a5a8a", marginBottom: 2 }}>פסקה 2 – דרכי ההתמודדות</div>
            <p style={{ fontSize: "10.5pt", margin: 0 }}>מהן דרכי ההתמודדות המומלצות?<br />מידע <strong>מאחד</strong> + <strong>מייחד</strong> לכל מאמר</p>
          </div>
        </div>
      </div>

      {/* REFERENCE EXAMPLES */}
      <h2 style={{ fontSize: "13pt", fontWeight: 700, color: "#1a1a1a", marginTop: 14, marginBottom: 6, paddingBottom: 3, borderBottom: "2px solid #ddd" }}>📌 איך מאזכרים מקורות בתוך הטקסט</h2>
      <div style={{ background: "#f8f5ee", border: "1px solid #d4c89a", borderRadius: 6, padding: "10px 14px", marginBottom: 12 }}>
        <h3 style={{ fontSize: "11.5pt", color: "#8a6d20", marginBottom: 4 }}>אזכור של מאמר אחד (מידע מייחד):</h3>
        <div style={{ fontSize: "10.5pt", marginBottom: 3, paddingRight: 8 }}>
          בית הספר הפך למוסד מיושן שאינו מתאים לעולם הדיגיטלי <strong>(הרפז, 2007)</strong>.
        </div>
        <h3 style={{ fontSize: "11.5pt", color: "#8a6d20", marginBottom: 4, marginTop: 6 }}>אזכור של שני המאמרים יחד (מידע מאחד):</h3>
        <div style={{ fontSize: "10.5pt", marginBottom: 3, paddingRight: 8 }}>
          תוכנית הלימודים המיושנת גורמת לשעמום ולבעיות משמעת <strong>(קון, 2007; הרפז, 2007)</strong>.
        </div>
        <div style={{ fontSize: "10.5pt", marginTop: 4, color: "#aa2222" }}>
          <span style={{ fontWeight: 700, fontSize: "10pt", color: "#666" }}>⚠️ שימו לב:</span> האזכור תמיד בסוף המשפט בסוגריים – <strong>מתמקדים בנושא, לא בכותבים!</strong>
        </div>
      </div>

      {/* EXAMPLE */}
      <h2 style={{ fontSize: "13pt", fontWeight: 700, color: "#1a1a1a", marginTop: 14, marginBottom: 6, paddingBottom: 3, borderBottom: "2px solid #ddd" }}>💡 דוגמה לפסקה ממזגת (על נושא אחר)</h2>
      <div style={{ display: "flex", flexWrap: "wrap", gap: 8, margin: "6px 0 4px 0", fontSize: "9.5pt" }}>
        {[
          { color: "#d4eaff", label: "פתיח" },
          { color: "#d4f5d4", label: "מאחד" },
          { color: "#ffe8cc", label: "מייחד – רוזן" },
          { color: "#f0d4ff", label: "מייחד – כהן" },
        ].map((item) => (
          <div key={item.label} style={{ display: "flex", alignItems: "center", gap: 3 }}>
            <span style={{ width: 12, height: 12, borderRadius: 3, display: "inline-block", background: item.color }} />
            {item.label}
          </div>
        ))}
        <div style={{ display: "flex", alignItems: "center", gap: 3 }}>
          <span style={{ borderBottom: "2px solid #cc4444", fontSize: "9.5pt" }}>קו אדום</span> = מילת קישור
        </div>
      </div>

      <div style={{ background: "#fafaf5", border: "1px solid #d4d0b8", borderRadius: 6, padding: "12px 16px", fontSize: "11pt", lineHeight: 1.8, marginBottom: 12 }}>
        <span style={{ background: "#d4eaff", borderRadius: 3, padding: "1px 3px" }}>בשנים האחרונות עולה חשש גובר מהשפעת המסכים על בני נוער.</span>{" "}
        <span style={{ background: "#d4f5d4", borderRadius: 3, padding: "1px 3px" }}>נמצא כי שימוש ממושך במסכים פוגע בשינה ובריכוז (רוזן, 2024; כהן, 2023).</span>{" "}
        <span style={{ borderBottom: "2px solid #cc4444" }}>בנוסף,</span>{" "}
        <span style={{ background: "#ffe8cc", borderRadius: 3, padding: "1px 3px" }}>ישיבה ממושכת מול מסך גורמת לבעיות ביציבת הגוף (רוזן, 2024).</span>{" "}
        <span style={{ borderBottom: "2px solid #cc4444" }}>כמו כן,</span>{" "}
        <span style={{ background: "#f0d4ff", borderRadius: 3, padding: "1px 3px" }}>השימוש במסכים פוגע ביחסים חברתיים פנים-אל-פנים (כהן, 2023).</span>
      </div>

      {/* WORD BANK */}
      <div style={{ background: "#f0f7f0", border: "1px solid #8cb88c", borderRadius: 6, padding: "8px 14px", marginBottom: 12 }}>
        <h3 style={{ fontSize: "11.5pt", color: "#2a6a2a", marginBottom: 4 }}>🔗 מילות קישור שימושיות</h3>
        {[
          { label: "מידע מאחד:", words: "נמצא כי... (שם, שנה; שם, שנה)  |  מחקרים מראים ש..." },
          { label: "הוספת מייחד:", words: "בנוסף  |  כמו כן  |  יתרה מכך  |  נוסף על כך" },
          { label: "ניגוד:", words: "לעומת זאת  |  מצד שני  |  אולם  |  אך" },
        ].map((row) => (
          <div key={row.label} style={{ display: "flex", gap: 6, marginBottom: 2, alignItems: "baseline", flexWrap: "wrap" }}>
            <span style={{ fontWeight: 700, fontSize: "10pt", minWidth: 100, color: "#333" }}>{row.label}</span>
            <span style={{ fontSize: "10pt", color: "#555" }}>{row.words}</span>
          </div>
        ))}
      </div>

      {/* CHECKLIST */}
      <h2 style={{ fontSize: "13pt", fontWeight: 700, color: "#1a1a1a", marginTop: 14, marginBottom: 6, paddingBottom: 3, borderBottom: "2px solid #ddd" }}>✅ לפני שמגישים</h2>
      <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "3px 14px", margin: "6px 0" }}>
        {[
          <>☐ בדיוק <strong>2 פסקאות</strong> (סיבות + דרכי התמודדות)</>,
          <>☐ אזכור: <strong>(קון, 2007)</strong> ו-<strong>(הרפז, 2007)</strong></>,
          <>☐ יש מידע <strong>מאחד + מייחד</strong></>,
          <>☐ <strong>מילות קישור</strong> בין המשפטים</>,
          <>☐ <strong>100–200 מילים</strong></>,
          <>☐ <strong>ביבליוגרפיה</strong> בסוף הסקירה</>,
        ].map((item, i) => (
          <div key={i} style={{ fontSize: "10.5pt", padding: "1px 0" }}>{item}</div>
        ))}
      </div>
    </div>
  );
};

export default TaskInstructions;
