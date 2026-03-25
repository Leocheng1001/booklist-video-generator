from fastapi import APIRouter, Depends, HTTPException, UploadFile, File, Form
from sqlalchemy.orm import Session
from typing import List, Optional
import uuid
import os
import shutil

from app.core.database import get_db
from app.models.project import ProjectModel
from app.models.schemas import (
    Project, CreateProjectRequest, GenerateKnowledgeRequest,
    UpdateScriptRequest, GenerateVideoRequest, ApiResponse,
    KnowledgePoint, Script, GeneratedImage
)
from app.agents.knowledge_agent import KnowledgeSummaryAgent
from app.agents.script_agent import ScriptGenerationAgent
from app.agents.image_agent import ImageGenerationAgent
from app.agents.video_agent import VideoCompositionAgent

router = APIRouter(prefix="/projects", tags=["projects"])

# 创建Agent实例
knowledge_agent = KnowledgeSummaryAgent()
script_agent = ScriptGenerationAgent()
image_agent = ImageGenerationAgent()
video_agent = VideoCompositionAgent()


@router.post("", response_model=ApiResponse)
async def create_project(
    request: CreateProjectRequest,
    db: Session = Depends(get_db)
):
    """创建新项目"""
    
    project = ProjectModel(
        id=str(uuid.uuid4()),
        book_name=request.bookName,
        status="idle",
        progress=0
    )
    
    db.add(project)
    db.commit()
    db.refresh(project)
    
    return {
        "success": True,
        "data": project.to_dict()
    }


@router.get("/{project_id}", response_model=ApiResponse)
async def get_project(project_id: str, db: Session = Depends(get_db)):
    """获取项目详情"""
    
    project = db.query(ProjectModel).filter(ProjectModel.id == project_id).first()
    if not project:
        raise HTTPException(status_code=404, detail="项目不存在")
    
    return {
        "success": True,
        "data": project.to_dict()
    }


@router.put("/{project_id}", response_model=ApiResponse)
async def update_project(
    project_id: str,
    data: dict,
    db: Session = Depends(get_db)
):
    """更新项目"""
    
    project = db.query(ProjectModel).filter(ProjectModel.id == project_id).first()
    if not project:
        raise HTTPException(status_code=404, detail="项目不存在")
    
    # 更新字段
    if "bookName" in data:
        project.book_name = data["bookName"]
    if "bookPdfUrl" in data:
        project.book_pdf_url = data["bookPdfUrl"]
    if "userRequirement" in data:
        project.user_requirement = data["userRequirement"]
    if "status" in data:
        project.status = data["status"]
    if "progress" in data:
        project.progress = data["progress"]
    if "knowledgePoints" in data:
        project.knowledge_points = data["knowledgePoints"]
    if "script" in data:
        project.script = data["script"]
    if "images" in data:
        project.images = data["images"]
    if "videoUrl" in data:
        project.video_url = data["videoUrl"]
    
    db.commit()
    db.refresh(project)
    
    return {
        "success": True,
        "data": project.to_dict()
    }
