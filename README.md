# FateFor V3 — 盘古宇宙 · 山海观象

FateFor（[fatefor.com](https://fatefor.com)）静态研究站：**保留线上首页观感**，下方追加盘古宇宙模块。  
本仓库用于 **GitHub 部署**，随后再接到 Cloudflare Pages。`fatefor.com` 域名切到本站是后续步骤，本次不改 DNS。

视觉锁定 live：珊瑚 `#ff5f4b`、墨黑、山海经印鉴 —— **无金色华尔街主题**。

## Cloudflare Pages

静态站点，无构建步骤。在 Cloudflare Pages 连接本仓库后使用：

| 设置 | 值 |
|------|-----|
| Framework preset | **None** |
| Build command | **空**（leave empty） |
| Output directory | **`/`** 或 **`.`**（仓库根目录） |
| Root directory | 仓库根（`index.html` 与本 README 同级） |

部署后先用 Pages 预览 URL 验收。**fatefor.com 切流（cutover）稍后进行**，不要在未验收前改域名。

GitHub 侧也可先用 GitHub Pages / 任意静态托管预览同一批根目录文件。

## 打开（本地）

```bash
python3 -m http.server 8787
# http://localhost:8787
# 离线首屏：http://localhost:8787/?offline=1
```

## 文件

| 路径 | 说明 |
|------|------|
| `index.html` | iframe 线上首页 + 山海观象模块 |
| `styles.css` | live coral / ink / seals |
| `app.js` | 行情闪烁、预测简、创世值、雷达、年表；localStorage |
| `privacy.html` | 隐私说明 |
| `LEGAL.md` | 合规边界 |
| `screenshots/` | 无头 Chrome 截图（若有） |

## 模块

1. **欢迎模态**「欢迎进入盘古宇宙」→ CTA「进入宇宙」（免费 +500 创世值）  
2. **假说山脉** LOVE/CAREER/WEALTH/HEALTH 脉动 + 玩法 ?  
3. **预测潮汐** 预测简（非下注）+ 潮汐权重  
4. **在途预测** 浮动准确期望（非资金 PnL）  
5. **双榜** 贡献主榜 / 准确次榜  
6. **创世值** 免费、年表、预测参与、一级邀请月封顶  
7. **同生雷达**  
8. **人生简册** 八字漏斗 + 健康自评免责  
9. **页脚** 中英风险摘要 · 18+  

创世期横幅：**2026.10.01–10.31 登记免费**；创世期结束后，新居民登记拟收 **1 美元**研究访问费（认真度门槛，非交易、非下注）。本静态站未接入支付。

## 合规要点

- 免费加入（创世期内）；创世值 ≠ 币；不可提现/P2P/兑现金  
- 预测 = 准确率，不是 stake 博彩  
- **不发明现金交易、下注、提现或类证券机制**  
- 详见 `LEGAL.md` / `privacy.html`

## 空宇宙默认

追加模块与离线克隆不预置虚构统计：指数 0、居民 0、榜单空态、同生 0、走带「尚无观测事件」。  
仅本机加入可使居民变为 1。线上 iframe 内 fatefor.com 自身内容不在控制范围。
