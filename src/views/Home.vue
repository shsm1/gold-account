<template>
  <div>
    <div class="holding-card">
      <div class="card-header">
        <h2>当前持仓</h2>
        <div class="header-center">
          <span class="center-label">已投入</span>
          <span class="center-value">¥{{ totalInvested }}</span>
        </div>
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
          <div class="value">¥{{ holdingTotalValue }}</div>
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
            <div class="value">¥{{ totalMarketValue }}</div>
          </div>
        </div>
      </div>
    </div>

    <div class="quick-actions">
      <van-button type="danger" block round @click="$router.push('/add?type=buy')">
        买入
      </van-button>
      <van-button type="success" block round @click="$router.push('/add?type=sell')">
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
.section-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding: 16px 16px 8px;
}

.section-title {
  font-size: 16px;
  font-weight: 500;
  color: #333;
}

.batch-card {
  margin: 8px 16px;
  background: #fff;
  border-radius: 12px;
  padding: 16px;
  box-shadow: 0 2px 8px rgba(0, 0, 0, 0.06);
}

.batch-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 12px;
}

.batch-date {
  font-size: 14px;
  color: #666;
  font-weight: 500;
}

.batch-table-wrapper {
  overflow-x: auto;
  margin: 8px 0;
}

.batch-table {
  min-width: 480px;
  border: 1px solid #eee;
  border-radius: 8px;
  overflow: hidden;
}

.table-row {
  display: flex;
}

.table-header-row {
  background: #f7f8fa;
}

.th {
  flex: 1;
  padding: 8px 4px;
  font-size: 12px;
  color: #999;
  text-align: center;
  border-bottom: 1px solid #eee;
  border-right: 1px solid #f0f0f0;
}

.th:last-child {
  border-right: none;
}

.td {
  flex: 1;
  padding: 10px 4px;
  font-size: 13px;
  color: #333;
  text-align: center;
  font-weight: 500;
  border-right: 1px solid #f0f0f0;
}

.td:last-child {
  border-right: none;
}

.profit-cell {
  font-weight: bold;
}

.batch-note {
  font-size: 12px;
  color: #999;
  margin-top: 8px;
  padding-top: 8px;
  border-top: 1px dashed #eee;
}

.batch-action {
  margin-top: 12px;
  text-align: right;
}

.current-price-section {
  margin-top: 16px;
  padding-top: 16px;
  border-top: 1px solid rgba(255, 255, 255, 0.3);
}

.price-input-row {
  display: flex;
  align-items: center;
  gap: 8px;
}

.price-label {
  font-size: 14px;
  white-space: nowrap;
}

.price-input {
  flex: 1;
  padding: 0;
  background: rgba(255, 255, 255, 0.2);
  border-radius: 8px;
}

.price-input :deep(.van-field__control) {
  color: #fff;
  font-size: 16px;
  font-weight: 500;
  text-align: center;
}

.price-input :deep(.van-field__control::placeholder) {
  color: rgba(255, 255, 255, 0.6);
}

.price-unit {
  font-size: 14px;
  white-space: nowrap;
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
  opacity: 0.8;
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
  font-size: 20px;
  opacity: 0.9;
  margin: 0;
}

.header-center {
  text-align: center;
}

.center-label {
  font-size: 20px;
  opacity: 0.7;
  display: block;
}

.center-value {
  font-size: 20px;
  font-weight: bold;
  color: #fff;
}

.account-balance {
  text-align: right;
}

.balance-label {
  font-size: 20px;
  opacity: 0.7;
  display: block;
}

.balance-value {
  font-size: 20px;
  font-weight: bold;
}
</style>
