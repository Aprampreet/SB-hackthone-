from ninja import Router
from .models import YouTubeVideo
from .schema import VideoIn, VideoOut,FilterIn
from .utils import download_youtube_video, trim_video,resizing_trimmed_video,apply_filter_to_video
from accounts.AuthBar import JWTAuth
from ninja.errors import HttpError
core_router = Router(auth=JWTAuth())

@core_router.post("convert-video", response=VideoOut)
def convert_video(request, data: VideoIn):
    video = YouTubeVideo.objects.create(
        user=request.user, youtube_url=data.youtube_url
    )
    input_path, title, yt_id = download_youtube_video(data.youtube_url, video.id)
    video.title = title
    relative_short_path = trim_video(input_path, yt_id, video.id)
    relative_short_path_resized = resizing_trimmed_video(
    relative_short_path, yt_id, video.id
)

    video.short_video_file.name = str(relative_short_path_resized)
    video.save()

    return VideoOut(
        id=video.id,
        youtube_url=str(video.youtube_url),
        title=video.title,
        short_video_file=request.build_absolute_uri(video.short_video_file.url) if video.short_video_file else None,
        created_at=video.created_at,
        updated_at=video.updated_at,
    )


@core_router.get("my-videos", response=list[VideoOut])
def list_my_videos(request):
    videos = YouTubeVideo.objects.filter(user=request.user).order_by("-created_at")

    return [
        VideoOut(
            id=video.id,
            youtube_url=str(video.youtube_url),
            title=video.title,
            short_video_file=request.build_absolute_uri(video.short_video_file.url) if video.short_video_file else None,
            created_at=video.created_at,
            updated_at=video.updated_at,
        )
        for video in videos
    ]


@core_router.post("/videos/{video_id}/apply-filter", response=VideoOut)
def filter_video(request, video_id: int, data: FilterIn):
    try:
        video = YouTubeVideo.objects.get(id=video_id, user=request.user)
    except YouTubeVideo.DoesNotExist:
        raise HttpError("Video not found.")

    if not video.short_video_file:
        raise HttpError("Cannot apply filter: Original short video does not exist.")

    new_filtered_path = apply_filter_to_video(
        input_relative_path=video.short_video_file.name,
        filter_name=data.filter_name
    )
    video.short_video_file.name = new_filtered_path
    video.save()

    return VideoOut(
        id=video.id,
        youtube_url=str(video.youtube_url),
        title=video.title,
        short_video_file=request.build_absolute_uri(video.short_video_file.url) if video.short_video_file else None,
        created_at=video.created_at,
        updated_at=video.updated_at,
    )