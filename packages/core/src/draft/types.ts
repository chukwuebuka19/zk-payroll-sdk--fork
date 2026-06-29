export interface PayrollDraftEntry {
  recipientId: string;
  amount: string;
  asset: string;
  note?: string;
}

export interface PayrollDraft {
  version: number;
  createdAt: string;
  updatedAt: string;
  label?: string;
  entries: PayrollDraftEntry[];
}

export interface DraftExportResult {
  data: string;
  checksum: string;
}

export interface DraftImportResult {
  draft: PayrollDraft;
  warnings: string[];
}
