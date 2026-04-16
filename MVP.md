# Image Background Remover — MVP 需求文档

## 1. 产品概述

**一句话描述**：上传图片，一键移除背景，下载透明 PNG。

**核心用户**：需要快速抠图的非专业用户（电商卖家、内容创作者、设计师临时需求）。

**MVP 边界**：单图处理，纯浏览器操作，无需注册，无需存储。

---

## 2. 用户故事

| 角色 | 场景 | 期望 |
|------|------|------|
| 电商运营 | 快速给商品图去背景 | 上传 → 处理 → 下载，三步完成 |
| 内容创作者 | 给文章配图去背景 | 操作简单，不需要设计工具 |
| 设计师 | 临时需要透明底素材 | 不用打开 Photoshop |

---

## 3. 功能需求

### 3.1 图片上传
- **方式**：拖拽上传 + 点击选择文件
- **格式**：支持 PNG、JPEG、WebP
- **大小**：单文件 ≤ 10 MB
- **校验**：客户端校验格式和大小，不符合条件时显示友好错误提示

### 3.2 背景移除
- **调用**：Cloudflare Workers 代理调用 Remove.bg API
- **处理时间**：预期 1-5 秒/张（取决于 Remove.bg 响应速度）
- **结果**：返回透明背景 PNG

### 3.3 结果展示与下载
- **展示**：原图 vs 结果图 并排对比
- **下载**：点击按钮下载结果图，文件名 `removed-bg.png`
- **重置**：支持重新上传其他图片

### 3.4 异常处理
| 场景 | 处理方式 |
|------|----------|
| 非图片文件 | 提示"请上传 PNG、JPEG 或 WebP 格式图片" |
| 文件过大 | 提示"图片不能超过 10 MB" |
| API 调用失败 | 提示"处理失败，请稍后重试" |
| 网络断开 | 提示"网络连接失败，请检查网络" |

---

## 4. 非功能需求

### 4.1 性能
- 首屏加载 < 2 秒（Cloudflare CDN 缓存）
- API 响应 < 5 秒/张（取决于 Remove.bg）

### 4.2 兼容性
- 目标浏览器：Chrome、Firefox、Safari、Edge（最新版）
- 移动端：支持，但非优先

### 4.3 隐私与安全
- 不存储任何上传或处理后的图片（纯内存/流式处理）
- Remove.bg API Key 仅存在于 Cloudflare Workers 环境变量中，不暴露在前端

---

## 5. 技术方案

### 5.1 纯 Cloudflare 架构

```
用户浏览器
    │
    └── Cloudflare Pages（React 静态站点）
              │
              │ fetch /api/remove
              ▼
        Cloudflare Workers
              │
              │ 调用 Remove.bg API（带 API Key）
              ▼
         Remove.bg API
```

**架构优势**：无需自建后端服务器，Cloudflare Workers 处理 API 代理，API Key 安全存储在环境变量中。

### 5.2 Workers API 设计

**POST /api/remove**
- 请求：`Content-Type: multipart/form-data`，字段 `file`（图片二进制）
- Workers 行为：将文件转发给 Remove.bg API，返回 Remove.bg 的响应
- 响应：`image/png`（透明背景图片）或 `application/json`（错误）

| 状态码 | 含义 |
|--------|------|
| 200 | 处理成功，返回图片 |
| 400 | 不支持的格式或参数错误 |
| 413 | 文件过大 |
| 500 | Remove.bg API 调用失败 |

**GET /api/health**
- 响应：`{ "status": "ok" }`

### 5.3 Remove.bg API 集成

- **Endpoint**：`https://api.remove.bg/v1.0/removebg`
- **Method**：POST，表单上传 `image_file`
- **认证**：API Key 在 Workers 环境变量中（`REMOVE_BG_API_KEY`）
- **免费额度**：Remove.bg 免费版 50 张/月，付费版 $0.009/张

