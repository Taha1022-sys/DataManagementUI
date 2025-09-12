// Data Viewing Debug Script
// Bu script'i browser konsolunda çalıştırarak veri görüntüleme sorunlarını tespit edebilirsiniz

import { API_CONFIG } from '../services/config'

export async function debugDataViewing(fileName?: string) {
  console.log('🔍 Data Viewing Debug Script Started')
  console.log('=' .repeat(50))
  
  const results = {
    backendConnection: false,
    filesEndpoint: false,
    sheetsEndpoint: false,
    dataEndpoint: false,
    issues: [] as string[]
  }
  
  try {
    // Test 1: Backend Connection
    console.log('1️⃣ Testing Backend Connection...')
    try {
      const testResponse = await fetch(`${API_CONFIG.BASE_URL}/excel/test`)
      if (testResponse.ok) {
        results.backendConnection = true
        console.log('✅ Backend connection: SUCCESS')
      } else {
        results.issues.push(`Backend connection failed: HTTP ${testResponse.status}`)
        console.log('❌ Backend connection: FAILED', testResponse.status)
      }
    } catch (error) {
      results.issues.push(`Backend connection error: ${error}`)
      console.log('❌ Backend connection: ERROR', error)
    }
    
    // Test 2: Files Endpoint
    console.log('2️⃣ Testing Files Endpoint...')
    try {
      const filesResponse = await fetch(`${API_CONFIG.BASE_URL}/excel/files`)
      if (filesResponse.ok) {
        const filesData = await filesResponse.json()
        results.filesEndpoint = true
        console.log('✅ Files endpoint: SUCCESS')
        console.log('📁 Available files:', filesData.data?.length || 0, 'files')
        
        if (filesData.data && filesData.data.length > 0) {
          console.log('📋 Files list:', filesData.data.map((f: any) => f.fileName))
          
          // Auto-select first file if none provided
          if (!fileName && filesData.data.length > 0) {
            fileName = filesData.data[0].fileName
            console.log('🎯 Auto-selected file for testing:', fileName)
          }
        } else {
          results.issues.push('No files found in the system')
        }
      } else {
        results.issues.push(`Files endpoint failed: HTTP ${filesResponse.status}`)
        console.log('❌ Files endpoint: FAILED', filesResponse.status)
      }
    } catch (error) {
      results.issues.push(`Files endpoint error: ${error}`)
      console.log('❌ Files endpoint: ERROR', error)
    }
    
    // Test 3: Sheets Endpoint (if we have a file)
    if (fileName) {
      console.log('3️⃣ Testing Sheets Endpoint...')
      try {
        const sheetsUrl = `${API_CONFIG.BASE_URL}/excel/sheets/${encodeURIComponent(fileName)}`
        console.log('🔗 Sheets URL:', sheetsUrl)
        const sheetsResponse = await fetch(sheetsUrl)
        
        if (sheetsResponse.ok) {
          const sheetsData = await sheetsResponse.json()
          results.sheetsEndpoint = true
          console.log('✅ Sheets endpoint: SUCCESS')
          console.log('📄 Available sheets:', sheetsData.data?.length || 0, 'sheets')
          console.log('📋 Sheets list:', sheetsData.data?.map((s: any) => `${s.name} (${s.rowCount} rows)`))
          
          // Test 4: Data Endpoint
          if (sheetsData.data && sheetsData.data.length > 0) {
            const sheetName = sheetsData.data[0].name
            console.log('4️⃣ Testing Data Endpoint...')
            console.log('🎯 Using sheet:', sheetName)
            
            const dataUrl = `${API_CONFIG.BASE_URL}/excel/data/${encodeURIComponent(fileName)}?page=1&pageSize=5&sheetName=${encodeURIComponent(sheetName)}`
            console.log('🔗 Data URL:', dataUrl)
            
            try {
              const dataResponse = await fetch(dataUrl)
              if (dataResponse.ok) {
                const dataResult = await dataResponse.json()
                results.dataEndpoint = true
                console.log('✅ Data endpoint: SUCCESS')
                console.log('📊 Data result success:', dataResult.success)
                console.log('📊 Data count:', dataResult.data?.length || 0)
                
                if (dataResult.success && dataResult.data && dataResult.data.length > 0) {
                  console.log('🎉 VERI BULUNDU! İlk satır örneği:')
                  console.log(dataResult.data[0])
                } else {
                  results.issues.push('Data endpoint returned empty result')
                  console.log('⚠️ Data endpoint returned empty or unsuccessful result')
                  
                  // Try without sheet filter
                  console.log('🔄 Trying without sheet filter...')
                  const dataUrlNoSheet = `${API_CONFIG.BASE_URL}/excel/data/${encodeURIComponent(fileName)}?page=1&pageSize=5`
                  const dataResponseNoSheet = await fetch(dataUrlNoSheet)
                  if (dataResponseNoSheet.ok) {
                    const dataResultNoSheet = await dataResponseNoSheet.json()
                    console.log('📊 Data without sheet filter:', dataResultNoSheet)
                  }
                }
              } else {
                const dataError = await dataResponse.text()
                results.issues.push(`Data endpoint failed: HTTP ${dataResponse.status} - ${dataError}`)
                console.log('❌ Data endpoint: FAILED', dataResponse.status, dataError)
              }
            } catch (error) {
              results.issues.push(`Data endpoint error: ${error}`)
              console.log('❌ Data endpoint: ERROR', error)
            }
          } else {
            results.issues.push('No sheets found for the file')
          }
        } else {
          const sheetsError = await sheetsResponse.text()
          results.issues.push(`Sheets endpoint failed: HTTP ${sheetsResponse.status} - ${sheetsError}`)
          console.log('❌ Sheets endpoint: FAILED', sheetsResponse.status, sheetsError)
        }
      } catch (error) {
        results.issues.push(`Sheets endpoint error: ${error}`)
        console.log('❌ Sheets endpoint: ERROR', error)
      }
    } else {
      results.issues.push('No file available for testing sheets and data endpoints')
      console.log('⚠️ No file provided/found for sheets and data testing')
    }
    
  } catch (generalError) {
    console.log('💥 General error during debug:', generalError)
    results.issues.push(`General error: ${generalError}`)
  }
  
  // Summary
  console.log('')
  console.log('🎯 DEBUG SUMMARY')
  console.log('=' .repeat(50))
  console.log('Backend Connection:', results.backendConnection ? '✅ PASS' : '❌ FAIL')
  console.log('Files Endpoint:', results.filesEndpoint ? '✅ PASS' : '❌ FAIL')
  console.log('Sheets Endpoint:', results.sheetsEndpoint ? '✅ PASS' : '❌ FAIL')
  console.log('Data Endpoint:', results.dataEndpoint ? '✅ PASS' : '❌ FAIL')
  
  if (results.issues.length > 0) {
    console.log('')
    console.log('🚨 ISSUES FOUND:')
    results.issues.forEach((issue, index) => {
      console.log(`${index + 1}. ${issue}`)
    })
  }
  
  const allPassed = results.backendConnection && results.filesEndpoint && results.sheetsEndpoint && results.dataEndpoint
  console.log('')
  console.log('🏁 OVERALL RESULT:', allPassed ? '✅ ALL TESTS PASSED' : '❌ SOME TESTS FAILED')
  
  if (!allPassed) {
    console.log('')
    console.log('💡 TROUBLESHOOTING TIPS:')
    if (!results.backendConnection) {
      console.log('• Backend servisi çalışmıyor. Backend projesini başlatın.')
      console.log('• URL ayarlarını kontrol edin:', API_CONFIG.BASE_URL)
    }
    if (!results.filesEndpoint) {
      console.log('• Files API endpoint\'i çalışmıyor.')
      console.log('• Backend logs\'larını kontrol edin.')
    }
    if (!results.sheetsEndpoint) {
      console.log('• Sheets API endpoint\'i çalışmıyor.')
      console.log('• Dosya doğru yüklenmiş mi kontrol edin.')
    }
    if (!results.dataEndpoint) {
      console.log('• Data API endpoint\'i çalışmıyor.')
      console.log('• Veritabanı bağlantısını kontrol edin.')
      console.log('• Dosya işlenmiş mi kontrol edin.')
    }
  }
  
  return results
}

// Browser konsolu için global export
if (typeof window !== 'undefined') {
  (window as any).debugDataViewing = debugDataViewing
}
