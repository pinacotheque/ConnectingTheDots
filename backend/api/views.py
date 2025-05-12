from rest_framework.decorators import api_view, permission_classes, action
from rest_framework.permissions import AllowAny, IsAuthenticated
from rest_framework.response import Response
from .models import Space, Tag, Node, Edge
from .serializers import (RegisterSerializer, SpaceSerializer, TagSerializer, 
                         UserSerializer, NodeSerializer, EdgeSerializer)
from rest_framework import viewsets, permissions, status
from rest_framework.response import Response
from django.contrib.auth import authenticate
from rest_framework_simplejwt.tokens import RefreshToken
from django.shortcuts import get_object_or_404
from django.contrib.auth.models import User
from django.db import transaction
import requests
from django.db.models import Q


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
        tags = self.request.data.get('tags', [])
        serializer.save(owner=self.request.user, tags=tags)
    
    def destroy(self, request, *args, **kwargs):
        try:
            space = self.get_object()
            
            if space.owner != request.user:
                return Response(
                    {
                        "detail": "Only the space owner can delete the space.",
                        "code": "not_owner"
                    },
                    status=status.HTTP_403_FORBIDDEN
                )
            
            space.delete()
            return Response(
                {
                    "detail": "Space successfully deleted.",
                    "code": "space_deleted"
                },
                status=status.HTTP_200_OK
            )
            
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
                    "detail": "An error occurred while deleting the space.",
                    "code": "server_error",
                    "error": str(e)
                },
                status=status.HTTP_500_INTERNAL_SERVER_ERROR
            )
    
    @action(detail=False, methods=['get'], url_path='search_wikidata')
    def search_wikidata(self, request):
        query = request.query_params.get('q', '')
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
            response = requests.get(url, params=params)
            data = response.json()
            
            results = []
            for item in data.get('search', []):
                result = {
                    'wikidata_id': item.get('id'),
                    'label': item.get('label'),
                    'description': item.get('description', ''),
                }
                results.append(result)
            
            return Response(results)
        except Exception as e:
            return Response({"error": str(e)}, status=status.HTTP_500_INTERNAL_SERVER_ERROR)
    
    @action(detail=False, methods=['get'], url_path='get_wikidata_properties')
    def get_wikidata_properties(self, request):
        entity_id = request.query_params.get('entity_id')
        if not entity_id:
            return Response({"error": "Entity ID is required"}, status=status.HTTP_400_BAD_REQUEST)
        
        url = 'https://www.wikidata.org/w/api.php'
        params = {
            'action': 'wbgetclaims',
            'entity': entity_id,
            'format': 'json',
            'limit': 50,
        }
        
        try:
            response = requests.get(url, params=params)
            data = response.json()
            
            properties = []
            for prop_id, claims in data.get('claims', {}).items():
                if claims:
                    prop_url = 'https://www.wikidata.org/w/api.php'
                    prop_params = {
                        'action': 'wbgetentities',
                        'ids': prop_id,
                        'languages': 'en',
                        'format': 'json',
                    }
                    prop_response = requests.get(prop_url, params=prop_params)
                    prop_data = prop_response.json()
                    
                    prop_label = prop_data.get('entities', {}).get(prop_id, {}).get('labels', {}).get('en', {}).get('value', prop_id)
                    
                    property_info = {
                        'wikidata_id': prop_id,
                        'label': prop_label,
                        'values': [claim.get('mainsnak', {}).get('datavalue', {}).get('value', {}) for claim in claims]
                    }
                    properties.append(property_info)
            
            return Response(properties)
        except Exception as e:
            return Response({"error": str(e)}, status=status.HTTP_500_INTERNAL_SERVER_ERROR)
    
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

    @action(detail=True, methods=['get'])
    def nodes(self, request, pk=None):
        space = self.get_object()
        nodes = Node.objects.filter(space=space)
        serializer = NodeSerializer(nodes, many=True)
        return Response(serializer.data)

    @action(detail=True, methods=['get'])
    def edges(self, request, pk=None):
        try:
            space = self.get_object()
            edges = Edge.objects.filter(
                Q(source_node__space=space) | Q(target_node__space=space)
            ).select_related('source_node', 'target_node')
            
            serializer = EdgeSerializer(edges, many=True)
            return Response(serializer.data)
        except Space.DoesNotExist:
            return Response(
                {"detail": "Space not found."},
                status=status.HTTP_404_NOT_FOUND
            )
        except Exception as e:
            return Response(
                {"detail": str(e)},
                status=status.HTTP_500_INTERNAL_SERVER_ERROR
            )

class TagViewSet(viewsets.ModelViewSet):
    queryset = Tag.objects.all()
    serializer_class = TagSerializer
    permission_classes = [permissions.IsAuthenticated]

class NodeViewSet(viewsets.ModelViewSet):
    queryset = Node.objects.all()
    serializer_class = NodeSerializer
    permission_classes = [permissions.IsAuthenticated]
    
    def get_queryset(self):
        space_id = self.request.query_params.get('space_id')
        if space_id:
            return Node.objects.filter(space_id=space_id)
        return Node.objects.none()
    
    def perform_create(self, serializer):
        serializer.save(creator=self.request.user)
    
    @action(detail=True, methods=['post'])
    def create_edge(self, request, pk=None):
        source_node_id = request.data.get('source_node_id')
        target_node_id = request.data.get('target_node_id')
        property_wikidata_id = request.data.get('property_wikidata_id')
        
        if not source_node_id or not target_node_id or not property_wikidata_id:
            return Response(
                {"error": "Source node ID, target node ID, and property Wikidata ID are required"},
                status=status.HTTP_400_BAD_REQUEST
            )
        
        try:
            source_node = Node.objects.get(id=source_node_id)
            target_node = Node.objects.get(id=target_node_id, space=source_node.space)
        except Node.DoesNotExist:
            return Response(
                {"error": "Source or target node not found in the same space"},
                status=status.HTTP_404_NOT_FOUND
            )
        
        edge = Edge.objects.create(
            source_node=source_node,
            target_node=target_node,
            property_wikidata_id=property_wikidata_id
        )
        
        serializer = EdgeSerializer(edge)
        return Response(serializer.data)