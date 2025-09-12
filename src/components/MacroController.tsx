import React, { useState } from 'react'
import macroService from '../services/macroService'
import type { MacroData, DocumentStatistics, UpdateRequest } from '../services/macroService'

const MacroController: React.FC = () => {
  const [activeTab, setActiveTab] = useState<'ozet' | 'ham' | 'pivot'>('ozet')
  const [documentNumber, setDocumentNumber] = useState<string>('')
  const [searchResults, setSearchResults] = useState<MacroData[]>([])
  const [hesapSearchResults, setHesapSearchResults] = useState<MacroData[]>([])
  const [statistics, setStatistics] = useState<DocumentStatistics | null>(null)
  const [loading, setLoading] = useState<boolean>(false)
  const [hesapLoading, setHesapLoading] = useState<boolean>(false)
  const [error, setError] = useState<string | null>(null)
  const [hesapError, setHesapError] = useState<string | null>(null)
  const [editingRow, setEditingRow] = useState<number | null>(null)
  const [editData, setEditData] = useState<Record<string, string | number>>({})


  // Sadece makro dosyası aranacak
  const targetFiles = [
    'gerceklesenmakrodata_20250905104736.xlsx'
  ]

  // Hesap dosyasında arama yapan fonksiyon
  const handleHesapSearch = async () => {
    if (!documentNumber.trim()) {
      setHesapError('Lütfen dosya numarası girin')
      return
    }

    setHesapLoading(true)
    setHesapError(null)
    setHesapSearchResults([])

    try {
      console.log('🔍 Hesap araması başlatılıyor - Dosya numarası:', documentNumber)
      const results = await macroService.searchInHesap(documentNumber)
      console.log('✅ Hesap arama sonuçları:', results)
      
      if (Array.isArray(results) && results.length > 0) {
        setHesapSearchResults(results)
        console.log(`✅ Hesap araması - ${results.length} kayıt bulundu`)
      } else {
        setHesapError(`Dosya numarası "${documentNumber}" için hesap verisi bulunamadı`)
        console.log('❌ Hesap araması sonucu boş')
      }
    } catch (error) {
      const errorMessage = 'Hesap araması sırasında hata oluştu: ' + ((error as Error).message || error)
      console.error('❌ Hesap arama hatası:', error)
      setHesapError(errorMessage)
      setHesapSearchResults([])
    } finally {
      setHesapLoading(false)
    }
  }

  // Dosya numarasına göre arama (her iki dosyayı da tara)
  const handleSearch = async () => {
    if (!documentNumber.trim()) {
      setError('Lütfen dosya numarası girin')
      return
    }

    setLoading(true)
    setError(null)
    setSearchResults([])

    try {
      console.log('🚀 Arama başlatılıyor - Dosya numarası:', documentNumber)
      const results = await macroService.quickSearchMakroOnly(documentNumber)
      console.log('✅ quick-search-makro sonuçları:', results)
      if (Array.isArray(results) && results.length > 0) {
        // Aynı id'ye sahip satırları tekilleştir
        const uniqueResults: MacroData[] = [];
        const seenIds = new Set<number>();
        for (const item of results) {
          if (!seenIds.has(item.id)) {
            uniqueResults.push(item);
            seenIds.add(item.id);
          }
        }
        setSearchResults(uniqueResults)
        console.log(`✅ Toplam ${uniqueResults.length} kayıt bulundu`)
      } else {
        setError(`Dosya numarası "${documentNumber}" için veri bulunamadı`)
        console.log('❌ Arama sonucu boş')
      }
    } catch (error) {
      const errorMessage = 'Arama sırasında hata oluştu: ' + ((error as Error).message || error)
      console.error('❌ Genel arama hatası:', error)
      setError(errorMessage)
      setSearchResults([])
      setStatistics(null)
    } finally {
      setLoading(false)
    }
  }

  // Düzenleme modunu başlat
  const startEdit = (row: MacroData) => {
    setEditingRow(row.id)
    setEditData({ ...row })
  }

  // Düzenlemeyi iptal et
  const cancelEdit = () => {
    setEditingRow(null)
    setEditData({})
  }

  // Veriyi güncelle
  const saveEdit = async () => {
    if (editingRow === null) return

    try {
      const updateRequest: UpdateRequest = {
        id: editingRow,
        documentNumber: documentNumber,
        data: editData
      }

      await macroService.updateDocumentData(updateRequest)
      
      // Aramayı yenile
      await handleSearch()
      
      setEditingRow(null)
      setEditData({})
    } catch (error) {
      setError('Güncelleme sırasında hata oluştu: ' + (error as Error).message)
    }
  }

  // Input değişikliği
  const handleInputChange = (field: string, value: string | number) => {
    setEditData(prev => ({
      ...prev,
      [field]: value
    }))
  }

  // Tabloyu render et
  const renderDataTable = () => {
    if (searchResults.length === 0) {
      return <p className="no-data">Veri bulunamadı</p>;
    }

    // Sadece istenen kolonlar
    // column 7 ve column 9 için index bazlı erişim
    const metaColumns = ['id', 'fileName', 'sheetName', 'rowIndex'];
    let hasDataProperty = false;
    let allKeys: string[] = [];
    if (searchResults[0]?.data && typeof searchResults[0].data === 'object') {
      hasDataProperty = true;
      allKeys = Object.keys(searchResults[0].data);
    } else {
      allKeys = Object.keys(searchResults[0]).filter(key => !metaColumns.includes(key));
    }

    // column 7 ve column 9
    const column7 = allKeys[6] || '';
    const column9 = allKeys[8] || '';

    // Diğer istenen kolonlar
    const columnMapping: Record<string, string[]> = {
      'Para Birimi': ['Para Birimi', 'Currency', 'Döviz', 'Para_Birimi', 'PARA_BIRIMI'],
      'Satınalma Birim Fiyat': ['Satınalma Birim Fiyat', 'Unit Price', 'Satinalma_Birim_Fiyat', 'SATINALMA_BIRIM_FIYAT'],
      'Toplam Stok Giriş Miktarı': ['Toplam Stok Giriş Miktarı', 'Stock Input', 'Toplam_Stok_Giris_Miktari', 'TOPLAM_STOK_GIRIS_MIKTARI'],
      'Toplam Stok Çıkış Miktarı': ['Toplam Stok Çıkış Miktarı', 'Stock Output', 'Toplam_Stok_Cikis_Miktari', 'TOPLAM_STOK_CIKIS_MIKTARI'],
      'Toplam Stok Miktarı': ['Toplam Stok Miktarı', 'Total Stock', 'Toplam_Stok_Miktari', 'TOPLAM_STOK_MIKTARI'],
      'Toplam Fiyat': ['Toplam Fiyat', 'Total Price', 'Toplam_Fiyat', 'TOPLAM_FIYAT']
    };
    // Malzeme Numarası için mapping ekle
    columnMapping['Malzeme Numarası'] = ['Malzeme Numarası', 'Material Number', 'Malzeme_No', 'MALZEME_NUMARASI'];

    // Her bir istenen kolonun veri içindeki gerçek adını bul
    function findColumnKey(label: string) {
      const alternatives = columnMapping[label] || [label];
      return alternatives.find(alt => allKeys.includes(alt)) || '';
    }

    const selectedColumns = [
      column7,
      column9,
      findColumnKey('Para Birimi'),
      findColumnKey('Satınalma Birim Fiyat'),
      findColumnKey('Toplam Stok Giriş Miktarı'),
      findColumnKey('Toplam Stok Çıkış Miktarı'),
      findColumnKey('Toplam Stok Miktarı'),
      findColumnKey('Satınalma Birim Fiyat'), // tekrar
  findColumnKey('Toplam Fiyat'),
  // Malzeme Numarası her zaman eklenmeli
  'Malzeme Numarası'
    ].filter(Boolean);

    // Sütun başlıkları
    const getColumnHeader = (column: string, idx: number): string => {
      if (idx === 0) return 'Column 7';
      if (idx === 1) return 'Column 9';
      if (columnMapping['Para Birimi'].includes(column)) return 'Para Birimi';
      if (columnMapping['Satınalma Birim Fiyat'].includes(column)) return 'Satınalma Birim Fiyat';
      if (columnMapping['Toplam Stok Giriş Miktarı'].includes(column)) return 'Toplam Stok Giriş Miktarı';
      if (columnMapping['Toplam Stok Çıkış Miktarı'].includes(column)) return 'Toplam Stok Çıkış Miktarı';
      if (columnMapping['Toplam Stok Miktarı'].includes(column)) return 'Toplam Stok Miktarı';
      if (columnMapping['Toplam Fiyat'].includes(column)) return 'Toplam Fiyat';
  if (column === 'Malzeme Numarası' || (columnMapping['Malzeme Numarası'] && columnMapping['Malzeme Numarası'].includes(column))) return 'Malzeme Numarası';
      return column;
    };

    return (
      <div className="table-container">
        <table className="data-table">
          <thead>
            <tr>
              <th>Row ID</th>
              {selectedColumns.map((column, idx) => (
                <th key={column}>{getColumnHeader(column, idx)}</th>
              ))}
              <th>İşlemler</th>
            </tr>
          </thead>
          <tbody>
            {searchResults.map((row, index) => {
              // Row ID'yi oluştur - eğer yoksa index kullan
              const rowId = row.id || row.rowId || index;
              const uniqueKey = `${row.id}-${index}`;
              return (
                <tr key={uniqueKey}>
                  <td>{rowId}</td>
                  {selectedColumns.map((column) => {
                    let cellValue: string | number | object | null = null;
                    // Malzeme Numarası için hem data hem ana objede kontrol et
                    if (column === 'Malzeme Numarası') {
                      // 'Malzeme' anahtarını da kontrol et
                      if (hasDataProperty && row.data && typeof row.data === 'object') {
                        cellValue = row.data['Malzeme Numarası'] || row.data['Malzeme'] || row.data['Material Number'] || row.data['Malzeme_No'] || row.data['MALZEME_NUMARASI'];
                      } else {
                        cellValue = row['Malzeme Numarası'] || row['Malzeme'] || row['Material Number'] || row['Malzeme_No'] || row['MALZEME_NUMARASI'];
                      }
                    } else {
                      if (hasDataProperty && row.data && typeof row.data === 'object') {
                        cellValue = (row.data as Record<string, string | number>)[column];
                      } else {
                        cellValue = row[column];
                      }
                    }
                    let displayValue = typeof cellValue === 'object' && cellValue !== null
                      ? JSON.stringify(cellValue)
                      : String(cellValue || '');
                    if (displayValue === 'DIV0') displayValue = '';
                    return (
                      <td key={column}>{editingRow === rowId ? (
                        <input
                          type="text"
                          value={editData[column] || ''}
                          onChange={(e) => handleInputChange(column, e.target.value)}
                          className="edit-input"
                        />
                      ) : (
                        displayValue
                      )}</td>
                    );
                  })}
                  <td>
                    {editingRow === rowId ? (
                      <div className="edit-actions">
                        <button onClick={saveEdit} className="save-btn">Kaydet</button>
                        <button onClick={cancelEdit} className="cancel-btn">İptal</button>
                      </div>
                    ) : (
                      <button onClick={() => startEdit({...row, id: typeof rowId === 'number' ? rowId : parseInt(String(rowId)) || index})} className="edit-btn">Düzenle</button>
                    )}
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>
    );
  }

  // Hesap arama sonuçları tablosunu render et
  const renderHesapTable = () => {
    if (hesapSearchResults.length === 0) {
      return <p className="no-data">Hesap verisi bulunamadı</p>
    }

    // Tüm satırları kontrol ederek mevcut olan tüm sütunları topla
    const allDataColumns = new Set<string>()
    const metaColumns = ['id', 'fileName', 'sheetName', 'rowIndex']
    let hasDataProperty = false

    // Tüm satırları gez ve mevcut kolonları topla
    hesapSearchResults.forEach((row, index) => {
      console.log(`📋 Hesap Satır ${index + 1} yapısı:`, row)
      
      if (row.data && typeof row.data === 'object') {
        hasDataProperty = true
        const dataKeys = Object.keys(row.data)
        console.log(`📋 Hesap Satır ${index + 1} data sütunları:`, dataKeys)
        dataKeys.forEach(key => allDataColumns.add(key))
      } else {
        // data property yoksa, direkt row'daki key'leri al
        const directKeys = Object.keys(row).filter(key => !metaColumns.includes(key))
        console.log(`📋 Hesap Satır ${index + 1} direkt sütunlar:`, directKeys)
        directKeys.forEach(key => allDataColumns.add(key))
      }
    })

    // Gösterilecek tüm kolonlar
    const dataColumnsArray = Array.from(allDataColumns).sort()
    const allColumns = hasDataProperty 
      ? [...metaColumns, ...dataColumnsArray]
      : dataColumnsArray

    // Sütun başlıkları için Türkçe karşılıklar
    const getColumnHeader = (column: string): string => {
      const headerMap: Record<string, string> = {
        'id': 'ID',
        'fileName': 'Dosya Adı',
        'sheetName': 'Sayfa Adı',
        'rowIndex': 'Satır No'
      }
      return headerMap[column] || column
    }

    return (
      <div className="table-container">
        <table className="data-table">
          <thead>
            <tr>
              {allColumns.map(column => ( 
                <th key={column}>{getColumnHeader(column)}</th>
              ))}
            </tr>
          </thead>
          <tbody>
            {hesapSearchResults.map((row, index) => {
              const uniqueKey = `hesap-${row.id}-${index}`;
              return (
                <tr key={uniqueKey}>
                  {allColumns.map(column => {
                    let cellValue: string | number | object | null = null;
                    if (metaColumns.includes(column)) {
                      cellValue = row[column];
                    } else if (hasDataProperty && row.data && typeof row.data === 'object') {
                      cellValue = (row.data as Record<string, string | number>)[column];
                    } else {
                      cellValue = row[column];
                    }
                    const displayValue = typeof cellValue === 'object' && cellValue !== null 
                      ? JSON.stringify(cellValue) 
                      : String(cellValue || '');
                    return (
                      <td key={column}>
                        {displayValue}
                      </td>
                    );
                  })}
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>
    )
  }

  // İstatistikleri render et
  const renderStatistics = () => {
    if (!statistics) return null

    return (
      <div className="statistics">
        <h3>Doküman İstatistikleri</h3>
        <div className="stats-grid">
          <div className="stat-item">
            <label>Dosya Numarası:</label>
            <span>{statistics.documentNumber}</span>
          </div>
          <div className="stat-item">
            <label>Toplam Kayıt:</label>
            <span>{statistics.totalRecords}</span>
          </div>
          <div className="stat-item">
            <label>Dosya Sayısı:</label>
            <span>{statistics.fileCount}</span>
          </div>
          <div className="stat-item">
            <label>Son Değişiklik:</label>
            <span>{new Date(statistics.lastModified).toLocaleString('tr-TR')}</span>
          </div>
        </div>
      </div>
    )
  }

  return (
    <div className="macro-controller">
      <div className="macro-header">
        <h2>🎛️ Macro Controller</h2>
    {/* Subtitle removed as requested */}
      </div>
      <div>
        {/* Tab Navigation */}
        <div className="tab-navigation">
          <button
            className={`tab-btn ${activeTab === 'ozet' ? 'active' : ''}`}
            onClick={() => setActiveTab('ozet')}
            style={{ backgroundColor: '#ff6f61', color: '#fff8f0', marginRight: '8px' }}
          >
            📊 ÖZET
          </button>
          <button
            className={`tab-btn ${activeTab === 'ham' ? 'active' : ''}`}
            onClick={() => setActiveTab('ham')}
            style={{ backgroundColor: '#ffb347', color: '#fff8f0', marginRight: '8px' }}
          >
            🗂️ HAM
          </button>
          <button
            className={`tab-btn ${activeTab === 'pivot' ? 'active' : ''}`}
            onClick={() => setActiveTab('pivot')}
            style={{ backgroundColor: '#ffd166', color: '#fff8f0' }}
          >
            🔄 PIVOT
          </button>
        </div>
        {/* Tab Content */}
        {activeTab === 'ozet' && (
          <div className="tab-content">
            {/* Hesap Search Section - üstte */}
            <div className="search-section" style={{marginBottom: '20px'}}>
              <div className="search-controls">
                <div className="input-group">
                  <label htmlFor="hesapDocumentNumber">Hesap Dosyasında Ara:</label>
                  <input
                    id="hesapDocumentNumber"
                    type="text"
                    value={documentNumber}
                    onChange={(e) => setDocumentNumber(e.target.value)}
                    placeholder="Dosya numarasını girin..."
                    className="search-input"
                    onKeyPress={(e) => e.key === 'Enter' && handleHesapSearch()}
                  />
                </div>
                <button 
                  onClick={handleHesapSearch} 
                  disabled={hesapLoading}
                  className="search-btn"
                  style={{ backgroundColor: '#ff6f61', color: '#fff8f0' }}
                >
                  {hesapLoading ? 'Aranıyor...' : '🔍 Hesap Ara'}
                </button>
              </div>
            </div>

            {/* Search Section - altta */}
            <div className="search-section">
              <div className="search-controls">
                <div className="input-group">
                  <label htmlFor="documentNumber">Dosya Numarası:</label>
                  <input
                    id="documentNumber"
                    type="text"
                    value={documentNumber}
                    onChange={(e) => setDocumentNumber(e.target.value)}
                    placeholder="Dosya numarasını girin..."
                    className="search-input"
                    onKeyPress={(e) => e.key === 'Enter' && handleSearch()}
                  />
                </div>
                <button 
                  onClick={handleSearch} 
                  disabled={loading}
                  className="search-btn"
                  style={{ backgroundColor: '#ff6f61', color: '#fff8f0' }}
                >
                  {loading ? 'Aranıyor...' : '🔍 Ara'}
                </button>
              </div>

              {/* Target Files Info */}
              <div className="available-files">
                {/* Removed 'Aranacak Dosyalar' text as requested */}
                {/* Removed Excel file tags as requested */}
              </div>
            </div>

            {/* Error Display */}
            {error && (
              <div className="error-message">
                ⚠️ {error}
              </div>
            )}

            {/* Hesap Error Display */}
            {hesapError && (
              <div className="error-message">
                ⚠️ {hesapError}
              </div>
            )}

            {/* Statistics */}
            {statistics && renderStatistics()}
            {/* Hesap Search Results - üstte */}
            {hesapSearchResults.length > 0 && (
              <div className="results-section" style={{marginTop: '20px'}}>
                <h3>Hesap Arama Sonuçları ({hesapSearchResults.length} kayıt)</h3>
                {renderHesapTable()}
              </div>
            )}
            {/* Results */}
            {searchResults.length > 0 && (
              <div className="results-section">
                <h3>Arama Sonuçları ({searchResults.length} kayıt)</h3>
                {/* Show summary of missing columns if any */}
                {(() => {
                  const missingColumns = (() => {
                    const allDataColumns = new Set<string>()
                    const metaColumns = ['id', 'fileName', 'sheetName', 'rowIndex']
                    searchResults.forEach((row) => {
                      if (row.data && typeof row.data === 'object') {
                        Object.keys(row.data).forEach(key => allDataColumns.add(key))
                      } else {
                        Object.keys(row).filter(key => !metaColumns.includes(key)).forEach(key => allDataColumns.add(key))
                      }
                    })
                    const expectedColumns = [
                      'Para Birimi', 'İşlem türü', 'Toplam Stok Miktarı', 
                      'Toplam Stok Çıkış Miktarı', 'Toplam Stok Giriş Miktarı', 
                      'Satınalma Birim Fiyat', 'Toplam Fiyat'
                    ]
                    const columnMapping: Record<string, string[]> = {
                      'Para Birimi': ['Para Birimi', 'Currency', 'Döviz', 'Para_Birimi', 'PARA_BIRIMI'],
                      'İşlem türü': ['İşlem türü', 'İşlem Türü', 'Transaction Type', 'Islem_Turu', 'ISLEM_TURU'],
                      'Toplam Stok Miktarı': ['Toplam Stok Miktarı', 'Total Stock', 'Toplam_Stok_Miktari', 'TOPLAM_STOK_MIKTARI'],
                      'Toplam Stok Çıkış Miktarı': ['Toplam Stok Çıkış Miktarı', 'Stock Output', 'Toplam_Stok_Cikis_Miktari', 'TOPLAM_STOK_CIKIS_MIKTARI'],
                      'Toplam Stok Giriş Miktarı': ['Toplam Stok Giriş Miktarı', 'Stock Input', 'Toplam_Stok_Giris_Miktari', 'TOPLAM_STOK_GIRIS_MIKTARI'],
                      'Satınalma Birim Fiyat': ['Satınalma Birim Fiyat', 'Unit Price', 'Satinalma_Birim_Fiyat', 'SATINALMA_BIRIM_FIYAT'],
                      'Toplam Fiyat': ['Toplam Fiyat', 'Total Price', 'Toplam_Fiyat', 'TOPLAM_FIYAT']
                    }
                    const missingColumns: string[] = []
                    expectedColumns.forEach(expectedCol => {
                      const alternatives = columnMapping[expectedCol] || [expectedCol]
                      const foundAlt = alternatives.find(alt => allDataColumns.has(alt))
                      if (!foundAlt) {
                        missingColumns.push(expectedCol)
                      }
                    })
                    return missingColumns
                  })()
                  return missingColumns.length > 0 && (
                    <div className="missing-columns-alert">
                      <h4>⚠️ Eksik Sütun Uyarısı</h4>
                      <p>Aşağıdaki beklenen sütunlar veri setinde bulunamadı:</p>
                      <div className="missing-columns-list">
                        {missingColumns.map(col => (
                          <span key={col} className="missing-column-pill">
                            {col}
                          </span>
                        ))}
                      </div>
                      <p><small>Bu sütunlar Excel dosyasında mevcut değil veya farklı isimlerle kaydedilmiş olabilir.</small></p>
                    </div>
                  )
                })()}
                {renderDataTable()}
              </div>
            )}
            {/* Empty State */}
            {!loading && searchResults.length === 0 && !error && documentNumber && (
              <div className="empty-state">
                <p>Bu dosya numarası için veri bulunamadı.</p>
              </div>
            )}
            {/* Hesap Empty State */}
            {!hesapLoading && hesapSearchResults.length === 0 && !hesapError && documentNumber && (
              <div className="empty-state" style={{marginTop: '10px'}}>
                <p>Bu dosya numarası için hesap verisi bulunamadı.</p>
              </div>
            )}
          </div>
        )}
        {activeTab === 'ham' && (
          <div className="tab-content">
            <h2>📊 HAM VERİ</h2>
            
            {/* Search Section for HAM */}
            <div className="search-section">
              <div className="search-controls">
                <div className="input-group">
                  <label htmlFor="hamDocumentNumber">Dosya Numarası:</label>
                  <input
                    id="hamDocumentNumber"
                    type="text"
                    value={documentNumber}
                    onChange={(e) => setDocumentNumber(e.target.value)}
                    placeholder="Dosya numarasını girin..."
                    className="search-input"
                    onKeyPress={(e) => e.key === 'Enter' && handleSearch()}
                  />
                </div>
                <button 
                  onClick={handleSearch} 
                  disabled={loading}
                  className="search-btn"
                  style={{ backgroundColor: '#ffb347', color: '#fff8f0' }}
                >
                  {loading ? 'Aranıyor...' : '🔍 Ham Veri Ara'}
                </button>
              </div>
            </div>

            {/* Error Display for HAM */}
            {error && (
              <div className="error-message">
                ⚠️ {error}
              </div>
            )}

            {/* HAM Data Results */}
            {searchResults.length > 0 && (
              <div className="results-section">
                <h3>Ham Veri Sonuçları ({searchResults.length} kayıt)</h3>
                {renderDataTable()}
              </div>
            )}

            {/* Empty State for HAM */}
            {!loading && searchResults.length === 0 && !error && documentNumber && (
              <div className="empty-state">
                <p>Bu dosya numarası için ham veri bulunamadı.</p>
              </div>
            )}
          </div>
        )}
        {activeTab === 'pivot' && (
          <div className="tab-content">
            <h2>🔄 PIVOT VERİ</h2>
            
            {/* Search Section for PIVOT */}
            <div className="search-section">
              <div className="search-controls">
                <div className="input-group">
                  <label htmlFor="pivotDocumentNumber">Dosya Numarası:</label>
                  <input
                    id="pivotDocumentNumber"
                    type="text"
                    value={documentNumber}
                    onChange={(e) => setDocumentNumber(e.target.value)}
                    placeholder="Dosya numarasını girin..."
                    className="search-input"
                    onKeyPress={(e) => e.key === 'Enter' && handleSearch()}
                  />
                </div>
                <button 
                  onClick={handleSearch} 
                  disabled={loading}
                  className="search-btn"
                  style={{ backgroundColor: '#ffd166', color: '#fff8f0' }}
                >
                  {loading ? 'Aranıyor...' : '🔍 Pivot Veri Ara'}
                </button>
              </div>
            </div>

            {/* Error Display for PIVOT */}
            {error && (
              <div className="error-message">
                ⚠️ {error}
              </div>
            )}

            {/* PIVOT Data Results */}
            {searchResults.length > 0 && (
              <div className="results-section">
                <h3>Pivot Veri Sonuçları ({searchResults.length} kayıt)</h3>
                {renderDataTable()}
              </div>
            )}

            {/* Empty State for PIVOT */}
            {!loading && searchResults.length === 0 && !error && documentNumber && (
              <div className="empty-state">
                <p>Bu dosya numarası için pivot veri bulunamadı.</p>
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  )
}

export default MacroController
