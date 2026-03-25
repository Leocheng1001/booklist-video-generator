from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from fastapi.staticfiles import StaticFiles
import os

from app.core.config import get_settings
from app.models.project import Base, ProjectModel
from app.core.database import engine

# 导入路由
from app.api import projects, books, knowledge, scripts, images, videos

settings = get_settings()

# 创建数据库表
Base.metadata.create_all(bind=engine)

# 创建FastAPI应用
app = FastAPI(
    title=settings.APP_NAME,
    version=settings.APP_VERSION,
    description="AI驱动的书单短视频生成系统",
)

# 配置CORS
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],  # 生产环境应该限制域名
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# 注册路由
app.include_router(projects.router, prefix="/api")
app.include_router(books.router, prefix="/api")
app.include_router(knowledge.router, prefix="/api")
app.include_router(scripts.router, prefix="/api")
app.include_router(images.router, prefix="/api")
app.include_router(videos.router, prefix="/api")

# 静态文件服务
uploads_dir = "/tmp/uploads"
os.makedirs(uploads_dir, exist_ok=True)
app.mount("/uploads", StaticFiles(directory=uploads_dir), name="uploads")


@app.get("/")
async def root():
    return {
        "message": "书单视频生成器 API",
        "version": settings.APP_VERSION,
        "docs": "/docs"
    }


@app.get("/health")
async def health_check():
    return {"status": "healthy"}
