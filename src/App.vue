<template>
  <div class="app-container">
    <router-view />
    <van-tabbar route>
      <van-tabbar-item to="/" icon="home-o">首页</van-tabbar-item>
      <van-tabbar-item to="/transactions" icon="orders-o">记录</van-tabbar-item>
      <van-tabbar-item to="/icbc" icon="cash-o">如意金</van-tabbar-item>
      <van-tabbar-item to="/settings" icon="setting-o">设置</van-tabbar-item>
    </van-tabbar>
  </div>
</template>

<script setup>
</script>

<style>
* {
  margin: 0;
  padding: 0;
  box-sizing: border-box;
}

body {
  font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, 'Helvetica Neue', Arial, sans-serif;
  background-color: #f5f5f5;
  -webkit-font-smoothing: antialiased;
}

.app-container {
  padding-bottom: 50px;
  min-height: 100vh;
}

.holding-card {
  background: linear-gradient(135deg, rgb(232 226 31 / 0.94) 10%, rgb(214 129 6) 90%);
  border-radius: 12px;
  padding: 20px;
  margin: 16px;
  color: #fff;
  box-shadow: 0 4px 12px rgba(255, 165, 0, 0.3);
}

.holding-card h2 {
  font-size: 14px;
  opacity: 0.9;
  margin-bottom: 8px;
}

.holding-card .grams {
  font-size: 36px;
  font-weight: bold;
  margin-bottom: 4px;
}

.holding-card .unit {
  font-size: 18px;
  font-weight: bold;
  opacity: 0.8;
}

.holding-details {
  display: flex;
  justify-content: space-between;
  margin-top: 16px;
  padding-top: 16px;
  border-top: 1px solid rgba(255, 255, 255, 0.3);
}

.holding-details .item {
  text-align: center;
}

.holding-details .label {
  font-size: 20px;
  font-weight: bold;
  opacity: 0.8;
  margin-bottom: 4px;
}

.holding-details .value {
  font-size: 18px;
  font-weight: 500;
}

.profit-positive {
  color: #ee0a24;
}

.profit-negative {
  color: #07c160;
}

.section-title {
  padding: 16px 16px 8px;
  font-size: 16px;
  font-weight: 500;
  color: #333;
}

.tx-item {
  padding: 12px 16px;
  background: #fff;
  border-bottom: 1px solid #f0f0f0;
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
}

.tx-details {
  display: flex;
  justify-content: space-between;
  font-size: 13px;
  color: #999;
}

.tx-note {
  font-size: 12px;
  color: #999;
  margin-top: 4px;
}

.empty-state {
  text-align: center;
  padding: 60px 20px;
  color: #999;
}

.quick-actions {
  display: flex;
  gap: 12px;
  padding: 16px;
}

.quick-actions .van-button {
  flex: 1;
}
</style>
