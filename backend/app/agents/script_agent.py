from typing import Any, Dict, List
import uuid
from app.agents.base import BaseAgent
from app.agents.llm_client import llm_client


class ScriptGenerationAgent(BaseAgent):
    """脚本生成Agent - 根据知识点生成视频脚本"""
    
    def __init__(self):
        super().__init__("ScriptGenerationAgent")
    
    async def execute(self, context: Dict[str, Any]) -> Dict[str, Any]:
        """执行脚本生成"""
        
        book_name = context.get("book_name", "")
        knowledge_points = context.get("knowledge_points", [])
        
        # 构建知识点文本
        knowledge_text = "\n\n".join([
            f"{i+1}. {point['title']}\n{point['content']}"
            for i, point in enumerate(knowledge_points)
        ])
        
        # 构建提示词
        messages = [
            {
                "role": "system",
                "content": """你是一位资深的短视频脚本创作专家。你的任务是根据书籍知识点，创作一个吸引人的短视频脚本。

脚本要求：
1. 总时长控制在60-90秒
2. 采用"黄金3秒"开场，快速抓住观众注意力
3. 分成3-5个分镜，每个分镜15-20秒
4. 口播文案要口语化、有感染力
5. 每个分镜需要配画面描述，用于AI生成配图

输出格式必须是JSON：
{
  "title": "视频标题",
  "scenes": [
    {
      "id": 1,
      "content": "口播文案",
      "visualDesc": "画面描述，用于AI绘画",
      "duration": 18
    }
  ],
  "totalDuration": 总时长
}"""
            },
            {
                "role": "user",
                "content": f"""书籍名称：《{book_name}》

知识点内容：
{knowledge_text}

请根据以上知识点，创作一个60-90秒的短视频脚本。要求：
1. 开场要有吸引力
2. 内容要有干货
3. 结尾要有行动号召"""
            }
        ]
        
        # 调用LLM生成脚本
        result = await llm_client.generate_json(messages)
        
        # 确保脚本有ID
        if "id" not in result:
            result["id"] = str(uuid.uuid4())
        
        # 计算总时长
        scenes = result.get("scenes", [])
        total_duration = sum(scene.get("duration", 15) for scene in scenes)
        result["totalDuration"] = total_duration
        
        return result
