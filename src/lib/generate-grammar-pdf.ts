import { conjugationData, oddOneOutData } from './grammar-explanations';

// ─── Normalization (mirrors dashboard logic) ─────────────────────────────────

function normalizeHebrew(text: string): string {
  if (!text) return '';
  return text
    .replace(/[\u0591-\u05C7]/g, '')
    .replace(/[.\-\s"'״׳()]/g, '')
    .replace(/ך/g, 'כ')
    .replace(/ם/g, 'מ')
    .replace(/ן/g, 'נ')
    .replace(/ף/g, 'פ')
    .replace(/ץ/g, 'צ')
    .trim();
}

const correctAnswers: Record<string, string> = {
  'pair0_a_root': 'כפה', 'pair0_b_root': 'כפת',
  'pair1_a_root': 'כרת', 'pair1_b_root': 'כרה',
  'pair2_a_root': 'רשמ', 'pair2_b_root': 'רשה',
  'pair3_a_root': 'פנמ', 'pair3_b_root': 'פנה',
  'pair4_a_root': 'לאמ', 'pair4_b_root': 'לאה',
  'pair5_a_root': 'טעה', 'pair5_b_root': 'טעמ',
  'pair6_a_root': 'תרמ', 'pair6_b_root': 'תרה',
  'pair7_a_root': 'שלמ', 'pair7_b_root': 'שלה',
  'pair8_a_root': 'תפר', 'pair8_b_root': 'פרה',
  'pair0_a_binyan': 'פעל', 'pair0_b_binyan': 'פעל',
  'pair1_a_binyan': 'פעל', 'pair1_b_binyan': 'פעל',
  'pair2_a_binyan': 'הפעיל', 'pair2_b_binyan': 'הפעיל',
  'pair3_a_binyan': 'הפעיל', 'pair3_b_binyan': 'הפעיל',
  'pair4_a_binyan': 'הפעיל', 'pair4_b_binyan': 'הפעיל',
  'pair5_a_binyan': 'הפעיל', 'pair5_b_binyan': 'הפעיל',
  'pair6_a_binyan': 'הפעיל', 'pair6_b_binyan': 'הפעיל',
  'pair7_a_binyan': 'הפעיל', 'pair7_b_binyan': 'הפעיל',
  'pair8_a_binyan': 'פעל', 'pair8_b_binyan': 'הפעיל',
  'ex1_q0': 'נטוי', 'ex1_q1': 'קפוא', 'ex1_q2': 'כלואה',
  'ex1_q3': 'שגוי', 'ex1_q4': 'מצויימ',
  'ex2_q0': 'המצאה', 'ex2_q1': 'מלוי', 'ex2_q2': 'שנוי',
  'ex2_q3': 'מחאה', 'ex2_q4': 'מלאי',
};

const BINYAN_VARIANTS: Record<string, string[]> = {
  'פעל': ['פעל', 'קל', 'פעלקל', 'קלפעל'],
  'הפעיל': ['הפעיל', 'היפעיל'],
};

function isCorrect(key: string, studentVal: string): boolean {
  if (!studentVal?.trim()) return false;
  const correct = correctAnswers[key];
  if (!correct) return false;
  const norm = normalizeHebrew(studentVal);
  if (key.includes('binyan')) {
    const variants = BINYAN_VARIANTS[correct] || [correct];
    return variants.some(v => normalizeHebrew(v) === norm);
  }
  return norm === normalizeHebrew(correct);
}

// ─── HTML builders ───────────────────────────────────────────────────────────

function conjugationTableHTML(data: { past: string; present: string; future: string }, rootLetters: [string, string, string], showBinyanMarkers: boolean, binyanExplanation: string): string {
  // Highlight root letters in red+bold within a conjugated form
  const highlightRoot = (form: string) => {
    let result = form;
    for (const letter of rootLetters) {
      // Replace first occurrence of each root letter with highlighted version
      // Use a marker to avoid double-replacing
      const regex = new RegExp(`(${letter})`);
      result = result.replace(regex, `<span style="color:#dc2626;font-weight:bold">$1</span>`);
    }
    return result;
  };

  return `
    <table style="border-collapse:collapse;margin:8px 0;width:auto">
      <tr>
        <td style="padding:4px 12px;border:1px solid #d1d5db;background:#f9fafb;font-weight:600">עבר</td>
        <td style="padding:4px 12px;border:1px solid #d1d5db;font-size:18px">${highlightRoot(data.past)}</td>
      </tr>
      <tr>
        <td style="padding:4px 12px;border:1px solid #d1d5db;background:#f9fafb;font-weight:600">הווה (בינוני)</td>
        <td style="padding:4px 12px;border:1px solid #d1d5db;font-size:18px">${highlightRoot(data.present)}</td>
      </tr>
      <tr>
        <td style="padding:4px 12px;border:1px solid #d1d5db;background:#f9fafb;font-weight:600">עתיד</td>
        <td style="padding:4px 12px;border:1px solid #d1d5db;font-size:18px">${highlightRoot(data.future)}</td>
      </tr>
    </table>
    <p style="margin:4px 0;color:#374151">
      💡 האותיות <span style="color:#dc2626;font-weight:bold">${rootLetters.join(', ')}</span> חוזרות בכל ההטיות — הן השורש ← ${conjugationData[Object.keys(conjugationData)[0]].a.root ? '' : ''}
    </p>
    ${showBinyanMarkers ? `<p style="margin:4px 0;color:#1d4ed8">🔹 ${binyanExplanation}</p>` : ''}
  `;
}

function buildPartAErrors(answers: Record<string, string>): string {
  let html = '';
  
  for (let i = 0; i < 9; i++) {
    for (const side of ['a', 'b'] as const) {
      const rootKey = `pair${i}_${side}_root`;
      const binyanKey = `pair${i}_${side}_binyan`;
      const rootWrong = !isCorrect(rootKey, answers[rootKey] || '');
      const binyanWrong = !isCorrect(binyanKey, answers[binyanKey] || '');
      
      if (!rootWrong && !binyanWrong) continue;
      
      const data = conjugationData[String(i)]?.[side];
      if (!data) continue;

      const sideLabel = side === 'a' ? "א'" : "ב'";
      
      html += `
        <div style="border:1px solid #e5e7eb;border-radius:8px;padding:16px;margin-bottom:16px;page-break-inside:avoid">
          <h3 style="margin:0 0 8px;font-size:16px;color:#1e3a5f">
            זוג ${i + 1} | משפט ${sideLabel}: "${data.sentence}"
          </h3>
      `;

      if (rootWrong) {
        const studentRoot = answers[rootKey] || '—';
        html += `
          <div style="margin-bottom:8px">
            <span style="color:#dc2626;text-decoration:line-through">תשובתך: שורש ${studentRoot}</span>
            &nbsp;&nbsp;
            <span style="color:#16a34a;font-weight:bold">התשובה הנכונה: שורש ${data.root}</span>
          </div>
          <p style="margin:4px 0;color:#6b7280;font-size:14px">📋 הטיות הפועל (הוא):</p>
          ${conjugationTableHTML(data, data.rootLetters, false, '')}
          <p style="margin:4px 0;color:#374151">
            💡 האותיות <span style="color:#dc2626;font-weight:bold">${data.rootLetters.join(', ')}</span> חוזרות בכל ההטיות — הן השורש → ${data.root}
          </p>
        `;
      }

      if (binyanWrong) {
        const studentBinyan = answers[binyanKey] || '—';
        html += `
          <div style="margin-bottom:8px;${rootWrong ? 'margin-top:12px;padding-top:12px;border-top:1px dashed #d1d5db' : ''}">
            <span style="color:#dc2626;text-decoration:line-through">תשובתך: בניין ${studentBinyan}</span>
            &nbsp;&nbsp;
            <span style="color:#16a34a;font-weight:bold">התשובה הנכונה: בניין ${data.binyan}</span>
          </div>
          ${!rootWrong ? `
            <p style="margin:4px 0;color:#6b7280;font-size:14px">📋 הטיות הפועל (הוא):</p>
            <table style="border-collapse:collapse;margin:8px 0">
              <tr>
                <td style="padding:4px 12px;border:1px solid #d1d5db;background:#f9fafb;font-weight:600">עבר</td>
                <td style="padding:4px 12px;border:1px solid #d1d5db;font-size:18px">${data.past}</td>
              </tr>
              <tr>
                <td style="padding:4px 12px;border:1px solid #d1d5db;background:#f9fafb;font-weight:600">הווה (בינוני)</td>
                <td style="padding:4px 12px;border:1px solid #d1d5db;font-size:18px">${data.present}</td>
              </tr>
              <tr>
                <td style="padding:4px 12px;border:1px solid #d1d5db;background:#f9fafb;font-weight:600">עתיד</td>
                <td style="padding:4px 12px;border:1px solid #d1d5db;font-size:18px">${data.future}</td>
              </tr>
            </table>
          ` : ''}
          <p style="margin:4px 0;color:#1d4ed8;font-weight:500">🔹 ${data.binyanExplanation}</p>
        `;
      }

      html += '</div>';
    }
  }
  
  return html;
}

function buildPartBErrors(answers: Record<string, string>): string {
  let html = '';
  const exercises = [
    { prefix: 'ex1', title: 'תרגיל 1 — פועל יוצא דופן', count: 5 },
    { prefix: 'ex2', title: 'תרגיל 2 — שם יוצא דופן', count: 5 },
  ];

  for (const { prefix, title, count } of exercises) {
    const questions = oddOneOutData[prefix];
    if (!questions) continue;

    for (let qi = 0; qi < count; qi++) {
      const key = `${prefix}_q${qi}`;
      if (isCorrect(key, answers[key] || '')) continue;

      const q = questions[qi];
      if (!q) continue;

      const studentAnswer = answers[key] || '—';
      const hebrewLetters = ['א', 'ב', 'ג', 'ד'];

      html += `
        <div style="border:1px solid #e5e7eb;border-radius:8px;padding:16px;margin-bottom:16px;page-break-inside:avoid">
          <h3 style="margin:0 0 8px;font-size:16px;color:#1e3a5f">
            חלק ב' — ${title}, שאלה ${qi + 1}
          </h3>
          <div style="margin-bottom:8px">
            <span style="color:#dc2626;text-decoration:line-through">תשובתך: ${studentAnswer}</span>
            &nbsp;&nbsp;
            <span style="color:#16a34a;font-weight:bold">התשובה הנכונה: ${hebrewLetters[q.correctAnswerIndex]}. ${q.correctAnswer}</span>
          </div>
          <table style="border-collapse:collapse;margin:8px 0;width:100%">
            <tr style="background:#f3f4f6">
              <th style="padding:6px 10px;border:1px solid #d1d5db;text-align:right">המילה</th>
              <th style="padding:6px 10px;border:1px solid #d1d5db;text-align:right">הוא אתמול</th>
              <th style="padding:6px 10px;border:1px solid #d1d5db;text-align:right">השורש</th>
              <th style="padding:6px 10px;border:1px solid #d1d5db;text-align:right">גזרה</th>
            </tr>
            ${q.words.map((word, wi) => {
              const isOdd = word === q.correctAnswer;
              const bgColor = isOdd ? '#dcfce7' : 'white';
              return `
                <tr style="background:${bgColor}">
                  <td style="padding:6px 10px;border:1px solid #d1d5db;font-size:16px">${word}${isOdd ? ' ✓' : ''}</td>
                  <td style="padding:6px 10px;border:1px solid #d1d5db;font-size:16px">${q.pastForms[word] || ''}</td>
                  <td style="padding:6px 10px;border:1px solid #d1d5db">${q.roots[word] || ''}</td>
                  <td style="padding:6px 10px;border:1px solid #d1d5db">${q.gizrot[word] || ''}${isOdd ? ' ← יוצא הדופן!' : ''}</td>
                </tr>
              `;
            }).join('')}
          </table>
          <p style="margin:8px 0 4px;color:#374151">💡 ${q.explanation}</p>
          <p style="margin:4px 0;color:#6b7280;font-size:13px">🔑 תזכורת: הטו לעבר נסתר (הוא אתמול) — האות האחרונה בשורש קובעת את הגזרה.</p>
        </div>
      `;
    }
  }

  return html;
}

// ─── Main export ─────────────────────────────────────────────────────────────

export function generateGrammarPDF(
  studentName: string,
  taskTitle: string,
  answers: Record<string, string>,
  grade: number
) {
  const partAHTML = buildPartAErrors(answers);
  const partBHTML = buildPartBErrors(answers);

  const hasErrors = partAHTML.length > 0 || partBHTML.length > 0;

  const fullHTML = `
<!DOCTYPE html>
<html dir="rtl" lang="he">
<head>
  <meta charset="UTF-8">
  <title>דף משוב — ${studentName}</title>
  <link href="https://fonts.googleapis.com/css2?family=Rubik:wght@400;500;600;700&display=swap" rel="stylesheet">
  <style>
    * { box-sizing: border-box; margin: 0; padding: 0; }
    body {
      font-family: 'Rubik', 'David', sans-serif;
      direction: rtl;
      padding: 32px;
      color: #1f2937;
      line-height: 1.6;
      max-width: 800px;
      margin: 0 auto;
    }
    h1 { font-size: 22px; color: #1e3a5f; margin-bottom: 4px; }
    h2 { font-size: 18px; color: #1e3a5f; margin: 24px 0 12px; border-bottom: 2px solid #1e3a5f; padding-bottom: 4px; }
    .header-info { color: #6b7280; font-size: 14px; margin-bottom: 20px; }
    .grade-box {
      display: inline-block;
      background: #eff6ff;
      border: 2px solid #1e3a5f;
      border-radius: 8px;
      padding: 8px 20px;
      font-size: 20px;
      font-weight: 700;
      color: #1e3a5f;
      margin-bottom: 20px;
    }
    .no-errors {
      text-align: center;
      padding: 40px;
      color: #16a34a;
      font-size: 18px;
      font-weight: 600;
    }
    @media print {
      body { padding: 16px; }
      .no-print { display: none; }
    }
  </style>
</head>
<body>
  <h1>דף משוב — שורשים, בניינים וגזרות</h1>
  <p class="header-info">תלמיד/ה: <strong>${studentName}</strong> | ${taskTitle}</p>
  <div class="grade-box">ציון: ${grade}</div>

  ${!hasErrors ? '<div class="no-errors">🎉 כל הכבוד! אין טעויות — כל התשובות נכונות!</div>' : ''}

  ${partAHTML ? `<h2>חלק א': שורשים ובניינים — הטעויות שלך</h2>${partAHTML}` : ''}
  ${partBHTML ? `<h2>חלק ב': יוצא הדופן — הטעויות שלך</h2>${partBHTML}` : ''}
</body>
</html>
  `;

  const printWindow = window.open('', '_blank');
  if (printWindow) {
    printWindow.document.write(fullHTML);
    printWindow.document.close();
    // Wait for fonts to load before printing
    setTimeout(() => {
      printWindow.print();
    }, 500);
  }
}
