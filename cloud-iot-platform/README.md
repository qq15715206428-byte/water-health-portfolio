# 家庭水质健康物联网云平台软件 V1.0

> 面向家庭的便携式微型水质智能检测与个性化健康管理系统的云端物联网平台，承接监测终端设备接入、水质数据汇聚存储、边缘计算、AI 健康分析与异常预警推送，为移动应用（软著1）提供后端支撑。

本软件为 Node.js 服务端应用（Express REST API + aedes MQTT Broker）+ 配套 Web 管理控制台（桌面端大屏），依赖均为纯 JS、无原生编译，`npm install` 后一键启动。

## 一、技术特点

- **设备接入**：aedes 实现 MQTT 3.1.1 Broker，同时支持 TCP（1883）与 WebSocket（`/mqtt`），监测终端通过主题 `home/water/<metricKey>` 上报水质数据。
- **REST API**：Express 提供实时/历史数据、设备、联动控制等接口，供移动应用 `HttpDataSource` 对接。
- **数据汇聚存储**：Node 内置 `fs` 读写 JSON 文件 + 内存缓存，水质时序数据 / 设备 / 预警记录持久化。
- **边缘计算**：内置三档阈值判定引擎，数据接入后即时本地判定风险等级。
- **AI 健康分析**：水质指标 + 用户健康画像 → 个性化用水建议（规则引擎）。
- **设备联动**：净水器 / 软水机 / 智能水龙头 / 全屋净水系统的自动与手动联动控制。
- **数据安全**：Node 内置 `crypto` 实现口令哈希与 AES 数据加密。

## 二、目录结构

```
cloud-iot-platform/
├── package.json            # 依赖与启动脚本
├── start.bat               # Windows 一键启动
├── README.md               # 本说明
├── smoke_test.js          # 核心逻辑冒烟测试（Node）
├── server/
│   ├── index.js            # 入口：启动 HTTP + MQTT broker
│   ├── config.js           # 端口 / 指标定义 / 阈值 / 预警 / 画像
│   ├── mqtt/
│   │   ├── broker.js       # aedes 封装
│   │   └── deviceSimulator.js  # 模拟监测终端上报
│   ├── api/
│   │   ├── router.js       # REST 路由汇总
│   │   ├── water.js        # current / history
│   │   ├── device.js       # 设备接口
│   │   ├── linkage.js      # 联动控制接口
│   │   └── user.js         # 用户接口
│   ├── store/
│   │   ├── db.js           # JSON 持久化 + 内存缓存
│   │   ├── reading.js      # 水质时序数据
│   │   ├── device.js       # 设备注册表
│   │   └── alert.js        # 预警记录
│   ├── engine/
│   │   ├── alertEngine.js  # 三档阈值判定 + 分级预警
│   │   ├── healthEngine.js # 水质-健康关联分析
│   │   └── linkageEngine.js # 联动决策
│   └── util/
│       ├── format.js       # 时间 / 数值格式化
│       └── crypto.js       # 口令哈希 / AES 加密
└── console/                # Web 管理控制台
    ├── index.html
    ├── css/style.css
    └── js/
        ├── app.js          # 控制台入口 / 路由
        ├── api.js          # API 客户端
        └── views/*.js      # 各功能模块视图
```

## 三、运行方式

### 方式一：Windows 一键启动

双击 `start.bat`，脚本会检测 Node.js、首次运行自动 `npm install`，随后启动云平台服务并打开管理控制台（`http://localhost:8090`）。

### 方式二：命令行启动

```bash
npm install
npm start
```

启动后：

- 管理控制台：<http://localhost:8090>（默认管理员账号 `admin` / `123456`）
- REST API：`http://localhost:8090/api/...`
- MQTT（TCP）：`mqtt://localhost:1883`
- MQTT（WebSocket）：`ws://localhost:8090/mqtt`

## 四、REST 接口约定（对接移动应用）

| 方法 | 路径 | 说明 |
|---|---|---|
| GET | `/api/water/current` | 最新水质读数 `{ time, metrics }` |
| GET | `/api/water/history?range=&metric=` | 历史时序 `{ labels, values }` |
| GET | `/api/devices` | 设备列表 |
| GET | `/api/linkage` | 联动设备列表 |
| POST | `/api/linkage/:id/control` | 联动控制，body `{ on }` |

MQTT 主题约定：`home/water/<metricKey>`，负载为指标数值字符串（如 `0.18`）。

## 五、逻辑测试

```bash
node smoke_test.js
```

输出全部通过即为核心逻辑（三档阈值判定、预警分析、健康分析、联动决策、MQTT 编解码）正常。

## 六、软件著作权说明

本软件为《家庭水质健康物联网云平台软件 V1.0》的源程序实现，著作权人：河海大学。源程序可作为软著登记的"源程序鉴别材料"（前 30 页 + 后 30 页）。
