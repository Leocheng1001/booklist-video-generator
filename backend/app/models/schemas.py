from pydantic import BaseModel
from typing import List, Optional, Literal
from datetime import datetime


# 书籍
class Book(BaseModel):
    id: str
    title: str
    author: str
    coverUrl: Optional[str] = None
    pdfUrl: Optional[str] = None


# 知识点
class KnowledgePoint(BaseModel):
    id: str
    title: str
    content: str
    category: Literal["concept", "insight", "quote", "advice", "case"]


# 分镜
class Scene(BaseModel):
    id: int
    content: str
    visualDesc: str
    duration: float
    imageUrl: Optional[str] = None


# 脚本
class Script(BaseModel):
    id: str
    title: str
    scenes: List[Scene]
    totalDuration: float


# 生成的图片
class GeneratedImage(BaseModel):
    id: str
    sceneId: int
    url: str
    prompt: str
    status: Literal["pending", "generating", "completed", "error"]


# 项目
class Project(BaseModel):
    id: str
    bookName: str
    bookPdfUrl: str
    userRequirement: str
    status: str
    progress: int
    knowledgePoints: List[KnowledgePoint]
    script: Optional[Script]
    images: List[GeneratedImage]
    videoUrl: str
    createdAt: Optional[str] = None
    updatedAt: Optional[str] = None


# API响应
from typing import Any

class ApiResponse(BaseModel):
    success: bool
    data: Optional[Any] = None
    message: Optional[str] = None
    error: Optional[str] = None


# 请求模型
class CreateProjectRequest(BaseModel):
    bookName: str


class GenerateKnowledgeRequest(BaseModel):
    projectId: str
    requirement: str


class UpdateScriptRequest(BaseModel):
    projectId: str
    script: Script


class GenerateVideoRequest(BaseModel):
    projectId: str
