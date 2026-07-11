# ISTEC DBA 典礼打卡文案工具

面向 ISTEC 商学院工商管理博士（DBA）学员的典礼打卡文案生成网站。

## 专业方向

- 企业创新（Corporate Innovation）
- 医疗健康管理（Healthcare Management）
- 应用心理学（Applied Psychology）

## 本地运行

1. 将 `.env.example` 复制为 `.env`，填写火山引擎方舟的 Key 和模型 ID。
2. 运行 `npm start`。
3. 浏览器打开 `http://localhost:3000`。

## Render 环境变量

- `ARK_API_KEY`：火山引擎方舟 API Key
- `ARK_MODEL`：模型或推理接入点 ID
- `ARK_BASE_URL`：`https://ark.cn-beijing.volces.com/api/v3`
- `STATS_TOKEN`：可选，用于保护统计接口

复制统计地址为 `/api/copy-stats`。设置 `STATS_TOKEN` 后，通过 `/api/copy-stats?token=你的令牌` 查看。

当前统计写入服务器本地 `data/copy-stats.json`。Render 免费实例重启或重新部署后，本地文件可能丢失；正式长期统计建议后续接入数据库。
