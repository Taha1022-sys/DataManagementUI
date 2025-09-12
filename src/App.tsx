import { useState } from 'react'
import Header from './components/Header'
import Sidebar from './components/Sidebar'
import Dashboard from './components/Dashboard'
import FileManager from './components/FileManager'
import DataViewer from './components/DataViewer'
import DataComparison from './components/DataComparison'
import ChangeHistory from './components/ChangeHistory'
import MacroController from './components/MacroController'
import './App.css'
import './components/components.css'

type ActivePage = 'dashboard' | 'files' | 'data' | 'comparison' | 'history' | 'macro'

function App() {
  const [activePage, setActivePage] = useState<ActivePage>('dashboard')
  const [selectedFile, setSelectedFile] = useState<string | null>(null)

  const renderContent = () => {
    switch (activePage) {
      case 'dashboard':
        return <Dashboard onNavigate={setActivePage} />
      case 'files':
        return <FileManager onFileSelect={setSelectedFile} onNavigate={setActivePage} />
      case 'data':
        return <DataViewer selectedFile={selectedFile} />
      case 'comparison':
        return <DataComparison />
      case 'history':
        return <ChangeHistory selectedFile={selectedFile} />
      case 'macro':
        return <MacroController />
      default:
        return <Dashboard onNavigate={setActivePage} />
    }
  }

  return (
    <div className="app">
      <Header />
      <div className="app-body">
        <Sidebar activePage={activePage} onPageChange={setActivePage} />
        <main className="main-content">
          {renderContent()}
        </main>
      </div>
    </div>
  )
}

export default App
