from django.urls import path, include
from . import views
from rest_framework.routers import DefaultRouter
from .views import SpaceViewSet

router = DefaultRouter()
router.register(r'spaces', SpaceViewSet, basename='space')

urlpatterns = [
    path('register/', views.register, name='register'),
    path('login/', views.login, name='login'),

    path('', include(router.urls)),
]