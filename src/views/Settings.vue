<template>
  <div>
    <van-nav-bar title="设置" />

    <van-cell-group inset style="margin-top: 16px;">
      <van-cell title="参数设置" is-link @click="showFeeSettings = true" :value="feeSettingSummary" />
      <van-cell title="总投入金额" is-link @click="showInvestedSettings = true" :value="'¥' + totalInvested.toFixed(2)" />
      <van-cell title="导出数据" is-link @click="exportData" />
      <van-cell title="导入数据" is-link @click="triggerImport" />
      <van-cell title="清空所有数据" is-link @click="confirmClear" />
    </van-cell-group>

    <van-cell-group inset style="margin-top: 16px;">
      <van-cell title="关于" :value="'v1.0.0'" />
      <van-cell title="数据存储" :value="'本地存储 (IndexedDB)'" />
    </van-cell-group>

    <input
      ref="fileInput"
      type="file"
      accept=".json"
      style="display: none"
      @change="importData"
    />

    <van-dialog
      v-model:show="showFeeSettings"
      title="手续费费率设置"
      show-cancel-button
      @confirm="saveFeeSettings"
    >
      <div class="fee-settings">
        <van-field
          v-model="tempSettings.buyFeeRate"
          label="买入费率"
          type="number"
          placeholder="例如 0.2"
        >
          <template #button>
            <span class="unit">%</span>
          </template>
        </van-field>
        <van-field
          v-model="tempSettings.sellFeeRate"
          label="卖出费率"
          type="number"
          placeholder="例如 0.2"
        >
          <template #button>
            <span class="unit">%</span>
          </template>
        </van-field>
        <div class="fee-hint">提示：新增交易时将根据费率自动计算手续费，也可手动修改</div>
      </div>
    </van-dialog>

    <van-dialog
      v-model:show="showInvestedSettings"
      title="总投入金额设置"
      show-cancel-button
      @confirm="saveInvestedSettings"
    >
      <div class="fee-settings">
        <van-field
          v-model="tempInvested"
          label="总投入金额"
          type="number"
          placeholder="请输入总投入金额"
        >
          <template #button>
            <span class="unit">元</span>
          </template>
        </van-field>
        <div class="fee-hint">提示：此金额代表您投入黄金账户的总资金，用于计算账户余额</div>
      </div>
    </van-dialog>

    <van-dialog
      v-model:show="showClearDialog"
      title="确认清空"
      show-cancel-button
      @confirm="clearAllData"
    >
      <p style="padding: 16px; color: #ee0a24;">
        此操作将删除所有交易记录，且无法恢复，确定继续？
      </p>
    </van-dialog>
  </div>
</template>

<script setup>
import { ref, computed, onMounted } from 'vue'
import { getAllTransactions, clearAllTransactions, importTransactions } from '../db'
import { getSettings, saveSettings, getTotalInvested, setTotalInvested } from '../utils/calculator'
import { showToast } from 'vant'

const fileInput = ref(null)
const showClearDialog = ref(false)
const showFeeSettings = ref(false)
const showInvestedSettings = ref(false)

const settings = ref({ buyFeeRate: 0, sellFeeRate: 0 })
const tempSettings = ref({ buyFeeRate: '', sellFeeRate: '' })
const totalInvested = ref(0)
const tempInvested = ref('')

const feeSettingSummary = computed(() => {
  const buy = (settings.value.buyFeeRate * 100).toFixed(2)
  const sell = (settings.value.sellFeeRate * 100).toFixed(2)
  return `买${buy}% 卖${sell}%`
})

function saveFeeSettings() {
  const buyRate = parseFloat(tempSettings.value.buyFeeRate) || 0
  const sellRate = parseFloat(tempSettings.value.sellFeeRate) || 0
  settings.value = { buyFeeRate: buyRate / 100, sellFeeRate: sellRate / 100 }
  saveSettings(settings.value)
  showToast('设置已保存')
}

function saveInvestedSettings() {
  const amount = parseFloat(tempInvested.value) || 0
  totalInvested.value = amount
  setTotalInvested(amount)
  showToast('总投入金额已保存')
}

async function exportData() {
  const transactions = await getAllTransactions()
  if (transactions.length === 0) {
    showToast('暂无数据可导出')
    return
  }

  const data = JSON.stringify(transactions, null, 2)
  const blob = new Blob([data], { type: 'application/json' })
  const url = URL.createObjectURL(blob)
  const a = document.createElement('a')
  a.href = url
  a.download = `积存金记账_${new Date().toISOString().split('T')[0]}.json`
  a.click()
  URL.revokeObjectURL(url)
  showToast('导出成功')
}

function triggerImport() {
  fileInput.value.click()
}

async function importData(event) {
  const file = event.target.files[0]
  if (!file) return

  try {
    const text = await file.text()
    const data = JSON.parse(text)
    if (!Array.isArray(data)) {
      showToast('数据格式错误')
      return
    }

    await importTransactions(data)
    showToast(`成功导入 ${data.length} 条记录`)
    event.target.value = ''
  } catch (e) {
    showToast('导入失败，请检查文件格式')
  }
}

function confirmClear() {
  showClearDialog.value = true
}

async function clearAllData() {
  await clearAllTransactions()
  showToast('已清空所有数据')
}

onMounted(() => {
  settings.value = getSettings()
  totalInvested.value = getTotalInvested()
})
</script>

<style scoped>
.fee-settings {
  padding: 16px;
}

.unit {
  color: #999;
  font-size: 14px;
}

.fee-hint {
  padding: 8px 0 0;
  font-size: 12px;
  color: #999;
  line-height: 1.5;
}
</style>
