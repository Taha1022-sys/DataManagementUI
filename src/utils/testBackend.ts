import { excelService } from '../services'

// Test backend connection
export async function testBackendConnection(): Promise<boolean> {
  try {
    console.log('Testing backend connection...')
    const response = await excelService.testConnection()
    console.log('Backend connection test result:', response)
    return response.success
  } catch (error) {
    console.error('Backend connection failed:', error)
    return false
  }
}

// Test file upload
export async function testFileUpload(file: File): Promise<boolean> {
  try {
    console.log('Testing file upload...')
    const response = await excelService.uploadFile(file, 'test-user')
    console.log('File upload test result:', response)
    return response.success
  } catch (error) {
    console.error('File upload test failed:', error)
    return false
  }
}

// Test file list
export async function testFileList(): Promise<boolean> {
  try {
    console.log('Testing file list...')
    const response = await excelService.getFiles()
    console.log('File list test result:', response)
    return response.success && Array.isArray(response.data)
  } catch (error) {
    console.error('File list test failed:', error)
    return false
  }
}

// Test sheets for a specific file
export async function testSheets(fileName: string): Promise<boolean> {
  try {
    console.log('Testing sheets for file:', fileName)
    const response = await excelService.getSheets(fileName)
    console.log('Sheets test result:', response)
    return response.success && Array.isArray(response.data)
  } catch (error) {
    console.error('Sheets test failed:', error)
    return false
  }
}

// Test data retrieval for a specific file and sheet
export async function testDataRetrieval(fileName: string, sheetName?: string): Promise<boolean> {
  try {
    console.log('Testing data retrieval for:', { fileName, sheetName })
    const response = await excelService.getData(fileName, sheetName, 1, 10)
    console.log('Data retrieval test result:', response)
    return response.success && Array.isArray(response.data)
  } catch (error) {
    console.error('Data retrieval test failed:', error)
    return false
  }
}

// Run comprehensive data viewing tests
export async function runDataViewingTests(fileName?: string): Promise<{
  connection: boolean
  fileList: boolean
  sheets: boolean
  dataRetrieval: boolean
  overallSuccess: boolean
}> {
  console.log('🚀 Starting comprehensive data viewing tests...')
  
  const connectionTest = await testBackendConnection()
  console.log(`✅ Backend Connection: ${connectionTest ? 'PASS' : 'FAIL'}`)
  
  const fileListTest = await testFileList()
  console.log(`✅ File List API: ${fileListTest ? 'PASS' : 'FAIL'}`)
  
  let sheetsTest = true
  let dataRetrievalTest = true
  
  if (fileName) {
    sheetsTest = await testSheets(fileName)
    console.log(`✅ Sheets API: ${sheetsTest ? 'PASS' : 'FAIL'}`)
    
    dataRetrievalTest = await testDataRetrieval(fileName)
    console.log(`✅ Data Retrieval API: ${dataRetrievalTest ? 'PASS' : 'FAIL'}`)
  } else {
    console.log(`ℹ️ Sheets and Data tests skipped (no file selected)`)
  }
  
  const overallSuccess = connectionTest && fileListTest && sheetsTest && dataRetrievalTest
  console.log(`🎯 Overall Test Result: ${overallSuccess ? 'ALL PASS' : 'SOME FAILED'}`)
  
  return {
    connection: connectionTest,
    fileList: fileListTest,
    sheets: sheetsTest,
    dataRetrieval: dataRetrievalTest,
    overallSuccess
  }
}

// Run all tests
export async function runAllTests(): Promise<void> {
  console.log('🚀 Starting frontend-backend integration tests...')
  
  const connectionTest = await testBackendConnection()
  console.log(`✅ Backend Connection: ${connectionTest ? 'PASS' : 'FAIL'}`)
  
  const fileListTest = await testFileList()
  console.log(`✅ File List API: ${fileListTest ? 'PASS' : 'FAIL'}`)
  
  console.log('🏁 Integration tests completed!')
  
  if (connectionTest && fileListTest) {
    console.log('🎉 All tests passed! Backend integration is working.')
  } else {
    console.log('❌ Some tests failed. Check backend server and CORS configuration.')
  }
}
