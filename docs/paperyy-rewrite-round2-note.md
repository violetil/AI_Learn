# PaperYY 向第二轮改写说明（中文正文）

## 范围
- 修改文件：`thesis.tex` 中 **`\chapter{绪论}` 至 `\backmatter` 之前**的中文叙述。
- **未改**：中文摘要、英文 Abstract、致谢、参考文献条目内容、章/节标题、公式与表内数值、图/表/公式 label、附录接口示例中的路径与模型名字符串。

## 本轮目的（表达层）
- 降低 PaperYY 类工具敏感的**对称列举**与**高频“本文…”主语模板**。
- 增加与仓库一致的**可核对路径锚点**（均来自 `docs/thesis-evidence-map.md` 已列证据），避免“泛化教科书段落”占比过高。

## 主要改动类型
1. **绪论**：将“一是/二是/三是”改写为叙事推进；部分“本文…”改为“毕业设计课题/全文…”等交替表述。
2. **第2章**：综述段落改写为文献驱动的段落节奏，减少并列堆砌。
3. **第3–7章**：批量下调“本文”密度；指标与约束段落改为无主语或被动引导。
4. **第4–6章**：插入 `\path{app/api/...}`、`lib/...`、`prisma/schema.prisma`、`.github/workflows/ci.yml`、`scripts/collect-thesis-metrics.ts` 等与实现对齐的锚点句。

## 事实门禁
- 对照 `docs/ai-rewrite-fact-lock.md`：核心数值、公式标签、API 路径字符串未被改写。
- 对照 `docs/thesis-metrics.json`：表 \ref{tab:metricsResult}、\ref{tab:ablation} 中关键数值口径保持一致。

## 编译
- 使用 `xelatex -interaction=nonstopmode -halt-on-error thesis.tex` 连续编译两轮，用于稳定交叉引用。
