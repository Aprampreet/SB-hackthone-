from ninja import Router
from .models import YouTubeVideo
from .schema import VideoIn, VideoOut,FilterIn,SubtitleStyle
from .utils import download_youtube_video, trim_video,resizing_trimmed_video,apply_filter_to_video,add_subtitles_to_video
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

@core_router.post('/videos/{video_id}/apply-subtitles',response=VideoOut)
def subtitles(request,video_id:int , body: SubtitleStyle):
    try:
        video = YouTubeVideo.objects.get(id=video_id, user=request.user)
    except YouTubeVideo.DoesNotExist:
        raise HttpError("Video not found.")
    
    if not video.short_video_file:
        raise HttpError("Cannot apply filter: Original short video does not exist.")
    
    color = body.color  
    def hex_to_ass_color(hex_color: str) -> str:
        hex_color = hex_color.lstrip('#')
        bbggrr = hex_color[4:6]+hex_color[2:4]+hex_color[0:2]  
        return f'&H00{bbggrr.upper()}'

    ass_color = hex_to_ass_color(body.color)
    ass_bold = 1 if (body.bold and int(body.bold) >= 700) else 0
    ass_font = body.font
    ass_size = body.fontsize
    input_video_path = video.original_short_video_file.name if hasattr(video, 'original_short_video_file') else video.short_video_file.name

    new_subtitle_video = add_subtitles_to_video(
        input_relative_path=video.short_video_file.name,
        font=ass_font,
        fontsize=ass_size,
        bold=ass_bold,
        color=ass_color,
    )
    video.short_video_file = new_subtitle_video
    video.save()
    
    return VideoOut(
        id=video.id,
        youtube_url=str(video.youtube_url),
        title=video.title,
        short_video_file=request.build_absolute_uri(video.short_video_file.url) if video.short_video_file else None,
        created_at=video.created_at,
        updated_at=video.updated_at,
    )

    