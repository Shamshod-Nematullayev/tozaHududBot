import XLSX from "xlsx";
import fs from "fs";

export type ExcelInput = string | Buffer | ArrayBuffer;

export interface ExcelJson {
  [key: string]: any;
}

/**
 * Detects the input type and returns a Buffer for further processing.
 */
function normalizeToBuffer(input: ExcelInput): Buffer {
  if (Buffer.isBuffer(input)) {
    return input;
  }

  if (input instanceof ArrayBuffer) {
    return Buffer.from(input);
  }

  if (typeof input === "string") {
    if (!fs.existsSync(input)) {
      throw new Error(`File not found: ${input}`);
    }
    return fs.readFileSync(input);
  }

  throw new Error("Invalid input type for readExcel()");
}

/**
 * Converts an Excel file (Buffer) to a JSON object using the first sheet.
 */
function parseExcel(buffer: Buffer): ExcelJson[] {
  const workbook = XLSX.read(buffer, { type: "buffer" });
  const firstSheetName = workbook.SheetNames[0];

  if (!firstSheetName) {
    throw new Error("Excel file contains no sheets");
  }

  const sheet = workbook.Sheets[firstSheetName];
  return XLSX.utils.sheet_to_json(sheet, {
    defval: "", // Empty cells → empty string
    raw: true, // Keep original values as much as possible
  });
}

/**
 * Main public function: Excel → JSON
 */
export function readExcel(input: ExcelInput): ExcelJson[] {
  const buffer = normalizeToBuffer(input);
  return parseExcel(buffer);
}
