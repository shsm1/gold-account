<template>
  <div>
    <van-nav-bar
      :title="isEdit ? '编辑交易' : '新增交易'"
      left-arrow
      @click-left="$router.back()"
    />

    <van-form @submit="onSubmit">
      <van-cell-group inset>
        <van-field name="type" label="类型">
          <template #input>
            <van-radio-group v-model="form.type" direction="horizontal">
              <van-radio name="buy">买入</van-radio>
              <van-radio name="sell">卖出</van-radio>
            </van-radio-group>
          </template>
        </van-field>

        <van-field
          v-if="form.type === 'sell'"
          v-model="selectedBatchLabel"
          name="sourceBatchId"
          label="卖出批次"
          placeholder="请选择要卖出的批次"
          readonly
          is-link
          @click="showBatchPicker = true"
          :rules="[{ required: true, message: '请选择卖出批次' }]"
        />

        <van-field
          v-model="form.grams"
          name="grams"
          label="克数"
          placeholder="请输入克数"
          type="number"
          :rules="[{ required: true, message: '请输入克数' }]"
        />

        <van-field
          v-if="form.type === 'sell' && maxGrams > 0"
          name="maxHint"
          label="可卖上限"
          :value="maxGrams + 'g'"
        />

        <van-field
          v-model="form.pricePerGram"
          name="pricePerGram"
          label="单价(元/g)"
          placeholder="请输入每克单价"
          type="number"
          :rules="[{ required: true, message: '请输入单价' }]"
        />

        <van-field
          v-if="currentFeeRate > 0"
          name="feeRate"
          label="费率"
          :value="(currentFeeRate * 100).toFixed(2) + '%'"
          readonly
        />

        <van-field
          v-model="form.fee"
          name="fee"
          label="手续费(元)"
          placeholder="自动计算，可手动修改"
          type="number"
        />

        <van-field name="date" label="日期">
          <template #input>
            <van-field
              v-model="form.date"
              readonly
              placeholder="请选择日期"
              @click="showDatePicker = true"
            />
          </template>
        </van-field>

        <van-field
          v-model="form.note"
          name="note"
          label="备注"
          placeholder="选填"
          rows="2"
          autosize
          type="textarea"
        />
      </van-cell-group>

      <van-cell-group inset style="margin-top: 16px;">
        <van-cell
          :title="form.type === 'buy' ? '总投入' : '总收回'"
          :value="'¥' + totalAmount"
        />
      </van-cell-group>

      <div style="margin: 16px;">
        <van-button round block type="primary" native-type="submit">
          {{ isEdit ? '保存修改' : '提交' }}
        </van-button>
      </div>
    </van-form>

    <van-popup v-model:show="showDatePicker" position="bottom">
      <van-date-picker
        v-model="currentDate"
        title="选择日期"
        @confirm="onDateConfirm"
        @cancel="showDatePicker = false"
      />
    </van-popup>

    <van-popup v-model:show="showBatchPicker" position="bottom" round>
      <div class="batch-picker">
        <div class="batch-picker-header">
          <span>选择卖出批次</span>
          <van-icon name="cross" @click="showBatchPicker = false" />
        </div>
        <div v-if="availableBatches.length === 0" class="empty-batches">
          暂无可卖出的批次，请先买入
        </div>
        <van-cell
          v-for="batch in availableBatches"
          :key="batch.id"
          :title="`${formatDate(batch.buyDate)} 买入 ${batch.buyGrams}g`"
          :label="`剩余 ${batch.remainingGrams}g | 成本 ¥${batch.costPerGram}/g`"
          @click="selectBatch(batch)"
        />
      </div>
    </van-popup>
  </div>
</template>

<script setup>
import { ref, computed, onMounted, watch } from 'vue'
import { useRoute, useRouter } from 'vue-router'
import { addTransaction, getTransaction, getAllTransactions, addIcbcTransaction } from '../db'
import { generateId, getAvailableBatches, formatDate, getSettings } from '../utils/calculator'
import { showToast } from 'vant'

const route = useRoute()
const router = useRouter()

const isEdit = computed(() => route.path.startsWith('/edit'))

const form = ref({
  type: 'buy',
  sourceBatchId: '',
  grams: '',
  pricePerGram: '',
  fee: '',
  date: new Date().toISOString().split('T')[0],
  note: ''
})

const settings = ref({ buyFeeRate: 0, sellFeeRate: 0 })

const showDatePicker = ref(false)
const showBatchPicker = ref(false)
const availableBatches = ref([])
const maxGrams = ref(0)
const isFeeManuallyEdited = ref(false)

const currentDate = ref([
  new Date().getFullYear().toString(),
  String(new Date().getMonth() + 1).padStart(2, '0'),
  String(new Date().getDate()).padStart(2, '0')
])

const currentFeeRate = computed(() => {
  return form.value.type === 'buy' ? settings.value.buyFeeRate : settings.value.sellFeeRate
})

const selectedBatchLabel = computed(() => {
  if (!form.value.sourceBatchId) return ''
  const batch = availableBatches.value.find(b => b.id === form.value.sourceBatchId)
  if (!batch) return ''
  return `${formatDate(batch.buyDate)} 买入 ${batch.buyGrams}g (剩余${batch.remainingGrams}g)`
})

const totalAmount = computed(() => {
  const grams = parseFloat(form.value.grams) || 0
  const price = parseFloat(form.value.pricePerGram) || 0
  const fee = parseFloat(form.value.fee) || 0
  if (form.value.type === 'buy') {
    return (grams * price + fee).toFixed(2)
  } else {
    return (grams * price - fee).toFixed(2)
  }
})

