<template>
  <div>
    <div class="holding-card">
      <div class="card-header">
        <h3>当前持仓:&nbsp{{ holding.totalGrams }}&nbsp克 </h3>
<!--        <div class="grams"></div>-->
<!--        <div class="unit"></div>-->
        <div class="account-balance">
          <h3>账户余额： {{ accountBalance }}</h3>
<!--          <span class="balance-value" :class="accountBalance >= 0 ? 'profit-positive' : 'profit-negative'">-->

<!--          </span>-->
        </div>
      </div>

      <div class="holding-details">
        <div class="item">
          <div class="label">平均成本</div>
          <div class="value">{{ holding.avgCost }}</div>
        </div>
        <div class="item">
          <div class="label">持仓总价</div>
          <div class="value gold-text">{{ holdingTotalValue }}</div>
        </div>
        <div class="item">
          <div class="label">已实现盈亏</div>
          <div class="value" :class="holding.realizedProfit >= 0 ? 'profit-positive' : 'profit-negative'">
            {{ holding.realizedProfit >= 0 ? '+' : '' }}{{ holding.realizedProfit }}
          </div>
        </div>
      </div>

      <div class="current-price-section">
        <div class="price-input-row">
          <span class="price-label">当前金价</span>
          <van-field
            v-model="currentPrice"
            type="number"
            placeholder="输入金价"
            class="price-input"
            :formatter="formatPriceInput"
            clearable
            @update:model-value="isAutoFetch = false"
          />
          <span class="price-unit">元/g</span>
          <van-button 
            class="btn-refresh"
            size="mini" 
            round 
            :type="isAutoFetch ? 'success' : 'default'"
            @click="refreshGoldPrice"
          >
            刷新
          </van-button>
          <van-button 
            v-if="currentPrice && parseFloat(currentPrice) > 0"
            class="btn-filter" 
            size="mini" 
            round 
            :type="priceFilterActive ? 'primary' : 'success'"
            @click="togglePriceFilter"
          >
            低于现价
          </van-button>
        </div>
        <div v-if="lastUpdateTime" class="update-time">
          更新于 {{ formatUpdateTime(lastUpdateTime) }}
        </div>
        <div v-if="currentPrice && parseFloat(currentPrice) > 0" class="floating-details">
          <div class="item">
            <div class="label">浮动盈亏</div>
            <div class="value" :class="floatingProfit >= 0 ? 'profit-positive' : 'profit-negative'">
              {{ floatingProfit >= 0 ? '+' : '' }}¥{{ floatingProfit }}
            </div>
          </div>
          <div class="item">
            <div class="label">总估值</div>
            <div class="value gold-text">¥{{ totalMarketValue }}</div>
          </div>
        </div>
      </div>
    </div>

    <div class="quick-actions">
      <van-button class="btn-press gold-btn" type="primary" block round @click="$router.push('/add?type=buy')">
        买入
      </van-button>
      <van-button class="btn-press" type="success" block round @click="$router.push('/add?type=sell')">
        卖出
      </van-button>
    </div>

<!--    <div class="section-header">-->
    <div>
