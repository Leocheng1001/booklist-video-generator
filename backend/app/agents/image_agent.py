from typing import Any, Dict, List
import uuid
import httpx
import base64
import os
from app.agents.base import BaseAgent
from app.core.config import get_settings

settings = get_settings()


class ImageGenerationAgent(BaseAgent):
    """图片生成Agent - 调用阿里万相API生成配图"""
    
    def __init__(self):
        super().__init__("ImageGenerationAgent")
        self.api_key = settings.DASHSCOPE_API_KEY
        self.base_url = "https://dashscope.aliyuncs.com/api/v1"
    
    async def execute(self, context: Dict[str, Any]) -> Dict[str, Any]:
        """执行图片生成"""
        
        scenes = context.get("scenes", [])
        book_name = context.get("book_name", "")
        
        images = []
        
        for scene in scenes:
            scene_id = scene.get("id", 0)
            visual_desc = scene.get("visualDesc", "")
            
            # 优化提示词
            prompt = self._optimize_prompt(visual_desc, book_name)
            
            # 生成图片
            image_url = await self._generate_image(prompt)
            
            images.append({
                "id": str(uuid.uuid4()),
                "sceneId": scene_id,
                "url": image_url,
                "prompt": prompt,
                "status": "completed"
            })
        
        return {"images": images}
    
    def _optimize_prompt(self, visual_desc: str, book_name: str) -> str:
        """优化绘画提示词"""
        
        # 添加风格词
        style_keywords = [
            "high quality",
            "detailed",
            "professional illustration",
            "clean composition"
        ]
        
        # 构建完整提示词
        prompt = f"{visual_desc}, {', '.join(style_keywords)}, inspired by book '{book_name}'"
        
        return prompt
    
    async def _generate_image(self, prompt: str) -> str:
        """调用阿里万相API生成图片"""
        
        headers = {
            "Authorization": f"Bearer {self.api_key}",
            "Content-Type": "application/json",
            "X-DashScope-Async": "enable"
        }
        
        payload = {
            "model": "wanx2.1-t2i-turbo",
            "input": {
                "prompt": prompt
            },
            "parameters": {
                "size": f"{settings.VIDEO_WIDTH}*{settings.VIDEO_HEIGHT}",
                "n": 1
            }
        }
        
        async with httpx.AsyncClient() as client:
            response = await client.post(
                f"{self.base_url}/services/aigc/text2image/image-synthesis",
                headers=headers,
                json=payload,
                timeout=120.0
            )
            response.raise_for_status()
            
            data = response.json()
            
            # 获取任务ID
            task_id = data.get("output", {}).get("task_id")
            if not task_id:
                raise Exception(f"图片生成任务创建失败: {data}")
            
            # 轮询任务结果
            image_url = await self._poll_task_result(task_id)
            
            return image_url
    
    async def _poll_task_result(self, task_id: str) -> str:
        """轮询任务结果"""
        
        headers = {
            "Authorization": f"Bearer {self.api_key}"
        }
        
        async with httpx.AsyncClient() as client:
            import asyncio
            
            # 最多轮询30次，每次2秒
            for _ in range(30):
                response = await client.get(
                    f"{self.base_url}/tasks/{task_id}",
                    headers=headers,
                    timeout=30.0
                )
                response.raise_for_status()
                
                data = response.json()
                task_status = data.get("output", {}).get("task_status")
                
                if task_status == "SUCCEEDED":
                    # 获取图片URL
                    results = data.get("output", {}).get("results", [])
                    if results:
                        return results[0].get("url", "")
                    raise Exception("图片生成成功但未返回URL")
                
                elif task_status == "FAILED":
                    raise Exception(f"图片生成失败: {data}")
                
                # 等待2秒后再次查询
                await asyncio.sleep(2)
            
            raise Exception("图片生成超时")
    
    async def regenerate_single(self, image_id: str, prompt: str) -> Dict[str, Any]:
        """重新生成单张图片"""
        
        image_url = await self._generate_image(prompt)
        
        return {
            "id": image_id,
            "url": image_url,
            "prompt": prompt,
            "status": "completed"
        }
