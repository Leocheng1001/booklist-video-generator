# 📚 书单视频生成器

AI驱动的书单短视频生成系统，输入书籍名称，自动生成短视频内容。

## ✨ 功能特性

- 🔍 **书籍搜索** - 搜索并选择想要制作视频的书籍
- 📄 **PDF上传** - 支持上传本地PDF或粘贴PDF链接
- 🧠 **AI知识提取** - 自动提取书籍核心知识点
- 📝 **智能脚本生成** - 根据知识点生成视频脚本
- 🎨 **AI配图生成** - 调用阿里万相API生成配图
- 🎬 **视频自动合成** - 将图片和脚本合成为完整视频

## 🏗️ 系统架构

```
┌─────────────┐    ┌─────────────┐    ┌─────────────┐
│   前端      │    │   后端API   │    │   Agent     │
│  React      │◄──►│  FastAPI    │◄──►│  工作流     │
└─────────────┘    └─────────────┘    └─────────────┘
                          │
       ┌──────────────────┼──────────────────┐
       ▼                  ▼                  ▼
  ┌─────────┐      ┌─────────┐       ┌──────────┐
 │PostgreSQL│      │  Redis  │       │  MinIO   │
 └─────────┘      └─────────┘       └──────────┘
```

## 🚀 快速开始

### 1. 克隆项目

```bash
git clone <repository-url>
cd booklist-video-generator
```

### 2. 配置环境变量

```bash
cp .env.example .env
# 编辑 .env 文件，填写你的API密钥
```

### 3. 使用Docker Compose启动

```bash
docker-compose up -d
```

服务将启动在：
- 前端：http://localhost
- 后端API：http://localhost:8000
- API文档：http://localhost:8000/docs
- MinIO控制台：http://localhost:9001

### 4. 本地开发

#### 前端开发

```bash
cd app
npm install
npm run dev
```

#### 后端开发

```bash
cd backend
python -m venv venv
source venv/bin/activate  # Windows: venv\Scripts\activate
pip install -r requirements.txt
uvicorn app.main:app --reload
```

## 📁 项目结构

```
booklist-video-generator/
├── app/                    # 前端 (React + TypeScript)
│   ├── src/
│   │   ├── api/           # API接口
│   │   ├── components/    # 公共组件
│   │   ├── pages/         # 页面组件
│   │   ├── stores/        # 状态管理
│   │   └── types/         # TypeScript类型
│   ├── Dockerfile
│   └── nginx.conf
│
├── backend/               # 后端 (FastAPI)
│   ├── app/
│   │   ├── api/          # API路由
│   │   ├── agents/       # AI Agent
│   │   ├── core/         # 核心配置
│   │   └── models/       # 数据模型
│   ├── Dockerfile
│   └── requirements.txt
│
├── docker-compose.yml    # Docker编排
└── .env.example         # 环境变量模板
```

## 🔧 配置说明

### 必需配置

| 变量名 | 说明 | 获取方式 |
|--------|------|----------|
| `DASHSCOPE_API_KEY` | 阿里万相API密钥 | [阿里云DashScope](https://dashscope.aliyun.com) |

### 可选配置

| 变量名 | 默认值 | 说明 |
|--------|--------|------|
| `LLM_MODEL` | qwen-max | LLM模型名称 |
| `DATABASE_URL` | postgresql://... | 数据库连接URL |
| `REDIS_URL` | redis://... | Redis连接URL |

## 📝 API文档

启动服务后访问：http://localhost:8000/docs

### 核心接口

- `POST /api/projects` - 创建项目
- `POST /api/books/search` - 搜索书籍
- `POST /api/knowledge/generate` - 生成知识点
- `POST /api/scripts/generate` - 生成脚本
- `POST /api/images/generate` - 生成图片
- `POST /api/videos/generate` - 生成视频

## 🤖 Agent工作流

1. **BookDownloadAgent** - 下载/获取书籍PDF
2. **KnowledgeSummaryAgent** - 提取核心知识点
3. **ScriptGenerationAgent** - 生成视频脚本
4. **ImageGenerationAgent** - 生成配图（阿里万相）
5. **VideoCompositionAgent** - 合成最终视频

## 💰 成本估算

| 项目 | 成本 |
|------|------|
| 图片生成 (3-5张) | ~0.5-0.8元 |
| LLM调用 | ~0.1-0.2元 |
| 计算资源 | ~0.1-0.2元 |
| **总计/视频** | **~0.7-1.1元** |

## 🔒 安全注意事项

- 生产环境请修改默认密码
- 妥善保管API密钥，不要提交到代码仓库
- 建议使用HTTPS部署
- 限制文件上传大小和类型

## 📄 许可证

MIT License

## 🤝 贡献

欢迎提交Issue和Pull Request！

## 📧 联系

如有问题，请提交Issue或联系维护者。
