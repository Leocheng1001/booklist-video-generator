from pydantic_settings import BaseSettings
from functools import lru_cache


class Settings(BaseSettings):
    # App
    APP_NAME: str = "书单视频生成器"
    APP_VERSION: str = "1.0.0"
    DEBUG: bool = False
    
    # Database
    DATABASE_URL: str = "postgresql://user:password@localhost:5432/booklist_video"
    
    # Redis
    REDIS_URL: str = "redis://localhost:6379/0"
    
    # Storage
    MINIO_ENDPOINT: str = "localhost:9000"
    MINIO_ACCESS_KEY: str = "minioadmin"
    MINIO_SECRET_KEY: str = "minioadmin"
    MINIO_BUCKET_NAME: str = "booklist-video"
    
    # AI APIs
    DASHSCOPE_API_KEY: str = ""  # 阿里万相API
    OPENAI_API_KEY: str = ""  # OpenAI API (可选)
    OPENAI_BASE_URL: str = "https://api.openai.com/v1"
    
    # LLM Model
    LLM_MODEL: str = "qwen-max"
    
    # Video Generation
    VIDEO_WIDTH: int = 720
    VIDEO_HEIGHT: int = 1280
    VIDEO_FPS: int = 24
    
    class Config:
        env_file = ".env"
        case_sensitive = True


@lru_cache()
def get_settings() -> Settings:
    return Settings()
