from typing import Any, Dict, List
import os
import tempfile
import uuid
import asyncio
import edge_tts
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

        # 创建持久化目录（非临时目录）
        output_dir = "/tmp/videos"
        os.makedirs(output_dir, exist_ok=True)

        # 下载所有图片
        image_paths = await self._download_images(images, output_dir)

        # 生成视频
        video_path = await self._compose_video(
            image_paths=image_paths,
            scenes=scenes,
            output_dir=output_dir,
            book_name=book_name
        )

        # 上传视频到存储
        video_url = await self._upload_video(video_path, book_name)

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
    
    async def _generate_tts(self, text: str, output_path: str) -> float:
        """使用edge-tts生成语音，返回音频时长"""
        try:
            # 使用中文女声
            voice = "zh-CN-XiaoxiaoNeural"
            communicate = edge_tts.Communicate(text, voice)
            await communicate.save(output_path)

            # 获取音频时长
            from moviepy.editor import AudioFileClip
            audio = AudioFileClip(output_path)
            duration = audio.duration
            audio.close()
            return duration
        except Exception as e:
            print(f"TTS生成失败: {e}")
            return 0

    async def _compose_video(
        self,
        image_paths: List[str],
        scenes: List[Dict],
        output_dir: str,
        book_name: str
    ) -> str:
        """使用MoviePy合成视频（带字幕和音频）"""

        try:
            from moviepy.editor import (
                ImageClip, AudioFileClip, CompositeVideoClip,
                concatenate_videoclips, TextClip
            )
            from moviepy.video.fx.all import fadein, fadeout
            from moviepy.audio.fx.all import audio_fadein, audio_fadeout
        except ImportError:
            raise Exception("MoviePy未安装，无法合成视频")

        clips = []
        audio_clips = []

        for i, (image_path, scene) in enumerate(zip(image_paths, scenes)):
            content = scene.get("content", "")

            # 生成TTS音频
            audio_path = os.path.join(output_dir, f"scene_{i:02d}_audio.mp3")
            audio_duration = await self._generate_tts(content, audio_path)

            # 使用音频时长或默认15秒
            duration = audio_duration if audio_duration > 0 else scene.get("duration", 15)

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

            # 添加字幕
            if content:
                # 字幕样式 - 使用系统自带的中文字体（使用完整路径）
                font_path = '/System/Library/Fonts/STHeiti Medium.ttc'
                txt_clip = TextClip(
                    content,
                    fontsize=36,
                    color='white',
                    font=font_path,  # macOS系统自带中文字体完整路径
                    bg_color='black',  # 黑色背景
                    size=(settings.VIDEO_WIDTH - 80, None),  # 留边距
                    method='caption',  # 自动换行
                    stroke_color='black',  # 描边颜色
                    stroke_width=2  # 描边宽度
                )

                # 设置字幕位置和时长
                txt_clip = txt_clip.set_duration(duration)
                txt_clip = txt_clip.set_position(('center', 'bottom'))  # 底部居中
                txt_clip = txt_clip.margin(bottom=100, opacity=0)  # 底部留100像素

                # 字幕淡入淡出
                txt_clip = fadein(txt_clip, 0.3)
                txt_clip = fadeout(txt_clip, 0.3)

                # 合并图片和字幕
                video_clip = CompositeVideoClip([image_clip, txt_clip], size=(settings.VIDEO_WIDTH, settings.VIDEO_HEIGHT))
            else:
                video_clip = image_clip

            # 添加音频
            if audio_duration > 0:
                audio = AudioFileClip(audio_path)
                # 音频淡入淡出
                audio = audio_fadein(audio, 0.3)
                audio = audio_fadeout(audio, 0.3)
                video_clip = video_clip.set_audio(audio)
                audio_clips.append(audio)

            clips.append(video_clip)

        # 拼接所有片段
        final_clip = concatenate_videoclips(clips, method="compose")

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
        for audio in audio_clips:
            audio.close()

        return output_path
    
    async def _upload_video(self, video_path: str, book_name: str) -> str:
        """上传视频到存储"""

        # 将视频移动到上传目录以便通过HTTP访问
        upload_dir = "/tmp/uploads"
        os.makedirs(upload_dir, exist_ok=True)

        # 生成唯一文件名（只用UUID，避免中文编码问题）
        video_filename = f"{uuid.uuid4()}.mp4"
        final_path = os.path.join(upload_dir, video_filename)

        # 移动视频文件
        import shutil
        shutil.move(video_path, final_path)

        # 返回可访问的URL - 使用新的流式端点
        return f"/api/videos/stream/{video_filename}"
