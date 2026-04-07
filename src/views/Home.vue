<template>
  <div>
    <div class="holding-card">
      <div class="card-header">
        <h2>当前持仓</h2>
        <div class="account-balance">
          <span class="balance-label">账户余额</span>
          <span class="balance-value" :class="accountBalance >= 0 ? 'profit-positive' : 'profit-negative'">
            ¥{{ accountBalance }}
          </span>
        </div>
      </div>
      <div class="grams">{{ holding.totalGrams }}</div>
      <div class="unit">克</div>
      <div class="holding-details">
        <div class="item">
          <div class="label">平均成本</div>
          <div class="value">¥{{ holding.avgCost }}/g</div>
        </div>
        <div class="item">
          <div class="label">持仓总价</div>
          <div class="value gold-text">¥{{ holdingTotalValue }}</div>
        </div>
        <div class="item">
          <div class="label">已实现盈亏</div>
          <div class="value" :class="holding.realizedProfit >= 0 ? 'profit-positive' : 'profit-negative'">
            {{ holding.realizedProfit >= 0 ? '+' : '' }}¥{{ holding.realizedProfit }}
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
          />
          <span class="price-unit">元/g</span>
        </div>
        <div v-if="currentPrice && parseFloat(currentPrice) > 0" class="floating-details">
          <div class="item">
            <div class="label">浮动盈亏</div>
            <div class="value" :class="floatingProfit >= 0 ? 'profit-positive' : 'profit-negative'">
              {{ floatingProfit >= 0 ? '+' : '' }}¥{{ floatingProfit }}
            </div>
          </div>
          <div class="item">
            <div class="label">总市值</div>
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

    <div class="section-header">
      <span class="section-title">持仓批次</span>
      <van-radio-group v-model="batchFilter" direction="horizontal" icon-size="14">
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
          <van-tag :type="batch.remainingGrams > 0.0001 ? 'primary' : 'default'" size="medium">
            {{ batch.remainingGrams > 0.0001 ? '持仓中' : '已清仓' }}
          </van-tag>
        </div>

        <div class="batch-table-wrapper">
          <div class="batch-table">
            <div class="table-row table-header-row">
              <div class="th">买入量</div>
              <div class="th">剩余</div>
              <div class="th">已售</div>
              <div class="th">成本/g</div>
              <div class="th">盈亏</div>
              <div class="th">总价</div>
            </div>
            <div class="table-row table-body-row">
              <div class="td">{{ batch.buyGrams }}g</div>
              <div class="td">{{ batch.remainingGrams }}g</div>
              <div class="td">{{ batch.soldGrams }}g</div>
              <div class="td">¥{{ batch.costPerGram }}</div>
              <div class="td profit-cell" :class="batch.realizedProfit >= 0 ? 'profit-positive' : 'profit-negative'">
                {{ batch.realizedProfit !== 0 ? (batch.realizedProfit >= 0 ? '+' : '') : '' }}¥{{ batch.realizedProfit }}
              </div>
              <div class="td">¥{{ (batch.buyGrams * batch.costPerGram).toFixed(2) }}</div>
            </div>
          </div>
        </div>

        <div v-if="batch.note" class="batch-note">{{ batch.note }}</div>

        <div v-if="batch.remainingGrams > 0.0001" class="batch-action">
          <van-button type="success" size="small" round @click="sellFromBatch(batch)">
            从此批卖出
          </van-button>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup>
import { ref, computed, onMounted } from 'vue'
import { useRouter } from 'vue-router'
import { getAllTransactions } from '../db'
import { calculateHolding, getBatches, calculateFloatingProfit, formatDate, getTotalInvested } from '../utils/calculator'

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
  return parseFloat((totalInvested.value - holding.value.totalInvested + holding.value.totalReturned).toFixed(2))
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

const filteredBatches = computed(() => {
  if (batchFilter.value === 'active') {
    return batches.value.filter(b => b.remainingGrams > 0.0001)
  }
  if (batchFilter.value === 'closed') {
    return batches.value.filter(b => b.remainingGrams <= 0.0001)
  }
  return batches.value
})

async function loadData() {
  const transactions = await getAllTransactions()
  holding.value = calculateHolding(transactions)
  batches.value = getBatches(transactions)
  totalInvested.value = getTotalInvested()
}

function sellFromBatch(batch) {
  router.push(`/add?type=sell&batchId=${batch.id}&maxGrams=${batch.remainingGrams}`)
}

onMounted(loadData)
</script>

<style scoped>
/* 持仓卡片样式 */
.holding-card {
  background: linear-gradient(135deg, #1a1a1a 0%, #2a2a2a 100%);
  border: 1px solid var(--gold-accent);
  border-radius: 16px;
  padding: 20px;
  margin: 16px;
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

.holding-card h2 {
  font-size: 16px;
  color: var(--gold-accent);
  margin-bottom: 8px;
}

.holding-card .grams {
  font-size: 42px;
  font-weight: bold;
  margin-bottom: 4px;
  background: linear-gradient(135deg, #fff 0%, var(--gold-accent) 100%);
  -webkit-background-clip: text;
  -webkit-text-fill-color: transparent;
  background-clip: text;
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
  margin-top: 16px;
  padding-top: 16px;
  border-top: 1px solid rgba(212, 175, 55, 0.3);
}

.holding-details .item {
  text-align: center;
}

.holding-details .label {
  font-size: 12px;
  opacity: 0.7;
  margin-bottom: 4px;
}

.holding-details .value {
  font-size: 16px;
  font-weight: 500;
  color: #fff;
}

.gold-text {
  color: var(--gold-accent) !important;
}

/* 按钮样式 */
.quick-actions {
  display: flex;
  gap: 12px;
  padding: 16px;
}

.quick-actions .van-button {
  flex: 1;
  height: 44px;
  font-weight: 600;
  font-size: 16px;
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
  padding: 16px 16px 8px;
}

.section-title {
  font-size: 16px;
  font-weight: 500;
  color: var(--text-primary);
}

.batch-card {
  margin: 8px 16px;
  background: var(--bg-card);
  border: 1px solid var(--border-color);
  border-radius: 12px;
  padding: 16px;
  box-shadow: 0 2px 12px rgba(0, 0, 0, 0.3);
  transition: all 0.3s ease;
  animation: slideUp 0.4s ease-out forwards;
}

.batch-card:hover {
  border-color: var(--gold-accent);
  box-shadow: 0 4px 20px rgba(212, 175, 55, 0.15);
}

.batch-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 12px;
}

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

.batch-action {
  margin-top: 12px;
  text-align: right;
}

.current-price-section {
  margin-top: 16px;
  padding-top: 16px;
  border-top: 1px solid rgba(212, 175, 55, 0.3);
}

.price-input-row {
  display: flex;
  align-items: center;
  gap: 8px;
}

.price-label {
  font-size: 14px;
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
  font-size: 16px;
  font-weight: 500;
  text-align: center;
}

.price-input :deep(.van-field__control::placeholder) {
  color: rgba(255, 255, 255, 0.4);
}

.price-unit {
  font-size: 14px;
  white-space: nowrap;
  color: rgba(255, 255, 255, 0.7);
}

.floating-details {
  display: flex;
  justify-content: space-around;
  margin-top: 12px;
}

.floating-details .item {
  text-align: center;
}

.floating-details .label {
  font-size: 12px;
  opacity: 0.7;
  margin-bottom: 4px;
}

.floating-details .value {
  font-size: 16px;
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
