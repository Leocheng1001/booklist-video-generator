from abc import ABC, abstractmethod
from typing import Any, Dict
import logging

logger = logging.getLogger(__name__)


class BaseAgent(ABC):
    """Agent基类"""
    
    def __init__(self, name: str):
        self.name = name
        self.logger = logging.getLogger(f"agent.{name}")
    
    @abstractmethod
    async def execute(self, context: Dict[str, Any]) -> Dict[str, Any]:
        """执行Agent任务"""
        pass
    
    async def run(self, context: Dict[str, Any]) -> Dict[str, Any]:
        """运行Agent，包含错误处理"""
        try:
            self.logger.info(f"[{self.name}] 开始执行")
            result = await self.execute(context)
            self.logger.info(f"[{self.name}] 执行完成")
            return {
                "success": True,
                "data": result
            }
        except Exception as e:
            self.logger.error(f"[{self.name}] 执行失败: {str(e)}")
            return {
                "success": False,
                "error": str(e)
            }
