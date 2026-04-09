<template>
  <div>
    <div class="holding-card">
      <div class="holding-title">工行如意积存金持仓</div>
      <div class="holding-grid">
        <div class="holding-item">
          <span class="label">总克数</span>
          <span class="value">{{ holding.totalGrams }}g</span>
        </div>
        <div class="holding-item">
          <span class="label">平均成本</span>
          <span class="value">¥{{ holding.avgCost }}/g</span>
        </div>
        <div class="holding-item">
          <span class="label">已投入</span>
          <span class="value">¥{{ holding.totalInvested }}</span>
        </div>
        <div class="holding-item">
          <span class="label">已实现盈亏</span>
          <span class="value" :class="holding.realizedProfit >= 0 ? 'profit-positive' : 'profit-negative'">
            {{ holding.realizedProfit >= 0 ? '+' : '' }}¥{{ holding.realizedProfit }}
          </span>
        </div>
        <div class="holding-item">
          <span class="label">已提取克数</span>
          <span class="value">{{ holding.extractedGrams }}g</span>
        </div>
      </div>
    </div>

    <van-cell-group inset >
      <van-cell title="交易类型" >
        <van-radio-group v-model="form.type" direction="horizontal" @change="onTypeChange">
          <van-radio name="buy">买</van-radio>
          <van-radio name="sell">卖</van-radio>
          <van-radio name="extract">提</van-radio>
        </van-radio-group>
      </van-cell>
      <van-cell title="日期" :value="form.date" is-link @click="showDatePicker = true" />
      <van-field v-model="form.grams" label="克数" placeholder="请输入克数" type="number" />
      <van-field v-model="form.totalPrice" label="总价(元)" placeholder="请输入总价" type="number" />
      <van-cell v-if="form.type !== 'buy'" title="选择批次" :value="selectedBatchLabel || '请选择批次'" is-link @click="showBatchPicker = true" />
      <van-cell title="单价" :value="calculatedPrice > 0 ? '¥' + calculatedPrice.toFixed(2) + '/g' : '-'" />
    </van-cell-group>

    <div style="margin: 16px;">
      <van-button type="primary" block round @click="onSubmit">提交</van-button>
    </div>

    <div class="section-header">
      <span class="section-title">持仓批次</span>
      <van-radio-group v-model="batchFilter" direction="horizontal" icon-size="13">
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
          <van-tag :type="batch.remainingGrams > 0.0001 ? 'primary' : 'default'" size="small">
            {{ batch.remainingGrams > 0.0001 ? '持仓中' : '已清仓' }}
          </van-tag>
        </div>

        <div class="batch-content">
          <div class="batch-col">
            <div class="batch-row">
              <span class="label">买入</span>
              <span class="value">{{ batch.buyGrams }}g</span>
            </div>
            <div class="batch-row">
              <span class="label">剩余</span>
              <span class="value highlight">{{ batch.remainingGrams }}g</span>
            </div>
          </div>
          
          <div class="batch-col">
            <div class="batch-row">
              <span class="label">已售</span>
              <span class="value">{{ batch.soldGrams }}g</span>
            </div>
            <div class="batch-row">
              <span class="label">成本</span>
              <span class="value">¥{{ batch.costPerGram }}/g</span>
            </div>
          </div>

          <div class="batch-col">
            <div class="batch-row">
              <span class="label">已提取</span>
              <span class="value">{{ batch.extractedGrams }}g</span>
            </div>
            <div class="batch-row">
              <span class="label">盈亏</span>
              <span class="value" :class="batch.realizedProfit >= 0 ? 'profit-positive' : 'profit-negative'">
                {{ batch.realizedProfit !== 0 ? (batch.realizedProfit >= 0 ? '+' : '') : '' }}¥{{ batch.realizedProfit }}
              </span>
            </div>
          </div>
          
          <div class="batch-actions">
            <van-button
              v-if="batch.remainingGrams > 0.0001"
              class="btn-action btn-sell"
              size="mini"
              round
              @click="sellFromBatch(batch)"
            >
              卖出
            </van-button>
            <van-button
              v-if="batch.remainingGrams > 0.0001"
              class="btn-action btn-extract"
              size="mini"
              round
              @click="extractFromBatch(batch)"
            >
              提取
            </van-button>
          </div>
        </div>
      </div>
    </div>

    <van-popup v-model:show="showDatePicker" position="bottom" @close="showDatePicker = false">
      <van-datetime-picker
        type="date"
        v-model="currentDate"
        title="选择日期"
        @confirm="onDateConfirm"
        @cancel="showDatePicker = false"
        :min-date="minDate"
        :max-date="maxDate"
      />
    </van-popup>

    <van-popup v-model:show="showBatchPicker" position="bottom" @close="showBatchPicker = false">
      <div class="batch-popup">
        <div class="batch-popup-title">选择批次</div>
        <div class="batch-list">
          <div v-for="batch in availableBatches" :key="batch.id" class="batch-item" @click="selectBatch(batch)">
            <div class="batch-item-left">
              <span class="batch-label">{{ batch.batchLabel }}</span>
              <span class="batch-detail">{{ batch.batchDetail }}</span>
            </div>
          </div>
          <div v-if="availableBatches.length === 0" class="no-batches">暂无可用批次</div>
        </div>
        <div class="batch-popup-close" @click="showBatchPicker = false">取消</div>
      </div>
    </van-popup>
  </div>