<!--      <span class="section-title">持仓批次</span>-->
      <van-radio-group v-model="batchFilter" direction="horizontal" icon-size="10" class="custom-radio-group">
        <van-radio name="all">全部</van-radio>
        <van-radio name="active">持仓中</van-radio>
        <van-radio name="closed">已清仓</van-radio>
      </van-radio-group>
    </div>

    <div v-if="filteredBatches.length === 0" class="empty-state">
      <van-empty description="暂无批次记录" />
    </div>
    <div v-else>
      <div
        v-for="batch in filteredBatches"
        :key="batch.id"
        class="batch-card"
      >
        <div class="batch-header">
          <div class="batch-date">{{ formatDate(batch.buyDate) }}</div>
          <van-tag class="status" :type="batch.remainingGrams > 0.0001 ? 'primary' : 'default'" size="mini">
            {{ batch.remainingGrams > 0.0001 ? '持仓中' : '已清仓' }}
          </van-tag>
        </div>

        <div class="batch-content">

          <div class="batch-col">
            <div class="batch-row">
              <span class="label">成本</span>
              <span class="value">{{ batch.costPerGram.toFixed(2) }}</span>
            </div>
            <div class="batch-row">
              <span class="label">总价</span>
              <span class="value gold-text">{{ (batch.buyGrams * batch.costPerGram).toFixed(2) }}</span>
            </div>



          </div>
          
          <div class="batch-col">
            <div class="batch-row">
              <span class="label">已售</span>
              <span class="value">{{ batch.soldGrams }}</span>
            </div>
            <div class="batch-row">
              <span class="label">盈亏</span>
              <span class="value" :class="batch.realizedProfit >= 0 ? 'profit-positive' : 'profit-negative'">
                {{ batch.realizedProfit !== 0 ? (batch.realizedProfit >= 0 ? '+' : '') : '' }}{{ batch.realizedProfit.toFixed(2) }}
              </span>
            </div>

          </div>

          <div class="batch-col">
            <div class="batch-row">
              <span class="label">买入</span>
              <span class="value">{{ batch.buyGrams }}</span>
            </div>
            <div class="batch-row">
              <span class="label">剩余</span>
              <span class="value highlight">{{ batch.remainingGrams }}</span>
            </div>
          </div>
          
          <div v-if="currentPrice && parseFloat(currentPrice) > 0 && batch.remainingGrams > 0.0001" class="batch-col batch-profit-col">
            <div class="batch-row">
<!--              <span class="label"></span>-->
              <span class="value" :class="getBatchFloatingProfit(batch) >= 0 ? 'profit-positive-1' : 'profit-negative-1'">
                <span class="profit-arrow">{{ getBatchFloatingProfit(batch) >= 0 ? '↑' : '↓' }}</span>
                {{ Math.abs(getBatchFloatingProfit(batch)).toFixed(2) }}
              </span>
            </div>
          </div>
          
          <div class="batch-action">
            <van-button
              class="btn-sell"
              type="success"
              size="mini"
              round
              :disabled="batch.remainingGrams <= 0.0001"
              :style="{ visibility: batch.remainingGrams <= 0.0001 ? 'hidden' : 'visible' }"
              @click="sellFromBatch(batch)"
            >
              卖出
            </van-button>
          </div>
        </div>


      </div>
    </div>
  </div>
</template>

<script setup>
import { ref, computed, onMounted, onUnmounted, watch } from 'vue'
import { useRouter } from 'vue-router'
import { getAllTransactions, getAllIcbcTransactions } from '../db'
import { calculateHolding, getBatches, calculateFloatingProfit, formatDate, getTotalInvested, calculateIcbcHolding, getSettings } from '../utils/calculator'
import { fetchGoldPrice, startAutoRefresh } from '../utils/goldPrice'

const router = useRouter()
const holding = ref({
  totalGrams: 0,
  avgCost: 0,
  totalInvested: 0,
  totalReturned: 0,
  realizedProfit: 0
})

const batches = ref([])
const batchFilter = ref('all')
const currentPrice = ref('')
const totalInvested = ref(0)
const icbcHolding = ref({
  totalGrams: 0,
  avgCost: 0,
  totalInvested: 0,
  realizedProfit: 0,
  extractedGrams: 0
})
const priceFilterActive = ref(false)
const isAutoFetch = ref(false)
const lastUpdateTime = ref(null)
const sellFeeRate = ref(0)
let stopAutoRefresh = null

const floatingProfit = computed(() => {
  const price = parseFloat(currentPrice.value)
  if (!price || price <= 0) return 0
  return calculateFloatingProfit(batches.value, price).floatingProfit
})

const totalMarketValue = computed(() => {
  const price = parseFloat(currentPrice.value)
  if (!price || price <= 0) return 0
  return calculateFloatingProfit(batches.value, price).totalMarketValue
})

const holdingTotalValue = computed(() => {
  return parseFloat((holding.value.avgCost * holding.value.totalGrams).toFixed(2))
})

const accountBalance = computed(() => {
  const holdingNetInvested = holding.value.totalInvested - holding.value.totalReturned
  return parseFloat((totalInvested.value - holdingNetInvested - icbcHolding.value.totalInvested).toFixed(2))
})

function formatPriceInput(value) {
  const numeric = value.replace(/[^\d.]/g, '')
  const parts = numeric.split('.')
  if (parts.length > 2) {
    return parts[0] + '.' + parts.slice(1).join('')
  }
  if (parts[1] && parts[1].length > 2) {
    return parts[0] + '.' + parts[1].slice(0, 2)
  }
  return numeric
}

