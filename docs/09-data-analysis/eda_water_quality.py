# -*- coding: utf-8 -*-
"""
水质监测数据探索性分析（EDA）
- 生成模拟水质数据（随机游走 + 偶发异常，参数对齐软著 config.js 的 METRICS）
- 用三档阈值判定引擎（safe/warn/danger）对每条读数分类
- 产出统一风格图表 + 统计摘要
用法：python eda_water_quality.py
"""
import os
import numpy as np
import pandas as pd
import matplotlib
matplotlib.use("Agg")
import matplotlib.pyplot as plt

# ---------- 中文字体与统一风格 ----------
plt.rcParams["font.sans-serif"] = ["Microsoft YaHei", "SimHei", "DejaVu Sans"]
plt.rcParams["axes.unicode_minus"] = False
plt.rcParams["figure.dpi"] = 120

# 统一配色（呼应产品“红黄绿三档”）
C_SAFE = "#4CAF50"   # 绿
C_WARN = "#FB8C00"   # 黄
C_DANGER = "#E53935" # 红
C_BLUE = "#2F5597"   # 主色（与简历/产品一致）
C_GREY = "#9E9E9E"

HERE = os.path.dirname(os.path.abspath(__file__))
CHARTS = os.path.join(HERE, "charts")
os.makedirs(CHARTS, exist_ok=True)

# ---------- 指标定义（对齐 config.js METRICS） ----------
METRICS = {
    "chlorine":   {"name": "余氯",   "unit": "mg/L", "base": 0.12, "drift": 0.05,
                   "safe": (0, 0.2),   "warn": (0.2, 0.3)},
    "hardness":   {"name": "硬度",   "unit": "mg/L", "base": 210,  "drift": 60,
                   "safe": (0, 300),   "warn": (300, 450)},
    "ph":         {"name": "pH",     "unit": "",     "base": 7.2,  "drift": 0.4,
                   "safe": (6.5, 8.5), "warn": (6.0, 9.0)},
    "turbidity":  {"name": "浊度",   "unit": "NTU",  "base": 0.5,  "drift": 0.4,
                   "safe": (0, 1),     "warn": (1, 3)},
    "temp":       {"name": "温度",   "unit": "℃",    "base": 22,   "drift": 3,
                   "safe": (10, 30),   "warn": (5, 35)},
    "heavyMetal": {"name": "重金属", "unit": "ppb",  "base": 5,    "drift": 4,
                   "safe": (0, 10),    "warn": (10, 30)},
}
DEVICES = ["dev-fixed-01", "dev-portable-01"]

rng = np.random.default_rng(42)  # 固定种子，可复现


def three_tier(value, safe, warn):
    """三档判定：safe / warn / danger（与 alertEngine 同源）。"""
    s_min, s_max = safe
    w_min, w_max = warn
    if s_min <= value <= s_max:
        return "safe"
    if w_min <= value <= w_max:
        return "warn"
    return "danger"


def simulate_series(n, base, drift, safe, p_anomaly=0.03):
    """随机游走 + 偶发异常。"""
    values = [base]
    for _ in range(n - 1):
        step = rng.normal(0, drift / 3)
        values.append(values[-1] + step)
    values = np.clip(values, max(0, base - 4 * drift), base + 4 * drift)
    # 偶发异常：把个别点推向 warn 边界外
    idx = rng.choice(n, size=int(n * p_anomaly), replace=False)
    s_min, s_max = safe
    for i in idx:
        values[i] = rng.uniform(s_max, s_max + (s_max - s_min))
    return np.round(values, 2)


def build_dataset():
    """生成 30 天 × 每小时 的多指标多设备读数。"""
    hours = 30 * 24
    time_idx = pd.date_range("2026-08-01", periods=hours, freq="h")
    rows = []
    for device in DEVICES:
        for key, m in METRICS.items():
            series = simulate_series(hours, m["base"], m["drift"], m["safe"])
            for t, v in zip(time_idx, series):
                rows.append({
                    "device_id": device, "metric_key": key,
                    "name": m["name"], "unit": m["unit"], "value": v,
                    "recorded_at": t,
                })
    df = pd.DataFrame(rows)
    df["level"] = df.apply(
        lambda r: three_tier(r["value"], METRICS[r["metric_key"]]["safe"],
                             METRICS[r["metric_key"]]["warn"]), axis=1)
    return df


def plot_trend(df):
    """图1：六指标时间趋势（按设备分面）。"""
    fig, axes = plt.subplots(2, 1, figsize=(12, 9), sharex=True)
    for ax, device in zip(axes, DEVICES):
        sub = df[df.device_id == device].pivot_table(
            index="recorded_at", columns="metric_key", values="value")
        sub = (sub - sub.min()) / (sub.max() - sub.min())  # 归一化便于同图比较
        for key in sub.columns:
            ax.plot(sub.index, sub[key], lw=1.2, label=METRICS[key]["name"])
        ax.set_title(f"{device} · 六指标趋势（归一化）", fontsize=13)
        ax.legend(ncol=6, fontsize=8, loc="upper right")
        ax.grid(alpha=0.25)
    axes[-1].set_xlabel("时间")
    fig.tight_layout()
    fig.savefig(os.path.join(CHARTS, "01_trend.png"), bbox_inches="tight")
    plt.close(fig)


