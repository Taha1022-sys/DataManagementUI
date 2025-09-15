// Hesaplama utility fonksiyonları
import { currencyService } from '../services/currencyService'

export interface StockCalculationData {
  girişMiktarı: number
  çıkışMiktarı: number
  birimFiyat: number
  paraBirimi?: string
}

export interface CalculationResult {
  toplamStokMiktarı: number
  toplamFiyat: number
  toplamFiyatTRY: number
  originalCurrency?: string
}

/**
 * Stok hesaplamaları için utility fonksiyonları
 */
export class StockCalculator {
  
  /**
   * Toplam stok miktarını hesapla: Giriş Miktarı - Çıkış Miktarı
   */
  static calculateTotalStock(girişMiktarı: number, çıkışMiktarı: number): number {
    const giriş = this.toNumber(girişMiktarı)
    const çıkış = this.toNumber(çıkışMiktarı)
    return giriş - çıkış
  }

  /**
   * Toplam fiyatı hesapla: Toplam Stok Miktarı × Birim Fiyat
   */
  static calculateTotalPrice(toplamStokMiktarı: number, birimFiyat: number): number {
    const stok = this.toNumber(toplamStokMiktarı)
    const fiyat = this.toNumber(birimFiyat)
    return stok * fiyat
  }

  /**
   * Tüm hesaplamaları bir arada yap
   */
  static calculateAll(data: StockCalculationData): CalculationResult {
    const toplamStokMiktarı = this.calculateTotalStock(data.girişMiktarı, data.çıkışMiktarı)
    const toplamFiyat = this.calculateTotalPrice(toplamStokMiktarı, data.birimFiyat)
    
    return {
      toplamStokMiktarı,
      toplamFiyat,
      toplamFiyatTRY: toplamFiyat, // Default olarak aynı değer, async güncelleme DataViewer'da yapılacak
      originalCurrency: data.paraBirimi || 'TRY'
    }
  }

  /**
   * Döviz kuru ile async hesaplama yap
   */
  static async calculateAllWithCurrency(data: StockCalculationData): Promise<CalculationResult> {
    const toplamStokMiktarı = this.calculateTotalStock(data.girişMiktarı, data.çıkışMiktarı)
    const toplamFiyat = this.calculateTotalPrice(toplamStokMiktarı, data.birimFiyat)
    
    let toplamFiyatTRY = toplamFiyat
    
    // Eğer para birimi EUR veya USD ise döviz kuru ile çevir
    if (data.paraBirimi && data.paraBirimi.toUpperCase() !== 'TRY') {
      try {
        toplamFiyatTRY = await currencyService.convertToTRY(toplamFiyat, data.paraBirimi)
        console.log(`💱 Currency conversion: ${toplamFiyat} ${data.paraBirimi} = ${toplamFiyatTRY.toFixed(2)} TRY`)
      } catch (error) {
        console.error('❌ Currency conversion failed:', error)
        // Hata durumunda orijinal fiyatı kullan
        toplamFiyatTRY = toplamFiyat
      }
    }
    
    return {
      toplamStokMiktarı,
      toplamFiyat,
      toplamFiyatTRY,
      originalCurrency: data.paraBirimi || 'TRY'
    }
  }



  /**
   * String veya number değeri güvenli number'a çevir
   */
  static toNumber(value: string | number | unknown): number {
    if (typeof value === 'number') {
      return isNaN(value) ? 0 : value
    }
    
    if (typeof value === 'string') {
      // Türkçe ondalık ayırıcı (virgül) desteği
      const cleanValue = value.replace(',', '.')
      const parsed = parseFloat(cleanValue)
      return isNaN(parsed) ? 0 : parsed
    }
    
    return 0
  }

  /**
   * Sayıyı formatla (Türkçe ondalık ayırıcı ile)
   */
  static formatNumber(value: number, decimals: number = 2): string {
    return value.toLocaleString('tr-TR', { 
      minimumFractionDigits: decimals, 
      maximumFractionDigits: decimals 
    })
  }

  /**
   * Belirli bir dosya için hesaplama yapılmalı mı kontrol et
   */
  static shouldCalculateFor(fileName: string | null): boolean {
    return fileName?.includes('gerceklesenmakrodata') || false
  }
}

/**
 * Sütun isimleri sabitleri
 */
export const COLUMN_NAMES = {
  TOPLAM_STOK_MIKTARI: 'Toplam Stok Miktarı',
  TOPLAM_STOK_CIKIS_MIKTARI: 'Toplam Stok Çıkış Miktarı', 
  TOPLAM_STOK_GIRIS_MIKTARI: 'Toplam Stok Giriş Miktarı',
  SATINALMA_BIRIM_FIYAT: 'Satınalma Birim Fiyat',
  TOPLAM_FIYAT: 'Toplam Fiyat',
  PARA_BIRIMI: 'Para Birimi'
} as const