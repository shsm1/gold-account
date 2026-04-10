<template>
  <div class="app-container">
    <router-view v-slot="{ Component }">
      <transition name="fade-slide" mode="out-in">
        <component :is="Component" />
      </transition>
    </router-view>
    <van-tabbar route>
      <van-tabbar-item to="/" icon="gold-coin-o">首页</van-tabbar-item>
      <van-tabbar-item to="/transactions" icon="orders-o">记录</van-tabbar-item>
      <van-tabbar-item to="/icbc" icon="cash-o">如意金</van-tabbar-item>
      <van-tabbar-item to="/settings" icon="setting-o">设置</van-tabbar-item>
    </van-tabbar>
  </div>
</template>

<script setup>
</script>

<style>
:root {
  --bg-primary: #0a0a0a;
  --bg-card: #1a1a1a;
  --bg-card-hover: #252525;
  --gold-accent: #D4AF37;
  --gold-light: #E5C574;
  --gold-dark: #B8963A;
  --text-primary: #ffffff;
  --text-secondary: #888888;
  --text-tertiary: #555555;
  --border-color: #333333;
  --border-gold: #D4AF37;
}

* {
  margin: 0;
  padding: 0;
  box-sizing: border-box;
}

body {
  font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, 'Helvetica Neue', Arial, sans-serif;
  background-color: var(--bg-primary);
  color: var(--text-primary);
  -webkit-font-smoothing: antialiased;
}

.app-container {
  padding-bottom: 60px;
  min-height: 100vh;
  background-color: var(--bg-primary);
}

/* 页面切换动画 */
.fade-slide-enter-active,
.fade-slide-leave-active {
  transition: all 0.3s ease;
}

.fade-slide-enter-from {
  opacity: 0;
  transform: translateY(10px);
}

.fade-slide-leave-to {
  opacity: 0;
  transform: translateY(-10px);
}

/* 滑入动画 */
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

.slide-up {
  animation: slideUp 0.4s ease-out forwards;
}

/* 卡片悬停发光效果 */
.card-glow {
  transition: all 0.3s ease;
}

.card-glow:hover {
  box-shadow: 0 4px 20px rgba(212, 175, 55, 0.15);
  border-color: var(--gold-accent);
}

/* 按钮点击动画 */
.btn-press {
  transition: transform 0.15s ease;
}

.btn-press:active {
  transform: scale(0.96);
}

/* 金色渐变背景 */
.gold-gradient {
  background: linear-gradient(135deg, var(--gold-accent) 0%, var(--gold-dark) 100%);
}

/* 盈利颜色 */
.profit-positive {
  color: #ee0a24;
}

.profit-negative {
  color: #07c160;
}

/* 通用卡片样式 */
.dark-card {
  background: var(--bg-card);
  border: 1px solid var(--border-color);
  border-radius: 12px;
}

/* 通用标题 */
.section-title {
  font-size: 16px;
  font-weight: 500;
  color: var(--text-primary);
  padding: 16px 16px 8px;
}

/* 空状态 */
.empty-state {
  text-align: center;
  padding: 60px 20px;
  color: var(--text-secondary);
}

/* Vant 组件覆盖样式 */
.van-tabbar {
  background-color: var(--bg-primary) !important;
  border-top: 1px solid var(--border-color);
}

.van-tabbar-item {
  color: var(--text-secondary) !important;
}

.van-tabbar-item--active {
  color: var(--gold-accent) !important;
  background-color: var(--bg-card-hover) !important;
}

.van-nav-bar {
  background-color: var(--bg-primary) !important;
  border-bottom: 1px solid var(--border-color);
}

.van-nav-bar__title {
  color: var(--text-primary) !important;
}

.van-cell {
  background-color: var(--bg-card) !important;
  border-bottom: 1px solid var(--border-color);
}

.van-cell__title {
  color: var(--text-primary) !important;
}

.van-cell__value {
  color: var(--text-secondary) !important;
}

.van-field__control {
  color: var(--text-primary) !important;
}

.van-field__control::placeholder {
  color: var(--text-tertiary) !important;
}

.van-radio__label {
  color: var(--text-primary) !important;
}

.van-radio__icon--checked .van-icon {
  background-color: var(--gold-accent) !important;
  border-color: var(--gold-accent) !important;
}

.van-button--primary {
  background: linear-gradient(135deg, var(--gold-accent) 0%, var(--gold-dark) 100%) !important;
  border: none !important;
  color: #0a0a0a !important;
}

.van-button--success {
  background: var(--bg-card) !important;
  border: 1px solid var(--gold-accent) !important;
  color: var(--gold-accent) !important;
}

.van-button--danger {
  background: linear-gradient(135deg, var(--gold-accent) 0%, var(--gold-dark) 100%) !important;
  border: none !important;
  color: #0a0a0a !important;
}

.van-tag--primary {
  background-color: rgba(212, 175, 55, 0.2) !important;
  color: var(--gold-accent) !important;
  border: 1px solid var(--gold-accent) !important;
}

.van-tag--default {
  background-color: var(--bg-card) !important;
  color: var(--text-secondary) !important;
  border: 1px solid var(--border-color) !important;
}

.van-tabs__nav {
  background-color: var(--bg-primary) !important;
}

.van-tabs__tab {
  color: var(--text-secondary) !important;
}

.van-tabs__tab--active {
  color: var(--gold-accent) !important;
}

.van-tabs__line {
  background-color: var(--gold-accent) !important;
}

.van-dialog {
  background-color: var(--bg-card) !important;
}

.van-dialog__title {
  color: var(--text-primary) !important;
}

.van-picker {
  background-color: var(--bg-card) !important;
}

.van-picker__toolbar {
  border-bottom: 1px solid var(--border-color);
}

.van-picker__title {
  color: var(--text-primary) !important;
}

.van-picker-column__item {
  color: var(--text-secondary) !important;
}

.van-picker-column__item--selected {
  color: var(--text-primary) !important;
}

.van-date-picker {
  background-color: var(--bg-card) !important;
}

.van-swipe-cell {
  background-color: var(--bg-card);
  border-bottom: 1px solid var(--border-color);
}

.van-radio-group--horizontal {
  gap: 20px;
}

.van-radio {
  gap: 4px;
}

.van-radio__icon {
  width: 18px;
  height: 18px;
}

.van-radio__icon .van-icon {
  width: 18px;
  height: 18px;
  border: 2px solid var(--text-secondary);
  background-color: transparent;
}

.van-radio__icon--checked .van-icon {
  border-color: var(--gold-accent) !important;
  background-color: var(--gold-accent) !important;
}

.van-radio__icon--checked .van-icon::before {
  display: none;
}

.van-radio__icon--checked::after {
  content: '✓';
  position: absolute;
  top: 50%;
  left: 50%;
  transform: translate(-50%, -50%);
  color: #0a0a0a;
  font-size: 12px;
  font-weight: bold;
}

.van-empty__description {
  color: var(--text-secondary) !important;
}

.van-popup {
  background-color: var(--bg-card) !important;
}

.van-popup--bottom {
  border-top: 1px solid var(--border-color);
}

.van-icon {
  color: var(--text-secondary) !important;
}

.van-cell-group--inset {
  margin: 16px !important;
}
</style>
