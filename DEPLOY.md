# 部署指南

## 项目已推送到 GitHub
仓库地址：https://github.com/Leocheng1001/booklist-video-generator

---

## 方案一：免费部署（Vercel + Railway）

### 第一步：部署后端到 Railway

1. **访问 Railway**: https://railway.app
2. **登录**（用GitHub账号即可）
3. **New Project** → **Deploy from GitHub repo**
4. 选择 `booklist-video-generator` 仓库
5. **设置环境变量**：
   ```
   DASHSCOPE_API_KEY=你的阿里云API密钥
   OPENAI_API_KEY=（可选，如果用OpenAI）
   ```
6. Railway会自动识别Python项目并部署
7. 记下生成的域名（如 `https://booklist-api.up.railway.app`）

### 第二步：部署前端到 Vercel

1. **访问 Vercel**: https://vercel.com
2. **Add New Project** → Import GitHub仓库
3. 选择 `booklist-video-generator`
4. **配置构建**：
   - Framework Preset: **Vite**
   - Root Directory: `app`
   - Build Command: `npm run build`
   - Output Directory: `dist`
5. **添加环境变量**：
   ```
   VITE_API_URL=https://booklist-api.up.railway.app/api
   ```
   （替换成Railway给你的后端地址）
6. 点击 **Deploy**

### 第三步：配置CORS（跨域）

后端需要允许前端域名访问。修改 `backend/app/main.py`：

```python
app.add_middleware(
    CORSMiddleware,
    allow_origins=[
        "http://localhost:5173",
        "https://你的vercel域名.vercel.app",  # 添加这行
    ],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)
```

提交修改后Railway会自动重新部署。

---

## 方案二：国内服务器部署（推荐正式使用）

### 购买服务器

推荐阿里云/腾讯云轻量应用服务器：
- **配置**: 2核2G 以上
- **系统**: Ubuntu 22.04
- **价格**: 约50-100元/月

### 部署步骤

#### 1. 连接服务器

```bash
ssh root@你的服务器IP
```

#### 2. 安装依赖

```bash
# 更新系统
apt update && apt upgrade -y

# 安装Python、Node.js、Git
apt install -y python3 python3-pip python3-venv nodejs npm git nginx

# 安装PM2（进程管理器）
npm install -g pm2
```

#### 3. 克隆代码

```bash
cd /opt
git clone https://github.com/Leocheng1001/booklist-video-generator.git
cd booklist-video-generator
```

#### 4. 配置后端

```bash
cd backend

# 创建虚拟环境
python3 -m venv venv
source venv/bin/activate

# 安装依赖
pip install -r requirements.txt

# 创建环境变量文件
cat > .env << EOF
DASHSCOPE_API_KEY=你的阿里云API密钥
EOF

# 启动后端（用PM2管理）
pm2 start "uvicorn app.main:app --host 0.0.0.0 --port 8000" --name booklist-api

# 设置开机自启
pm2 startup
pm2 save
```

#### 5. 配置前端

```bash
cd ../app

# 安装依赖
npm install

# 构建（修改API地址为服务器地址）
echo "VITE_API_URL=http://你的服务器IP:8000/api" > .env
npm run build

# 用Nginx托管静态文件
```

#### 6. 配置Nginx

```bash
cat > /etc/nginx/sites-available/booklist << 'EOF'
server {
    listen 80;
    server_name 你的服务器IP 或 域名;

    # 前端静态文件
    location / {
        root /opt/booklist-video-generator/app/dist;
        try_files $uri $uri/ /index.html;
    }

    # 后端API代理
    location /api/ {
        proxy_pass http://localhost:8000/api/;
        proxy_http_version 1.1;
        proxy_set_header Upgrade $http_upgrade;
        proxy_set_header Connection 'upgrade';
        proxy_set_header Host $host;
        proxy_set_header X-Real-IP $remote_addr;
        proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
        proxy_set_header X-Forwarded-Proto $scheme;
        proxy_cache_bypass $http_upgrade;
    }

    # 视频流代理
    location /api/videos/ {
        proxy_pass http://localhost:8000/api/videos/;
        proxy_http_version 1.1;
        proxy_buffering off;
        proxy_set_header Host $host;
    }
}
EOF

# 启用配置
ln -s /etc/nginx/sites-available/booklist /etc/nginx/sites-enabled/
rm /etc/nginx/sites-enabled/default
nginx -t
systemctl restart nginx
```

#### 7. 开放端口

在云服务控制台的安全组中开放：
- 80端口（HTTP）
- 443端口（HTTPS，如果用域名+SSL）

---

## 方案三：Docker一键部署

如果你有Docker环境，可以使用提供的docker-compose：

```bash
# 在项目根目录
cd /Users/chengyifan/Downloads/kimiOKC/booklist-generate-project/booklist-video-generator

# 复制环境变量模板
cp .env.example .env
# 编辑.env填入你的API密钥

# 构建并启动
docker-compose up -d
```

---

## 部署检查清单

- [ ] 后端API能在浏览器访问：`http://你的地址/docs`
- [ ] 前端页面能正常加载
- [ ] 能正常搜索书籍
- [ ] 能生成知识点
- [ ] 能生成视频并播放
- [ ] 视频下载功能正常

---

## 常见问题

**Q: 视频生成慢怎么办？**
A: 视频生成涉及AI绘图和MoviePy渲染，建议升级服务器配置（4核8G以上）。

**Q: 如何更新部署后的代码？**
A:
- Railway: 推送代码到GitHub自动部署
- 服务器: `git pull` + `pm2 restart booklist-api` + 重新构建前端

**Q: 如何绑定域名？**
A:
1. 购买域名（阿里云/腾讯云/GoDaddy）
2. 添加A记录指向服务器IP
3. 修改Nginx配置中的 `server_name`
4. （可选）申请SSL证书启用HTTPS

---

## 需要帮助？

遇到问题可以：
1. 查看后端日志：`pm2 logs booklist-api`
2. 查看Nginx日志：`tail -f /var/log/nginx/error.log`
3. 提Issue到GitHub仓库
