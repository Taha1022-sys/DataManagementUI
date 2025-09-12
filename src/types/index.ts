// Backend API Response Types

export interface ApiResponse<T = unknown> {
  success: boolean
  data?: T
  message?: string
}

// Excel File Types
export interface ExcelFile {
  fileName: string
  uploadDate: string
  uploadedBy: string
  size: number
  recordCount?: number
}

export interface ExcelData {
  id: number
  fileName: string
  sheetName: string
  rowIndex: number
  data: Record<string, unknown>
  createdDate: string
  modifiedDate?: string
  version: number
  modifiedBy?: string
}

export interface Sheet {
  name: string
  rowCount: number
}

// Update/Create Types
export interface ExcelDataUpdate {
  id: number
  data: Record<string, unknown>
  modifiedBy?: string
}

export interface BulkUpdate {
  updates: ExcelDataUpdate[]
  modifiedBy?: string
}

export interface AddRowRequest {
  fileName: string
  sheetName: string
  rowData: Record<string, unknown>
  addedBy?: string
}

// Comparison Types
export interface ComparisonResult {
  comparisonId: string
  file1Name: string
  file2Name: string
  comparisonDate: string
  differences: Difference[]
  summary: ComparisonSummary
}

export interface Difference {
  rowIndex: number
  columnName: string
  oldValue: unknown
  newValue: unknown
  type: DifferenceType
}

export type DifferenceType = 'Modified' | 'Added' | 'Deleted'

export interface ComparisonSummary {
  totalRows: number
  modifiedRows: number
  addedRows: number
  deletedRows: number
  unchangedRows: number
}

export interface CompareFilesRequest {
  fileName1: string
  fileName2: string
  sheetName?: string
}

export interface CompareVersionsRequest {
  fileName: string
  version1Date: string
  version2Date: string
  sheetName?: string
}

// Change History Types
export interface ChangeRecord {
  id: number
  fileName: string
  sheetName: string
  rowIndex: number
  columnName: string
  oldValue: string
  newValue: string
  changeType: ChangeType
  changeDate: string
  changedBy: string
  version: number
}

export type ChangeType = 'Insert' | 'Update' | 'Delete'

// UI Component Types
export type ActivePage = 'dashboard' | 'files' | 'data' | 'comparison' | 'history'

export interface MenuItem {
  id: ActivePage
  label: string
  icon: string
  description: string
}

// Filter Types
export interface DateFilter {
  fromDate: string
  toDate: string
}

export interface DataFilter {
  sheetName?: string
  page: number
  pageSize: number
}

// Statistics Types
export interface DataStatistics {
  totalRows: number
  totalColumns: number
  lastModified: string
  modifiedBy: string
  version: number
}

// Export Types
export interface ExcelExportRequest {
  fileName: string
  sheetName?: string
  rowIds?: number[]
  includeModificationHistory: boolean
}

// Additional Comparison Types
export interface ComparisonFile {
  fileName: string
  uploadDate: string
  uploadedBy: string
  version: number
}

export interface ComparisonVersion {
  id: number
  fileName: string
  version: number
  uploadDate: string
  uploadedBy: string
  size: number
}

export interface ComparisonRequest {
  fileName1: string
  fileName2: string
  sheetName?: string
  settings?: ComparisonSettings
}

export interface ComparisonSettings {
  ignoreCase: boolean
  ignoreWhitespace: boolean
  compareFormulas: boolean
  compareFormats: boolean
  highlightChanges: boolean
  includeRowNumbers: boolean
}

export interface ExcelDataDifference {
  rowIndex: number
  columnName: string
  oldValue: unknown
  newValue: unknown
  type: DifferenceType
  fileName1: string
  fileName2: string
  confidence: number
}

export interface FileComparisonSummary {
  comparisonId: string
  fileName1: string
  fileName2: string
  totalDifferences: number
  addedRows: number
  deletedRows: number
  modifiedRows: number
  comparisonDate: string
  comparedBy: string
}

// Change History Types
export interface ChangeHistoryEntry {
  id: number
  fileName: string
  operation: 'CREATE' | 'UPDATE' | 'DELETE' | 'UPLOAD' | 'COMPARE'
  dataId?: number
  sheetName?: string
  rowIndex?: number
  columnName?: string
  oldValue?: string
  newValue?: string
  userId: string
  userName: string
  timestamp: string
  description?: string
  metadata?: Record<string, unknown>
}

export interface ChangeHistoryFilter {
  fileName?: string
  operation?: string
  userId?: string
  startDate?: Date
  endDate?: Date
  sheetName?: string
  dataId?: number
}

export interface ChangeHistoryStats {
  totalChanges: number
  operationCounts: Record<string, number>
  userCounts: Record<string, number>
  fileCounts: Record<string, number>
  dailyActivity: Array<{
    date: string
    count: number
  }>
  topUsers: Array<{
    userId: string
    userName: string
    changeCount: number
  }>
  topFiles: Array<{
    fileName: string
    changeCount: number
  }>
}

export interface PaginatedResponse<T> {
  data: T[]
  totalCount: number
  page: number
  pageSize: number
  totalPages: number
  hasNextPage: boolean
  hasPreviousPage: boolean
}