function togglePriceFilter() {
  priceFilterActive.value = !priceFilterActive.value
}

const filteredBatches = computed(() => {
  let result = batches.value
  
  // 状态筛选
  if (batchFilter.value === 'active') {
    result = result.filter(b => b.remainingGrams > 0.0001)
  } else if (batchFilter.value === 'closed') {
    result = result.filter(b => b.remainingGrams <= 0.0001)
  }
  
  // 金价筛选
  if (priceFilterActive.value && currentPrice.value) {
    const price = parseFloat(currentPrice.value)
    result = result.filter(b => 
      b.remainingGrams > 0.0001 && 
      b.costPerGram < price
    )
  }
  
  return result
})

async function loadData() {
  const transactions = await getAllTransactions()
  holding.value = calculateHolding(transactions)
  batches.value = getBatches(transactions)
  totalInvested.value = getTotalInvested()
  
  const icbcTransactions = await getAllIcbcTransactions()
  icbcHolding.value = calculateIcbcHolding(icbcTransactions)
}

async function refreshGoldPrice() {
  const price = await fetchGoldPrice()
  if (price !== null) {
    currentPrice.value = price.toString()
    lastUpdateTime.value = new Date()
    isAutoFetch.value = true
  }
}

function formatUpdateTime(date) {
  const hours = String(date.getHours()).padStart(2, '0')
  const minutes = String(date.getMinutes()).padStart(2, '0')
  const seconds = String(date.getSeconds()).padStart(2, '0')
  return `${hours}:${minutes}:${seconds}`
}

function sellFromBatch(batch) {
  router.push(`/add?type=sell&batchId=${batch.id}&maxGrams=${batch.remainingGrams}`)
}

function getBatchFloatingProfit(batch) {
  const price = parseFloat(currentPrice.value)
  if (!price || price <= 0 || batch.remainingGrams <= 0.0001) return 0
  
  const currentMarketValue = price * batch.remainingGrams
  const batchTotalValue = batch.buyGrams * batch.costPerGram
  const estimatedSellFee = currentMarketValue * sellFeeRate.value
  
  return currentMarketValue - batchTotalValue - estimatedSellFee
}

onMounted(() => {
  loadData()
  refreshGoldPrice()
  stopAutoRefresh = startAutoRefresh(refreshGoldPrice, 60000)
  
  const settings = getSettings()
  sellFeeRate.value = settings.sellFeeRate || 0
})

onUnmounted(() => {
  if (stopAutoRefresh) {
    stopAutoRefresh()
  }
})

watch(currentPrice, (newVal) => {
  if (!newVal || parseFloat(newVal) <= 0) {
    priceFilterActive.value = false
  }
})
</script>

