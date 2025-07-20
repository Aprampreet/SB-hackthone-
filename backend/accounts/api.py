from ninja import Router
from ninja.security import HttpBearer
from django.contrib.auth.models import User
from django.contrib.auth import authenticate
from rest_framework_simplejwt.tokens import RefreshToken
from rest_framework_simplejwt.token_blacklist.models import BlacklistedToken, OutstandingToken
from pydantic import BaseModel
from ninja.errors import HttpError

auth_router = Router()

class AuthIn(BaseModel):
    username: str
    password: str

class AuthOut(BaseModel):
    access: str
    refresh: str
    username: str

@auth_router.post("register", response=AuthOut)
def register(request, data: AuthIn):
    if User.objects.filter(username=data.username).exists():
        raise HttpError(400, "Username already exists")
    user = User.objects.create_user(username=data.username, password=data.password)
    refresh = RefreshToken.for_user(user)
    print(refresh.access_token)
    return {
        "access": str(refresh.access_token),
        "refresh": str(refresh),
        "username": user.username,
    }

@auth_router.post("login", response=AuthOut)
def login(request, data: AuthIn):
    user = authenticate(username=data.username, password=data.password)
    if not user:
        raise HttpError(401, "Invalid credentials")
    refresh = RefreshToken.for_user(user)
    print(refresh.access_token)
    return {
        "access": str(refresh.access_token),
        "refresh": str(refresh),
        "username": user.username,
    }
