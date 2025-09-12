import React from 'react'

type ActivePage = 'dashboard' | 'files' | 'data' | 'comparison' | 'history' | 'macro'

interface SidebarProps {
  activePage: ActivePage
  onPageChange: (page: ActivePage) => void
}

const Sidebar: React.FC<SidebarProps> = ({ activePage, onPageChange }) => {
  const menuItems = [
    {
      id: 'dashboard' as ActivePage,
      label: 'Dashboard',
      icon: '📊',
      description: 'Genel Bakış'
    },
    {
      id: 'files' as ActivePage,
      label: 'Dosya Yönetimi',
      icon: '📁',
      description: 'Excel Dosyaları'
    },
    {
      id: 'data' as ActivePage,
      label: 'Veri Görüntüleme',
      icon: '📋',
      description: 'Veri İnceleme'
    },
    {
      id: 'comparison' as ActivePage,
      label: 'Karşılaştırma',
      icon: '🔍',
      description: 'Veri Karşılaştırma'
    },
    {
      id: 'history' as ActivePage,
      label: 'Değişiklik Geçmişi',
      icon: '📈',
      description: 'Değişiklik Takibi'
    },
    {
      id: 'macro' as ActivePage,
      label: 'Macro Controller',
      icon: '🎛️',
      description: 'Veri Yönetimi'
    }
  ]

  return (
    <nav className="sidebar">
      <ul className="sidebar-nav">
        {menuItems.map((item) => (
          <li key={item.id}>
            <a
              href="#"
              className={activePage === item.id ? 'active' : ''}
              onClick={(e) => {
                e.preventDefault()
                onPageChange(item.id)
              }}
            >
              <span className="icon">{item.icon}</span>
              <div>
                <div>{item.label}</div>
                <div style={{ fontSize: '0.8rem', opacity: 0.7 }}>{item.description}</div>
              </div>
            </a>
          </li>
        ))}
      </ul>
    </nav>
  )
}

export default Sidebar
