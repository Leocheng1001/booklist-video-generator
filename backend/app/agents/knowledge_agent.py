from typing import Any, Dict, List
import uuid
from app.agents.base import BaseAgent
from app.agents.llm_client import llm_client
from app.models.schemas import KnowledgePoint


class KnowledgeSummaryAgent(BaseAgent):
    """知识总结Agent - 从PDF内容提取核心知识点"""
    
    def __init__(self):
        super().__init__("KnowledgeSummaryAgent")
    
    async def execute(self, context: Dict[str, Any]) -> Dict[str, Any]:
        """执行知识总结"""
        
        book_name = context.get("book_name", "")
        pdf_content = context.get("pdf_content", "")
        user_requirement = context.get("user_requirement", "")
        
        # 构建提示词
        messages = [
            {
                "role": "system",
                "content": """你是一位专业的知识提炼专家。你的任务是从书籍内容中提取核心知识点，并以结构化的方式呈现。

请从以下维度分析书籍内容：
1. 核心概念 - 书中的重要概念和理论
2. 深度洞察 - 作者的独特见解和观点
3. 金句摘录 - 经典语录和名言
4. 行动建议 - 可执行的方法和建议
5. 案例故事 - 书中的典型案例

输出格式必须是JSON，包含以下结构：
{
  "knowledge_points": [
    {
      "id": "唯一ID",
      "title": "知识点标题",
      "content": "详细内容",
      "category": "concept/insight/quote/advice/case"
    }
  ]
}"""
            },
            {
                "role": "user",
                "content": f"""书籍名称：《{book_name}》

用户需求：{user_requirement}

书籍内容摘要：
{pdf_content[:8000]}  # 限制内容长度

请从这本书中提取5-8个核心知识点，确保覆盖用户最关注的内容。"""
            }
        ]
        
        # 调用LLM生成知识点
        result = await llm_client.generate_json(messages)
        
        # 解析结果
        knowledge_points = result.get("knowledge_points", [])
        
        # 确保每个知识点有ID
        for point in knowledge_points:
            if not point.get("id"):
                point["id"] = str(uuid.uuid4())
        
        return {
            "knowledge_points": knowledge_points
        }
