import { API_CONFIG } from '../services/config'

export const diagnoseExcelError = async () => {
  console.log('🔍 EXCEL ERROR DIAGNOSIS STARTING...')
  console.log('=' .repeat(50))
  
  // 1. Check configuration
  console.log('📋 1. CONFIGURATION CHECK:')
  console.log('   API Base URL:', API_CONFIG.BASE_URL)
  console.log('   Timeout:', API_CONFIG.TIMEOUT)
  console.log('   Headers:', API_CONFIG.HEADERS)
  console.log('')
  
  // 2. Test backend connectivity
  console.log('🔗 2. BACKEND CONNECTIVITY TEST:')
  try {
    const testUrl = `${API_CONFIG.BASE_URL}/excel/test`
    console.log('   Testing URL:', testUrl)
    
    const response = await fetch(testUrl, {
      method: 'GET',
      headers: API_CONFIG.HEADERS,
    })
    
    console.log('   Response Status:', response.status)
    console.log('   Response OK:', response.ok)
    console.log('   Response Headers:', Object.fromEntries(response.headers.entries()))
    
    if (response.ok) {
      const result = await response.json()
      console.log('   ✅ Backend Connection: SUCCESS')
      console.log('   Response:', result)
    } else {
      console.log('   ❌ Backend Connection: FAILED')
      const errorText = await response.text()
      console.log('   Error:', errorText)
    }
  } catch (error) {
    console.log('   💥 Backend Connection: ERROR')
    console.log('   Error:', error)
  }
  console.log('')
  
  // 3. List available files
  console.log('📁 3. AVAILABLE FILES TEST:')
  try {
    const filesUrl = `${API_CONFIG.BASE_URL}/excel/files`
    console.log('   Files URL:', filesUrl)
    
    const response = await fetch(filesUrl, {
      method: 'GET',
      headers: API_CONFIG.HEADERS,
    })
    
    console.log('   Files Response Status:', response.status)
    
    if (response.ok) {
      const result = await response.json()
      console.log('   ✅ Files List: SUCCESS')
      console.log('   Available Files:', result.data || result)
      
      // Test with the problematic file if it exists
      const files = result.data || result.files || []
      const problematicFile = files.find((f: any) => 
        f.fileName?.includes('Gerçekleşen') || 
        f.name?.includes('Gerçekleşen') ||
        f.includes?.('Gerçekleşen')
      )
      
      if (problematicFile) {
        console.log('   🎯 Found problematic file:', problematicFile)
        await testFileReading(problematicFile)
      }
    } else {
      console.log('   ❌ Files List: FAILED')
      const errorText = await response.text()
      console.log('   Error:', errorText)
    }
  } catch (error) {
    console.log('   💥 Files List: ERROR')
    console.log('   Error:', error)
  }
  console.log('')
  
  console.log('🔍 DIAGNOSIS COMPLETE')
  console.log('=' .repeat(50))
}

const testFileReading = async (file: any) => {
  console.log('📖 4. FILE READING TEST:')
  
  const fileName = file.fileName || file.name || file
  console.log('   Testing file:', fileName)
  
  try {
    const readUrl = `${API_CONFIG.BASE_URL}/excel/read/${encodeURIComponent(fileName)}`
    console.log('   Read URL:', readUrl)
    console.log('   Encoded filename:', encodeURIComponent(fileName))
    
    const response = await fetch(readUrl, {
      method: 'POST',
      headers: API_CONFIG.HEADERS,
    })
    
    console.log('   Read Response Status:', response.status)
    console.log('   Read Response OK:', response.ok)
    
    if (response.ok) {
      const result = await response.json()
      console.log('   ✅ File Reading: SUCCESS')
      console.log('   Result:', result)
    } else {
      console.log('   ❌ File Reading: FAILED')
      const errorText = await response.text()
      console.log('   Error:', errorText)
      
      // Try to parse error as JSON for more details
      try {
        const errorJson = JSON.parse(errorText)
        console.log('   Parsed Error:', errorJson)
      } catch {
        console.log('   Raw Error Text:', errorText)
      }
    }
  } catch (error) {
    console.log('   💥 File Reading: ERROR')
    console.log('   Error:', error)
  }
}

// Helper function to test specific file
export const testSpecificFile = async (fileName: string) => {
  console.log(`🔍 TESTING SPECIFIC FILE: ${fileName}`)
  console.log('=' .repeat(50))
  
  await testFileReading(fileName)
  
  console.log('🔍 SPECIFIC FILE TEST COMPLETE')
  console.log('=' .repeat(50))
}

// Helper function to test network connectivity
export const testNetworkConnectivity = async () => {
  console.log('🌐 NETWORK CONNECTIVITY TEST')
  console.log('=' .repeat(30))
  
  const testUrls = [
    'http://localhost:5002',
    'http://localhost:5002/api',
    'http://localhost:5002/api/excel',
    'http://localhost:5002/api/excel/test',
    'https://localhost:7002',
    'https://localhost:7002/api',
    'https://localhost:7002/api/excel/test'
  ]
  
  for (const url of testUrls) {
    try {
      console.log(`Testing: ${url}`)
      const response = await fetch(url, { method: 'GET' })
      console.log(`  Status: ${response.status} (${response.ok ? 'OK' : 'FAILED'})`)
    } catch (error) {
      console.log(`  Error: ${error.message}`)
    }
  }
  
  console.log('🌐 NETWORK TEST COMPLETE')
  console.log('=' .repeat(30))
}
