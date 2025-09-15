/**
 * Döviz kuru servisi - ExchangeRate API kullanılıyor
 * Ücretsiz tier: günde 1000 request
 */

export interface ExchangeRates {
  EUR: number
  USD: number
  TRY: number
  lastUpdated: string
}

export interface CurrencyApiResponse {
  success: boolean
  timestamp: number
  base: string
  date: string
  rates: {
    [key: string]: number
  }
}

class CurrencyService {
  private readonly baseUrl = 'https://api.exchangerate-api.com/v4/latest'
  private cachedRates: ExchangeRates | null = null
  private lastFetchTime: number = 0
  private readonly cacheValidityMs = 5 * 60 * 1000 // 5 dakika cache (güncel kurlar için)
  private manualRates: ExchangeRates | null = null // Manuel olarak girilen kurlar

  /**
   * Manuel döviz kurları ayarla
   */
  setManualRates(rates: Record<string, number> | null): void {
    if (rates) {
      this.manualRates = {
        USD: rates.USD || 0,
        EUR: rates.EUR || 0,
        TRY: 1,
        lastUpdated: new Date().toISOString()
      }
      console.log('💰 Manuel döviz kurları ayarlandı:', this.manualRates)
    } else {
      this.manualRates = null
      console.log('💰 Manuel döviz kurları temizlendi, API kullanılacak')
    }
  }

  /**
   * Manuel kurların ayarlanıp ayarlanmadığını kontrol et
   */
  hasManualRates(): boolean {
    return this.manualRates !== null
  }

  /**
   * Manuel kurları temizle
   */
  clearManualRates(): void {
    this.setManualRates(null)
  }

  /**
   * TRY bazında güncel döviz kurlarını al (manuel kurlar öncelikli)
   */
  async getExchangeRates(): Promise<ExchangeRates> {
    // Eğer manuel kurlar varsa, onları kullan
    if (this.manualRates) {
      console.log('💰 Manuel döviz kurları kullanılıyor:', this.manualRates)
      return this.manualRates
    }

    // Cache kontrolü
    if (this.cachedRates && (Date.now() - this.lastFetchTime) < this.cacheValidityMs) {
      console.log('🔄 Using cached exchange rates:', this.cachedRates)
      return this.cachedRates
    }

    try {
      console.log('🌍 Fetching fresh exchange rates from API...')
      
      // USD bazında kurları al (daha yaygın format)
      const response = await fetch(`${this.baseUrl}/USD`)
      
      if (!response.ok) {
        throw new Error(`API request failed: ${response.status}`)
      }
      
      const data: CurrencyApiResponse = await response.json()
      
      console.log('📡 API Response:', data)
      
      if (!data.rates) {
        throw new Error('Invalid API response format - no rates found')
      }

      // USD bazındaki kurları TRY'ye çevir
      const usdToTry = data.rates.TRY || 34.1 // 1 USD = ? TRY
      const eurToTry = data.rates.EUR ? (usdToTry / data.rates.EUR) : 37.2 // 1 EUR = ? TRY

      this.cachedRates = {
        EUR: eurToTry,
        USD: usdToTry,
        TRY: 1, // TRY'den TRY'ye kur her zaman 1
        lastUpdated: new Date().toISOString()
      }

      this.lastFetchTime = Date.now()

      console.log('✅ Exchange rates updated from LIVE API:', this.cachedRates)
      console.log('🔗 API URL used:', `${this.baseUrl}/USD`)
      return this.cachedRates

    } catch (error) {
      console.error('❌ Failed to fetch exchange rates:', error)
      
      const fallbackRates: ExchangeRates = {
        EUR: 48, 
        USD: 41, 
        TRY: 1,
        lastUpdated: new Date().toISOString()
      }

      console.warn('⚠️ Using fallback exchange rates:', fallbackRates)
      return fallbackRates
    }
  }

  /**
   * Belirli bir para biriminden TRY'ye çevir
   */
  async convertToTRY(amount: number, fromCurrency: string): Promise<number> {
    if (fromCurrency === 'TRY') {
      return amount // TRY'den TRY'ye çevirme gerek yok
    }

    const rates = await this.getExchangeRates()
    
    switch (fromCurrency.toUpperCase()) {
      case 'EUR':
        return amount * rates.EUR
      case 'USD':
        return amount * rates.USD
      case 'TRY':
        return amount
      default:
        console.warn(`⚠️ Unsupported currency: ${fromCurrency}, using original amount`)
        return amount
    }
  }

  /**
   * Para birimi sembolü al
   */
  getCurrencySymbol(currency: string): string {
    switch (currency?.toUpperCase()) {
      case 'EUR':
        return '€'
      case 'USD':
        return '$'
      case 'TRY':
        return '₺'
      default:
        return ''
    }
  }

  /**
   * Cache'i temizle (test amaçlı)
   */
  clearCache(): void {
    this.cachedRates = null
    this.lastFetchTime = 0
    console.log('🗑️ Currency cache cleared')
  }

  /**
   * Cache'deki kurları al (UI'da gösterim için)
   */
  getCachedRates(): ExchangeRates | null {
    return this.cachedRates
  }
}

// Singleton instance
export const currencyService = new CurrencyService()

// Browser konsolu için global test fonksiyonları
if (typeof window !== 'undefined') {
  (window as any).testCurrencyService = async () => {
    console.log('🧪 Testing Currency Service...')
    
    try {
      // Önce cache'i temizle
      currencyService.clearCache()
      console.log('🗑️ Cache cleared, fetching fresh rates...')
      
      const rates = await currencyService.getExchangeRates()
      console.log('📊 Fresh exchange rates from API:', rates)
      
      // Test conversions
      const eur100ToTry = await currencyService.convertToTRY(100, 'EUR')
      const usd100ToTry = await currencyService.convertToTRY(100, 'USD')
      const try100ToTry = await currencyService.convertToTRY(100, 'TRY')
      
      console.log('💰 Conversion tests:')
      console.log(`100 EUR = ${eur100ToTry.toFixed(2)} TRY`)
      console.log(`100 USD = ${usd100ToTry.toFixed(2)} TRY`)
      console.log(`100 TRY = ${try100ToTry.toFixed(2)} TRY`)
      
      return { rates, conversions: { eur100ToTry, usd100ToTry, try100ToTry } }
    } catch (error) {
      console.error('❌ Currency service test failed:', error)
      return null
    }
  }

  // Cache temizleme fonksiyonu
  (window as any).clearCurrencyCache = () => {
    currencyService.clearCache()
    console.log('✅ Currency cache cleared!')
  }
}

export default currencyService
