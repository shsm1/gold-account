const GOLD_PRICE_API = 'https://api.gold-api.com/price/XAU'
const EXCHANGE_RATE_API = 'https://api.exchangerate-api.com/v4/latest/USD'
let USD_TO_CNY_RATE = 6.83
const OUNCE_TO_GRAM = 31.1035

export async function fetchGoldPrice() {
  try {
    const [goldResponse, exchangeResponse] = await Promise.all([
      fetch(GOLD_PRICE_API),
      fetch(EXCHANGE_RATE_API)
    ])
    
    if (!goldResponse.ok) {
      throw new Error('获取金价失败')
    }
    
    if (exchangeResponse.ok) {
      const exchangeData = await exchangeResponse.json()
      if (exchangeData.rates && exchangeData.rates.CNY) {
        USD_TO_CNY_RATE = exchangeData.rates.CNY
      }
    }
    
    const goldData = await goldResponse.json()
    // 将美元/盎司转换为人民币/克
    const pricePerOunceUSD = goldData.price
    const pricePerGramCNY = ((pricePerOunceUSD * USD_TO_CNY_RATE / OUNCE_TO_GRAM)+2).toFixed(2)
    return parseFloat(pricePerGramCNY)
  } catch (error) {
    console.error('获取实时金价失败:', error)
    return null
  }
}

export function startAutoRefresh(callback, interval = 60000) {
  callback()
  const timer = setInterval(callback, interval)
  return () => clearInterval(timer)
}