</template>

<script setup>
import { showToast } from 'vant'
import { ref, computed, onMounted, watch } from 'vue'
import { getAllIcbcTransactions, addIcbcTransaction, deleteIcbcTransaction } from '../db'
import { calculateIcbcHolding, getIcbcBatches, getAvailableIcbcBatches, generateId } from '../utils/calculator'

const form = ref({
  type: 'buy',
  date: '',
  grams: '',
  totalPrice: '',
  sourceBatchId: ''
})

const availableBatches = ref([])
const maxGrams = ref(0)
const selectedBatchLabel = ref('')
const showDatePicker = ref(false)
const showBatchPicker = ref(false)
const currentDate = ref(new Date())
const minDate = new Date(2020, 0, 1)
const maxDate = new Date(2030, 11, 31)

const calculatedPrice = ref(0)

const holding = ref({
  totalGrams: 0,
  avgCost: 0,
  totalInvested: 0,
  realizedProfit: 0,
  extractedGrams: 0
})

const icbcBatches = ref([])
const batchFilter = ref('all')

function formatDate(dateStr) {
  const date = new Date(dateStr)
  return `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, '0')}-${String(date.getDate()).padStart(2, '0')}`
}

onMounted(() => {
  const today = new Date()
  form.value.date = formatDate(today)
  loadData()
})

async function loadData() {
  const transactions = await getAllIcbcTransactions()
  holding.value = calculateIcbcHolding(transactions)
  icbcBatches.value = getIcbcBatches(transactions)
}

async function onTypeChange(e) {
  const value = (e && typeof e === 'object' && 'detail' in e) ? e.detail : e
  form.value.type = value
  form.value.sourceBatchId = ''
  selectedBatchLabel.value = ''
  maxGrams.value = 0
  if (value !== 'buy') {
    await loadBatches()
  }
}

  async function loadBatches() {
  const transactions = await getAllIcbcTransactions()
  const batches = getAvailableIcbcBatches(transactions)
  availableBatches.value = batches.map(b => ({
    ...b,
    batchLabel: `${b.buyDate} 买入 ${b.buyGrams}g`,
    batchDetail: `剩余 ${b.remainingGrams}g | 成本 ¥${b.costPerGram}/g`
  }))
}

