from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session

from app.core.database import get_db
from app.models.project import ProjectModel
from app.models.schemas import ApiResponse, UpdateScriptRequest
from app.agents.script_agent import ScriptGenerationAgent

router = APIRouter(prefix="/scripts", tags=["scripts"])

script_agent = ScriptGenerationAgent()


@router.post("/generate", response_model=ApiResponse)
async def generate_script(
    request: dict,
    db: Session = Depends(get_db)
):
    """生成脚本"""
    
    project_id = request.get("projectId")
    
    # 获取项目
    project = db.query(ProjectModel).filter(ProjectModel.id == project_id).first()
    if not project:
        raise HTTPException(status_code=404, detail="项目不存在")
    
    # 更新项目状态
    project.status = "scripting"
    project.progress = 50
    db.commit()
    
    try:
        # 调用Agent生成脚本
        result = await script_agent.run({
            "book_name": project.book_name,
            "knowledge_points": project.knowledge_points
        })
        
        if not result["success"]:
            raise Exception(result.get("error", "生成失败"))
        
        # 保存脚本
        script = result["data"]
        project.script = script
        project.status = "scripting"
        project.progress = 60
        db.commit()
        
        return {
            "success": True,
            "data": script
        }
        
    except Exception as e:
        project.status = "error"
        db.commit()
        raise HTTPException(status_code=500, detail=f"生成脚本失败: {str(e)}")


@router.post("/update", response_model=ApiResponse)
async def update_script(
    request: UpdateScriptRequest,
    db: Session = Depends(get_db)
):
    """更新脚本"""
    
    project = db.query(ProjectModel).filter(ProjectModel.id == request.projectId).first()
    if not project:
        raise HTTPException(status_code=404, detail="项目不存在")
    
    project.script = request.script.model_dump()
    db.commit()
    
    return {
        "success": True,
        "message": "脚本已更新"
    }
