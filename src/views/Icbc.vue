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
      <van-field v-model="form.grams" label="克数" placeholder="请输入克数" type="digit" />
      <van-field v-model="form.pricePerGram" label="单价(元/g)" placeholder="请输入每克单价" type="digit" />
      <van-cell v-if="form.type !== 'buy'" title="选择批次" :value="selectedBatchLabel || '请选择批次'" is-link @click="showBatchPicker = true" />
      <van-cell v-if="form.type === 'sell'" title="手续费" :value="'¥' + form.fee" />
      <van-cell title="总金额" :value="'¥' + totalAmount" />
    </van-cell-group>

    <div style="margin: 16px;">
      <van-button type="primary" block round @click="onSubmit">提交</van-button>
    </div>

    <div class="records-section">
      <div class="section-title">交易记录</div>
      <div v-for="item in records" :key="item.id" class="record-item">
        <div class="record-left">
          <div class="record-header">
            <span class="record-type" :class="item.type">{{ item.typeText }}</span>
            <span class="record-date">{{ item.date }}</span>
          </div>
          <div class="record-detail">{{ item.grams }}g × ¥{{ item.pricePerGram }}/g = ¥{{ item.amount }}</div>
        </div>
        <div class="record-delete" @click="deleteRecord(item.id)">删除</div>
      </div>
      <div v-if="records.length === 0" class="empty-state">暂无交易记录</div>
    </div>

    <van-popup v-model:show="showDatePicker" position="bottom" @close="showDatePicker = false">
      <van-datetime-picker
        type="date"
        :value="currentDate"
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
import { ref, onMounted, watch } from 'vue'
import { getAllIcbcTransactions, addIcbcTransaction, deleteIcbcTransaction } from '../db'
import { calculateIcbcHolding, getAvailableIcbcBatches, generateId } from '../utils/calculator'

const form = ref({
  type: 'buy',
  date: '',
  grams: '',
  pricePerGram: '',
  fee: '',
  sourceBatchId: ''
})

const availableBatches = ref([])
const maxGrams = ref(0)
const selectedBatchLabel = ref('')
const totalAmount = ref('0.00')
const showDatePicker = ref(false)
const showBatchPicker = ref(false)
const currentDate = ref(Date.now())
const minDate = new Date(2020, 0, 1).getTime()
const maxDate = new Date(2030, 11, 31).getTime()

const holding = ref({
  totalGrams: 0,
  avgCost: 0,
  totalInvested: 0,
  realizedProfit: 0,
  extractedGrams: 0
})

const records = ref([])

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
  records.value = transactions.map(r => {
    let amount = 0
    if (r.type === 'buy') {
      amount = r.grams * r.pricePerGram
    } else if (r.type === 'sell') {
      amount = r.grams * r.pricePerGram - (r.fee || 0)
    } else if (r.type === 'extract') {
      amount = r.grams * r.pricePerGram
    }
    return {
      ...r,
      amount: amount.toFixed(2),
      typeText: r.type === 'buy' ? '买入' : r.type === 'sell' ? '卖出' : '提取'
    }
  })
}

// 将输入值的变更逻辑交给 v-model + watch 来管理，移除旧的 onGramsChange/onPriceChange
async function onTypeChange(e) {
  const value = (e && typeof e === 'object' && 'detail' in e) ? e.detail : e
  form.value.type = value
  form.value.sourceBatchId = ''
  form.value.fee = ''
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
function updateFee() {
  if (form.value.type === 'sell') {
    const grams = parseFloat(form.value.grams) || 0
    const price = parseFloat(form.value.pricePerGram) || 0
    const fee = parseFloat((grams * price * 0.005).toFixed(2))
    form.value.fee = fee > 0 ? fee.toString() : ''
  } else {
    form.value.fee = ''
  }
}

// 使用 watch 实现总金额的实时计算，避免输入时被 onchange 覆盖
watch([
  () => form.value.grams,
  () => form.value.pricePerGram,
  () => form.value.fee
], () => {
  const grams = parseFloat(form.value.grams) || 0
  const price = parseFloat(form.value.pricePerGram) || 0
  const fee = parseFloat(form.value.fee) || 0
  const amount = grams * price - fee
  totalAmount.value = amount.toFixed(2)
  updateFee()
}, { immediate: true })

function onDateConfirm(e) {
  const date = new Date(e.detail)
  form.value.date = formatDate(date)
  showDatePicker.value = false
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
  const pricePerGram = parseFloat(form.value.pricePerGram)

  if (!grams || grams <= 0) {
    showToast({ title: '请输入有效的克数', icon: 'none' })
    return
  }
  if (!pricePerGram || pricePerGram <= 0) {
    showToast({ title: '请输入有效的单价', icon: 'none' })
    return
  }
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
    fee: form.value.type === 'sell' ? parseFloat(form.value.fee) || 0 : 0,
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
  form.value.pricePerGram = ''
  form.value.fee = ''
  form.value.sourceBatchId = ''
  selectedBatchLabel.value = ''
  totalAmount.value = '0.00'

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

.records-section {
  margin: 16px;
  padding: 16px;
  background: var(--bg-card);
  border: 1px solid var(--border-color);
  border-radius: 12px;
  box-shadow: 0 2px 12px rgba(0, 0, 0, 0.3);
}

.section-title {
  font-size: 16px;
  font-weight: 500;
  color: var(--text-primary);
  margin-bottom: 12px;
}

.record-item {
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding: 12px 0;
  border-bottom: 1px solid var(--border-color);
  transition: background 0.3s ease;
}

.record-item:hover {
  background: var(--bg-card-hover);
}

.record-left {
  flex: 1;
}

.record-header {
  display: flex;
  align-items: center;
  margin-bottom: 4px;
}

.record-type {
  font-size: 12px;
  padding: 2px 6px;
  border-radius: 4px;
  margin-right: 8px;
}

.record-type.buy {
  background: rgba(238, 122, 29, 0.2);
  color: #ee7a1d;
}

.record-type.sell {
  background: rgba(24, 144, 255, 0.2);
  color: #1890ff;
}

.record-type.extract {
  background: rgba(82, 196, 26, 0.2);
  color: #52c41a;
}

.record-date {
  font-size: 13px;
  color: var(--text-secondary);
}

.record-detail {
  font-size: 14px;
  color: #fff;
  font-weight: 500;
}

.record-delete {
  font-size: 13px;
  color: #ee0a24;
  padding: 4px 8px;
}

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
