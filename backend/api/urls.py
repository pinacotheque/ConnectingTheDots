from django.urls import path, include
from rest_framework.routers import DefaultRouter
from . import views

router = DefaultRouter()
router.register(r'spaces', views.SpaceViewSet, basename='space')
router.register(r'tags', views.TagViewSet, basename='tag')
router.register(r'nodes', views.NodeViewSet, basename='node')

urlpatterns = [
    path('register/', views.register, name='register'),
    path('login/', views.login, name='login'),
    path('logout/', views.logout, name='logout'),
    path('tags/create/', views.create_tag, name='create-tag'),
    path('', include(router.urls)),
]