from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session
import uuid

from app.core.database import get_db
from app.models.project import ProjectModel
from app.models.schemas import ApiResponse
from app.agents.image_agent import ImageGenerationAgent

router = APIRouter(prefix="/images", tags=["images"])

image_agent = ImageGenerationAgent()


@router.post("/generate", response_model=ApiResponse)
async def generate_images(
    request: dict,
    db: Session = Depends(get_db)
):
    """生成图片"""
    
    project_id = request.get("projectId")
    
    # 获取项目
    project = db.query(ProjectModel).filter(ProjectModel.id == project_id).first()
    if not project:
        raise HTTPException(status_code=404, detail="项目不存在")
    
    if not project.script:
        raise HTTPException(status_code=400, detail="项目尚未生成脚本")
    
    # 更新项目状态
    project.status = "generating_images"
    project.progress = 70
    db.commit()
    
    try:
        # 调用Agent生成图片
        result = await image_agent.run({
            "book_name": project.book_name,
            "scenes": project.script.get("scenes", [])
        })
        
        if not result["success"]:
            raise Exception(result.get("error", "生成失败"))
        
        # 保存图片信息
        images = result["data"]["images"]
        project.images = images
        project.status = "generating_images"
        project.progress = 80
        db.commit()
        
        return {
            "success": True,
            "data": images
        }
        
    except Exception as e:
        project.status = "error"
        db.commit()
        raise HTTPException(status_code=500, detail=f"生成图片失败: {str(e)}")


@router.post("/regenerate", response_model=ApiResponse)
async def regenerate_image(
    request: dict,
    db: Session = Depends(get_db)
):
    """重新生成单张图片"""
    
    project_id = request.get("projectId")
    image_id = request.get("imageId")
    
    # 获取项目
    project = db.query(ProjectModel).filter(ProjectModel.id == project_id).first()
    if not project:
        raise HTTPException(status_code=404, detail="项目不存在")
    
    try:
        # 找到对应的场景
        scene_id = None
        prompt = ""
        for img in project.images:
            if img["id"] == image_id:
                scene_id = img["sceneId"]
                prompt = img["prompt"]
                break
        
        if scene_id is None:
            raise HTTPException(status_code=404, detail="图片不存在")
        
        # 重新生成图片
        result = await image_agent.regenerate_single(image_id, prompt)
        
        # 更新图片信息
        for i, img in enumerate(project.images):
            if img["id"] == image_id:
                project.images[i] = result
                break
        
        db.commit()
        
        return {
            "success": True,
            "data": result
        }
        
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"重新生成图片失败: {str(e)}")
