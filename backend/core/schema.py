from pydantic import BaseModel, ConfigDict
from typing import Optional
from datetime import datetime

class VideoIn(BaseModel):
    youtube_url: str

class VideoOut(BaseModel):
    id: int
    youtube_url: str
    title: Optional[str]
    short_video_file: Optional[str]
    created_at: datetime
    updated_at: datetime

    model_config = ConfigDict(from_attributes=True)

class FilterIn(BaseModel):
    filter_name: str

class SubtitleStyle(BaseModel):
    font: str = "Impact"
    fontsize: int = 80
    bold: int = 400
    color: str = "#FF0000"