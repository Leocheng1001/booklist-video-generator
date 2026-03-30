from sqlalchemy import create_engine
from sqlalchemy.orm import sessionmaker, Session

# 使用SQLite
engine = create_engine("sqlite:///./booklist_video.db", connect_args={"check_same_thread": False})
SessionLocal = sessionmaker(autocommit=False, autoflush=False, bind=engine)

def get_db() -> Session:
    db = SessionLocal()
    try:
        yield db
    finally:
        db.close()
