import { API_CONFIG } from '../services/config'

export const debugExcelRead = async (fileName: string) => {
  const url = `${API_CONFIG.BASE_URL}/excel/read/${encodeURIComponent(fileName)}`
  
  console.log('🔍 Debug Excel Read:')
  console.log('📁 Original fileName:', fileName)
  console.log('🔗 Encoded fileName:', encodeURIComponent(fileName))
  console.log('🌐 Full URL:', url)
  console.log('⚙️ API Config:', API_CONFIG)
  
  try {
    const response = await fetch(url, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
    })
    
    console.log('📡 Response status:', response.status)
    console.log('📡 Response ok:', response.ok)
    console.log('📡 Response headers:', Object.fromEntries(response.headers.entries()))
    
    if (!response.ok) {
      const errorText = await response.text()
      console.error('❌ Error response body:', errorText)
      
      try {
        const errorJson = JSON.parse(errorText)
        console.error('📋 Parsed error JSON:', errorJson)
      } catch {
        console.error('📋 Error is not JSON format')
      }
    } else {
      const result = await response.json()
      console.log('✅ Success response:', result)
    }
    
    return response
  } catch (error) {
    console.error('💥 Network/Fetch error:', error)
    throw error
  }
}

export const checkBackendConnection = async () => {
  const testUrl = `${API_CONFIG.BASE_URL}/excel/test`
  
  console.log('🔍 Testing backend connection:')
  console.log('🌐 Test URL:', testUrl)
  
  try {
    const response = await fetch(testUrl, {
      method: 'GET',
      headers: {
        'Content-Type': 'application/json',
      },
    })
    
    console.log('📡 Backend test response status:', response.status)
    console.log('📡 Backend test response ok:', response.ok)
    
    if (response.ok) {
      const result = await response.json()
      console.log('✅ Backend connection successful:', result)
      return true
    } else {
      console.error('❌ Backend connection failed')
      return false
    }
  } catch (error) {
    console.error('💥 Backend connection error:', error)
    return false
  }
}

export const listFiles = async () => {
  const url = `${API_CONFIG.BASE_URL}/excel/files`
  
  console.log('🔍 Listing files:')
  console.log('🌐 Files URL:', url)
  
  try {
    const response = await fetch(url, {
      method: 'GET',
      headers: {
        'Content-Type': 'application/json',
      },
    })
    
    console.log('📡 Files response status:', response.status)
    
    if (response.ok) {
      const result = await response.json()
      console.log('📁 Available files:', result)
      return result
    } else {
      console.error('❌ Failed to list files')
      return null
    }
  } catch (error) {
    console.error('💥 List files error:', error)
    return null
  }
}