// 使用 watch 实现单价的实时计算
watch([
  () => form.value.grams,
  () => form.value.totalPrice
], () => {
  const grams = parseFloat(form.value.grams) || 0
  const totalPrice = parseFloat(form.value.totalPrice) || 0
  if (grams > 0 && totalPrice > 0) {
    calculatedPrice.value = totalPrice / grams
  } else {
    calculatedPrice.value = 0
  }
}, { immediate: true })

function onDateConfirm(value) {
  const date = new Date(value)
  form.value.date = formatDate(date)
  showDatePicker.value = false
}

const filteredBatches = computed(() => {
  let result = icbcBatches.value
  
  if (batchFilter.value === 'active') {
    result = result.filter(b => b.remainingGrams > 0.0001)
  } else if (batchFilter.value === 'closed') {
    result = result.filter(b => b.remainingGrams <= 0.0001)
  }
  
  return result
})

function sellFromBatch(batch) {
  form.value.type = 'sell'
  form.value.sourceBatchId = batch.id
  maxGrams.value = batch.remainingGrams
  selectedBatchLabel.value = `${batch.buyDate} 买入 ${batch.buyGrams}g (剩余${batch.remainingGrams}g)`
  window.scrollTo({ top: 0, behavior: 'smooth' })
}

function extractFromBatch(batch) {
  form.value.type = 'extract'
  form.value.sourceBatchId = batch.id
  maxGrams.value = batch.remainingGrams
  selectedBatchLabel.value = `${batch.buyDate} 买入 ${batch.buyGrams}g (剩余${batch.remainingGrams}g)`
  window.scrollTo({ top: 0, behavior: 'smooth' })
}

function selectBatch(batch) {
  form.value.sourceBatchId = batch.id
  maxGrams.value = batch.remainingGrams
  selectedBatchLabel.value = `${batch.buyDate} 买入 ${batch.buyGrams}g (剩余${batch.remainingGrams}g)`
  showBatchPicker.value = false
  // no-op: 计算逻辑已由 watch 驱动 totalAmount 的更新
}

async function onSubmit() {
  const grams = parseFloat(form.value.grams)
  const totalPrice = parseFloat(form.value.totalPrice)

  if (!grams || grams <= 0) {
    showToast({ title: '请输入有效的克数', icon: 'none' })
    return
  }
  if (!totalPrice || totalPrice <= 0) {
    showToast({ title: '请输入有效的总价', icon: 'none' })
    return
  }
  
  const pricePerGram = totalPrice / grams
  
  if (form.value.type !== 'buy' && !form.value.sourceBatchId) {
    showToast({ title: '请选择批次', icon: 'none' })
    return
  }
  if (form.value.type !== 'buy' && grams > maxGrams.value + 0.0001) {
    showToast({ title: `克数不能超过剩余 ${maxGrams.value}g`, icon: 'none' })
    return
  }

  const transaction = {
    id: generateId(),
    type: form.value.type,
    batchId: form.value.type === 'buy' ? generateId() : undefined,
    sourceBatchId: form.value.type !== 'buy' ? form.value.sourceBatchId : undefined,
    grams,
    pricePerGram,
    fee: 0,
    date: form.value.date
  }

  try {
    const writeResult = await addIcbcTransaction(transaction)
    console.log('ICBC write result:', writeResult, 'transaction:', transaction)
    showToast({ title: '添加成功', icon: 'success' })
  } catch (err) {
    console.error('ICBC write error', err)
    showToast({ title: '写入失败，请稍后重试', icon: 'none' })
    return
  }

  form.value.grams = ''
  form.value.totalPrice = ''
  form.value.sourceBatchId = ''
  selectedBatchLabel.value = ''
  calculatedPrice.value = 0

  loadData()
}

  async function deleteRecord(id) {
  await deleteIcbcTransaction(id)
  showToast({ title: '删除成功', icon: 'success' })
  loadData()
}
</script>

