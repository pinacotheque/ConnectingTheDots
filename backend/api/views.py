from rest_framework.decorators import api_view, permission_classes, action
from rest_framework.permissions import AllowAny, IsAuthenticated
from rest_framework.response import Response
from .models import Space, Tag
from .serializers import  RegisterSerializer, SpaceSerializer, TagSerializer, UserSerializer
from rest_framework import viewsets, permissions, status
from rest_framework.response import Response
from django.contrib.auth import authenticate
from rest_framework_simplejwt.tokens import RefreshToken
from django.shortcuts import get_object_or_404
from django.contrib.auth.models import User
from django.db import transaction


@api_view(['POST'])
@permission_classes([AllowAny])
def register(request):
    serializer = RegisterSerializer(data=request.data)
    if serializer.is_valid():
        serializer.save()
        return Response({"message": "User registered successfully"}, status=201)
    return Response(serializer.errors, status=400)

@api_view(['POST'])
@permission_classes([AllowAny])
def login(request):
    username = request.data.get('username')
    password = request.data.get('password')

    if not username or not password:
        return Response({"message": "Please provide both username and password"}, status=400)

    user = authenticate(request, username=username, password=password)
    if user:
        refresh = RefreshToken.for_user(user)
        return Response({
            "message": "Login successful",
            "token": str(refresh.access_token),
        })
    else:
        return Response({"message": "Invalid credentials"}, status=401)

@api_view(['POST'])
@permission_classes([IsAuthenticated])
def logout(request):
    request.session.flush()
    return Response({"message": "Logged out successfully"}, status=200)


@api_view(['GET'])
@permission_classes([IsAuthenticated])
def search_wikidata_tags(request):
    query = request.GET.get('q', '')
    if not query or len(query) < 2:
        return Response({"error": "Query too short"}, status=status.HTTP_400_BAD_REQUEST)
    
    url = 'https://www.wikidata.org/w/api.php'
    params = {
        'action': 'wbsearchentities',
        'search': query,
        'language': 'en',
        'format': 'json',
        'limit': 50,
    }
    
    try:
        response = request.get(url, params=params)
        data = response.json()
        
        results = []
        for item in data.get('search', []):
            result = {
                'wikidata_id': item.get('id'),
                'name': item.get('label'),
                'description': item.get('description', ''),
            }
            results.append(result)
        
        return Response(results)
    except Exception as e:
        return Response({"error": str(e)}, status=status.HTTP_500_INTERNAL_SERVER_ERROR)

@api_view(['POST'])
@permission_classes([IsAuthenticated])
def create_tag(request):
    wikidata_id = request.data.get('wikidata_id')
    name = request.data.get('name')
    description = request.data.get('description')
    
    if not wikidata_id or not name:
        return Response({"error": "Wikidata ID and name are required"}, 
                        status=status.HTTP_400_BAD_REQUEST)
    
    tag, created = Tag.objects.get_or_create(
        wikidata_id=wikidata_id,
        defaults={'name': name, 'description': description}
    )
    
    serializer = TagSerializer(tag)
    return Response(serializer.data)

class UserViewSet(viewsets.ModelViewSet):
    queryset = User.objects.all()
    serializer_class = UserSerializer
    permission_classes = [permissions.IsAuthenticated]
    
    def get_permissions(self):
        if self.action == 'create':
            return [permissions.AllowAny()]
        return super().get_permissions()

class SpaceViewSet(viewsets.ModelViewSet):
    queryset = Space.objects.all()
    serializer_class = SpaceSerializer
    permission_classes = [permissions.IsAuthenticated]
    
    def get_queryset(self):
        queryset = Space.objects.all()
        search = self.request.query_params.get('search', None)
        if search:
            queryset = queryset.filter(title__icontains=search) | \
                      queryset.filter(description__icontains=search) | \
                      queryset.filter(tags__name__icontains=search)
        return queryset.distinct()
    
    def perform_create(self, serializer):
        tag_ids = self.request.data.get('tag_ids', [])
        serializer.save(tag_ids=tag_ids)
    
    @action(detail=True, methods=['post'])
    @transaction.atomic
    def join(self, request, pk=None):
        try:
            space = self.get_object()
            
            if space.owner == request.user:
                return Response(
                    {
                        "detail": "You are already the owner of this space.",
                        "code": "already_owner"
                    },
                    status=status.HTTP_400_BAD_REQUEST
                )

            if request.user in space.contributors.all():
                return Response(
                    {
                        "detail": "You are already a contributor of this space.",
                        "code": "already_contributor"
                    },
                    status=status.HTTP_400_BAD_REQUEST
                )

            space.contributors.add(request.user)
            
            serializer = self.get_serializer(space)
            return Response({
                "detail": "Successfully joined the space.",
                "space": serializer.data
            }, status=status.HTTP_200_OK)
            
        except Space.DoesNotExist:
            return Response(
                {
                    "detail": "Space not found.",
                    "code": "space_not_found"
                },
                status=status.HTTP_404_NOT_FOUND
            )
        except Exception as e:
            return Response(
                {
                    "detail": "An error occurred while joining the space.",
                    "code": "server_error",
                    "error": str(e)
                },
                status=status.HTTP_500_INTERNAL_SERVER_ERROR
            )
    
    @action(detail=True, methods=['post'])
    @transaction.atomic
    def leave(self, request, pk=None):
        try:
            space = self.get_object()
            
            if space.owner == request.user:
                return Response(
                    {
                        "detail": "You cannot leave a space you own.",
                        "code": "is_owner"
                    },
                    status=status.HTTP_400_BAD_REQUEST
                )
            
            if request.user not in space.contributors.all():
                return Response(
                    {
                        "detail": "You are not a contributor of this space.",
                        "code": "not_contributor"
                    },
                    status=status.HTTP_400_BAD_REQUEST
                )
            
            space.contributors.remove(request.user)
            
            serializer = self.get_serializer(space)
            return Response({
                "detail": "Successfully left the space.",
                "space": serializer.data
            }, status=status.HTTP_200_OK)
            
        except Space.DoesNotExist:
            return Response(
                {
                    "detail": "Space not found.",
                    "code": "space_not_found"
                },
                status=status.HTTP_404_NOT_FOUND
            )
        except Exception as e:
            return Response(
                {
                    "detail": "An error occurred while leaving the space.",
                    "code": "server_error",
                    "error": str(e)
                },
                status=status.HTTP_500_INTERNAL_SERVER_ERROR
            )

class TagViewSet(viewsets.ModelViewSet):
    queryset = Tag.objects.all()
    serializer_class = TagSerializer
    permission_classes = [permissions.IsAuthenticated]