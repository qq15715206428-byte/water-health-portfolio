# 家庭水质健康智能管理移动应用软件 V1.0

> 打通水质监测"最后一米"：面向家庭的便携式微型水质智能检测与个性化健康管理系统。

本软件为纯前端网页应用（HTML5 + CSS + JavaScript，ES Modules），无构建步骤、无第三方依赖，浏览器即开即用；采用"移动端优先"的窄容器布局，模拟移动应用观感。

## 一、技术特点

- **纯前端 SPA**：原生 HTML5 + CSS + JS，ES Modules 模块化组织，无需打包构建。
- **数据源抽象**：统一 `DataSource` 接口，内置三种实现——
  - `MockDataSource`（默认）：本地生成真实感水质时序数据，供功能演示；
  - `HttpDataSource`：REST API 客户端（预留，对接云端平台时启用）；
  - `MqttDataSource`：MQTT-over-WebSocket 客户端（预留，对接硬件终端时启用）。
- **本地缓存**：`localStorage` 封装，实现账号、健康画像与设置的本地持久化存储。
- **自绘图表**：SVG 折线图 / 环形仪表盘 / 柱状图，无 CDN 依赖、离线可用。

## 二、目录结构

```
water-health-app/
├── index.html               # 应用外壳（登录页 + 主界面）
├── manifest.json            # PWA 清单
├── start.bat                # Windows 一键启动脚本
├── README.md                # 本说明
├── css/
│   └── style.css            # 全局样式
├── js/
│   ├── app.js               # 入口：路由 / 导航 / 全局状态
│   ├── config.js            # 全局配置（指标阈值 / 端点 / 画像选项）
│   ├── data/
│   │   ├── dataSource.js    # 数据源抽象接口
│   │   ├── dataSourceFactory.js  # 数据源工厂
│   │   ├── mockSource.js    # 模拟数据源
│   │   ├── httpSource.js    # REST API 客户端（预留）
│   │   └── mqttSource.js    # MQTT WebSocket 客户端（预留）
│   ├── storage/cache.js     # 本地缓存封装
│   ├── engine/
│   │   ├── alertEngine.js   # 异常预警判定引擎
│   │   └── healthEngine.js  # 健康画像 → 个性化方案引擎
│   ├── views/               # 11 个功能视图
│   └── utils/
│       ├── chart.js         # 自绘 SVG 图表
│       └── format.js        # 数值 / 日期格式化
└── smoke_test.mjs           # 核心逻辑冒烟测试（Node）
```

## 三、运行方式

### 方式一：Windows 一键启动

双击 `start.bat`，脚本会启动本地静态服务器并自动打开浏览器（默认 `http://localhost:8080`）。

### 方式二：命令行启动

ES Modules 需要通过 HTTP 服务访问，不能直接双击 `file://` 打开。任选其一：

```bash
# 使用 Python
python -m http.server 8080

# 使用 Node.js
npx http-server -p 8080 -o
```

启动后浏览器访问 <http://localhost:8080>，注册账号登录后即可使用。

## 四、功能模块

| 模块 | 说明 |
|---|---|
| 登录 / 注册 | 本地账号体系，账号保存在本机浏览器 |
| 水质仪表盘 | 综合评分（红黄绿三色）+ 六项指标卡片 |
| 实时监测 | 定时刷新，指标达标状态一目了然 |
| 历史趋势 | 日 / 周 / 月折线图，可切换指标 |
| 健康画像 | 皮肤 / 头皮 / 敏感点 / 家庭成员录入 |
| 健康方案 | 指标超标 + 画像 → 个性化饮水 / 护肤 / 护发建议 |
| 异常预警 | 分级预警（饮用水高风险 / 生活用水提示）+ 记录 |
| 设备管理 | 监测设备绑定 / 解绑 / 在线状态 |
| 设备联动 | 净水器 / 软水机 / 智能水龙头手动与自动联动 |
| 健康报告 | 周报 / 月报生成，复制 / 打印导出 |
| 系统设置 | 通知开关、数据清除、隐私说明、退出登录 |

## 五、接入真实数据（预留接口）

在 `js/config.js` 中修改 `DATA_SOURCE_MODE` 并填写端点：

```js
export const DATA_SOURCE_MODE = 'http';   // 或 'mqtt'
export const ENDPOINTS = {
  restBaseUrl: 'https://api.example.com',      // REST API 根地址
  mqttBrokerUrl: 'wss://broker.example.com:8084/mqtt',  // MQTT Broker
  mqttTopicPrefix: 'home/water/',
};
```

- **REST 接口约定**：`GET /api/water/current`、`GET /api/water/history?range=&metric=`、`GET /api/devices`、`GET /api/linkage`、`POST /api/linkage/:id/control`。
- **MQTT 主题约定**：`home/water/<metricKey>`，负载为指标数值字符串。

## 六、逻辑测试

```bash
node smoke_test.mjs
```

输出 `24 通过，0 失败` 即为核心逻辑（模拟数据生成、三档阈值判定、预警分析、健康方案、MQTT 编解码）全部正常。

## 七、软件著作权说明

本软件为《家庭水质健康智能管理移动应用软件 V1.0》的源程序实现，著作权人：河海大学。源程序可作为软著登记的"源程序鉴别材料"（前 30 页 + 后 30 页）。
