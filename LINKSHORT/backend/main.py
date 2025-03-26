from fastapi import FastAPI, HTTPException
from fastapi.middleware.cors import CORSMiddleware
from pydantic import BaseModel, HttpUrl
from sqlalchemy import create_engine, Column, Integer, String, DateTime
from sqlalchemy.ext.declarative import declarative_base
from sqlalchemy.orm import sessionmaker
import datetime
import random
import string
import os
import logging

# Set up logging
logging.basicConfig(level=logging.INFO)
logger = logging.getLogger(__name__)

# Database setup
SQLALCHEMY_DATABASE_URL = "sqlite:///./urls.db"
engine = create_engine(SQLALCHEMY_DATABASE_URL, connect_args={"check_same_thread": False})
SessionLocal = sessionmaker(autocommit=False, autoflush=False, bind=engine)
Base = declarative_base()

# Database model
class URL(Base):
    __tablename__ = "urls"

    id = Column(Integer, primary_key=True, index=True)
    original_url = Column(String)
    short_code = Column(String, unique=True)
    created_at = Column(DateTime, default=datetime.datetime.utcnow)
    clicks = Column(Integer, default=0)

# Create tables
Base.metadata.create_all(bind=engine)

app = FastAPI()

# CORS middleware with specific origins
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],  # Allows all origins
    allow_credentials=True,
    allow_methods=["*"],  # Allows all methods
    allow_headers=["*"],  # Allows all headers
)

# Pydantic models
class URLCreate(BaseModel):
    url: str  # Changed from HttpUrl to str to handle more URL formats

class URLResponse(BaseModel):
    id: int
    original_url: str
    short_code: str
    created_at: datetime.datetime
    clicks: int

    class Config:
        from_attributes = True

def generate_short_code(length: int = 6) -> str:
    characters = string.ascii_letters + string.digits
    return ''.join(random.choice(characters) for _ in range(length))

@app.post("/api/shorten", response_model=URLResponse)
async def create_short_url(url_data: URLCreate):
    logger.info(f"Received URL shortening request for: {url_data.url}")
    db = SessionLocal()
    try:
        # Validate URL format
        if not url_data.url.startswith(('http://', 'https://')):
            url_data.url = 'https://' + url_data.url

        # Generate a unique short code
        while True:
            short_code = generate_short_code()
            if not db.query(URL).filter(URL.short_code == short_code).first():
                break

        # Create new URL record
        db_url = URL(
            original_url=url_data.url,
            short_code=short_code
        )
        db.add(db_url)
        db.commit()
        db.refresh(db_url)
        logger.info(f"Successfully created short URL: {short_code}")
        return db_url
    except Exception as e:
        logger.error(f"Error creating short URL: {str(e)}")
        raise HTTPException(status_code=500, detail=str(e))
    finally:
        db.close()

@app.get("/api/urls", response_model=list[URLResponse])
async def get_urls():
    db = SessionLocal()
    try:
        urls = db.query(URL).all()
        return urls
    except Exception as e:
        logger.error(f"Error fetching URLs: {str(e)}")
        raise HTTPException(status_code=500, detail=str(e))
    finally:
        db.close()

@app.get("/{short_code}")
async def redirect_to_url(short_code: str):
    db = SessionLocal()
    try:
        url = db.query(URL).filter(URL.short_code == short_code).first()
        if not url:
            raise HTTPException(status_code=404, detail="URL not found")
        
        # Increment click counter
        url.clicks += 1
        db.commit()
        
        return {"url": url.original_url}
    except Exception as e:
        logger.error(f"Error redirecting URL: {str(e)}")
        raise HTTPException(status_code=500, detail=str(e))
    finally:
        db.close()

if __name__ == "__main__":
    import uvicorn
    uvicorn.run(app, host="0.0.0.0", port=8000) 