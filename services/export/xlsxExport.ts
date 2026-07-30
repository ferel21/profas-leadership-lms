import { strToU8, zipSync } from "fflate";

export interface StudentReportRow {
  name: string;
  email: string;
  courseTitle: string;
  role: string;
  status: string;
  score?: number;
  completedAt?: string;
}

export interface AttendanceReportRow {
  eventName: string;
  userName: string;
  status: string;
  checkedInAt: string;
  note?: string;
}

export interface XPReportRow {
  userName: string;
  totalXP: number;
  source: string;
  lastActivity: string;
}

export type SpreadsheetCell = string | number;

export type SpreadsheetSheet = {
  name: string;
  headers: string[];
  rows: SpreadsheetCell[][];
  widths?: number[];
};

function xml(value: string) {
  return value
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;")
    .replace(/'/g, "&apos;");
}

function sanitizeCell(value: SpreadsheetCell): SpreadsheetCell {
  if (typeof value !== "string") return Number.isFinite(value) ? value : 0;
  const clean = value.replace(/\u0000/g, "");
  return /^[=+\-@\t\r]/.test(clean.trimStart()) ? `'${clean}` : clean;
}

function columnName(index: number) {
  let name = "";
  let value = index + 1;
  while (value > 0) {
    value -= 1;
    name = String.fromCharCode(65 + (value % 26)) + name;
    value = Math.floor(value / 26);
  }
  return name;
}

function sheetName(value: string, fallback: string) {
  const clean = value.replace(/[\\/*?:[\]]/g, " ").trim().slice(0, 31);
  return clean || fallback;
}

function cellXml(value: SpreadsheetCell, row: number, column: number, header = false) {
  const reference = `${columnName(column)}${row}`;
  const style = header ? ' s="1"' : "";
  const sanitized = sanitizeCell(value);
  if (typeof sanitized === "number") {
    return `<c r="${reference}"${style} t="n"><v>${sanitized}</v></c>`;
  }
  return `<c r="${reference}"${style} t="inlineStr"><is><t xml:space="preserve">${xml(sanitized)}</t></is></c>`;
}

function worksheetXml(sheet: SpreadsheetSheet) {
  const allRows = [sheet.headers, ...sheet.rows];
  const rows = allRows.map((row, rowIndex) => {
    const number = rowIndex + 1;
    const cells = row.map((value, columnIndex) =>
      cellXml(value, number, columnIndex, rowIndex === 0),
    ).join("");
    return `<row r="${number}">${cells}</row>`;
  }).join("");
  const widths = sheet.headers.map((_, index) => {
    const requested = sheet.widths?.[index] ?? 18;
    return `<col min="${index + 1}" max="${index + 1}" width="${Math.max(6, Math.min(60, requested))}" customWidth="1"/>`;
  }).join("");
  const lastColumn = columnName(Math.max(0, sheet.headers.length - 1));
  const lastRow = Math.max(1, allRows.length);

  return `<?xml version="1.0" encoding="UTF-8" standalone="yes"?>
<worksheet xmlns="http://schemas.openxmlformats.org/spreadsheetml/2006/main">
  <dimension ref="A1:${lastColumn}${lastRow}"/>
  <sheetViews><sheetView workbookViewId="0"><pane ySplit="1" topLeftCell="A2" activePane="bottomLeft" state="frozen"/></sheetView></sheetViews>
  <cols>${widths}</cols>
  <sheetData>${rows}</sheetData>
  <autoFilter ref="A1:${lastColumn}${lastRow}"/>
</worksheet>`;
}

export function createExcelWorkbook(sheets: SpreadsheetSheet[]) {
  const safeSheets = (sheets.length > 0 ? sheets : [{ name: "Laporan", headers: ["Data"], rows: [] }])
    .slice(0, 20);
  const workbookSheets = safeSheets.map((sheet, index) => ({
    ...sheet,
    name: sheetName(sheet.name, `Laporan ${index + 1}`),
  }));
  const sheetEntries = Object.fromEntries(
    workbookSheets.map((sheet, index) => [
      `xl/worksheets/sheet${index + 1}.xml`,
      strToU8(worksheetXml(sheet)),
    ]),
  );
  const contentTypes = workbookSheets.map((_, index) =>
    `<Override PartName="/xl/worksheets/sheet${index + 1}.xml" ContentType="application/vnd.openxmlformats-officedocument.spreadsheetml.worksheet+xml"/>`,
  ).join("");
  const workbookSheetNodes = workbookSheets.map((sheet, index) =>
    `<sheet name="${xml(sheet.name)}" sheetId="${index + 1}" r:id="rId${index + 1}"/>`,
  ).join("");
  const workbookRels = workbookSheets.map((_, index) =>
    `<Relationship Id="rId${index + 1}" Type="http://schemas.openxmlformats.org/officeDocument/2006/relationships/worksheet" Target="worksheets/sheet${index + 1}.xml"/>`,
  ).join("");
  const styleRelId = workbookSheets.length + 1;

  return zipSync({
    "[Content_Types].xml": strToU8(`<?xml version="1.0" encoding="UTF-8" standalone="yes"?>
<Types xmlns="http://schemas.openxmlformats.org/package/2006/content-types">
  <Default Extension="rels" ContentType="application/vnd.openxmlformats-package.relationships+xml"/>
  <Default Extension="xml" ContentType="application/xml"/>
  <Override PartName="/xl/workbook.xml" ContentType="application/vnd.openxmlformats-officedocument.spreadsheetml.sheet.main+xml"/>
  <Override PartName="/xl/styles.xml" ContentType="application/vnd.openxmlformats-officedocument.spreadsheetml.styles+xml"/>
  <Override PartName="/docProps/core.xml" ContentType="application/vnd.openxmlformats-package.core-properties+xml"/>
  <Override PartName="/docProps/app.xml" ContentType="application/vnd.openxmlformats-officedocument.extended-properties+xml"/>
  ${contentTypes}
</Types>`),
    "_rels/.rels": strToU8(`<?xml version="1.0" encoding="UTF-8" standalone="yes"?>
<Relationships xmlns="http://schemas.openxmlformats.org/package/2006/relationships">
  <Relationship Id="rId1" Type="http://schemas.openxmlformats.org/officeDocument/2006/relationships/officeDocument" Target="xl/workbook.xml"/>
  <Relationship Id="rId2" Type="http://schemas.openxmlformats.org/package/2006/relationships/metadata/core-properties" Target="docProps/core.xml"/>
  <Relationship Id="rId3" Type="http://schemas.openxmlformats.org/officeDocument/2006/relationships/extended-properties" Target="docProps/app.xml"/>
</Relationships>`),
    "docProps/app.xml": strToU8(`<?xml version="1.0" encoding="UTF-8" standalone="yes"?>
<Properties xmlns="http://schemas.openxmlformats.org/officeDocument/2006/extended-properties">
  <Application>PROFAS Leadership LMS</Application>
</Properties>`),
    "docProps/core.xml": strToU8(`<?xml version="1.0" encoding="UTF-8" standalone="yes"?>
<cp:coreProperties xmlns:cp="http://schemas.openxmlformats.org/package/2006/metadata/core-properties" xmlns:dc="http://purl.org/dc/elements/1.1/" xmlns:dcterms="http://purl.org/dc/terms/">
  <dc:creator>PROFAS Leadership LMS</dc:creator>
  <dcterms:created xsi:type="dcterms:W3CDTF" xmlns:xsi="http://www.w3.org/2001/XMLSchema-instance">${new Date().toISOString()}</dcterms:created>
</cp:coreProperties>`),
    "xl/workbook.xml": strToU8(`<?xml version="1.0" encoding="UTF-8" standalone="yes"?>
<workbook xmlns="http://schemas.openxmlformats.org/spreadsheetml/2006/main" xmlns:r="http://schemas.openxmlformats.org/officeDocument/2006/relationships">
  <sheets>${workbookSheetNodes}</sheets>
</workbook>`),
    "xl/_rels/workbook.xml.rels": strToU8(`<?xml version="1.0" encoding="UTF-8" standalone="yes"?>
<Relationships xmlns="http://schemas.openxmlformats.org/package/2006/relationships">
  ${workbookRels}
  <Relationship Id="rId${styleRelId}" Type="http://schemas.openxmlformats.org/officeDocument/2006/relationships/styles" Target="styles.xml"/>
</Relationships>`),
    "xl/styles.xml": strToU8(`<?xml version="1.0" encoding="UTF-8" standalone="yes"?>
<styleSheet xmlns="http://schemas.openxmlformats.org/spreadsheetml/2006/main">
  <fonts count="2"><font/><font><b/><color rgb="FFFFFFFF"/></font></fonts>
  <fills count="3"><fill><patternFill patternType="none"/></fill><fill><patternFill patternType="gray125"/></fill><fill><patternFill patternType="solid"><fgColor rgb="FF1E5A8F"/><bgColor indexed="64"/></patternFill></fill></fills>
  <borders count="1"><border/></borders>
  <cellStyleXfs count="1"><xf numFmtId="0" fontId="0" fillId="0" borderId="0"/></cellStyleXfs>
  <cellXfs count="2"><xf numFmtId="0" fontId="0" fillId="0" borderId="0"/><xf numFmtId="0" fontId="1" fillId="2" borderId="0" applyFont="1" applyFill="1"/></cellXfs>
  <cellStyles count="1"><cellStyle name="Normal" xfId="0" builtinId="0"/></cellStyles>
</styleSheet>`),
    ...sheetEntries,
  }, { level: 6 });
}

export function downloadExcelWorkbook(sheets: SpreadsheetSheet[], fileName: string) {
  const archive = createExcelWorkbook(sheets);
  const blob = new Blob([new Uint8Array(archive).buffer], {
    type: "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet",
  });
  const url = URL.createObjectURL(blob);
  const anchor = document.createElement("a");
  anchor.href = url;
  anchor.download = fileName;
  anchor.click();
  URL.revokeObjectURL(url);
}

export async function generateExcelReport({
  fileName = `PROFAS-LMS-Report-${new Date().toISOString().split("T")[0]}.xlsx`,
  students = [],
  attendances = [],
  xpLogs = [],
}: {
  fileName?: string;
  students?: StudentReportRow[];
  attendances?: AttendanceReportRow[];
  xpLogs?: XPReportRow[];
}): Promise<void> {
  downloadExcelWorkbook([
    {
      name: "Rekap Nilai Kuis",
      headers: ["No", "Nama Peserta", "Email", "Program Kelas", "Status", "Nilai Akhir / Kuis", "Tanggal Selesai"],
      rows: students.map((student, index) => [
        index + 1,
        student.name,
        student.email,
        student.courseTitle,
        student.status,
        student.score !== undefined ? `${student.score} / 100` : "-",
        student.completedAt || "-",
      ]),
      widths: [6, 25, 28, 35, 15, 18, 20],
    },
    {
      name: "Log Kehadiran",
      headers: ["No", "Nama Acara / Sesi", "Nama Peserta", "Status Kehadiran", "Waktu Check-In", "Catatan"],
      rows: attendances.map((attendance, index) => [
        index + 1,
        attendance.eventName,
        attendance.userName,
        attendance.status,
        attendance.checkedInAt,
        attendance.note || "-",
      ]),
      widths: [6, 35, 25, 18, 22, 30],
    },
    {
      name: "Leaderboard XP",
      headers: ["Peringkat", "Nama Pengguna", "Total XP", "Sumber Utama", "Aktivitas Terakhir"],
      rows: xpLogs.map((log, index) => [
        index + 1,
        log.userName,
        log.totalXP,
        log.source,
        log.lastActivity,
      ]),
      widths: [10, 28, 15, 25, 20],
    },
  ], fileName);
}
