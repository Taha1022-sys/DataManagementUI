import { API_CONFIG, API_ENDPOINTS } from './config'
import type { 
  ApiResponse, 
  ChangeHistoryEntry, 
  ChangeHistoryFilter, 
  ChangeHistoryStats,
  PaginatedResponse
} from '../types'

class HistoryService {
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

  // Get change history with filters and pagination
  async getChangeHistory(
    page: number = 1,
    pageSize: number = 50,
    filters?: ChangeHistoryFilter
  ): Promise<ApiResponse<PaginatedResponse<ChangeHistoryEntry>>> {
    try {
      const params = new URLSearchParams({
        page: page.toString(),
        pageSize: pageSize.toString(),
      })

      if (filters) {
        if (filters.fileName) params.append('fileName', filters.fileName)
        if (filters.operation) params.append('operation', filters.operation)
        if (filters.userId) params.append('userId', filters.userId)
        if (filters.startDate) params.append('startDate', filters.startDate.toISOString())
        if (filters.endDate) params.append('endDate', filters.endDate.toISOString())
        if (filters.sheetName) params.append('sheetName', filters.sheetName)
      }

      const response = await this.fetchWithTimeout(
        `${API_CONFIG.BASE_URL}${API_ENDPOINTS.HISTORY.CHANGES}?${params}`
      )
      return await response.json()
    } catch (error) {
      console.error('Failed to fetch change history:', error)
      throw new Error('Değişiklik geçmişi yüklenirken hata oluştu')
    }
  }

  // Get change history for a specific file
  async getFileHistory(
    fileName: string,
    page: number = 1,
    pageSize: number = 50
  ): Promise<ApiResponse<PaginatedResponse<ChangeHistoryEntry>>> {
    try {
      const params = new URLSearchParams({
        page: page.toString(),
        pageSize: pageSize.toString(),
      })

      const response = await this.fetchWithTimeout(
        `${API_CONFIG.BASE_URL}${API_ENDPOINTS.HISTORY.FILE_HISTORY(fileName)}?${params}`
      )
      return await response.json()
    } catch (error) {
      console.error('Failed to fetch file history:', error)
      throw new Error('Dosya geçmişi yüklenirken hata oluştu')
    }
  }

  // Get change history for a specific data entry
  async getDataHistory(
    dataId: number,
    page: number = 1,
    pageSize: number = 50
  ): Promise<ApiResponse<PaginatedResponse<ChangeHistoryEntry>>> {
    try {
      const params = new URLSearchParams({
        page: page.toString(),
        pageSize: pageSize.toString(),
      })

      const response = await this.fetchWithTimeout(
        `${API_CONFIG.BASE_URL}${API_ENDPOINTS.HISTORY.DATA_HISTORY(dataId)}?${params}`
      )
      return await response.json()
    } catch (error) {
      console.error('Failed to fetch data history:', error)
      throw new Error('Veri geçmişi yüklenirken hata oluştu')
    }
  }

  // Get change history statistics
  async getHistoryStats(
    fileName?: string,
    startDate?: Date,
    endDate?: Date
  ): Promise<ApiResponse<ChangeHistoryStats>> {
    try {
      const params = new URLSearchParams()
      
      if (fileName) params.append('fileName', fileName)
      if (startDate) params.append('startDate', startDate.toISOString())
      if (endDate) params.append('endDate', endDate.toISOString())

      const response = await this.fetchWithTimeout(
        `${API_CONFIG.BASE_URL}${API_ENDPOINTS.HISTORY.STATS}?${params}`
      )
      return await response.json()
    } catch (error) {
      console.error('Failed to fetch history statistics:', error)
      throw new Error('Geçmiş istatistikleri yüklenirken hata oluştu')
    }
  }

  // Get specific change details
  async getChangeDetails(changeId: number): Promise<ApiResponse<ChangeHistoryEntry>> {
    try {
      const response = await this.fetchWithTimeout(
        `${API_CONFIG.BASE_URL}${API_ENDPOINTS.HISTORY.CHANGE_DETAILS(changeId)}`
      )
      return await response.json()
    } catch (error) {
      console.error('Failed to fetch change details:', error)
      throw new Error('Değişiklik detayları yüklenirken hata oluştu')
    }
  }

  // Revert a specific change
  async revertChange(
    changeId: number, 
    revertedBy: string, 
    reason?: string
  ): Promise<ApiResponse> {
    try {
      const response = await this.fetchWithTimeout(
        `${API_CONFIG.BASE_URL}${API_ENDPOINTS.HISTORY.REVERT(changeId)}`,
        {
          method: 'POST',
          body: JSON.stringify({
            revertedBy,
            reason
          }),
        }
      )
      return await response.json()
    } catch (error) {
      console.error('Failed to revert change:', error)
      throw new Error('Değişiklik geri alınırken hata oluştu')
    }
  }

  // Export change history
  async exportHistory(
    filters?: ChangeHistoryFilter,
    format: 'excel' | 'json' | 'csv' = 'excel'
  ): Promise<Blob> {
    try {
      const params = new URLSearchParams({
        format
      })

      if (filters) {
        if (filters.fileName) params.append('fileName', filters.fileName)
        if (filters.operation) params.append('operation', filters.operation)
        if (filters.userId) params.append('userId', filters.userId)
        if (filters.startDate) params.append('startDate', filters.startDate.toISOString())
        if (filters.endDate) params.append('endDate', filters.endDate.toISOString())
        if (filters.sheetName) params.append('sheetName', filters.sheetName)
      }

      const response = await this.fetchWithTimeout(
        `${API_CONFIG.BASE_URL}${API_ENDPOINTS.HISTORY.EXPORT}?${params}`
      )
      
      if (!response.ok) {
        throw new Error('Export failed')
      }
      
      return await response.blob()
    } catch (error) {
      console.error('Failed to export history:', error)
      throw new Error('Geçmiş dışa aktarılırken hata oluştu')
    }
  }

  // Get user activity summary
  async getUserActivity(
    userId: string,
    startDate?: Date,
    endDate?: Date
  ): Promise<ApiResponse<ChangeHistoryStats>> {
    try {
      const params = new URLSearchParams({
        userId
      })
      
      if (startDate) params.append('startDate', startDate.toISOString())
      if (endDate) params.append('endDate', endDate.toISOString())

      const response = await this.fetchWithTimeout(
        `${API_CONFIG.BASE_URL}${API_ENDPOINTS.HISTORY.USER_ACTIVITY}?${params}`
      )
      return await response.json()
    } catch (error) {
      console.error('Failed to fetch user activity:', error)
      throw new Error('Kullanıcı aktivitesi yüklenirken hata oluştu')
    }
  }

  // Search in change history
  async searchHistory(
    searchTerm: string,
    page: number = 1,
    pageSize: number = 50
  ): Promise<ApiResponse<PaginatedResponse<ChangeHistoryEntry>>> {
    try {
      const params = new URLSearchParams({
        q: searchTerm,
        page: page.toString(),
        pageSize: pageSize.toString(),
      })

      const response = await this.fetchWithTimeout(
        `${API_CONFIG.BASE_URL}${API_ENDPOINTS.HISTORY.SEARCH}?${params}`
      )
      return await response.json()
    } catch (error) {
      console.error('Failed to search history:', error)
      throw new Error('Geçmiş araması sırasında hata oluştu')
    }
  }
}

// Singleton instance
export const historyService = new HistoryService()
export default historyService
