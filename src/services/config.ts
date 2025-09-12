// API Configuration
export const API_CONFIG = {
  BASE_URL: 'http://localhost:5002/api', // HTTP endpoint kullan (HTTPS sertifika sorunları için)
  TIMEOUT: 30000, // 30 saniye timeout
  HEADERS: {
    'Content-Type': 'application/json',
  }
}

// API endpoint'leri
export const API_ENDPOINTS = {
  // Excel Controller
  EXCEL: {
    TEST: '/excel/test',
    FILES: '/excel/files',
    UPLOAD: '/excel/upload',
    READ: (fileName: string) => `/excel/read/${encodeURIComponent(fileName)}`,
    DATA: (fileName: string) => `/excel/data/${encodeURIComponent(fileName)}`,
    UPDATE_DATA: '/excel/data',
    BULK_UPDATE: '/excel/data/bulk',
    ADD_ROW: '/excel/data',
    DELETE_DATA: (id: number) => `/excel/data/${id}`,
    DELETE_FILE: (fileName: string) => `/excel/files/${encodeURIComponent(fileName)}`,
    EXPORT: '/excel/export',
    SHEETS: (fileName: string) => `/excel/sheets/${encodeURIComponent(fileName)}`,
    STATISTICS: (fileName: string) => `/excel/statistics/${encodeURIComponent(fileName)}`,
  },
  
  // Comparison Controller
  COMPARISON: {
    FILES: '/comparison/files',
    VERSIONS: (fileName: string) => `/comparison/versions/${encodeURIComponent(fileName)}`,
    COMPARE: '/comparison/compare',
    COMPARE_VERSIONS: (fileName: string) => `/comparison/compare-versions/${encodeURIComponent(fileName)}`,
    DIFFERENCES: (fileName: string, versionId1: number, versionId2: number) => 
      `/comparison/differences/${encodeURIComponent(fileName)}/${versionId1}/${versionId2}`,
    SUMMARY: (comparisonId: string) => `/comparison/summary/${encodeURIComponent(comparisonId)}`,
    EXPORT: (comparisonId: string) => `/comparison/export/${encodeURIComponent(comparisonId)}`,
    SAVE_TEMPLATE: '/comparison/templates',
    TEMPLATES: '/comparison/templates',
    CELL_DIFFERENCES: (fileName: string, versionId1: number, versionId2: number) => 
      `/comparison/cell-differences/${encodeURIComponent(fileName)}/${versionId1}/${versionId2}`
  },

  // History/Change Tracking
  HISTORY: {
    CHANGES: '/history/changes',
    FILE_HISTORY: (fileName: string) => `/history/file/${encodeURIComponent(fileName)}`,
    DATA_HISTORY: (dataId: number) => `/history/data/${dataId}`,
    STATS: '/history/stats',
    CHANGE_DETAILS: (changeId: number) => `/history/change/${changeId}`,
    REVERT: (changeId: number) => `/history/revert/${changeId}`,
    EXPORT: '/history/export',
    USER_ACTIVITY: '/history/user-activity',
    SEARCH: '/history/search'
  },

  // Macro Controller
  MACRO: {
  QUICK_SEARCH_MAKRO_ONLY: (documentNumber: string) => `/macro/quick-search-makro/${encodeURIComponent(documentNumber)}`,
    SEARCH_IN_HESAP: (documentNumber: string) => `/macro/search-in-hesap/${encodeURIComponent(documentNumber)}`,
    UPDATE_DOCUMENT_DATA: '/macro/update-document-data',
    BULK_UPDATE_DOCUMENT: '/macro/bulk-update-document',
    DOCUMENT_STATISTICS: (documentNumber: string) => `/macro/document-statistics/${encodeURIComponent(documentNumber)}`,
    AVAILABLE_FILES: '/macro/available-files'
  }
}

export default API_CONFIG
