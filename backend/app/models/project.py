from sqlalchemy import Column, String, Integer, JSON, DateTime, Text, create_engine
from sqlalchemy.ext.declarative import declarative_base
from sqlalchemy.sql import func
import uuid

Base = declarative_base()


class ProjectModel(Base):
    __tablename__ = "projects"
    
    id = Column(String(36), primary_key=True, default=lambda: str(uuid.uuid4()))
    book_name = Column(String(255), nullable=False)
    book_pdf_url = Column(String(500), default="")
    user_requirement = Column(Text, default="")
    status = Column(String(50), default="idle")
    progress = Column(Integer, default=0)
    
    # JSON fields
    knowledge_points = Column(JSON, default=list)
    script = Column(JSON, default=dict)
    images = Column(JSON, default=list)
    video_url = Column(String(500), default="")
    
    # Timestamps
    created_at = Column(DateTime, server_default=func.now())
    updated_at = Column(DateTime, server_default=func.now(), onupdate=func.now())
    
    def to_dict(self):
        return {
            "id": self.id,
            "bookName": self.book_name,
            "bookPdfUrl": self.book_pdf_url,
            "userRequirement": self.user_requirement,
            "status": self.status,
            "progress": self.progress,
            "knowledgePoints": self.knowledge_points,
            "script": self.script,
            "images": self.images,
            "videoUrl": self.video_url,
            "createdAt": self.created_at.isoformat() if self.created_at else None,
            "updatedAt": self.updated_at.isoformat() if self.updated_at else None,
        }
