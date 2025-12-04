// Invoice-related types for the HOA Nexus application

export interface DatabaseInvoice {
  InvoiceID: string;
  CommunityID: string;
  InvoiceNumber: string;
  InvoiceDate: string;
  Total: number;
  Status: string;
  FileID: string | null;
  CreatedOn: string;
  CreatedBy: string | null;
  ModifiedOn: string | null;
  ModifiedBy: string | null;
}

export interface DatabaseInvoiceCharge {
  InvoiceChargeID: string;
  InvoiceID: string;
  Description: string;
  Amount: number;
  DisplayOrder: number;
  CreatedOn: string;
  CreatedBy: string | null;
  ModifiedOn: string | null;
  ModifiedBy: string | null;
}

export interface Invoice {
  id: string;
  communityId: string;
  invoiceNumber: string;
  invoiceDate: string;
  total: number;
  status: string;
  fileId: string | null;
  charges: InvoiceCharge[];
  createdOn: string;
  createdBy: string | null;
  modifiedOn: string | null;
  modifiedBy: string | null;
}

export interface InvoiceCharge {
  id: string;
  invoiceId: string;
  description: string;
  amount: number;
  displayOrder: number;
  createdOn: string;
  createdBy: string | null;
}

export interface CreateInvoiceData {
  CommunityID: string;
  InvoiceDate: string;
  Charges: Array<{
    Description: string;
    Amount: number;
    DisplayOrder?: number;
  }>;
  CreatedBy?: string | null;
}

export interface InvoiceFeeData {
  managementFees: Array<{
    type: string;
    description: string;
    amount: number;
    displayOrder: number;
  }>;
  standardFees: Array<{
    type: string;
    feeMasterId: string;
    description: string;
    amount: number;
    displayOrder: number;
    shouldInclude: boolean;
  }>;
  commitmentFees: Array<{
    type: string;
    description: string;
    amount: number;
    displayOrder: number;
  }>;
  allCharges: Array<{
    type: string;
    description: string;
    amount: number;
    displayOrder: number;
  }>;
  total: number;
}

