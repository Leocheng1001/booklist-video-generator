from typing import Any, Dict, List
import os
import tempfile
import uuid
from app.agents.base import BaseAgent
from app.core.config import get_settings
import httpx

settings = get_settings()


class VideoCompositionAgent(BaseAgent):
    """视频拼接Agent - 将图片和脚本合成为视频"""
    
    def __init__(self):
        super().__init__("VideoCompositionAgent")
    
    async def execute(self, context: Dict[str, Any]) -> Dict[str, Any]:
        """执行视频合成"""
        
        script = context.get("script", {})
        images = context.get("images", [])
        book_name = context.get("book_name", "")
        
        scenes = script.get("scenes", [])
        
        # 创建临时目录
        with tempfile.TemporaryDirectory() as temp_dir:
            # 下载所有图片
            image_paths = await self._download_images(images, temp_dir)
            
            # 生成视频
            video_path = await self._compose_video(
                image_paths=image_paths,
                scenes=scenes,
                output_dir=temp_dir,
                book_name=book_name
            )
            
            # 上传视频到存储
            video_url = await self._upload_video(video_path)
            
            return {"video_url": video_url}
    
    async def _download_images(self, images: List[Dict], temp_dir: str) -> List[str]:
        """下载图片到本地"""
        
        image_paths = []
        
        async with httpx.AsyncClient() as client:
            for i, image in enumerate(images):
                url = image.get("url", "")
                if not url:
                    continue
                
                response = await client.get(url, timeout=30.0)
                response.raise_for_status()
                
                # 保存图片
                image_path = os.path.join(temp_dir, f"scene_{i:02d}.jpg")
                with open(image_path, "wb") as f:
                    f.write(response.content)
                
                image_paths.append(image_path)
        
        return image_paths
    
    async def _compose_video(
        self,
        image_paths: List[str],
        scenes: List[Dict],
        output_dir: str,
        book_name: str
    ) -> str:
        """使用MoviePy合成视频"""
        
        try:
            from moviepy.editor import (
                ImageClip, AudioFileClip, CompositeVideoClip,
                concatenate_videoclips, TextClip
            )
            from moviepy.video.fx.all import fadein, fadeout
        except ImportError:
            raise Exception("MoviePy未安装，无法合成视频")
        
        clips = []
        
        for i, (image_path, scene) in enumerate(zip(image_paths, scenes)):
            duration = scene.get("duration", 15)
            content = scene.get("content", "")
            
            # 创建图片片段
            image_clip = ImageClip(image_path, duration=duration)
            
            # 调整尺寸为竖屏
            image_clip = image_clip.resize(
                height=settings.VIDEO_HEIGHT
            ).resize(
                width=settings.VIDEO_WIDTH
            )
            
            # 添加淡入淡出效果
            image_clip = fadein(image_clip, 0.5)
            image_clip = fadeout(image_clip, 0.5)
            
            # 添加字幕（简化版，实际项目中可以使用更复杂的字幕样式）
            # 这里仅作为示例，实际可以添加文字层
            
            clips.append(image_clip)
        
        # 拼接所有片段
        final_clip = concatenate_videoclips(clips, method="compose")
        
        # 添加背景音乐（可选）
        # 这里可以添加轻音乐作为背景
        
        # 输出视频
        output_path = os.path.join(output_dir, f"{uuid.uuid4()}.mp4")
        
        final_clip.write_videofile(
            output_path,
            fps=settings.VIDEO_FPS,
            codec="libx264",
            audio_codec="aac",
            preset="fast",
            threads=4
        )
        
        # 清理
        final_clip.close()
        for clip in clips:
            clip.close()
        
        return output_path
    
    async def _upload_video(self, video_path: str) -> str:
        """上传视频到对象存储"""
        
        # 这里应该实现上传到MinIO或阿里云OSS的逻辑
        # 简化版本，返回本地路径
        
        # 实际项目中，这里应该：
        # 1. 使用MinIO客户端上传文件
        # 2. 返回可访问的URL
        
        return f"file://{video_path}"
