export function calculateHolding(transactions) {
  if (!transactions || transactions.length === 0) {
    return {
      totalGrams: 0,
      avgCost: 0,
      totalInvested: 0,
      totalReturned: 0,
      realizedProfit: 0
    }
  }

  const sorted = [...transactions].sort((a, b) => new Date(a.date) - new Date(b.date))

  let totalGrams = 0
  let totalBuyAmount = 0
  let totalSellAmount = 0
  let totalInvested = 0
  let totalReturned = 0
  let realizedProfit = 0

  for (const tx of sorted) {
    if (tx.type === 'buy') {
      const amount = tx.grams * tx.pricePerGram + (tx.fee || 0)
      totalGrams += tx.grams
      totalBuyAmount += amount
      totalInvested += amount
    } else {
      const sellAmount = tx.grams * tx.pricePerGram - (tx.fee || 0)
      const avgCost = totalGrams > 0 ? (totalBuyAmount - totalSellAmount) / totalGrams : 0
      const profit = (tx.pricePerGram - avgCost) * tx.grams - (tx.fee || 0)

      realizedProfit += profit
      totalSellAmount += sellAmount
      totalReturned += sellAmount
      totalGrams -= tx.grams

      if (totalGrams < 0.0001) {
        totalGrams = 0
      }
    }
  }

  // 获取所有批次，计算批次盈亏总和
  const batches = getBatches(transactions)
  const batchRealizedProfit = batches.reduce((sum, batch) => sum + batch.realizedProfit, 0)

  return {
    totalGrams: parseFloat(totalGrams.toFixed(4)),
    avgCost: totalGrams > 0 ? parseFloat(((totalBuyAmount - totalSellAmount) / totalGrams).toFixed(2)) : 0,
    totalInvested: parseFloat(totalInvested.toFixed(2)),
    totalReturned: parseFloat(totalReturned.toFixed(2)),
    realizedProfit: parseFloat(batchRealizedProfit.toFixed(2))
  }
}

export function formatMoney(amount) {
  return '¥' + Number(amount).toFixed(2)
}

export function formatGrams(grams) {
  return Number(grams).toFixed(2) + 'g'
}

export function formatDate(dateStr) {
  const date = new Date(dateStr)
  const year = date.getFullYear()
  const month = String(date.getMonth() + 1).padStart(2, '0')
  const day = String(date.getDate()).padStart(2, '0')
  return `${year}-${month}-${day}`
}

export function getBatches(transactions) {
  const batches = {}

  // 第一遍：处理所有买入交易，创建批次
  for (const tx of transactions) {
    if (tx.type === 'buy') {
      const batchId = tx.batchId || `batch_${tx.id}`
      if (!batches[batchId]) {
        batches[batchId] = {
          id: batchId,
          buyDate: tx.date,
          buyPrice: tx.pricePerGram,
          costPerGram: parseFloat(((tx.pricePerGram * tx.grams + (tx.fee || 0)) / tx.grams).toFixed(4)),
          buyGrams: tx.grams,
          remainingGrams: tx.grams,
          soldGrams: 0,
          realizedProfit: 0,
          totalSoldAmount: 0,
          fee: tx.fee || 0,
          note: tx.note || '',
          txId: tx.id
        }
      }
    }
  }

  // 第二遍：处理所有卖出交易，扣除对应批次的持仓
  for (const tx of transactions) {
    if (tx.type === 'sell' && tx.sourceBatchId) {
      const batch = batches[tx.sourceBatchId]
      if (batch) {
        batch.remainingGrams = Math.max(0, parseFloat((batch.remainingGrams - tx.grams).toFixed(4)))
        batch.soldGrams = parseFloat((batch.soldGrams + tx.grams).toFixed(4))
        batch.realizedProfit = parseFloat((batch.realizedProfit + (tx.pricePerGram - batch.costPerGram) * tx.grams - (tx.fee || 0)).toFixed(2))
        batch.totalSoldAmount = parseFloat((batch.totalSoldAmount + tx.grams * tx.pricePerGram - (tx.fee || 0)).toFixed(2))
      }
    }
  }

  return Object.values(batches).sort((a, b) => new Date(b.buyDate) - new Date(a.buyDate))
}

export function getAvailableBatches(transactions) {
  return getBatches(transactions).filter(b => b.remainingGrams > 0.0001)
}

export function calculateFloatingProfit(batches, currentPrice) {
  if (!currentPrice || currentPrice <= 0) {
    return { floatingProfit: 0, totalMarketValue: 0 }
  }

  let floatingProfit = 0
  let totalMarketValue = 0

  for (const batch of batches) {
    if (batch.remainingGrams > 0.0001) {
      floatingProfit += (currentPrice - batch.buyPrice) * batch.remainingGrams
      totalMarketValue += currentPrice * batch.remainingGrams
    }
  }

  return {
    floatingProfit: parseFloat(floatingProfit.toFixed(2)),
    totalMarketValue: parseFloat(totalMarketValue.toFixed(2))
  }
}

