from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session

from app.core.database import get_db
from app.models.project import ProjectModel
from app.models.schemas import ApiResponse
from app.agents.video_agent import VideoCompositionAgent

router = APIRouter(prefix="/videos", tags=["videos"])

video_agent = VideoCompositionAgent()


@router.post("/generate", response_model=ApiResponse)
async def generate_video(
    request: dict,
    db: Session = Depends(get_db)
):
    """生成视频"""
    
    project_id = request.get("projectId")
    
    # 获取项目
    project = db.query(ProjectModel).filter(ProjectModel.id == project_id).first()
    if not project:
        raise HTTPException(status_code=404, detail="项目不存在")
    
    if not project.script or not project.images:
        raise HTTPException(status_code=400, detail="项目缺少脚本或图片")
    
    # 更新项目状态
    project.status = "composing_video"
    project.progress = 90
    db.commit()
    
    try:
        # 调用Agent生成视频
        result = await video_agent.run({
            "book_name": project.book_name,
            "script": project.script,
            "images": project.images
        })
        
        if not result["success"]:
            raise Exception(result.get("error", "生成失败"))
        
        # 保存视频URL
        video_url = result["data"]["video_url"]
        project.video_url = video_url
        project.status = "completed"
        project.progress = 100
        db.commit()
        
        return {
            "success": True,
            "data": {"url": video_url}
        }
        
    except Exception as e:
        project.status = "error"
        db.commit()
        raise HTTPException(status_code=500, detail=f"生成视频失败: {str(e)}")