### 5.4 数据限制
- 输入格式：PNG、JPEG、WebP
- 输入大小：≤ 10 MB
- 输出格式：PNG（透明背景）

### 5.5 技术栈

| 层 | 技术 |
|----|------|
| 前端框架 | React 18 + Vite + TypeScript |
| 后端 | Cloudflare Workers（JavaScript/TypeScript） |
| 图像处理 | Remove.bg API |
| 前端部署 | Cloudflare Pages |
| 后端部署 | Cloudflare Workers |

---

## 6. 项目结构

```
bg-remover/
├── src/                      # React 前端
│   ├── App.tsx
│   ├── components/
│   │   ├── DropZone.tsx
│   │   ├── ImagePreview.tsx
│   │   ├── DownloadButton.tsx
│   │   └── Spinner.tsx
│   ├── hooks/
│   │   └── useRemoveBackground.ts
│   └── main.tsx
├── workers/
│   └── remove-bg/
│       └── index.js           # Cloudflare Worker
├── public/
├── index.html
├── package.json
├── vite.config.ts
└── wrangler.toml              # Cloudflare Workers 配置
```

---

## 7. UI 设计

### 页面结构（单页面，无导航）

```
┌─────────────────────────────────────────────────────┐
│                   [Header]                          │
│          Background Remover                         │
│    Remove image backgrounds instantly              │
│                                                     │
│  ┌─────────────────────────────────────────────┐   │
│  │                                             │   │
│  │         拖拽图片到此处，或点击上传            │   │
│  │         (PNG, JPEG, WebP / 最大 10MB)       │   │
│  │                                             │   │
│  └─────────────────────────────────────────────┘   │
│                                                     │
│  ┌────────────┐          ┌────────────┐             │
│  │            │          │            │             │
│  │  Original  │  ──────► │   Result   │             │
│  │            │  [处理中] │  (透明PNG) │             │
│  │            │          │            │             │
│  └────────────┘          └────────────┘             │
│                                                     │
│                    [下载 PNG]                        │
│                    [重新上传]                        │
│                                                     │
└─────────────────────────────────────────────────────┘
```

### 状态流转

```
[空闲状态]
  │  上传图片
  ▼
[上传完成，等待处理]
  │  点击"移除背景"
  ▼
[处理中] ──── 展示加载动画 ────► [完成] ──── 展示对比图 + 下载按钮
  │                                    │
  └──────────── 处理失败 ←──────────────┘
                 │
                 ▼
           [错误提示] ──── [重新上传]
```

---

## 8. MVP 不做

以下功能不在 MVP 范围内，后续版本再评估：

- [ ] 用户注册 / 登录
- [ ] 历史记录 / 存储已处理图片
- [ ] 批量处理多张图片
- [ ] 多种 AI 模型选择
- [ ] API 接口开放
- [ ] 移动端原生 App
- [ ] 高级编辑（裁剪、旋转、调色）

---

## 9. 验收标准

- [ ] 可以拖拽或点击上传 PNG/JPEG/WebP 图片（≤10MB）
- [ ] 上传非图片文件或超大文件有明确错误提示
- [ ] 点击处理后显示加载动画
- [ ] 处理完成后展示原图与结果对比图
- [ ] 可以下载结果图（PNG 格式，背景透明）
- [ ] 可以重新上传新图片
- [ ] 移动端基本可用
- [ ] 页面加载时间 < 2 秒（缓存后）

---

## 10. 部署流程

### 前端（Cloudflare Pages）
1. Push 到 GitHub
2. Cloudflare Pages 面板连接仓库
3. 构建命令：`npm run build`，输出目录：`dist`
4. 设置环境变量：`VITE_API_URL`（Workers 地址）

### Workers（Cloudflare Workers）
1. `wrangler login` 授权 Cloudflare CLI
2. `wrangler deploy` 部署 Workers
3. Workers 自动生成 URL（如 `remove-bg.<username>.workers.dev`）
4. 设置 secrets：`wrangler secret put REMOVE_BG_API_KEY`