<style scoped>
/* 持仓卡片样式 */
.holding-card {
  background: linear-gradient(135deg, #1a1a1a 0%, #2a2a2a 100%);
  border: 1px solid var(--gold-accent);
  border-radius: 16px;
  padding: 8px;
  margin: 6px;
  color: #fff;
  box-shadow: 0 4px 20px rgba(212, 175, 55, 0.15), inset 0 1px 0 rgba(212, 175, 55, 0.1);
  animation: cardGlow 3s ease-in-out infinite alternate;
}

@keyframes cardGlow {
  from {
    box-shadow: 0 4px 20px rgba(212, 175, 55, 0.1), inset 0 1px 0 rgba(212, 175, 55, 0.1);
  }
  to {
    box-shadow: 0 4px 25px rgba(212, 175, 55, 0.2), inset 0 1px 0 rgba(212, 175, 55, 0.15);
  }
}

.holding-card h3 {
  font-size: 14px;
  color: var(--gold-accent);
  /*margin-bottom: 8px;*/
}

.holding-card .grams {
  /*font-size: 42px;*/
  /*font-weight: bold;*/
  /*margin-bottom: 4px;*/
  /*background: linear-gradient(135deg, #fff 0%, var(--gold-accent) 100%);*/
  /*-webkit-background-clip: text;*/
  /*-webkit-text-fill-color: transparent;*/
  /*!*background-clip: text;*!*/
}

.holding-card .unit {
  font-size: 16px;
  font-weight: bold;
  opacity: 0.7;
  margin-bottom: 16px;
}

.holding-details {
  display: flex;
  justify-content: space-between;
  margin-top: 8px;
  padding-top: 8px;
  border-top: 1px solid rgba(212, 175, 55, 0.3);
}

.holding-details .item {
  text-align: center;
}

.holding-details .label {
  font-size: 10px;
  opacity: 0.7;
  margin-bottom: 4px;
}

/*.holding-details .value {*/
/*  font-size: 12px;*/
/*  font-weight: 500;*/
/*  color: #fff;*/
/*}*/
.holding-details .value .profit-positive {
  font-size: 12px;
  font-weight: 500;
  color: #ff0000;
}

.holding-details .value .profit-negative {
  font-size: 12px;
  font-weight: 500;
  color: #2fff00;
}

.gold-text {
  color: var(--gold-accent) !important;
}

/* 按钮样式 */
.quick-actions {
  display: flex;
  gap: 12px;
  padding: 6px;
}

.quick-actions .van-button {
  flex: 1;
  height: 30px;
  font-weight: 600;
  font-size: 14px;
}

.gold-btn {
  background: linear-gradient(135deg, var(--gold-accent) 0%, var(--gold-dark) 100%) !important;
  border: none !important;
  color: #0a0a0a !important;
}

.btn-press {
  transition: all 0.15s ease;
}

.btn-press:active {
  transform: scale(0.96);
}

.section-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding: 4px 4px 4px;
}

.section-title {
  font-size: 14px;
  font-weight: 500;
  color: var(--text-primary);
  padding: 4px 20px 4px;
}

.status{
  font-size: 8px;
}

.batch-card {
  margin: 4px 4px;
  background: var(--bg-card);
  border: 1px solid var(--border-color);
  border-radius: 10px;
  padding: 5px;
  box-shadow: 0 2px 12px rgba(0, 0, 0, 0.3);
  transition: all 0.3s ease;
  animation: slideUp 0.4s ease-out forwards;
  position: relative;
}

.batch-card:hover {
  border-color: var(--gold-accent);
}

.batch-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: -4px;
}

.batch-date {
  font-size: 13px;
  color: var(--gold-accent);
  font-weight: 500;
}

.batch-content {
  display: flex;
  align-items: center;
  gap: 8px;
}

.batch-col {
  flex: 1;
  display: flex;
  flex-direction: column;
  gap: 3px;
  min-width: 0;
}

.batch-profit-col {
  min-width: 80px;
}

.batch-left, .batch-right {
  flex: 1;
  display: flex;
  flex-direction: column;
  gap: 4px;
}

.batch-row {
  display: flex;
  justify-content: space-between;
  align-items: center;
}

.batch-row .label {
  font-size: 10px;
  color: var(--text-secondary);
}

.batch-row .value{
  font-size: 10px;
}

.batch-row .profit-positive-1{
  font-size: 13px;
  color: #ff0000;
}

.batch-row .profit-negative-1{
  font-size: 13px;
  color: #2fff00;
}

.batch-row .value.highlight {
  color: var(--gold-accent);
  font-size: 10px;
}

.batch-row .value.gold-text {
  color: var(--gold-accent);
}

.profit-arrow {
  font-size: 10px;
  margin-right: 2px;
  font-weight: bold;
}

.batch-action {
  /*position: absolute;*/
  right: 6px;
  bottom: 6px;
}

.btn-sell {
  padding: 0 12px;
  height: 30px;
  font-size: 12px;
}

.batch-note {
  font-size: 11px;
  color: var(--text-secondary);
  margin-top: 8px;
  padding-top: 8px;
  border-top: 1px dashed var(--border-color);
}

.batch-card:hover {
  border-color: var(--gold-accent);
  box-shadow: 0 4px 20px rgba(212, 175, 55, 0.15);
}

/*.batch-header {*/
/*  display: flex;*/
/*  justify-content: space-between;*/
/*  align-items: center;*/
/*  margin-bottom: 12px;*/
/*}*/

.batch-date {
  font-size: 14px;
  color: var(--gold-accent);
  font-weight: 500;
}

.batch-table-wrapper {
  overflow-x: auto;
  margin: 8px 0;
}

