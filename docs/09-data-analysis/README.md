# Python 数据分析（EDA）—— 水质监测数据探索

> 展示用 pandas + matplotlib 对水质时序数据做探索性分析（EDA）的能力，并与产品逻辑（三档阈值判定引擎）打通。
>
> **诚实边界**：真实硬件尚未接入，本脚本的输入为**模拟水质数据**（随机游走 + 偶发异常，与软著 `mockSource.js` 同源逻辑，参数对齐 `config.js` 的 `METRICS`）。后续接入真实公开数据集/实地采样后，替换数据源即可复用整套分析。

---

## 1. 分析内容

| 分析 | 回答的产品问题 |
|---|---|
| 六指标时间趋势 | 水质随时间如何波动？哪些指标长期超标？ |
| 各指标分布 | 读数集中区间？偏离国标多远？ |
| 指标相关性 | 哪些指标同涨同跌（如余氯↔浊度）？ |
| 三档阈值判定占比 | 红/黄/绿各占多少？预警压力有多大？ |
| 异常（超标）频次 | 哪类预警最频繁？对应哪类设备？ |

## 2. 运行方式

```bash
cd 09-data-analysis
python eda_water_quality.py
```

- 依赖：`pandas`、`matplotlib`、`numpy`（Python 3.13 环境已具备）。
- 输出：`charts/*.png` 图表 + `water_quality_sim.csv` 数据 + 控制台统计摘要。

## 3. 产物说明

| 文件 | 内容 |
|---|---|
| `eda_water_quality.py` | EDA 主脚本（数据生成 + 阈值判定 + 可视化） |
| `charts/` | 5 张统一风格图表（PNG） |
| `water_quality_sim.csv` | 生成的模拟数据（可复现） |

## 4. 阈值判定逻辑（与软著一致）

三档判定与 `server/engine/alertEngine.js` 同源：
- `safe`（绿）：`safeMin ≤ value ≤ safeMax`
- `warn`（黄）：超出 safe 但未超 warn
- `danger`（红）：超出 `warnMin / warnMax`

指标阈值取自 `config.js`：余氯 0–0.2 / 硬度 0–300 / pH 6.5–8.5 / 浊度 0–1 / 温度 10–30 / 重金属 0–10。