export function getSettings() {
  const saved = localStorage.getItem('gold-account-settings')
  if (saved) return JSON.parse(saved)
  return { buyFeeRate: 0, sellFeeRate: 0 }
}

export function saveSettings(settings) {
  localStorage.setItem('gold-account-settings', JSON.stringify(settings))
}

export function getTotalInvested() {
  return parseFloat(localStorage.getItem('gold-total-invested') || '0')
}

export function setTotalInvested(amount) {
  localStorage.setItem('gold-total-invested', amount.toString())
}

export function generateId() {
  return Date.now().toString(36) + Math.random().toString(36).substr(2, 9)
}

export function calculateIcbcHolding(transactions) {
  if (!transactions || transactions.length === 0) {
    return {
      totalGrams: 0,
      avgCost: 0,
      totalInvested: 0,
      realizedProfit: 0,
      extractedGrams: 0
    }
  }

  const sorted = [...transactions].sort((a, b) => new Date(a.date) - new Date(b.date))

  let totalGrams = 0
  let totalCost = 0
  let totalInvested = 0
  let realizedProfit = 0
  let extractedGrams = 0

  for (const tx of sorted) {
    if (tx.type === 'buy') {
      const amount = tx.grams * tx.pricePerGram
      totalGrams += tx.grams
      totalCost += amount
      totalInvested += amount
    } else if (tx.type === 'sell') {
      const avgCost = totalGrams > 0 ? totalCost / totalGrams : 0
      const sellAmount = tx.grams * tx.pricePerGram - (tx.fee || 0)
      const profit = (tx.pricePerGram - avgCost) * tx.grams - (tx.fee || 0)

      realizedProfit += profit
      totalGrams -= tx.grams
      totalCost -= avgCost * tx.grams

      if (totalGrams < 0.0001) {
        totalGrams = 0
        totalCost = 0
      }
    } else if (tx.type === 'extract') {
      const avgCost = totalGrams > 0 ? totalCost / totalGrams : 0
      extractedGrams += tx.grams
      totalGrams -= tx.grams
      totalCost -= avgCost * tx.grams

      if (totalGrams < 0.0001) {
        totalGrams = 0
        totalCost = 0
      }
    }
  }

  return {
    totalGrams: parseFloat(totalGrams.toFixed(2)),
    avgCost: totalGrams > 0 ? parseFloat((totalCost / totalGrams).toFixed(2)) : 0,
    totalInvested: parseFloat(totalInvested.toFixed(2)),
    realizedProfit: parseFloat(realizedProfit.toFixed(2)),
    extractedGrams: parseFloat(extractedGrams.toFixed(2))
  }
}

export function getIcbcBatches(transactions) {
  const batches = {}

  for (const tx of transactions) {
    if (tx.type === 'buy') {
      const batchId = tx.batchId || `batch_${tx.id}`
      if (!batches[batchId]) {
        batches[batchId] = {
          id: batchId,
          buyDate: tx.date,
          buyPrice: tx.pricePerGram,
          costPerGram: parseFloat((tx.pricePerGram * tx.grams / tx.grams).toFixed(4)),
          buyGrams: tx.grams,
          remainingGrams: tx.grams,
          soldGrams: 0,
          extractedGrams: 0,
          realizedProfit: 0,
          txId: tx.id
        }
      }
    } else if ((tx.type === 'sell' || tx.type === 'extract') && tx.sourceBatchId) {
      const batch = batches[tx.sourceBatchId]
      if (batch) {
        if (tx.type === 'sell') {
          batch.remainingGrams = Math.max(0, parseFloat((batch.remainingGrams - tx.grams).toFixed(4)))
          batch.soldGrams = parseFloat((batch.soldGrams + tx.grams).toFixed(4))
          batch.realizedProfit = parseFloat((batch.realizedProfit + (tx.pricePerGram - batch.costPerGram) * tx.grams - (tx.fee || 0)).toFixed(2))
        } else if (tx.type === 'extract') {
          batch.remainingGrams = Math.max(0, parseFloat((batch.remainingGrams - tx.grams).toFixed(4)))
          batch.extractedGrams = parseFloat((batch.extractedGrams + tx.grams).toFixed(4))
        }
      }
    }
  }

  return Object.values(batches).sort((a, b) => new Date(b.buyDate) - new Date(a.buyDate))
}

export function getAvailableIcbcBatches(transactions) {
  return getIcbcBatches(transactions).filter(b => b.remainingGrams > 0.0001)
}
