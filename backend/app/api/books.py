from fastapi import APIRouter, Depends, HTTPException, UploadFile, File, Form
from sqlalchemy.orm import Session
from typing import List
import uuid
import os
import shutil
from pathlib import Path

from app.core.database import get_db
from app.models.schemas import ApiResponse, Book
from app.models.project import ProjectModel

router = APIRouter(prefix="/books", tags=["books"])

# 模拟书籍数据库
MOCK_BOOKS = [
    {"id": "1", "title": "原子习惯", "author": "詹姆斯·克利尔", "coverUrl": ""},
    {"id": "2", "title": "深度工作", "author": "卡尔·纽波特", "coverUrl": ""},
    {"id": "3", "title": "思考，快与慢", "author": "丹尼尔·卡尼曼", "coverUrl": ""},
    {"id": "4", "title": "原则", "author": "瑞·达利欧", "coverUrl": ""},
    {"id": "5", "title": "非暴力沟通", "author": "马歇尔·卢森堡", "coverUrl": ""},
    {"id": "6", "title": "金字塔原理", "author": "芭芭拉·明托", "coverUrl": ""},
    {"id": "7", "title": "高效能人士的七个习惯", "author": "史蒂芬·柯维", "coverUrl": ""},
    {"id": "8", "title": "刻意练习", "author": "安德斯·艾利克森", "coverUrl": ""},
]


@router.get("/search", response_model=ApiResponse)
async def search_books(keyword: str):
    """搜索书籍"""
    
    if not keyword:
        return {
            "success": True,
            "data": []
        }
    
    # 简单模糊匹配
    keyword_lower = keyword.lower()
    results = [
        Book(**book) for book in MOCK_BOOKS
        if keyword_lower in book["title"].lower() or keyword_lower in book["author"].lower()
    ]
    
    return {
        "success": True,
        "data": [book.model_dump() for book in results]
    }


@router.post("/upload", response_model=ApiResponse)
async def upload_pdf(
    file: UploadFile = File(...),
    db: Session = Depends(get_db)
):
    """上传PDF文件"""
    
    # 验证文件类型
    if not file.filename.endswith('.pdf'):
        raise HTTPException(status_code=400, detail="只支持PDF文件")
    
    # 生成唯一文件名
    file_id = str(uuid.uuid4())
    file_name = f"{file_id}.pdf"
    
    # 确保上传目录存在
    upload_dir = Path("/tmp/uploads")
    upload_dir.mkdir(parents=True, exist_ok=True)
    
    # 保存文件
    file_path = upload_dir / file_name
    
    try:
        with open(file_path, "wb") as buffer:
            shutil.copyfileobj(file.file, buffer)
        
        # 返回文件URL（实际项目中应该返回可访问的URL）
        file_url = f"/uploads/{file_name}"
        
        return {
            "success": True,
            "data": {"url": file_url, "filename": file.filename}
        }
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"文件上传失败: {str(e)}")


@router.post("/url", response_model=ApiResponse)
async def submit_pdf_url(request: dict):
    """提交PDF链接"""

    url = request.get("url", "")
    # 验证URL
    if not url.startswith(('http://', 'https://')):
        raise HTTPException(status_code=400, detail="无效的URL")

    return {
        "success": True,
        "data": {"url": url}
    }
