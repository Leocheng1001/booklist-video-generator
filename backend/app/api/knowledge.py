from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session

from app.core.database import get_db
from app.models.project import ProjectModel
from app.models.schemas import ApiResponse, GenerateKnowledgeRequest
from app.agents.knowledge_agent import KnowledgeSummaryAgent

router = APIRouter(prefix="/knowledge", tags=["knowledge"])

knowledge_agent = KnowledgeSummaryAgent()


@router.post("/generate", response_model=ApiResponse)
async def generate_knowledge(
    request: GenerateKnowledgeRequest,
    db: Session = Depends(get_db)
):
    """生成知识点"""
    
    # 获取项目
    project = db.query(ProjectModel).filter(ProjectModel.id == request.projectId).first()
    if not project:
        raise HTTPException(status_code=404, detail="项目不存在")
    
    # 更新项目状态
    project.status = "summarizing"
    project.progress = 30
    project.user_requirement = request.requirement
    db.commit()
    
    try:
        # 模拟PDF内容（实际项目中应该从PDF中提取）
        pdf_content = f"这是《{project.book_name}》的书籍内容摘要..."
        
        # 调用Agent生成知识点
        result = await knowledge_agent.run({
            "book_name": project.book_name,
            "pdf_content": pdf_content,
            "user_requirement": request.requirement
        })
        
        if not result["success"]:
            raise Exception(result.get("error", "生成失败"))
        
        # 保存知识点
        knowledge_points = result["data"]["knowledge_points"]
        project.knowledge_points = knowledge_points
        project.status = "summarizing"
        project.progress = 40
        db.commit()
        
        return {
            "success": True,
            "data": knowledge_points
        }
        
    except Exception as e:
        project.status = "error"
        db.commit()
        raise HTTPException(status_code=500, detail=f"生成知识点失败: {str(e)}")


@router.post("/update", response_model=ApiResponse)
async def update_knowledge(
    request: dict,
    db: Session = Depends(get_db)
):
    """更新知识点"""
    
    project_id = request.get("projectId")
    points = request.get("points", [])
    
    project = db.query(ProjectModel).filter(ProjectModel.id == project_id).first()
    if not project:
        raise HTTPException(status_code=404, detail="项目不存在")
    
    project.knowledge_points = points
    db.commit()
    
    return {
        "success": True,
        "message": "知识点已更新"
    }
