# 家庭水质健康智能管理系统 · 产品经理作品集

> Water Health Smart Management System — Product Manager Portfolio
>
> 石佳 · 河海大学 · 商学院 · 信息管理与信息系统 2024 级（大三）· 项目负责人
> Shi Jia · Hohai University · Information Management &amp; Information Systems · Project Lead

一个**中英双语、可在线编辑**的交互式作品集网站，把“大学生创新创业训练计划”（大创）的“家庭水质健康智能管理”项目，从产品经理视角复盘为完整的 Case Study，并**内嵌可交互的 live demo**。已产出两项软件著作权。

An interactive, bilingual (zh/en), in-browser-editable portfolio site that turns the "Family Water Quality Health Management" college-innovation project into a full PM case study — with an **embedded interactive live demo**. Two software copyrights shipped.

---

## 🔗 在线访问 / Live

> GitHub Pages 链接在推送后填入这里。
> The GitHub Pages URL goes here after the first push.

---

## 一句话定位 / One-liner

> 不做“报数机器”，做“懂你、替你处理”的家庭水质健康管家 —— 把水质数据翻译成**健康影响 + 个性化方案 + 设备联动**，形成“监测—分析—预警—处理”闭环。
>
> Not a "number-teller", but a health steward that understands and acts for you — turning water data into health impact + a personalized plan + auto linkage, closing the "monitor–analyze–alert–resolve" loop.

---

## 📁 仓库结构 / Repo layout

```
water-health-portfolio/
├── index.html            # 旗舰 Case Study 长页（双语，内嵌 demo）
├── css/style.css         # 设计系统
├── js/main.js            # 导航 / 语言切换 / 开启编辑 / 导出 HTML
├── pages/                # 8 个次级交付物页
│   ├── prd.html          # ② 产品需求文档
│   ├── research.html     # ③ 用户调研（双源）
│   ├── metrics.html      # ④ 指标与埋点
│   ├── competition.html  # ⑤ 竞品分析
│   ├── roadmap.html      # ⑥ 产品路线图
│   ├── ai.html           # ⑦ AI 协作叙事
│   ├── database.html     # ⑧ 数据库设计
│   └── eda.html          # ⑨ Python 数据分析
├── demo/                 # 软著 1：水质健康 App（纯前端 SPA，可 iframe 内嵌）
├── cloud-iot-platform/   # 软著 2：物联网云平台（Node.js REST + MQTT）
└── docs/                 # 内容源：Markdown + SQL/SQLite + EDA 脚本
```

---

## 🖥 本地预览 / Local preview

无需构建、零依赖。任选其一：

```bash
# 方式一：Python 静态服务器
python -m http.server 8080
# 打开 http://localhost:8080

# 方式二：直接双击 index.html（demo 的 ES Modules 需经 HTTP 访问）
```

网站功能：

- 🌐 **语言切换**：顶部按钮一键切中/英（记忆到 localStorage）
- ✏️ **开启编辑**：正文可直接在浏览器里改，改完“导出 HTML”替换本地文件
- 📱 **内嵌 demo**：Case Study 页内嵌水质健康 App，可直接注册体验（Mock 数据）

---

## 🚀 部署到 GitHub Pages / Deploy

```bash
git init
git add .
git commit -m "init: water health portfolio site"

# 需先登录（开 VPN 后）：gh auth login
gh repo create water-health-portfolio --public --source=. --push
gh api repos/{owner}/water-health-portfolio/pages -f source[branch]=main -f source[path]=/ 
# 在网页 Settings → Pages 里选 main 分支根目录，等待构建完成
```

---

## 🧪 验证 / Verification

| 项 | 命令 | 结果 |
|---|---|---|
| 前端冒烟测试 | `cd demo && node smoke_test.mjs` | 24 通过 |
| 后端冒烟测试 | `cd cloud-iot-platform && npm install && npm run smoke` | 通过 |
| 数据库可运行验证 | `python docs/08-database/sqlite/run.py` | 通过 |
| 数据分析复现 | `python docs/09-data-analysis/eda_water_quality.py` | 产出 5 图 |

---

## 📌 诚实边界 / Honest boundary

- **已实现**：移动应用（软著 1）、物联网云平台（软著 2）——均为可运行软件。
- **规划中**：硬件终端（便携款 + 旗舰家用款双形态监测器）、机器学习 / 真实数据接入、LLM+RAG 健康咨询。
- **数据说明**：二手数据均标注来源与年份；一手调研为占位示例，待真实问卷替换；EDA 为模拟数据。

---

## 👤 作者 / Author

石佳 · 河海大学 · 商学院 · 信息管理与信息系统 2024 级 · 求职方向：产品经理实习生

*软件著作权归河海大学所有。*
