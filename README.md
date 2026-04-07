# 积存金记账 APP

一个轻量级的积存金买卖记账管理应用，支持批次管理、独立盈亏计算，数据完全本地存储。

## 功能特性

### 核心功能
- **买入/卖出记录** - 克数、单价、手续费、日期、备注
- **批次管理** - 支持从指定批次部分卖出，每批独立计算盈亏
- **持仓统计** - 持仓克数、平均成本(含手续费摊入)、持仓总价、已实现盈亏
- **账户余额** - 总投入 - 累计买入(含手续费) + 累计卖出(扣手续费)

### 费率与价格
- **手续费设置** - 买入/卖出费率设置，新增交易自动计算手续费，可手动修改
- **总投入金额** - 用户手动设置，用于计算账户余额
- **当前金价** - 输入金价计算浮动盈亏和总市值

### 数据管理
- **数据导入/导出** - JSON 格式备份
- **工行如意积存金同步** - 备注包含"工行如意积存金"自动同步到工行账户

## 页面导航

| 页面 | 功能 |
|------|------|
| 首页 | 持仓总览卡片、快捷买入/卖出、持仓批次列表 |
| 记录 | 交易明细 / 持仓批次 两种视图切换 |
| 如意金 | 工行如意积存金独立管理 |
| 设置 | 手续费费率、总投入金额、数据导入/导出 |

## 持仓批次展示

采用横向表格展示：
- 买入量 | 剩余 | 已售 | 成本/g | 盈亏 | 总价
- 按买入时间升序排列，最早买入的批次显示在前

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
│   │   └── index.js         # IndexedDB 数据操作（双库：主交易+ICBC）
│   ├── utils/
│   │   └── calculator.js    # 持仓/盈亏计算（含ICBC计算）
│   └── views/
│       ├── Home.vue          # 首页-持仓概览+批次列表
│       ├── Transactions.vue  # 交易记录列表
│       ├── AddTransaction.vue # 新增/编辑交易
│       ├── Icbc.vue          # 工行如意金页面
│       └── Settings.vue      # 设置-参数/数据管理
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

## 数据说明

### 账户余额计算
```
账户余额 = 总投入 - 累计买入金额(含手续费) + 累计卖出金额(扣手续费)
```

### 批次成本计算
```
实际成本/g = (买入单价 × 买入克数 + 买入手续费) / 买入克数
```

### 批次盈亏计算
```
已实现盈亏 = (卖出单价 - 实际成本/g) × 卖出克数 - 卖出手续费
```
