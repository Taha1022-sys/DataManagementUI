import React, { useState, useEffect } from 'react'
import { excelService } from '../services'
import { runAllTests } from '../utils/testBackend'
import { API_CONFIG } from '../services/config'
import type { ExcelFile } from '../types'

type ActivePage = 'dashboard' | 'files' | 'data' | 'comparison' | 'history' | 'macro'

interface DashboardProps {
  onNavigate: (page: ActivePage) => void
}

interface DashboardStats {
  totalFiles: number
  totalRecords: number
  lastUpload: string
  activeUsers: number
}

const Dashboard: React.FC<DashboardProps> = ({ onNavigate }) => {
  const [stats, setStats] = useState<DashboardStats>({
    totalFiles: 0,
    totalRecords: 0,
    lastUpload: 'Henüz yükleme yok',
    activeUsers: 1
  })
  const [recentFiles, setRecentFiles] = useState<ExcelFile[]>([])
  const [loading, setLoading] = useState(true)
  const [testingConnection, setTestingConnection] = useState(false)
  const [connectionStatus, setConnectionStatus] = useState<'unknown' | 'connected' | 'disconnected'>('unknown')

  useEffect(() => {
    loadDashboardData()
  }, [])

  const loadDashboardData = async () => {
    try {
      setLoading(true)
      
      // Test backend connection first
      try {
        await excelService.testConnection()
        setConnectionStatus('connected')
      } catch {
        setConnectionStatus('disconnected')
        setLoading(false)
        return
      }

      // Load files
      const filesResponse = await excelService.getFiles()
      if (filesResponse.success && filesResponse.data) {
        const files = filesResponse.data
        setRecentFiles(files.slice(0, 3)) // Show last 3 files
        
        // Calculate stats
        const totalRecords = files.reduce((sum, file) => sum + (file.recordCount || 0), 0)
        const lastUpload = files.length > 0 
          ? new Date(files[0].uploadDate).toLocaleDateString('tr-TR')
          : 'Henüz yükleme yok'
        
        setStats({
          totalFiles: files.length,
          totalRecords,
          lastUpload,
          activeUsers: 1
        })
      }
    } catch (error) {
      console.error('Dashboard data loading failed:', error)
      setConnectionStatus('disconnected')
    } finally {
      setLoading(false)
    }
  }

  const handleTestConnection = async () => {
    setTestingConnection(true)
    try {
      await runAllTests()
      await loadDashboardData() // Reload data after test
    } catch (error) {
      console.error('Connection test failed:', error)
    } finally {
      setTestingConnection(false)
    }
  }

  return (
    <div className="dashboard">
      <h2>Dashboard</h2>
      
      {/* Connection Status */}
      <div className={`connection-status ${connectionStatus}`}>
        <span className="status-indicator"></span>
        <span>
          Backend: {
            connectionStatus === 'connected' ? 'Bağlı ✅' :
            connectionStatus === 'disconnected' ? 'Bağlantı Yok ❌' :
            'Test Ediliyor... ⏳'
          }
        </span>
        <button 
          onClick={handleTestConnection}
          disabled={testingConnection}
          className="test-button"
        >
          {testingConnection ? 'Test Ediliyor...' : 'Bağlantıyı Test Et'}
        </button>
      </div>

      {connectionStatus === 'disconnected' ? (
        <div className="connection-error">
          <h3>Backend Sunucusuna Bağlanılamıyor</h3>
          <p>Lütfen backend sunucusunun çalıştığından emin olun:</p>
          <ul>
            <li>Backend URL: {API_CONFIG.BASE_URL}</li>
            <li>CORS ayarları yapılandırılmalı</li>
            <li>SSL sertifikası kabul edilmeli</li>
          </ul>
        </div>
      ) : loading ? (
        <div>Yükleniyor...</div>
      ) : (
        <>
          {/* Quick Stats */}
          <div className="quick-stats">
            <div className="stat-card">
              <div className="stat-value">{stats.totalFiles}</div>
              <div className="stat-label">Toplam Dosya</div>
            </div>
            <div className="stat-card">
              <div className="stat-value">{stats.totalRecords.toLocaleString('tr-TR')}</div>
              <div className="stat-label">Toplam Kayıt</div>
            </div>
            <div className="stat-card">
              <div className="stat-value">{stats.lastUpload}</div>
              <div className="stat-label">Son Yükleme</div>
            </div>
            <div className="stat-card">
              <div className="stat-value">{stats.activeUsers}</div>
              <div className="stat-label">Aktif Kullanıcı</div>
            </div>
          </div>

          {/* Recent Files */}
          {recentFiles.length > 0 && (
            <div className="recent-files-section">
              <h3>Son Yüklenen Dosyalar</h3>
              <div className="recent-files-list">
                {recentFiles.map((file, index) => (
                  <div key={index} className="recent-file-item">
                    <span className="file-icon">📄</span>
                    <div className="file-details">
                      <strong>{file.fileName}</strong>
                      <small>{file.uploadedBy} • {new Date(file.uploadDate).toLocaleDateString('tr-TR')}</small>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}
        </>
      )}

      {/* Quick Actions */}
      <div className="dashboard-grid">
        <div className="dashboard-card" onClick={() => onNavigate('files')}>
          <div className="icon">📁</div>
          <h3>Dosya Yönetimi</h3>
          <p>Excel dosyalarını yükleyin, görüntüleyin ve yönetin. Dosya listesi, yükleme ve temel işlemler.</p>
        </div>

        <div className="dashboard-card" onClick={() => onNavigate('data')}>
          <div className="icon">📋</div>
          <h3>Veri Görüntüleme</h3> 
          <p>Excel verilerini detaylı olarak inceleyin. Satır bazında düzenleme, ekleme ve silme işlemleri.</p>
        </div>

        <div className="dashboard-card" onClick={() => onNavigate('comparison')}>
          <div className="icon">🔍</div>
          <h3>Veri Karşılaştırma</h3>
          <p>Farklı Excel dosyalarını veya aynı dosyanın versiyonlarını karşılaştırın.</p>
        </div>

        <div className="dashboard-card" onClick={() => onNavigate('history')}>
          <div className="icon">📈</div>
          <h3>Değişiklik Geçmişi</h3>
          <p>Verilerde yapılan tüm değişiklikleri takip edin ve geçmişi görüntüleyin.</p>
        </div>

        <div className="dashboard-card" onClick={() => onNavigate('macro')}>
          <div className="icon">🎛️</div>
          <h3>Macro Controller</h3>
          <p>Excel ve veri yönetimi için makro işlemler. Detaylı arama ve düzenleme için tıklayın.</p>
        </div>
      </div>
    </div>
  )
}

export default Dashboard
