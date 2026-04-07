# 积存金记账 APP

一个轻量级的积存金买卖记账管理应用，数据完全本地存储。

## 功能

- 买入/卖出记录（克数、单价、手续费、日期、备注）
- 持仓统计（持仓克数、平均成本、累计投入、已实现盈亏）
- 交易记录管理（查看、编辑、删除、筛选）
- 数据导入/导出（JSON格式备份）
- 本地存储（IndexedDB，无需网络）

## 开发

```bash
npm install
npm run dev
```

## 构建

```bash
npm run build
```

## 打包 APK

### 环境要求

1. **JDK 17**（推荐，最低需要 JDK 11）
   - 下载地址：https://adoptium.net/
   - 安装后设置环境变量 `JAVA_HOME`

2. **Android Studio**（包含 Android SDK）
   - 下载地址：https://developer.android.com/studio
   - 安装后设置环境变量 `ANDROID_HOME`

### 打包步骤

```bash
# 1. 构建 Web 资源
npm run build

# 2. 同步到 Android 项目
npx cap sync android

# 3. 用 Android Studio 打开
npx cap open android

# 4. 在 Android Studio 中点击 Build -> Build Bundle(s) / APK(s) -> Build APK(s)
```

### 命令行打包（需要配置好 Gradle）

```bash
cd android
./gradlew assembleDebug
# APK 输出在 android/app/build/outputs/apk/debug/app-debug.apk
```

## 项目结构

```
gold-account/
├── src/
│   ├── main.js              # 入口文件
│   ├── App.vue              # 根组件（底部导航）
│   ├── router.js            # 路由配置
│   ├── db/
│   │   └── index.js         # IndexedDB 数据操作
│   ├── utils/
│   │   └── calculator.js    # 持仓/盈亏计算
│   └── views/
│       ├── Home.vue          # 首页-持仓概览
│       ├── Transactions.vue  # 交易记录列表
│       ├── AddTransaction.vue # 新增/编辑交易
│       └── Settings.vue      # 设置-导入导出
├── android/                  # Capacitor Android 项目
├── capacitor.config.json     # Capacitor 配置
├── vite.config.js            # Vite 配置
└── package.json
```

## 技术栈

- Vue 3 + Vite
- Vant 4（移动端 UI）
- Vue Router 4
- IndexedDB（idb 封装）
- Capacitor 5（原生打包）
