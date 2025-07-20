
from django.db import models
from django.contrib.auth.models import User

class YouTubeVideo(models.Model):
    user = models.ForeignKey(User, on_delete=models.CASCADE, related_name='youtube_videos')
    youtube_url = models.URLField(max_length=255)
    title = models.CharField(max_length=255, blank=True, null=True)
    short_video_file = models.FileField(upload_to='shorts/', blank=True, null=True)
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)

    def __str__(self):
        return f"{self.title or self.youtube_url}"