def plot_distribution(df):
    """图2：各指标读数分布（直方图 + 安全区间参考线）。"""
    fig, axes = plt.subplots(2, 3, figsize=(13, 7))
    for ax, (key, m) in zip(axes.ravel(), METRICS.items()):
        sub = df[df.metric_key == key]
        ax.hist(sub.value, bins=40, color=C_BLUE, alpha=0.7)
        s_min, s_max = m["safe"]
        ax.axvline(s_min, color=C_SAFE, lw=2, ls="--", label="safe 下界")
        ax.axvline(s_max, color=C_DANGER, lw=2, ls="--", label="safe 上界")
        ax.set_title(f"{m['name']}（{m['unit']}）")
        ax.legend(fontsize=7)
    fig.suptitle("各指标读数分布", fontsize=14)
    fig.tight_layout()
    fig.savefig(os.path.join(CHARTS, "02_distribution.png"), bbox_inches="tight")
    plt.close(fig)


def plot_correlation(df):
    """图3：指标相关性热力图（余氯↔浊度 等）。"""
    wide = df.pivot_table(index=["device_id", "recorded_at"],
                          columns="metric_key", values="value").reset_index(drop=True)
    corr = wide.corr()
    fig, ax = plt.subplots(figsize=(7, 6))
    im = ax.imshow(corr, cmap="RdYlGn", vmin=-1, vmax=1)
    ax.set_xticks(range(len(corr))); ax.set_yticks(range(len(corr)))
    ax.set_xticklabels([METRICS[c]["name"] for c in corr.columns], rotation=45)
    ax.set_yticklabels([METRICS[c]["name"] for c in corr.columns])
    for i in range(len(corr)):
        for j in range(len(corr)):
            ax.text(j, i, f"{corr.iloc[i, j]:.2f}", ha="center", va="center",
                    fontsize=8, color="black")
    fig.colorbar(im, ax=ax, shrink=0.8)
    ax.set_title("指标相关性热力图", fontsize=13)
    fig.tight_layout()
    fig.savefig(os.path.join(CHARTS, "03_correlation.png"), bbox_inches="tight")
    plt.close(fig)


def plot_threshold_ratio(df):
    """图4：三档阈值判定占比（红黄绿堆叠）。"""
    pivot = (df.groupby(["metric_key", "level"]).size().unstack(fill_value=0)
             .reindex(columns=["safe", "warn", "danger"], fill_value=0))
    labels = [METRICS[k]["name"] for k in pivot.index]
    colors = [C_SAFE, C_WARN, C_DANGER]
    fig, ax = plt.subplots(figsize=(9, 5))
    bottom = np.zeros(len(pivot))
    for lvl, c in zip(["safe", "warn", "danger"], colors):
        vals = pivot[lvl].values
        ax.bar(labels, vals, bottom=bottom, color=c, label=lvl)
        bottom += vals
    ax.set_ylabel("读数条数")
    ax.set_title("三档阈值判定占比（绿=安全 / 黄=提示 / 红=高风险）", fontsize=13)
    ax.legend(title="等级")
    fig.tight_layout()
    fig.savefig(os.path.join(CHARTS, "04_threshold_ratio.png"), bbox_inches="tight")
    plt.close(fig)


def plot_alert_frequency(df):
    """图5：异常（超标）频次 Top 排行。"""
    abnormal = df[df.level != "safe"]
    cnt = (abnormal.groupby(["name", "level"]).size()
           .unstack(fill_value=0).reindex(columns=["warn", "danger"], fill_value=0))
    cnt["total"] = cnt.sum(axis=1)
    cnt = cnt.sort_values("total", ascending=True)
    fig, ax = plt.subplots(figsize=(8, 5))
    ax.barh(cnt.index, cnt["warn"], color=C_WARN, label="warn（提示）")
    ax.barh(cnt.index, cnt["danger"], color=C_DANGER, label="danger（高风险）")
    ax.set_xlabel("超标次数")
    ax.set_title("异常（超标）频次排行", fontsize=13)
    ax.legend()
    fig.tight_layout()
    fig.savefig(os.path.join(CHARTS, "05_alert_frequency.png"), bbox_inches="tight")
    plt.close(fig)


def summary(df):
    print("=" * 60)
    print("水质数据 EDA 统计摘要")
    print("=" * 60)
    print(f"样本量：{len(df)} 条（{len(DEVICES)} 设备 × {len(METRICS)} 指标 × 30 天每小时）")
    print("\n--- 各指标描述统计 ---")
    print(df.groupby("name")["value"].agg(["count", "mean", "std", "min", "max"])
            .round(2).to_string())
    print("\n--- 三档阈值判定占比 ---")
    ratio = (df.groupby("level").size() / len(df) * 100).round(1)
    for lvl in ["safe", "warn", "danger"]:
        print(f"  {lvl}: {ratio.get(lvl, 0)}%")
    print("\n--- 超标最多的指标 ---")
    print(df[df.level != "safe"].groupby("name").size().sort_values(ascending=False)
            .to_string())


def main():
    df = build_dataset()
    df.to_csv(os.path.join(HERE, "water_quality_sim.csv"), index=False, encoding="utf-8-sig")
    plot_trend(df)
    plot_distribution(df)
    plot_correlation(df)
    plot_threshold_ratio(df)
    plot_alert_frequency(df)
    summary(df)
    print(f"\n图表已输出至：{CHARTS}")
    print(f"数据已输出至：{os.path.join(HERE, 'water_quality_sim.csv')}")


if __name__ == "__main__":
    main()