<style scoped>
.holding-card {
  background: linear-gradient(135deg, #1a1a1a 0%, #2a2a2a 100%);
  border: 1px solid var(--gold-accent);
  border-radius: 12px;
  padding: 16px;
  margin: 16px;
  box-shadow: 0 4px 20px rgba(212, 175, 55, 0.15);
}

.holding-title {
  font-size: 16px;
  font-weight: 600;
  color: var(--gold-accent);
  margin-bottom: 12px;
  text-align: center;
}

.holding-grid {
  display: flex;
  flex-wrap: wrap;
}

.holding-item {
  width: 50%;
  padding: 8px 0;
  display: flex;
  flex-direction: column;
  align-items: center;
}

.holding-item .label {
  font-size: 12px;
  color: var(--text-secondary);
  margin-bottom: 4px;
}

.holding-item .value {
  font-size: 16px;
  font-weight: 600;
  color: #fff;
}

.profit-positive {
  color: #ee7a1d;
}

.profit-negative {
  color: #07c160;
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
  margin-bottom: 10px;
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

.batch-row {
  display: flex;
  justify-content: space-between;
  align-items: center;
}

.batch-row .label {
  font-size: 12px;
  color: var(--text-secondary);
}

.batch-row .value {
  font-size: 13px;
  font-weight: 500;
  color: var(--text-primary);
}

.batch-row .value.highlight {
  color: var(--gold-accent);
  font-size: 14px;
}

.batch-actions {
  display: flex;
  flex-direction: column;
  gap: 4px;
}

.btn-action {
  padding: 0 12px;
  height: 28px;
  font-size: 12px;
}

.btn-sell {
  background: #1890ff !important;
  border-color: #1890ff !important;
  color: #fff !important;
}

.btn-extract {
  background: #52c41a !important;
  border-color: #52c41a !important;
  color: #fff !important;
}

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

.batch-card:nth-child(1) { animation-delay: 0s; }
.batch-card:nth-child(2) { animation-delay: 0.05s; }
.batch-card:nth-child(3) { animation-delay: 0.1s; }
.batch-card:nth-child(4) { animation-delay: 0.15s; }
.batch-card:nth-child(5) { animation-delay: 0.2s; }

.empty-state {
  text-align: center;
  padding: 32px 0;
  color: var(--text-secondary);
  font-size: 14px;
}

.batch-popup {
  background: var(--bg-card);
  border-radius: 12px 12px 0 0;
}

.batch-popup-title {
  font-size: 16px;
  font-weight: 600;
  text-align: center;
  padding: 16px;
  color: var(--gold-accent);
  border-bottom: 1px solid var(--border-color);
}

.batch-list {
  max-height: 300px;
  overflow-y: auto;
}

.batch-item {
  padding: 16px;
  border-bottom: 1px solid var(--border-color);
}

.batch-item-left {
  display: flex;
  flex-direction: column;
}

.batch-label {
  font-size: 14px;
  color: #fff;
  font-weight: 500;
}

.batch-detail {
  font-size: 12px;
  color: var(--text-secondary);
  margin-top: 4px;
}

.no-batches {
  text-align: center;
  padding: 32px;
  color: var(--text-secondary);
  font-size: 14px;
}

.batch-popup-close {
  text-align: center;
  padding: 16px;
  color: var(--text-secondary);
  font-size: 16px;
  border-top: 1px solid var(--border-color);
}

.van-radio-group {
  flex-wrap: nowrap !important;
  white-space: nowrap;
  gap: 8px;
}

.van-radio {
  flex-shrink: 0;
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

.record-item {
  animation: slideUp 0.3s ease-out forwards;
}



.record-item:nth-child(1) { animation-delay: 0s; }
.record-item:nth-child(2) { animation-delay: 0.03s; }
.record-item:nth-child(3) { animation-delay: 0.06s; }
.record-item:nth-child(4) { animation-delay: 0.09s; }
.record-item:nth-child(5) { animation-delay: 0.12s; }
</style>
