from fastapi import APIRouter, Depends, HTTPException, Request, Response
from fastapi.responses import StreamingResponse
from sqlalchemy.orm import Session
import os
import mimetypes
import urllib.parse

from app.core.database import get_db
from app.models.project import ProjectModel
from app.models.schemas import ApiResponse
from app.agents.video_agent import VideoCompositionAgent

router = APIRouter(prefix="/videos", tags=["videos"])

video_agent = VideoCompositionAgent()

# 视频文件存储目录
UPLOADS_DIR = "/tmp/uploads"


def iter_file(file_path: str, start: int = 0, end: int = None):
    """生成文件迭代器，支持Range请求"""
    with open(file_path, "rb") as f:
        f.seek(start)
        if end is None:
            while True:
                chunk = f.read(8192)
                if not chunk:
                    break
                yield chunk
        else:
            remaining = end - start + 1
            while remaining > 0:
                chunk_size = min(8192, remaining)
                chunk = f.read(chunk_size)
                if not chunk:
                    break
                yield chunk
                remaining -= len(chunk)


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


@router.get("/stream/{filename}")
async def stream_video(request: Request, filename: str):
    """
    流媒体播放视频 - 支持Range请求（视频快进、跳转）
    """
    # URL解码文件名（处理中文文件名）
    filename = urllib.parse.unquote(filename)
    file_path = os.path.join(UPLOADS_DIR, filename)

    # 安全检查：确保文件在uploads目录内
    real_path = os.path.realpath(file_path)
    real_uploads_dir = os.path.realpath(UPLOADS_DIR)
    if not real_path.startswith(real_uploads_dir):
        raise HTTPException(status_code=403, detail="Access denied")

    if not os.path.exists(file_path):
        raise HTTPException(status_code=404, detail="视频文件不存在")

    file_size = os.path.getsize(file_path)
    mime_type, _ = mimetypes.guess_type(file_path)
    if not mime_type:
        mime_type = "video/mp4"

    # 获取Range头
    range_header = request.headers.get("range")

    if range_header:
        # 解析Range头 (例如: bytes=0-1023)
        try:
            range_value = range_header.replace("bytes=", "")
            start_str, end_str = range_value.split("-")
            start = int(start_str) if start_str else 0
            end = int(end_str) if end_str else file_size - 1

            # 确保end不超过文件大小
            end = min(end, file_size - 1)
            chunk_size = end - start + 1

            # 所有header值必须是ASCII
            headers = [
                (b"content-range", f"bytes {start}-{end}/{file_size}".encode()),
                (b"accept-ranges", b"bytes"),
                (b"content-length", str(chunk_size).encode()),
                (b"content-type", mime_type.encode()),
            ]

            return StreamingResponse(
                iter_file(file_path, start, end),
                status_code=206,
                headers={k.decode(): v.decode() for k, v in headers},
                media_type=mime_type
            )

        except (ValueError, IndexError):
            pass  # Range格式错误，返回整个文件

    # 返回整个文件
    headers = [
        (b"accept-ranges", b"bytes"),
        (b"content-length", str(file_size).encode()),
        (b"content-type", mime_type.encode()),
    ]

    return StreamingResponse(
        iter_file(file_path),
        headers={k.decode(): v.decode() for k, v in headers},
        media_type=mime_type
    )


@router.get("/download/{filename}")
async def download_video(filename: str):
    """
    下载视频文件
    """
    # URL解码文件名（处理中文文件名）
    filename = urllib.parse.unquote(filename)
    file_path = os.path.join(UPLOADS_DIR, filename)

    # 安全检查
    real_path = os.path.realpath(file_path)
    real_uploads_dir = os.path.realpath(UPLOADS_DIR)
    if not real_path.startswith(real_uploads_dir):
        raise HTTPException(status_code=403, detail="Access denied")

    if not os.path.exists(file_path):
        raise HTTPException(status_code=404, detail="视频文件不存在")

    mime_type, _ = mimetypes.guess_type(file_path)
    if not mime_type:
        mime_type = "video/mp4"

    file_size = os.path.getsize(file_path)

    # 使用ASCII文件名避免编码问题
    headers = [
        (b"content-type", mime_type.encode()),
        (b"content-length", str(file_size).encode()),
        (b"content-disposition", b'attachment; filename="video.mp4"'),
    ]

    return StreamingResponse(
        iter_file(file_path),
        headers={k.decode(): v.decode() for k, v in headers},
        media_type=mime_type
    )
