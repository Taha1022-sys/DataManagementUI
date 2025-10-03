import React, { useState, useEffect } from 'react'
import { excelService } from '../services'
import macroService from '../services/macroService'
import currencyService from '../services/currencyService'
import type { ExcelData, Sheet } from '../types'
import type { MacroData } from '../services/macroService'
import { StockCalculator, COLUMN_NAMES } from '../utils/stockCalculations'

interface DataViewerProps {
  selectedFile: string | null
}

const DataViewer: React.FC<DataViewerProps> = ({ selectedFile }) => {
  const [data, setData] = useState<ExcelData[]>([])
  const [sheets, setSheets] = useState<Sheet[]>([])
  const [selectedSheet, setSelectedSheet] = useState<string>('')
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [success, setSuccess] = useState<string | null>(null)
  const [page, setPage] = useState(1)
  const [pageSize] = useState(50)
  const [editingRow, setEditingRow] = useState<number | null>(null)
  const [editData, setEditData] = useState<Record<string, string | number>>({})
  const [totalRows, setTotalRows] = useState<number | null>(null)
  const [totalPages, setTotalPages] = useState<number>(1)
  
  // Dosya numarası filtreleme için yeni state'ler
  const [documentNumberFilter, setDocumentNumberFilter] = useState<string>('')
  const [filteredData, setFilteredData] = useState<MacroData[]>([])
  const [isFiltering, setIsFiltering] = useState<boolean>(false)
  const [filterError, setFilterError] = useState<string | null>(null)

  // Döviz kuru modal'ı için state'ler
  const [showCurrencyModal, setShowCurrencyModal] = useState<boolean>(false)
  const [manualCurrencyRates, setManualCurrencyRates] = useState<Record<string, number> | null>(null)
  const [currencyFormData, setCurrencyFormData] = useState<Record<string, string>>({
    USD: '',
    EUR: '',
    GBP: '',
    JPY: ''
  })

  const clearMessages = () => {
    setError(null)
    setSuccess(null)
  }

  // Dosya numarası ile filtreleme fonksiyonu
  const handleDocumentNumberFilter = async (documentNumber: string) => {
    if (!documentNumber.trim()) {
      // Boş ise filtrelemeyi temizle ve normal veriyi göster
      setFilteredData([])
      setIsFiltering(false)
      setFilterError(null)
      return
    }

    // Sadece hedef dosyalar için filtreleme yap
    const targetFiles = [
  'gerceklesenmakrodata_20251003204545.xlsx',
      'gerceklesenhesap_20251003204832.xlsx'
    ]

    if (!selectedFile || !targetFiles.includes(selectedFile)) {
      setFilterError('Bu dosya için dosya numarası filtresi kullanılamaz')
      return
    }

    setIsFiltering(true)
    setFilterError(null)
    
    try {
      let results: MacroData[] = []
      
  if (selectedFile === 'gerceklesenmakrodata_20251003204545.xlsx') {
        results = await macroService.quickSearchMakroOnly(documentNumber)
      } else if (selectedFile === 'gerceklesenhesap_20251003204832.xlsx') {
        results = await macroService.searchInHesap(documentNumber)
      }
      
      console.log('📊 Filtrelenmiş veri (filtreleme öncesi):', results)
      
      // Column 7'de "Mamul" olan kayıtları filtrele (çıkar)
      const filteredResults = results.filter((item) => {
        let column7Value = '';
        
        // Column 7 değerini al
        if (item.data && typeof item.data === 'object') {
          const allKeys = Object.keys(item.data);
          const column7Key = allKeys[6]; // Column 7 = index 6
          if (column7Key) {
            column7Value = String(item.data[column7Key] || '').trim();
          }
        } else {
          const allKeys = Object.keys(item).filter(key => !['id', 'fileName', 'sheetName', 'rowIndex'].includes(key));
          const column7Key = allKeys[6]; // Column 7 = index 6
          if (column7Key) {
            column7Value = String(item[column7Key] || '').trim();
          }
        }
        
        // "Mamul" içeren kayıtları filtrele
        return !column7Value.toLowerCase().includes('mamul');
      });
      
      console.log(`📊 Filtreleme sonucu: ${results.length} kayıt bulundu, ${filteredResults.length} kayıt gösteriliyor (Mamul kayıtları filtrelendi)`);
      
      if (filteredResults.length > 0) {
        console.log('📋 İlk kayıt yapısı:', filteredResults[0])
        console.log('🔑 Kullanılabilir anahtarlar:', Object.keys(filteredResults[0]))
        if (filteredResults[0].data) {
          console.log('📁 Data objesi anahtarları:', Object.keys(filteredResults[0].data))
          console.log('💾 Data objesi içeriği:', filteredResults[0].data)
        }
      }
      setFilteredData(filteredResults)
      
      if (filteredResults.length === 0) {
        setFilterError(`Dosya numarası "${documentNumber}" için veri bulunamadı (Mamul kayıtları filtrelendi)`)
      }
    } catch (error) {
      setFilterError('Filtreleme sırasında hata oluştu: ' + (error as Error).message)
      setFilteredData([])
    } finally {
      setIsFiltering(false)
    }
  }

  // Filtreyi temizleme fonksiyonu
  const clearFilter = () => {
    setDocumentNumberFilter('')
    setFilteredData([])
    setIsFiltering(false)
    setFilterError(null)
  }

  // Döviz kuru modal'ı fonksiyonları
  const openCurrencyModal = () => {
    setShowCurrencyModal(true)
  }

  const closeCurrencyModal = () => {
    setShowCurrencyModal(false)
    // Form verilerini temizle
    setCurrencyFormData({
      USD: '',
      EUR: '',
      GBP: '',
      JPY: ''
    })
  }

  const handleCurrencyInputChange = (currency: string, value: string) => {
    setCurrencyFormData(prev => ({
      ...prev,
      [currency]: value
    }))
  }

  const saveCurrencyRates = () => {
    // Form verilerini number'a çevir ve validate et
    const rates: Record<string, number> = {}
    let hasValidRate = false

    Object.entries(currencyFormData).forEach(([currency, value]) => {
      const numValue = parseFloat(value.replace(',', '.'))
      if (!isNaN(numValue) && numValue > 0) {
        rates[currency] = numValue
        hasValidRate = true
      }
    })

    if (!hasValidRate) {
      setError('En az bir geçerli döviz kuru giriniz')
      return
    }

    // Manuel kurları ayarla
    currencyService.setManualRates(rates)
    setManualCurrencyRates(rates)
    setSuccess('✅ Manuel döviz kurları başarıyla ayarlandı! Hesaplamalar bu kurları kullanacak.')
    closeCurrencyModal()
  }

  const clearManualRates = () => {
    currencyService.clearManualRates()
    setManualCurrencyRates(null)
    setSuccess('✅ Manuel döviz kurları temizlendi! API kurları kullanılacak.')
  }

  const shouldShowCurrencyButton = () => {
    return selectedFile === 'gerceklesenmakrodata_20251003204545.xlsx'
  }

  useEffect(() => {
  }, [data])

  useEffect(() => {
  }, [selectedSheet])

  useEffect(() => {
    setTimeout(() => {
    }, 2000)
  }, [])

  useEffect(() => {
  // ...debug log removed...
    if (selectedFile) {
      // Yeni dosya seçildiğinde selectedSheet'i sıfırla
      setSelectedSheet('')
      fetchSheets()
    }
  }, [selectedFile]) // eslint-disable-line react-hooks/exhaustive-deps

  useEffect(() => {
  // ...debug log removed...
    if (selectedFile && selectedSheet) {
      fetchData()
    }
  }, [selectedFile, selectedSheet, page]) // eslint-disable-line react-hooks/exhaustive-deps

  // Seçili sheet değiştiğinde veya dosya değiştiğinde istatistikleri çek
  useEffect(() => {
    if (selectedFile && selectedSheet) {
      // Sayfa resetle
      setPage(1)
      fetchStatistics()
    } else {
      setTotalRows(null)
      setTotalPages(1)
    }
  }, [selectedFile, selectedSheet]) // eslint-disable-line react-hooks/exhaustive-deps

  const fetchStatistics = async () => {
    if (!selectedFile || !selectedSheet) return
    try {
      const statsResp = await excelService.getStatistics(selectedFile, selectedSheet)
      if (statsResp.success && statsResp.data) {
        const rows = statsResp.data.totalRows
        setTotalRows(rows)
        setTotalPages(Math.max(1, Math.ceil(rows / pageSize)))
      }
    } catch (err) {
      // İstatistik hatası dropdown'u bloklamasın, sadece logla
      console.warn('İstatistikler alınamadı:', err)
    }
  }

  const fetchSheets = async () => {
    if (!selectedFile) return
    
    setLoading(true)
    clearMessages()
    try {
  // ...debug log removed...
      const response = await excelService.getSheets(selectedFile)
  // ...debug log removed...
      
      if (response.success && response.data) {
  // ...debug log removed...
        
        // Backend string array olarak gönderiyor, Sheet object'e dönüştürelim
        let sheetsArray: Sheet[];
        if (Array.isArray(response.data) && typeof response.data[0] === 'string') {
          // Backend string array gönderiyor
          sheetsArray = (response.data as unknown as string[]).map((sheetName: string) => ({ 
            name: sheetName, 
            rowCount: 0 
          }));
        } else {
          // Backend zaten Sheet array gönderiyor
          sheetsArray = response.data as Sheet[];
        }
        
  // ...debug log removed...
        setSheets(sheetsArray)
        
  // ...debug log removed...
        
        if (sheetsArray.length > 0 && !selectedSheet) {
          // ...debug log removed...
          setSelectedSheet(sheetsArray[0].name)
        } else {
          // ...debug log removed...
        }
  // ...debug log removed...
      } else {
  // ...debug log removed...
        setError(response.message || 'Sayfalar yüklenirken hata oluştu')
      }
    } catch {
      setError('Sayfalar yüklenirken hata oluştu. Backend bağlantısını kontrol edin.')
    } finally {
      setLoading(false)
    }
  }

  const fetchData = async () => {
    if (!selectedFile) {
  // ...debug log removed...
      return
    }
    
    setLoading(true)
    clearMessages()
    try {
  // ...debug log removed...

      // Önce dosyanın işlenmiş olup olmadığını kontrol et
      try {
  // ...debug log removed...
        const readResponse = await excelService.readExcelData(selectedFile, selectedSheet)
  // ...debug log removed...

        if (!readResponse.success) {
          setError(`Dosya işleme hatası: ${readResponse.message || 'Dosya henüz işlenmemiş olabilir'}`)
          return
        }
      } catch (readError) {
        console.error('❌ File read error:', readError)
        setError(`Dosya okuma hatası: ${readError instanceof Error ? readError.message : 'Bilinmeyen hata'} - Dosya henüz işlenmemiş olabilir.`)
        return
      }

  // Sadece 'stok' sheet'i için pageSize=50, diğerleri için mevcut pageSize kullan
  const effectivePageSize = selectedSheet && selectedSheet.toLowerCase() === 'stok' ? 50 : pageSize;
  const response = await excelService.getData(selectedFile, selectedSheet, page, effectivePageSize)
          // ...debug log removed...

      if (response.success) {
        if (response.data && Array.isArray(response.data)) {
          setData(response.data)
          // ...debug log removed...

          // Eğer totalRows henüz bilinmiyorsa ve backend yanıtında totalCount varsa kullan
          if (totalRows == null) {
            // Bazı backend'ler ApiResponse dışında totalCount/totalRows dönebilir; tip güvenliği için kontrol et
            const inferredTotal = (response as unknown as { totalCount?: number; totalRows?: number }).totalCount
              || (response as unknown as { totalCount?: number; totalRows?: number }).totalRows
            if (typeof inferredTotal === 'number' && inferredTotal > 0) {
              setTotalRows(inferredTotal)
              setTotalPages(Math.max(1, Math.ceil(inferredTotal / pageSize)))
            } else if (page === 1 && response.data.length < pageSize) {
              // Tek sayfa veri
              setTotalRows(response.data.length)
              setTotalPages(1)
            }
          }

          if (response.data.length === 0) {
            setError('Bu dosya/sayfa için veri bulunamadı. Dosya henüz işlenmiş olmayabilir.')
          } else {
            setSuccess(`✅ ${response.data.length} satır veri başarıyla yüklendi!`)
          }
        } else {
          // ...debug log removed...
          setError('API yanıtı beklenen formatta değil.')
          setData([])
        }
      } else {
  // ...debug log removed...
        setError(response.message || 'Veri yüklenirken hata oluştu')
        setData([])
      }
    } catch (error) {
  // ...debug log removed...

      if (error instanceof TypeError && error.message.includes('fetch')) {
        setError('Network hatası: Backend servisine bağlanılamıyor. Backend servisi çalışıyor mu?')
      } else if (error instanceof Error) {
        setError(`Veri yüklenirken hata oluştu: ${error.message}`)
      } else {
        setError('Veri yüklenirken bilinmeyen bir hata oluştu.')
      }
      setData([])
    } finally {
      setLoading(false)
    }
  }

  const startEdit = async (row: ExcelData | MacroData) => {
    setEditingRow(row.id)
    let initialData: Record<string, string | number>
    
    // Filtrelenmiş veri için MacroData.data, normal veri için ExcelData.data kullan
    if ('data' in row && row.data) {
      initialData = row.data as Record<string, string | number>
    } else {
      // MacroData'da data objesi yoksa direkt row'dan kullan
      const excludeFields = ['id', 'documentNumber', 'fileName', 'sheetName', 'rowIndex', 'createdDate', 'modifiedDate', 'version', 'modifiedBy']
      initialData = {}
      Object.keys(row).forEach(key => {
        if (!excludeFields.includes(key)) {
          const value = (row as Record<string, unknown>)[key]
          initialData[key] = typeof value === 'string' || typeof value === 'number' ? value : String(value || '')
        }
      })
    }
    
    // Başlangıçta hesaplamaları da yap - döviz kuru ile
    try {
      const calculatedData = await performCalculationsAsync(initialData)
      setEditData(calculatedData)
    } catch (error) {
      console.error('❌ Async calculation failed in startEdit, using sync:', error)
      const calculatedData = performCalculations(initialData)
      setEditData(calculatedData)
    }
  }

  const cancelEdit = () => {
    setEditingRow(null)
    setEditData({})
  }

  // Hesaplama yapan fonksiyon (sync versiyon)
  const performCalculations = (currentEditData: Record<string, string | number>) => {
    // Sadece belirtilen dosya için hesaplama yap
    if (!StockCalculator.shouldCalculateFor(selectedFile)) {
      return currentEditData
    }

    const girişMiktarı = StockCalculator.toNumber(currentEditData[COLUMN_NAMES.TOPLAM_STOK_GIRIS_MIKTARI])
    const çıkışMiktarı = StockCalculator.toNumber(currentEditData[COLUMN_NAMES.TOPLAM_STOK_CIKIS_MIKTARI])
    const birimFiyat = StockCalculator.toNumber(currentEditData[COLUMN_NAMES.SATINALMA_BIRIM_FIYAT])
    const paraBirimi = String(currentEditData[COLUMN_NAMES.PARA_BIRIMI] || 'TRY')

    const calculations = StockCalculator.calculateAll({
      girişMiktarı,
      çıkışMiktarı,
      birimFiyat,
      paraBirimi
    })

    // Güncellenen veriyi oluştur - TRY olarak göster
    const updatedData = {
      ...currentEditData,
      [COLUMN_NAMES.TOPLAM_STOK_MIKTARI]: calculations.toplamStokMiktarı,
      [COLUMN_NAMES.TOPLAM_FIYAT]: calculations.toplamFiyatTRY // Her zaman TRY cinsinden göster
    }

    return updatedData
  }

  // Async hesaplama yapan fonksiyon (döviz kuru ile)
  const performCalculationsAsync = async (currentEditData: Record<string, string | number>) => {
    // Sadece belirtilen dosya için hesaplama yap
    if (!StockCalculator.shouldCalculateFor(selectedFile)) {
      return currentEditData
    }

    const girişMiktarı = StockCalculator.toNumber(currentEditData[COLUMN_NAMES.TOPLAM_STOK_GIRIS_MIKTARI])
    const çıkışMiktarı = StockCalculator.toNumber(currentEditData[COLUMN_NAMES.TOPLAM_STOK_CIKIS_MIKTARI])
    const birimFiyat = StockCalculator.toNumber(currentEditData[COLUMN_NAMES.SATINALMA_BIRIM_FIYAT])
    const paraBirimi = String(currentEditData[COLUMN_NAMES.PARA_BIRIMI] || 'TRY')

    console.log(`💰 Calculating price for ${paraBirimi}: ${birimFiyat}`)

    const calculations = await StockCalculator.calculateAllWithCurrency({
      girişMiktarı,
      çıkışMiktarı,
      birimFiyat,
      paraBirimi
    })

    // Güncellenen veriyi oluştur - Her zaman TRY cinsinden göster
    const updatedData = {
      ...currentEditData,
      [COLUMN_NAMES.TOPLAM_STOK_MIKTARI]: calculations.toplamStokMiktarı,
      [COLUMN_NAMES.TOPLAM_FIYAT]: calculations.toplamFiyatTRY // Her zaman TRY cinsinden
    }

    return updatedData
  }

  // EditData değişiklik handler'ı
  const handleEditDataChange = async (column: string, value: string) => {
    const newEditData = { ...editData, [column]: value }
    
    // Eğer değişen sütun hesaplamaya etki ediyorsa, hesapla
    const affectedColumns = [
      COLUMN_NAMES.TOPLAM_STOK_GIRIS_MIKTARI,
      COLUMN_NAMES.TOPLAM_STOK_CIKIS_MIKTARI,
      COLUMN_NAMES.SATINALMA_BIRIM_FIYAT,
      COLUMN_NAMES.PARA_BIRIMI // Para birimi değiştiğinde de hesapla
    ] as string[]

    if (affectedColumns.includes(column)) {
      // Para birimi veya fiyat alanı değiştiğinde döviz kurunu da hesapla
      if (column === COLUMN_NAMES.PARA_BIRIMI || column === COLUMN_NAMES.SATINALMA_BIRIM_FIYAT) {
        try {
          const calculatedData = await performCalculationsAsync(newEditData)
          setEditData(calculatedData)
        } catch (error) {
          console.error('❌ Async calculation failed, falling back to sync:', error)
          const calculatedData = performCalculations(newEditData)
          setEditData(calculatedData)
        }
      } else {
        // Diğer alanlar için sync hesaplama yeterli
        const calculatedData = performCalculations(newEditData)
        setEditData(calculatedData)
      }
    } else {
      setEditData(newEditData)
    }
  }

  const saveEdit = async (rowId: number) => {
    setLoading(true)
    clearMessages()
    try {
      // Backend için veriyi hazırla - tüm değerleri string'e çevir
      const cleanEditData = Object.fromEntries(
        Object.entries(editData).map(([key, value]) => [key, String(value)])
      )

      console.log('🔄 Saving edit data:', {
        id: rowId,
        data: cleanEditData,
        modifiedBy: 'Frontend User'
      })
      
      const response = await excelService.updateData({
        id: rowId,
        data: cleanEditData,
        modifiedBy: 'Frontend User' // Bu değeri gerçek kullanıcı bilgisi ile değiştirin
      })
      
  // ...debug log removed...
      if (response.success) {
        setSuccess('Veri başarıyla güncellendi!')
        setEditingRow(null)
        setEditData({})
        
        // Eğer filtrelenmiş veri varsa, hem filtreyi yenile hem de normal veriyi yenile
        if (filteredData.length > 0) {
          // Filtreyi yeniden uygula
          await handleDocumentNumberFilter(documentNumberFilter)
        }
        
        // Normal verileri de yenile
        fetchData()
      } else {
  // ...debug log removed...
        setError('Güncelleme hatası: ' + (response.message || 'Bilinmeyen hata'))
      }
    } catch (error) {
  // ...debug log removed...
      setError('Güncelleme sırasında hata oluştu: ' + (error instanceof Error ? error.message : 'Bilinmeyen hata'))
    } finally {
      setLoading(false)
    }
  }

  const deleteRow = async (rowId: number) => {
    if (!confirm('Bu satırı silmek istediğinizden emin misiniz?')) {
      return
    }

    setLoading(true)
    clearMessages()
    try {
  // ...debug log removed...
      const response = await excelService.deleteData(rowId, 'Frontend User')
      
  // ...debug log removed...
      if (response.success) {
        setSuccess('Satır başarıyla silindi!')
        
        // Eğer filtrelenmiş veri varsa, hem filtreyi yenile hem de normal veriyi yenile
        if (filteredData.length > 0) {
          // Filtreyi yeniden uygula
          await handleDocumentNumberFilter(documentNumberFilter)
        }
        
        // Normal verileri de yenile
        fetchData()
      } else {
  // ...debug log removed...
        setError('Silme işleminde hata oluştu: ' + (response.message || 'Bilinmeyen hata'))
      }
    } catch (error) {
  // ...debug log removed...
      setError('Silme sırasında hata oluştu: ' + (error instanceof Error ? error.message : 'Bilinmeyen hata'))
    } finally {
      setLoading(false)
    }
  }

  const getColumns = () => {
    if (filteredData.length > 0) {
      // Filtrelenmiş veri için MacroData tipindeki data objesini kullan
      const firstItem = filteredData[0] as MacroData & { data?: Record<string, string | number> }
      if (firstItem.data && typeof firstItem.data === 'object') {
        return Object.keys(firstItem.data)
      }
      // Eğer data objesi yoksa direkt anahtarları kullan
      const excludeFields = ['id', 'documentNumber', 'fileName', 'sheetName', 'rowIndex', 'createdDate', 'modifiedDate', 'version', 'modifiedBy']
      return Object.keys(firstItem).filter(key => !excludeFields.includes(key))
    }
    if (data.length === 0) return []
    return Object.keys(data[0].data)
  }

  const testApiConnection = async () => {
  // ...debug log removed...
    clearMessages()
    
    try {
      // Test backend connectivity
      const testResult = await excelService.testConnection()
  // ...debug log removed...
      
      if (testResult.success) {
        setSuccess('Backend bağlantısı başarılı!')
        
        // If we have a selected file, try to get its data
        if (selectedFile) {
          await fetchSheets()
          if (selectedSheet) {
            await fetchData()
          }
        }
      } else {
        setError('Backend bağlantı testi başarısız: ' + testResult.message)
      }
    } catch (error) {
  // ...debug log removed...
      setError('API bağlantı testi başarısız: ' + (error instanceof Error ? error.message : 'Bilinmeyen hata'))
    }
  }

  // Dosya işleme fonksiyonu 
  const processFile = async (fileName: string) => {
    if (!fileName) return
    
    setLoading(true)
    clearMessages()
    
    try {
  // ...debug log removed...
      setSuccess('Dosya işleniyor, lütfen bekleyin...')
      
      const readResponse = await excelService.readExcelData(fileName)
  // ...debug log removed...
      
      if (readResponse.success) {
        setSuccess('✅ Dosya başarıyla işlendi! Sayfalar yükleniyor...')
        await fetchSheets()
      } else {
        setError(`Dosya işleme hatası: ${readResponse.message || 'Bilinmeyen hata'}`)
      }
    } catch (error) {
  // ...debug log removed...
      setError(`Dosya işleme hatası: ${error instanceof Error ? error.message : 'Bilinmeyen hata'}`)
    } finally {
      setLoading(false)
    }
  }

  if (!selectedFile) {
    return (
      <div className="data-viewer">
  <h2 style={{ color: '#111', fontWeight: 'bold' }}>Veri Görüntüleme</h2>
        <div className="no-file-selected">
          <p>Lütfen önce Dosya Yönetimi sayfasından bir dosya seçin.</p>
        </div>
      </div>
    )
  }

  if (loading && data.length === 0) {
    return (
      <div className="loading">
        <div className="spinner"></div>
      </div>
    )
  }

  return (
    <div className="data-viewer">
  {/* DEBUG BANNER REMOVED */}
      
  <h2 style={{ color: '#111', fontWeight: 'bold' }}>Veri Görüntüleme: {selectedFile}</h2>

      
            
      {/* Connection Test Button */}
      <div className="connection-test" style={{ marginBottom: '1rem' }}>
        <button 
          onClick={testApiConnection}
          disabled={loading}
          className="btn btn-primary"
          style={{ marginRight: '10px', backgroundColor: '#ff6f61', color: '#fff8f0' }}
        >
          🔗 Backend Bağlantısını Test Et
        </button>
        {selectedFile && (
          <>
            <button 
              onClick={() => processFile(selectedFile)}
              disabled={loading}
                className="btn btn-warning"
                style={{ marginRight: '10px', backgroundColor: '#ff6f61', color: '#fff8f0', border: 'none' }}
            >
              🔄 Dosyayı Yeniden İşle
            </button>
          </>
        )}
        
        {/* Döviz Kuru Yönetim Butonları (sadece makro dosyası için) */}
        {shouldShowCurrencyButton() && (
          <>
            <button 
              onClick={openCurrencyModal}
              disabled={loading}
              className="btn btn-info"
              style={{ marginRight: '10px', backgroundColor: '#28a745', color: '#fff' }}
            >
              💰 Manuel Döviz Kurları
            </button>
            {manualCurrencyRates && (
              <button 
                onClick={clearManualRates}
                disabled={loading}
                className="btn btn-secondary"
                style={{ marginRight: '10px', backgroundColor: '#6c757d', color: '#fff' }}
              >
                🗑️ Manuel Kurları Temizle
              </button>
            )}
          </>
        )}
        
        {!selectedFile && (
          <span style={{ color: '#666', fontSize: '14px' }}>
            Önce Dosya Yönetimi sayfasından bir dosya seçin
          </span>
        )}
      </div>
      
      {/* Error/Success Messages */}
      {error && (
        <div className="alert alert-error">
          {error}
          <button onClick={clearMessages} className="alert-close">×</button>
        </div>
      )}
      {success && (
        <div className="alert alert-success">
          {success}
          <button onClick={clearMessages} className="alert-close">×</button>
        </div>
      )}
      
  {/* Debug Panel kaldırıldı */}
      
      {/* Sheet & Page Selection */}
  {sheets.length > 0 && (
        <div className="sheet-selector" style={{ marginBottom: '1rem', display: 'flex', alignItems: 'center', gap: '16px' }}>
          <label htmlFor="sheet-select" style={{ marginRight: 4 }}>Sheet Seç: </label>
          <select 
            id="sheet-select"
            value={selectedSheet} 
            onChange={(e) => {
              setSelectedSheet(e.target.value)
            }}
            style={{ padding: '8px', marginRight: '16px' }}
          >
            {sheets.map((sheet) => (
              <option key={sheet.name} value={sheet.name}>
                {sheet.name} ({sheet.rowCount} satır)
              </option>
            ))}
          </select>
          {/* Sayfa Seç Dropdownu */}
          {data.length > 0 && (
            (() => {
              // Öncelikle totalRows state'i (istatistiklerden) kullan
              const sheetRowCount = sheets.find(s => s.name === selectedSheet)?.rowCount
              const effectiveTotalRows = (sheetRowCount && sheetRowCount > 0) ? sheetRowCount : (totalRows ?? null)
              const pages = effectiveTotalRows ? Math.max(1, Math.ceil(effectiveTotalRows / pageSize)) : totalPages
              return (
                <>
                  <label htmlFor="page-select" style={{ marginRight: 4 }}>Sayfa Seç: </label>
                  <select
                    id="page-select"
                    value={page}
                    onChange={e => setPage(Number(e.target.value))}
                    style={{ padding: '8px' }}
                    disabled={!effectiveTotalRows}
                  >
                    {effectiveTotalRows ? (
                      Array.from({ length: pages }, (_, i) => (
                        <option key={i + 1} value={i + 1}>Sayfa {i + 1}</option>
                      ))
                    ) : (
                      <option value={1}>Sayfa 1 (yükleniyor...)</option>
                    )}
                  </select>
                  {effectiveTotalRows && (
                    <span style={{ fontSize: '12px', color: '#555', marginLeft: '8px' }}>
                      Toplam {effectiveTotalRows} satır / {pages} sayfa
                    </span>
                  )}
                </>
              )
            })()
          )}
        </div>
      )}

      {/* Dosya Numarası Filtresi */}
      {selectedFile && (selectedFile.includes('gerceklesenmakrodata') || selectedFile.includes('gerceklesenhesap')) && (
        <div className="document-filter" style={{ marginBottom: '1rem', padding: '10px', backgroundColor: '#f5f5f5', borderRadius: '5px' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '10px', flexWrap: 'wrap' }}>
            <label htmlFor="document-filter-input" style={{ fontWeight: 'bold' }}>
              Dosya Numarası Filtresi:
            </label>
            <input
              id="document-filter-input"
              type="text"
              value={documentNumberFilter}
              onChange={(e) => setDocumentNumberFilter(e.target.value)}
              onKeyPress={(e) => {
                if (e.key === 'Enter') {
                  handleDocumentNumberFilter(documentNumberFilter)
                }
              }}
              placeholder="Dosya numarasını girin..."
              style={{ padding: '8px', minWidth: '200px', border: '1px solid #ddd', borderRadius: '3px' }}
            />
            <button
              onClick={() => handleDocumentNumberFilter(documentNumberFilter)}
              disabled={isFiltering}
              style={{ 
                padding: '8px 12px', 
                backgroundColor: '#007acc', 
                color: 'white', 
                border: 'none', 
                borderRadius: '3px',
                cursor: isFiltering ? 'not-allowed' : 'pointer',
                opacity: isFiltering ? 0.6 : 1
              }}
            >
              {isFiltering ? 'Filtreleniyor...' : 'Filtrele'}
            </button>
            <button
              onClick={clearFilter}
              style={{ 
                padding: '8px 12px', 
                backgroundColor: '#6c757d', 
                color: 'white', 
                border: 'none', 
                borderRadius: '3px',
                cursor: 'pointer'
              }}
            >
              Temizle
            </button>
          </div>
          {filterError && (
            <div style={{ marginTop: '8px', padding: '6px', backgroundColor: '#f8d7da', color: '#721c24', borderRadius: '3px', fontSize: '14px' }}>
              {filterError}
            </div>
          )}
          {filteredData.length > 0 && (
            <div style={{ marginTop: '8px', padding: '6px', backgroundColor: '#d4edda', color: '#155724', borderRadius: '3px', fontSize: '14px' }}>
              ✅ {filteredData.length} kayıt bulundu
            </div>
          )}
        </div>
      )}

      {/* Hesaplama Bilgilendirmesi */}
      {StockCalculator.shouldCalculateFor(selectedFile) && (
        <div style={{ marginBottom: '1rem', padding: '12px', backgroundColor: '#e7f3ff', border: '1px solid #007acc', borderRadius: '5px' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '8px' }}>
            <span style={{ fontSize: '18px' }}>🧮</span>
            <strong style={{ color: '#0056b3' }}>Otomatik Hesaplama Aktif</strong>
          </div>
          <div style={{ fontSize: '14px', color: '#0056b3', lineHeight: '1.4' }}>
            <div>📊 <strong>Toplam Stok Miktarı</strong> = Giriş Miktarı - Çıkış Miktarı</div>
            <div>💰 <strong>Toplam Fiyat</strong> = Toplam Stok Miktarı × Birim Fiyat</div>
            <div style={{ marginTop: '6px', fontSize: '12px', fontStyle: 'italic' }}>
              ℹ️ Giriş/Çıkış miktarı veya birim fiyat değiştirdiğinizde hesaplamalar otomatik olarak güncellenir.
            </div>
          </div>
        </div>
      )}

      {/* Data Table */}
      {(filteredData.length > 0 || data.length > 0) ? (
        <div className="data-table">
          <div style={{ marginBottom: '10px', fontSize: '14px', color: '#666' }}>
            {filteredData.length > 0 
              ? `Filtrelenmiş ${filteredData.length} satır gösteriliyor` 
              : `Toplam ${data.length} satır gösteriliyor (Sayfa ${page})`
            }
          </div>
          <table>
            <thead>
              <tr>
                <th>Satır</th>
                {getColumns().map((column) => (
                  <th key={column}>{column}</th>
                ))}
                {/* <th>Son Değişiklik</th> */}
                <th>İşlemler</th>
              </tr>
            </thead>
            <tbody>
              {(filteredData.length > 0 ? filteredData : data).map((row, index) => (
                <tr key={row.id || index}>
                  <td>{filteredData.length > 0 ? (row as MacroData & { rowIndex?: number }).rowIndex || (index + 1) : (row as ExcelData).rowIndex}</td>
                  {getColumns().map((column) => (
                    <td key={column}>
                      {editingRow === row.id ? (
                        (() => {
                          // Hesaplanan alanlar sadece okunabilir
                          const isCalculatedField = StockCalculator.shouldCalculateFor(selectedFile) && 
                            (column === COLUMN_NAMES.TOPLAM_STOK_MIKTARI || column === COLUMN_NAMES.TOPLAM_FIYAT);
                          
                          return (
                            <input
                              type="text"
                              value={editData[column] || ''}
                              onChange={isCalculatedField ? undefined : async (e) => await handleEditDataChange(column, e.target.value)}
                              readOnly={isCalculatedField}
                              style={{ 
                                width: '100%', 
                                padding: '4px',
                                backgroundColor: isCalculatedField ? '#f0f8ff' : 'white',
                                border: isCalculatedField ? '2px solid #007acc' : '1px solid #ccc',
                                cursor: isCalculatedField ? 'not-allowed' : 'text',
                                fontWeight: isCalculatedField ? 'bold' : 'normal'
                              }}
                              title={isCalculatedField ? 'Bu alan otomatik hesaplanır' : ''}
                            />
                          )
                        })()
                      ) : (
                        <span title={`${column}: ${String(filteredData.length > 0 
                          ? (row as MacroData & { data?: Record<string, string | number> })?.data?.[column] || (row as MacroData)[column] || '' 
                          : (row as ExcelData).data[column] || ''
                        )}`}>
                          {filteredData.length > 0 
                            ? String((row as MacroData & { data?: Record<string, string | number> })?.data?.[column] || (row as MacroData)[column] || '') 
                            : String((row as ExcelData).data[column] || '')
                          }
                        </span>
                      )}
                    </td>
                  ))}
        {/* <td>
          ...Son Değişiklik sütunu kaldırıldı...
        </td> */}
                  <td>
                    {editingRow === row.id ? (
                      <div>
                        <button 
                          className="btn btn-primary btn-sm"
                          onClick={() => saveEdit(row.id)}
                          disabled={loading}
                          style={{ marginRight: '4px', backgroundColor: '#ff6f61', color: '#fff8f0' }}
                        >
                          Kaydet
                        </button>
                        <button 
                          className="btn btn-secondary btn-sm"
                          onClick={cancelEdit}
                          style={{ backgroundColor: '#ffd6c0', color: '#d7263d' }}
                        >
                          İptal
                        </button>
                      </div>
                    ) : (
                      <div>
                        <button 
                          className="btn btn-primary btn-sm"
                          onClick={async () => await startEdit(row as ExcelData | MacroData)}
                          style={{ backgroundColor: '#ff6f61', color: '#fff8f0', marginRight: '4px' }}
                        >
                          Düzenle
                        </button>
                        <button 
                          className="btn btn-danger btn-sm"
                          onClick={() => deleteRow(row.id)}
                          disabled={loading}
                        >
                          Sil
                        </button>
                      </div>
                    )}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      ) : !loading && selectedFile && selectedSheet ? (
        <div className="no-data">
          <h3>❌ Veri Bulunamadı</h3>
          <p>Bu dosya/sayfa için veri bulunamadı.</p>
          <div style={{ background: '#fff3cd', border: '1px solid #ffeaa7', borderRadius: '4px', padding: '10px', margin: '10px 0' }}>
            <h4>🔍 Olası Nedenler:</h4>
            <ul>
              <li>Backend servisi çalışmıyor olabilir</li>
              <li>Dosya henüz yüklenmemiş veya işlenmemiş olabilir</li>
              <li>Seçilen sayfa boş olabilir</li>
              <li>Veritabanı bağlantı sorunu olabilir</li>
            </ul>
            <h4>✅ Yapılacaklar:</h4>
            <ul>
              <li>Konsol (F12) log'larını kontrol edin</li>
              <li>Backend servisinin çalıştığından emin olun</li>
              <li>Farklı bir dosya/sayfa deneyin</li>
            </ul>
          </div>
        </div>
      ) : (
        <div className="no-data">
          <p>Veri yüklemek için yukarıdan dosya ve sayfa seçin.</p>
        </div>
      )}

      {/* Pagination */}
      <div className="pagination" style={{ marginTop: '1rem', textAlign: 'center' }}>
        <button 
          className="btn btn-secondary btn-sm"
          onClick={() => setPage(page - 1)}
          disabled={page <= 1 || loading}
          style={{ marginRight: '8px' }}
        >
          Önceki
        </button>
        <span style={{ margin: '0 16px' }}>Sayfa {page}</span>
        <button 
          className="btn btn-secondary btn-sm"
          onClick={() => setPage(page + 1)}
          disabled={loading || (totalPages ? page >= totalPages : data.length < pageSize)}
        >
          Sonraki
        </button>
      </div>

      {loading && (
        <div style={{ textAlign: 'center', padding: '1rem' }}>
          <div className="spinner"></div>
        </div>
      )}

      {/* Döviz Kuru Modal'ı */}
      {showCurrencyModal && (
        <div className="modal-overlay" style={{
          position: 'fixed',
          top: 0,
          left: 0,
          right: 0,
          bottom: 0,
          backgroundColor: 'rgba(0, 0, 0, 0.5)',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          zIndex: 1000
        }}>
          <div className="modal-content" style={{
            backgroundColor: 'white',
            borderRadius: '8px',
            padding: '24px',
            maxWidth: '500px',
            width: '90%',
            maxHeight: '80vh',
            overflowY: 'auto',
            boxShadow: '0 4px 20px rgba(0, 0, 0, 0.3)'
          }}>
            <div className="modal-header" style={{
              display: 'flex',
              justifyContent: 'space-between',
              alignItems: 'center',
              marginBottom: '20px'
            }}>
              <h3 style={{ margin: 0, color: '#333' }}>💰 Manuel Döviz Kurları</h3>
              <button 
                onClick={closeCurrencyModal}
                style={{
                  background: 'none',
                  border: 'none',
                  fontSize: '24px',
                  cursor: 'pointer',
                  color: '#666'
                }}
              >
                ×
              </button>
            </div>
            
            <div className="modal-body">
              <p style={{ marginBottom: '20px', color: '#666' }}>
                Hesaplamalarda kullanılacak döviz kurlarını manuel olarak girebilirsiniz. 
                Boş bırakılan kurlar API'den alınacaktır.
              </p>
              
              <div className="currency-inputs" style={{ display: 'grid', gap: '16px' }}>
                {['USD', 'EUR', 'GBP', 'JPY'].map((currency) => (
                  <div key={currency} style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
                    <label style={{ 
                      minWidth: '40px', 
                      fontWeight: 'bold',
                      color: '#333'
                    }}>
                      {currency}:
                    </label>
                    <input 
                      type="number"
                      step="0.01"
                      placeholder={`1 ${currency} = ? TRY`}
                      value={currencyFormData[currency]}
                      onChange={(e) => handleCurrencyInputChange(currency, e.target.value)}
                      style={{
                        flex: 1,
                        padding: '8px 12px',
                        border: '1px solid #ddd',
                        borderRadius: '4px',
                        fontSize: '14px'
                      }}
                    />
                    <span style={{ color: '#666', fontSize: '14px' }}>TRY</span>
                  </div>
                ))}
              </div>

              {currencyService.hasManualRates() && (
                <div style={{
                  marginTop: '16px',
                  padding: '12px',
                  backgroundColor: '#d4edda',
                  border: '1px solid #c3e6cb',
                  borderRadius: '4px',
                  color: '#155724'
                }}>
                  ✅ Şu anda manuel kurlar kullanılıyor
                </div>
              )}
            </div>
            
            <div className="modal-footer" style={{
              display: 'flex',
              gap: '12px',
              justifyContent: 'flex-end',
              marginTop: '24px'
            }}>
              <button 
                onClick={closeCurrencyModal}
                style={{
                  padding: '8px 16px',
                  border: '1px solid #ddd',
                  borderRadius: '4px',
                  backgroundColor: 'white',
                  color: '#333',
                  cursor: 'pointer'
                }}
              >
                İptal
              </button>
              <button 
                onClick={saveCurrencyRates}
                style={{
                  padding: '8px 16px',
                  border: 'none',
                  borderRadius: '4px',
                  backgroundColor: '#28a745',
                  color: 'white',
                  cursor: 'pointer'
                }}
              >
                💾 Kaydet
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}

export default DataViewer
