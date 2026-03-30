import httpx
import json
from typing import List, Dict, Any, Optional
from app.core.config import get_settings

settings = get_settings()


class LLMClient:
    """LLM客户端，支持多种模型"""
    
    def __init__(self):
        self.api_key = settings.DASHSCOPE_API_KEY
        self.model = settings.LLM_MODEL
        self.base_url = "https://dashscope.aliyuncs.com/api/v1"
    
    async def chat(
        self,
        messages: List[Dict[str, str]],
        temperature: float = 0.7,
        max_tokens: int = 2000,
        response_format: Optional[Dict] = None
    ) -> str:
        """调用LLM进行对话"""
        
        headers = {
            "Authorization": f"Bearer {self.api_key}",
            "Content-Type": "application/json"
        }
        
        payload = {
            "model": self.model,
            "input": {
                "messages": messages
            },
            "parameters": {
                "temperature": temperature,
                "max_tokens": max_tokens,
                "result_format": "message"
            }
        }
        
        if response_format:
            payload["parameters"]["response_format"] = response_format
        
        async with httpx.AsyncClient() as client:
            response = await client.post(
                f"{self.base_url}/services/aigc/text-generation/generation",
                headers=headers,
                json=payload,
                timeout=60.0
            )
            response.raise_for_status()
            
            data = response.json()
            if "output" in data:
                # 处理不同格式的响应
                if "text" in data["output"]:
                    return data["output"]["text"]
                elif "choices" in data["output"]:
                    return data["output"]["choices"][0]["message"]["content"]
            raise Exception(f"LLM响应格式错误: {data}")
    
    async def generate_json(
        self,
        messages: List[Dict[str, str]],
        temperature: float = 0.7
    ) -> Dict[str, Any]:
        """生成JSON格式的响应"""
        
        response = await self.chat(
            messages=messages,
            temperature=temperature,
            response_format={"type": "json_object"}
        )
        
        # 尝试解析JSON
        try:
            # 清理可能的markdown代码块
            if response.startswith("```json"):
                response = response[7:]
            if response.startswith("```"):
                response = response[3:]
            if response.endswith("```"):
                response = response[:-3]
            
            return json.loads(response.strip())
        except json.JSONDecodeError as e:
            raise Exception(f"JSON解析失败: {str(e)}, 响应: {response}")


# 全局LLM客户端实例
llm_client = LLMClient()
