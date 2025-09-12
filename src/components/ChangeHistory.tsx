import React, { useState, useEffect, useCallback } from 'react'
import { API_CONFIG } from '../services/config'
import { diagnoseExcelError, testSpecificFile } from '../utils/diagnoseExcel'

interface ChangeHistoryProps {
  selectedFile: string | null
}

interface ChangeRecord {
  id: number
  fileName: string
  sheetName: string
  rowIndex: number
  columnName: string
  oldValue: string
  newValue: string
  changeType: 'Insert' | 'Update' | 'Delete'
  changeDate: string
  changedBy: string
  version: number
}

const ChangeHistory: React.FC<ChangeHistoryProps> = ({ selectedFile }) => {
  const [changes, setChanges] = useState<ChangeRecord[]>([])
  const [loading, setLoading] = useState(false)
  const [dateFilter, setDateFilter] = useState({
    fromDate: '',
    toDate: ''
  })
  const [selectedSheet, setSelectedSheet] = useState('')
  const [sheets, setSheets] = useState<string[]>([])

  const API_BASE = API_CONFIG.BASE_URL

  const fetchSheets = useCallback(async () => {
    if (!selectedFile) return
    
    try {
      console.log('🔍 Fetching sheets for file:', selectedFile)
      const response = await fetch(`${API_BASE}/excel/sheets/${encodeURIComponent(selectedFile)}`)
      console.log('📡 Sheets response status:', response.status)
      
      if (!response.ok) {
        const errorText = await response.text()
        console.error('❌ Sheets fetch failed:', response.status, errorText)
        throw new Error(`Failed to fetch sheets: ${response.status} ${errorText}`)
      }
      
      const result = await response.json()
      console.log('📋 Sheets result:', result)
      
      if (result.success) {
        setSheets(result.data.map((sheet: { name: string }) => sheet.name))
      } else {
        console.warn('⚠️ Sheets fetch unsuccessful:', result.message)
      }
    } catch (error) {
      console.error('💥 Error fetching sheets:', error)
    }
  }, [selectedFile, API_BASE])

  const fetchChanges = useCallback(async () => {
    if (!selectedFile) return
    
    setLoading(true)
    try {
      console.log('🔍 Fetching changes for file:', selectedFile)
      
      let url = `${API_BASE}/comparison/changes/${encodeURIComponent(selectedFile)}`
      const params = new URLSearchParams()
      
      if (dateFilter.fromDate) {
        params.append('fromDate', dateFilter.fromDate)
      }
      if (dateFilter.toDate) {
        params.append('toDate', dateFilter.toDate)
      }
      if (selectedSheet) {
        params.append('sheetName', selectedSheet)
      }
      
      if (params.toString()) {
        url += '?' + params.toString()
      }

      console.log('🔗 Changes URL:', url)
      
      const response = await fetch(url)
      console.log('📡 Changes response status:', response.status)
      
      if (!response.ok) {
        const errorText = await response.text()
        console.error('❌ Changes fetch failed:', response.status, errorText)
        
        // Provide specific error messages based on status code
        if (response.status === 500) {
          throw new Error(`Sunucu hatası: Değişiklik geçmişi işlenirken hata oluştu. Dosya: "${selectedFile}"`)
        } else if (response.status === 404) {
          throw new Error(`Dosya bulunamadı: "${selectedFile}" için değişiklik geçmişi bulunamıyor.`)
        } else {
          throw new Error(`HTTP ${response.status}: ${errorText}`)
        }
      }
      
      const result = await response.json()
      console.log('📋 Changes result:', result)
      
      if (result.success) {
        setChanges(result.data)
      } else {
        console.warn('⚠️ Changes fetch unsuccessful:', result.message)
        setChanges([])
      }
    } catch (error) {
      console.error('💥 Error fetching changes:', error)
      setChanges([])
      
      // You might want to show this error to the user
      // setError(error.message)
    } finally {
      setLoading(false)
    }
  }, [selectedFile, API_BASE, dateFilter, selectedSheet])

  useEffect(() => {
    if (selectedFile) {
      fetchChanges()
      fetchSheets()
    }
  }, [selectedFile, fetchChanges, fetchSheets])

  useEffect(() => {
    if (selectedFile) {
      fetchChanges()
    }
  }, [dateFilter, selectedSheet, fetchChanges, selectedFile])

  const getChangeTypeColor = (type: string) => {
    switch (type) {
      case 'Insert': return '#10b981' // green
      case 'Delete': return '#ef4444' // red
      case 'Update': return '#f59e0b' // yellow
      default: return '#6b7280' // gray
    }
  }

  const getChangeTypeIcon = (type: string) => {
    switch (type) {
      case 'Insert': return '➕'
      case 'Delete': return '➖'
      case 'Update': return '✏️'
      default: return '❓'
    }
  }

  const formatDate = (dateString: string) => {
    const date = new Date(dateString)
    return date.toLocaleDateString('tr-TR') + ' ' + date.toLocaleTimeString('tr-TR')
  }

  const applyFilters = () => {
    fetchChanges()
  }

  const clearFilters = () => {
    setDateFilter({ fromDate: '', toDate: '' })
    setSelectedSheet('')
    // fetchChanges will be called automatically by useEffect when filters change
  }

  if (!selectedFile) {
    return (
      <div className="change-history">
  <h2 style={{ color: '#111', fontWeight: 'bold' }}>Değişiklik Geçmişi</h2>
        <div className="no-file-selected">
          <p>Lütfen önce Dosya Yönetimi sayfasından bir dosya seçin.</p>
        </div>
      </div>
    )
  }

  return (
    <div className="change-history">
  <h2 style={{ color: '#111', fontWeight: 'bold' }}>Değişiklik Geçmişi: {selectedFile}</h2>
      
      {/* Filters */}
      <div className="filters-section">
        <div className="filters-grid">
          <div className="form-group">
            <label htmlFor="from-date">Başlangıç Tarihi:</label>
            <input
              id="from-date"
              type="datetime-local"
              value={dateFilter.fromDate}
              onChange={(e) => setDateFilter(prev => ({ ...prev, fromDate: e.target.value }))}
              className="form-control"
            />
          </div>

          <div className="form-group">
            <label htmlFor="to-date">Bitiş Tarihi:</label>
            <input
              id="to-date"
              type="datetime-local"
              value={dateFilter.toDate}
              onChange={(e) => setDateFilter(prev => ({ ...prev, toDate: e.target.value }))}
              className="form-control"
            />
          </div>

          <div className="form-group">
            <label htmlFor="sheet-filter">Sayfa:</label>
            <select 
              id="sheet-filter"
              value={selectedSheet} 
              onChange={(e) => setSelectedSheet(e.target.value)}
              className="form-control"
            >
              <option value="">Tüm sayfalar</option>
              {sheets.map((sheetName) => (
                <option key={sheetName} value={sheetName}>{sheetName}</option>
              ))}
            </select>
          </div>
        </div>

        <div className="filter-actions">
          <button 
            className="btn btn-primary"
            onClick={applyFilters}
            disabled={loading}
          >
            Filtrele
          </button>
          <button 
            className="btn btn-secondary"
            onClick={clearFilters}
            disabled={loading}
          >
            Temizle
          </button>
          <button 
            className="btn btn-primary"
            onClick={() => diagnoseExcelError()}
            disabled={loading}
            style={{ marginLeft: '10px', backgroundColor: '#ffb347', color: '#fff8f0' }}
          >
            Diagnoz Çalıştır
          </button>
          {selectedFile && (
            <button 
              className="btn btn-primary"
              onClick={() => testSpecificFile(selectedFile)}
              disabled={loading}
              style={{ marginLeft: '5px', backgroundColor: '#ffb347', color: '#fff8f0' }}
            >
              Bu Dosyayı Test Et
            </button>
          )}
        </div>
      </div>

      {/* Changes List */}
      {loading ? (
        <div className="loading">
          <div className="spinner"></div>
        </div>
      ) : changes.length > 0 ? (
        <div className="changes-list">
          <h3>Değişiklikler ({changes.length})</h3>
          
          {/* Summary Stats */}
          <div className="change-stats">
            <div className="stat-item">
              <span className="stat-label">Toplam:</span>
              <span className="stat-value">{changes.length}</span>
            </div>
            <div className="stat-item">
              <span className="stat-label">Eklenen:</span>
              <span className="stat-value" style={{ color: '#10b981' }}>
                {changes.filter(c => c.changeType === 'Insert').length}
              </span>
            </div>
            <div className="stat-item">
              <span className="stat-label">Güncellenen:</span>
              <span className="stat-value" style={{ color: '#f59e0b' }}>
                {changes.filter(c => c.changeType === 'Update').length}
              </span>
            </div>
            <div className="stat-item">
              <span className="stat-label">Silinen:</span>
              <span className="stat-value" style={{ color: '#ef4444' }}>
                {changes.filter(c => c.changeType === 'Delete').length}
              </span>
            </div>
          </div>

          <div className="data-table">
            <table>
              <thead>
                <tr>
                  <th>Tip</th>
                  <th>Tarih</th>
                  <th>Sayfa</th>
                  <th>Satır</th>
                  <th>Sütun</th>
                  <th>Eski Değer</th>
                  <th>Yeni Değer</th>
                  <th>Değiştiren</th>
                  <th>Versiyon</th>
                </tr>
              </thead>
              <tbody>
                {changes.map((change) => (
                  <tr key={change.id}>
                    <td>
                      <span 
                        className="change-type"
                        style={{ 
                          color: getChangeTypeColor(change.changeType),
                          fontWeight: 'bold'
                        }}
                      >
                        {getChangeTypeIcon(change.changeType)} {change.changeType}
                      </span>
                    </td>
                    <td>{formatDate(change.changeDate)}</td>
                    <td>{change.sheetName}</td>
                    <td>{change.rowIndex}</td>
                    <td>{change.columnName}</td>
                    <td>
                      {change.changeType === 'Insert' ? '-' : (change.oldValue || '')}
                    </td>
                    <td>
                      {change.changeType === 'Delete' ? '-' : (change.newValue || '')}
                    </td>
                    <td>{change.changedBy}</td>
                    <td>v{change.version}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      ) : (
        <div className="no-changes">
          <p>Seçili kriterlere göre değişiklik bulunamadı.</p>
          <p>Farklı tarih aralığı veya sayfa seçmeyi deneyin.</p>
        </div>
      )}
    </div>
  )
}

export default ChangeHistory
