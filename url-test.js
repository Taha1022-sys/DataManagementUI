// URL Test Script
import { API_CONFIG, API_ENDPOINTS } from './src/services/config'

const documentNumber = '1010001613000100'
const fileName = 'gerceklesenhesap_20250902100230.xlsx'

// Test URL construction
const baseEndpoint = API_ENDPOINTS.MACRO.SEARCH_BY_DOCUMENT(documentNumber)
const params = new URLSearchParams()
params.append('fileName', fileName)
const queryString = params.toString()
const fullUrl = `${API_CONFIG.BASE_URL}${baseEndpoint}${queryString ? `?${queryString}` : ''}`

console.log('=== URL Construction Test ===')
console.log('Document Number:', documentNumber)
console.log('File Name:', fileName)
console.log('Base URL:', API_CONFIG.BASE_URL)
console.log('Base Endpoint:', baseEndpoint)
console.log('Query String:', queryString)
console.log('Full URL:', fullUrl)
console.log('Expected URL:', 'http://localhost:5002/api/macro/search-by-document/1010001613000100?fileName=gerceklesenhesap_20250902100230.xlsx')
console.log('URLs Match:', fullUrl === 'http://localhost:5002/api/macro/search-by-document/1010001613000100?fileName=gerceklesenhesap_20250902100230.xlsx')
