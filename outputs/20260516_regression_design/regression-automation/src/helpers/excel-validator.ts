import ExcelJS from 'exceljs';

export interface CellCheck {
  sheetName?: string;
  cell: string;
  expectedValue?: string | number;
  expectedFormula?: RegExp;
  shouldExist?: boolean;
}

export async function validateExcelFile(filePath: string, checks: CellCheck[]): Promise<string[]> {
  const workbook = new ExcelJS.Workbook();
  await workbook.xlsx.readFile(filePath);
  const errors: string[] = [];

  for (const check of checks) {
    const sheet = check.sheetName ? workbook.getWorksheet(check.sheetName) : workbook.worksheets[0];
    if (!sheet) {
      errors.push(`Sheet "${check.sheetName}" not found`);
      continue;
    }

    const cell = sheet.getCell(check.cell);
    if (check.shouldExist === false && cell.value) {
      errors.push(`Cell ${check.cell} should be empty but got ${cell.value}`);
      continue;
    }

    if (check.expectedValue !== undefined && cell.value !== check.expectedValue) {
      errors.push(`Cell ${check.cell}: expected "${check.expectedValue}", got "${cell.value}"`);
    }

    if (check.expectedFormula) {
      const formula = (cell as any).formula;
      if (!formula) {
        errors.push(`Cell ${check.cell}: expected formula but got plain value`);
      } else if (!check.expectedFormula.test(formula)) {
        errors.push(`Cell ${check.cell}: formula "${formula}" does not match ${check.expectedFormula}`);
      }
    }
  }

  return errors;
}

export async function getSheetNames(filePath: string): Promise<string[]> {
  const workbook = new ExcelJS.Workbook();
  await workbook.xlsx.readFile(filePath);
  return workbook.worksheets.map((ws) => ws.name);
}

export async function validateFileNonEmpty(filePath: string): Promise<boolean> {
  const workbook = new ExcelJS.Workbook();
  await workbook.xlsx.readFile(filePath);
  for (const ws of workbook.worksheets) {
    if (ws.rowCount > 0) return true;
  }
  return false;
}
