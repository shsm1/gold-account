<template>
  <div>
    <van-nav-bar title="交易记录" />
    
    <van-tabs v-model:active="viewMode">
      <van-tab title="交易明细" name="transactions"></van-tab>
      <van-tab title="持仓批次" name="batches"></van-tab>
    </van-tabs>

    <div v-if="viewMode === 'transactions'">
      <van-tabs v-model:active="txFilter" sticky offset-top="44">
        <van-tab title="全部" name="all"></van-tab>
        <van-tab title="买入" name="buy"></van-tab>
        <van-tab title="卖出" name="sell"></van-tab>
      </van-tabs>

      <div v-if="filteredTransactions.length === 0" class="empty-state">
        <van-empty description="暂无交易记录" />
      </div>
      <div v-else>
        <van-swipe-cell v-for="tx in filteredTransactions" :key="tx.id">
          <div class="tx-item" @click="editTransaction(tx.id)">
            <div class="tx-header">
              <span class="tx-type" :class="tx.type">
                {{ tx.type === 'buy' ? '买入' : '卖出' }}
              </span>
              <span class="tx-amount">¥{{ (tx.grams * tx.pricePerGram).toFixed(2) }}</span>
            </div>
            <div class="tx-details">
              <span>{{ tx.grams }}g × ¥{{ tx.pricePerGram }}/g</span>
              <span>{{ formatDate(tx.date) }}</span>
            </div>
            <div v-if="tx.type === 'sell' && tx.sourceBatchId" class="tx-batch-ref">
              来源批次: {{ getBatchLabel(tx.sourceBatchId) }}
            </div>
            <div v-if="tx.fee" class="tx-details">
              <span>手续费: ¥{{ tx.fee }}</span>
            </div>
            <div v-if="tx.note" class="tx-note">{{ tx.note }}</div>
          </div>
          <template #right>
            <van-button square type="primary" text="编辑" class="swipe-button" @click="editTransaction(tx.id)" />
            <van-button square type="danger" text="删除" class="swipe-button" @click="confirmDelete(tx)" />
          </template>
        </van-swipe-cell>
      </div>
    </div>

    <div v-else>
      <van-tabs v-model:active="batchFilter" sticky offset-top="44">
        <van-tab title="全部" name="all"></van-tab>
        <van-tab title="持仓中" name="active"></van-tab>
        <van-tab title="已清仓" name="closed"></van-tab>
      </van-tabs>

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
        </div>
      </div>
    </div>

    <van-dialog
      v-model:show="showDeleteDialog"
      title="确认删除"
      show-cancel-button
      @confirm="deleteTransaction"
    >
      <p style="padding: 16px;">确定要删除这条交易记录吗？</p>
    </van-dialog>
  </div>
</template>

<script setup>
import { ref, computed, onMounted } from 'vue'
import { useRouter } from 'vue-router'
import { getAllTransactions, deleteTransaction as dbDeleteTransaction } from '../db'
import { formatDate, getBatches } from '../utils/calculator'
import { showToast } from 'vant'

const router = useRouter()
const viewMode = ref('transactions')
const txFilter = ref('all')
const batchFilter = ref('all')
const transactions = ref([])
const batches = ref([])
const showDeleteDialog = ref(false)
const deleteTarget = ref(null)

const filteredTransactions = computed(() => {
  if (txFilter.value === 'all') return transactions.value
  return transactions.value.filter(tx => tx.type === txFilter.value)
})

const filteredBatches = computed(() => {
  if (batchFilter.value === 'active') {
    return batches.value.filter(b => b.remainingGrams > 0.0001)
  }
  if (batchFilter.value === 'closed') {
    return batches.value.filter(b => b.remainingGrams <= 0.0001)
  }
  return batches.value
})

function getBatchLabel(batchId) {
  const batch = batches.value.find(b => b.id === batchId)
  if (!batch) return batchId
  return `${formatDate(batch.buyDate)} ${batch.buyGrams}g`
}

async function loadData() {
  transactions.value = await getAllTransactions()
  batches.value = getBatches(transactions.value)
}

function editTransaction(id) {
  router.push(`/edit/${id}`)
}

function confirmDelete(tx) {
  deleteTarget.value = tx
  showDeleteDialog.value = true
}

async function deleteTransaction() {
  if (deleteTarget.value) {
    await dbDeleteTransaction(deleteTarget.value.id)
    showToast('删除成功')
    await loadData()
    deleteTarget.value = null
  }
}

onMounted(loadData)
</script>

<style scoped>
.swipe-button {
  height: 100%;
}

.tx-item {
  padding: 14px 16px;
  background: var(--bg-card);
  border-bottom: 1px solid var(--border-color);
  transition: background 0.3s ease;
}

.tx-item:hover {
  background: var(--bg-card-hover);
}

.tx-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 8px;
}

.tx-type {
  font-size: 15px;
  font-weight: 500;
}

.tx-type.buy {
  color: #ee0a24;
}

.tx-type.sell {
  color: #07c160;
}

.tx-amount {
  font-size: 16px;
  font-weight: 500;
  color: var(--gold-accent);
}

.tx-details {
  display: flex;
  justify-content: space-between;
  font-size: 13px;
  color: var(--text-secondary);
}

.tx-note {
  font-size: 12px;
  color: var(--text-secondary);
  margin-top: 4px;
}

.tx-batch-ref {
  font-size: 12px;
  color: var(--gold-accent);
  margin-top: 4px;
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
</style>