.batch-table {
  min-width: 480px;
  border: 1px solid var(--border-color);
  border-radius: 8px;
  overflow: hidden;
}

.table-row {
  display: flex;
}

.table-header-row {
  background: #252525;
}

.th {
  flex: 1;
  padding: 10px 4px;
  font-size: 12px;
  color: var(--text-secondary);
  text-align: center;
  border-bottom: 1px solid var(--border-color);
  border-right: 1px solid var(--border-color);
}

.th:last-child {
  border-right: none;
}

.td {
  flex: 1;
  padding: 12px 4px;
  font-size: 13px;
  color: var(--text-primary);
  text-align: center;
  font-weight: 500;
  border-right: 1px solid var(--border-color);
}

.td:last-child {
  border-right: none;
}

.profit-cell {
  font-weight: bold;
}

.batch-note {
  font-size: 12px;
  color: var(--text-secondary);
  margin-top: 10px;
  padding-top: 10px;
  border-top: 1px dashed var(--border-color);
}

.custom-radio-group {
  font-size: 10px;
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin: 0px 42px;
}

.batch-action {
  margin-top: 12px;
  text-align: right;
}

.current-price-section {
  margin-top: 8px;
  padding-top: 8px;
  border-top: 1px solid rgba(212, 175, 55, 0.3);
}

.price-input-row {
  display: flex;
  align-items: center;
  gap: 8px;
}

.price-label {
  font-size: 10px;
  white-space: nowrap;
  color: rgba(255, 255, 255, 0.7);
}

.price-input {
  flex: 1;
  padding: 0;
  background: rgba(255, 255, 255, 0.1);
  border: 1px solid rgba(212, 175, 55, 0.3);
  border-radius: 8px;
}

.price-input :deep(.van-field__control) {
  color: var(--gold-accent);
  font-size: 10px;
  font-weight: 500;
  text-align: center;
}

.price-input :deep(.van-field__control::placeholder) {
  color: rgba(255, 255, 255, 0.4);
}

.price-unit {
  font-size: 10px;
  white-space: nowrap;
  color: rgba(255, 255, 255, 0.7);
}

.btn-filter {
  margin-left: 8px;
  font-size: 10px;
  min-width: 56px;
}


.btn-refresh {
  margin-left: 8px;
  font-size: 10px;
  min-width: 56px;
}

.update-time {
  font-size: 8px;
  color: rgba(255, 255, 255, 0.5);
  text-align: right;
  margin-top: 4px;
}

.floating-details {
  display: flex;
  justify-content: space-around;
  margin-top: 8px;
}

.floating-details .item {
  text-align: center;
}

.floating-details .label {
  font-size: 10px;
  opacity: 0.7;
  margin-bottom: 4px;
}

.floating-details .value {
  font-size: 12px;
  font-weight: 500;
}





.card-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 8px;
}

.card-header h2 {
  font-size: 18px;
  opacity: 0.9;
  margin: 0;
  color: var(--gold-accent);
}

.header-center {
  text-align: center;
}

.center-label {
  font-size: 12px;
  opacity: 0.7;
  display: block;
}

.center-value {
  font-size: 16px;
  font-weight: bold;
  color: #fff;
}

.account-balance {
  text-align: right;
}

.balance-label {
  font-size: 12px;
  opacity: 0.7;
  display: block;
}

.balance-value {
  font-size: 16px;
  font-weight: bold;
}


/* 动画 */
@keyframes slideUp {
  from {
    opacity: 0;
    transform: translateY(20px);
  }
  to {
    opacity: 1;
    transform: translateY(0);
  }
}

/* 延迟动画 */
.batch-card:nth-child(1) { animation-delay: 0s; }
.batch-card:nth-child(2) { animation-delay: 0.05s; }
.batch-card:nth-child(3) { animation-delay: 0.1s; }
.batch-card:nth-child(4) { animation-delay: 0.15s; }
.batch-card:nth-child(5) { animation-delay: 0.2s; }
.batch-card:nth-child(6) { animation-delay: 0.25s; }
.batch-card:nth-child(7) { animation-delay: 0.3s; }
.batch-card:nth-child(8) { animation-delay: 0.35s; }
.batch-card:nth-child(9) { animation-delay: 0.4s; }
.batch-card:nth-child(10) { animation-delay: 0.45s; }
</style>
