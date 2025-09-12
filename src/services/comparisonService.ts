import { API_CONFIG, API_ENDPOINTS } from './config'
import type { 
  ApiResponse, 
  ComparisonFile, 
  ComparisonVersion, 
  ComparisonResult, 
  ComparisonRequest, 
  ComparisonSettings, 
  ExcelDataDifference,
  FileComparisonSummary
} from '../types'

class ComparisonService {
  private async fetchWithTimeout(url: string, options: RequestInit = {}): Promise<Response> {
    const controller = new AbortController()
    const timeoutId = setTimeout(() => controller.abort(), API_CONFIG.TIMEOUT)
    
    try {
      const response = await fetch(url, {
        ...options,
        signal: controller.signal,
        headers: {
          ...API_CONFIG.HEADERS,
          ...options.headers,
        },
      })
      clearTimeout(timeoutId)
      return response
    } catch (error) {
      clearTimeout(timeoutId)
      throw error
    }
  }

  // Get all files that can be compared
  async getFiles(): Promise<ApiResponse<ComparisonFile[]>> {
    try {
      const response = await this.fetchWithTimeout(`${API_CONFIG.BASE_URL}${API_ENDPOINTS.COMPARISON.FILES}`)
      return await response.json()
    } catch (error) {
      console.error('Failed to fetch comparison files:', error)
      throw new Error('Karşılaştırma dosyaları yüklenirken hata oluştu')
    }
  }

  // Get all versions of a file
  async getVersions(fileName: string): Promise<ApiResponse<ComparisonVersion[]>> {
    try {
      const response = await this.fetchWithTimeout(
        `${API_CONFIG.BASE_URL}${API_ENDPOINTS.COMPARISON.VERSIONS(fileName)}`
      )
      return await response.json()
    } catch (error) {
      console.error('Failed to fetch file versions:', error)
      throw new Error('Dosya sürümleri yüklenirken hata oluştu')
    }
  }

  // Compare two files
  async compareFiles(comparisonRequest: ComparisonRequest): Promise<ApiResponse<ComparisonResult>> {
    try {
      const response = await this.fetchWithTimeout(
        `${API_CONFIG.BASE_URL}${API_ENDPOINTS.COMPARISON.COMPARE}`,
        {
          method: 'POST',
          body: JSON.stringify(comparisonRequest),
        }
      )
      return await response.json()
    } catch (error) {
      console.error('Failed to compare files:', error)
      throw new Error('Dosya karşılaştırması sırasında hata oluştu')
    }
  }

  // Compare file versions (older vs newer)
  async compareVersions(
    fileName: string, 
    oldVersionId: number, 
    newVersionId: number,
    settings?: ComparisonSettings
  ): Promise<ApiResponse<ComparisonResult>> {
    try {
      const response = await this.fetchWithTimeout(
        `${API_CONFIG.BASE_URL}${API_ENDPOINTS.COMPARISON.COMPARE_VERSIONS(fileName)}`,
        {
          method: 'POST',
          body: JSON.stringify({
            oldVersionId,
            newVersionId,
            settings
          }),
        }
      )
      return await response.json()
    } catch (error) {
      console.error('Failed to compare versions:', error)
      throw new Error('Sürüm karşılaştırması sırasında hata oluştu')
    }
  }

  // Get differences in a specific range
  async getDifferences(
    fileName: string, 
    versionId1: number, 
    versionId2: number,
    sheetName?: string,
    startRow?: number,
    endRow?: number
  ): Promise<ApiResponse<ExcelDataDifference[]>> {
    try {
      const params = new URLSearchParams()
      
      if (sheetName) params.append('sheetName', sheetName)
      if (startRow !== undefined) params.append('startRow', startRow.toString())
      if (endRow !== undefined) params.append('endRow', endRow.toString())

      const response = await this.fetchWithTimeout(
        `${API_CONFIG.BASE_URL}${API_ENDPOINTS.COMPARISON.DIFFERENCES(fileName, versionId1, versionId2)}?${params}`
      )
      return await response.json()
    } catch (error) {
      console.error('Failed to fetch differences:', error)
      throw new Error('Farklılıklar yüklenirken hata oluştu')
    }
  }

  // Get comparison summary
  async getComparisonSummary(comparisonId: string): Promise<ApiResponse<FileComparisonSummary>> {
    try {
      const response = await this.fetchWithTimeout(
        `${API_CONFIG.BASE_URL}${API_ENDPOINTS.COMPARISON.SUMMARY(comparisonId)}`
      )
      return await response.json()
    } catch (error) {
      console.error('Failed to fetch comparison summary:', error)
      throw new Error('Karşılaştırma özeti yüklenirken hata oluştu')
    }
  }

  // Export comparison result
  async exportComparison(
    comparisonId: string, 
    format: 'excel' | 'json' | 'csv' = 'excel'
  ): Promise<Blob> {
    try {
      const response = await this.fetchWithTimeout(
        `${API_CONFIG.BASE_URL}${API_ENDPOINTS.COMPARISON.EXPORT(comparisonId)}?format=${format}`
      )
      
      if (!response.ok) {
        throw new Error('Export failed')
      }
      
      return await response.blob()
    } catch (error) {
      console.error('Failed to export comparison:', error)
      throw new Error('Karşılaştırma dışa aktarılırken hata oluştu')
    }
  }

  // Save comparison settings as template
  async saveComparisonTemplate(
    name: string, 
    description: string, 
    settings: ComparisonSettings
  ): Promise<ApiResponse> {
    try {
      const response = await this.fetchWithTimeout(
        `${API_CONFIG.BASE_URL}${API_ENDPOINTS.COMPARISON.SAVE_TEMPLATE}`,
        {
          method: 'POST',
          body: JSON.stringify({
            name,
            description,
            settings
          }),
        }
      )
      return await response.json()
    } catch (error) {
      console.error('Failed to save comparison template:', error)
      throw new Error('Karşılaştırma şablonu kaydedilirken hata oluştu')
    }
  }

  // Get saved comparison templates
  async getComparisonTemplates(): Promise<ApiResponse<ComparisonSettings[]>> {
    try {
      const response = await this.fetchWithTimeout(
        `${API_CONFIG.BASE_URL}${API_ENDPOINTS.COMPARISON.TEMPLATES}`
      )
      return await response.json()
    } catch (error) {
      console.error('Failed to fetch comparison templates:', error)
      throw new Error('Karşılaştırma şablonları yüklenirken hata oluştu')
    }
  }

  // Get detailed cell-level differences
  async getCellDifferences(
    fileName: string,
    versionId1: number,
    versionId2: number,
    sheetName: string,
    row: number,
    column: string
  ): Promise<ApiResponse<ExcelDataDifference>> {
    try {
      const response = await this.fetchWithTimeout(
        `${API_CONFIG.BASE_URL}${API_ENDPOINTS.COMPARISON.CELL_DIFFERENCES(fileName, versionId1, versionId2)}?sheetName=${encodeURIComponent(sheetName)}&row=${row}&column=${column}`
      )
      return await response.json()
    } catch (error) {
      console.error('Failed to fetch cell differences:', error)
      throw new Error('Hücre farklılıkları yüklenirken hata oluştu')
    }
  }
}

// Singleton instance
export const comparisonService = new ComparisonService()
export default comparisonService