function calcAutoFee() {
  const grams = parseFloat(form.value.grams) || 0
  const price = parseFloat(form.value.pricePerGram) || 0
  const rate = form.value.type === 'buy' ? settings.value.buyFeeRate : settings.value.sellFeeRate
  return parseFloat((grams * price * rate).toFixed(2))
}

function updateFee() {
  if (!isFeeManuallyEdited.value) {
    form.value.fee = calcAutoFee() > 0 ? calcAutoFee().toString() : ''
  }
}

function onDateConfirm({ selectedValues }) {
  form.value.date = selectedValues.join('-')
  showDatePicker.value = false
}

function selectBatch(batch) {
  form.value.sourceBatchId = batch.id
  maxGrams.value = batch.remainingGrams
  showBatchPicker.value = false
}

async function onSubmit() {
  const grams = parseFloat(form.value.grams)
  const pricePerGram = parseFloat(form.value.pricePerGram)

  if (!grams || grams <= 0) {
    showToast('请输入有效的克数')
    return
  }
  if (!pricePerGram || pricePerGram <= 0) {
    showToast('请输入有效的单价')
    return
  }
  if (form.value.type === 'sell' && !form.value.sourceBatchId) {
    showToast('请选择卖出批次')
    return
  }
  if (form.value.type === 'sell' && grams > maxGrams.value + 0.0001) {
    showToast(`卖出克数不能超过剩余 ${maxGrams.value}g`)
    return
  }

  const transaction = {
    id: isEdit.value ? route.params.id : generateId(),
    type: form.value.type,
    batchId: form.value.type === 'buy' ? generateId() : undefined,
    sourceBatchId: form.value.type === 'sell' ? form.value.sourceBatchId : undefined,
    grams,
    pricePerGram,
    fee: parseFloat(form.value.fee) || 0,
    date: form.value.date,
    note: form.value.note
  }

  await addTransaction(transaction)
  // ICBC auto-sync when note mentions 工行如意积存金
  if (transaction.note && transaction.note.includes('工行如意积存金')) {
    const icbcTx = {
      ...transaction,
      fee: transaction.type === 'sell' ? (transaction.grams * transaction.pricePerGram * 0.005) : 0
    }
    await addIcbcTransaction(icbcTx)
  }
  showToast(isEdit.value ? '修改成功' : '添加成功')
  router.push('/')
}

async function loadBatches() {
  const transactions = await getAllTransactions()
  availableBatches.value = getAvailableBatches(transactions)
}

watch(() => form.value.type, () => {
  isFeeManuallyEdited.value = false
  if (form.value.type === 'sell') {
    loadBatches()
  }
  updateFee()
})

watch(() => form.value.grams + form.value.pricePerGram, () => {
  updateFee()
})

onMounted(async () => {
  settings.value = getSettings()

  if (isEdit.value) {
    const tx = await getTransaction(route.params.id)
    if (tx) {
      form.value = {
        type: tx.type,
        sourceBatchId: tx.sourceBatchId || '',
        grams: tx.grams.toString(),
        pricePerGram: tx.pricePerGram.toString(),
        fee: tx.fee ? tx.fee.toString() : '',
        date: tx.date,
        note: tx.note || ''
      }
      isFeeManuallyEdited.value = true
      if (tx.sourceBatchId) {
        await loadBatches()
        const batch = availableBatches.value.find(b => b.id === tx.sourceBatchId)
        if (batch) {
          maxGrams.value = batch.remainingGrams + tx.grams
        }
      }
    }
  } else {
    if (route.query.type) {
      form.value.type = route.query.type
    }
    if (route.query.batchId) {
      await loadBatches()
      const batch = availableBatches.value.find(b => b.id === route.query.batchId)
      if (batch) {
        form.value.sourceBatchId = batch.id
        maxGrams.value = batch.remainingGrams
        if (route.query.maxGrams) {
          form.value.grams = route.query.maxGrams.toString()
        }
      }
    }
    if (form.value.type === 'sell') {
      await loadBatches()
    }
    updateFee()
  }
})
</script>

<style scoped>
.batch-picker {
  padding: 16px;
  max-height: 60vh;
  overflow-y: auto;
  background: var(--bg-card);
}

.batch-picker-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding: 8px 0 16px;
  font-size: 16px;
  font-weight: 500;
  color: var(--gold-accent);
  border-bottom: 1px solid var(--border-color);
  margin-bottom: 8px;
}

.batch-picker :deep(.van-cell) {
  background: var(--bg-card);
  border-bottom: 1px solid var(--border-color);
}

.batch-picker :deep(.van-cell__title) {
  color: var(--text-primary);
}

.batch-picker :deep(.van-cell__label) {
  color: var(--text-secondary);
}

.batch-picker :deep(.van-icon) {
  color: var(--text-secondary);
}

.empty-batches {
  text-align: center;
  padding: 32px 0;
  color: var(--text-secondary);
  font-size: 14px;
}

.form-section {
  background: var(--bg-card);
  border: 1px solid var(--border-color);
  border-radius: 12px;
  margin: 16px;
  overflow: hidden;
}

.form-section :deep(.van-cell) {
  background: var(--bg-card);
  border-bottom: 1px solid var(--border-color);
}

.form-section :deep(.van-cell__title) {
  color: var(--text-primary);
}

.form-section :deep(.van-field__label) {
  color: var(--text-primary);
}

.form-section :deep(.van-field__control) {
  color: var(--text-primary);
}

.form-section :deep(.van-field__control::placeholder) {
  color: var(--text-tertiary);
}
</style>
