
from django.contrib import admin
from django.urls import path
from ninja import NinjaAPI
from accounts.api import auth_router
from core.api import core_router
from django.conf import settings
from django.conf.urls.static import static
api = NinjaAPI()
api.add_router("/auth/", auth_router)
api.add_router('/core/',core_router)
urlpatterns = [
    path("admin/", admin.site.urls),
    path("api/", api.urls),
]+ static(settings.MEDIA_URL, document_root=settings.MEDIA_ROOT)
