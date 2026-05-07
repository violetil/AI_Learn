# 论文改写不可改动清单

本清单用于“降低 AI 痕迹改写”过程中的事实锁定。改写只调整表达，不改研究事实。

## 一、不可改动项

- 公式与编号：`eq:cosine`、`eq:retrievalScore`、`eq:precision`、`eq:recall`、`eq:f1`、`eq:quality`、`eq:availability`、`eq:replyFunction`、`eq:contextBudget`、`eq:scoreFusion`。
- 表格数据与阈值：
  - 可用率：`100%`
  - 非流式平均时延：`6.72s`
  - 流式首包时延：`2.73s`
  - RAG F1：`0.80`
  - 消融：无 RAG `0.4667/0.5833/0.5185/20.60s`，有 RAG `0.6667/1.0000/0.8000/7.71s`
- 图表与章节编号：保持现有 `fig:*`、`tab:*`、章/节/小节编号不变。
- 接口路径与关键术语：
  - `/api/chat`、`/api/chat/stream`、`/api/dashboard/chat`、`/api/auth/session`
  - `RAG`、`Top-K`、`LanceDB`、`Prisma`、`SQLite`、`Next.js`
- 引文编号：正文 `\cite{...}` 与参考文献 `\bibitem{...}` 的映射不变。

## 二、高风险段落（仅可改写语气）

- 第6章：`结果评估`、`消融分析`、`可视化结果`。
- 第7章：`创新点与贡献`、`不足与未来工作`。
- 摘要与 Abstract：可简化句式，但不得变更结论与指标口径。

## 三、改写边界

- 不新增实验结果、不新增数据来源、不新增功能实现。
- 不删除与结论直接相关的事实句。
- 可拆句、换词、调整段内顺序，但需保证逻辑连贯。
