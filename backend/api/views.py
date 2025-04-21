from rest_framework.decorators import api_view, permission_classes
from rest_framework.permissions import AllowAny
from rest_framework.response import Response
from django.contrib.auth.hashers import check_password
from .models import User, Space
from .serializers import LoginSerializer, RegisterSerializer, SpaceSerializer
from rest_framework import viewsets, permissions, status
from rest_framework.response import Response

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

    try:
        user = User.objects.get(username=username)
        if check_password(password, user.password):
            request.session['user_id'] = user.id
            return Response({"message": "Login successful"}, status=200)
        else:
            return Response({"message": "Invalid credentials"}, status=400)
    except User.DoesNotExist:
        return Response({"message": "User not found"}, status=404)

@api_view(['POST'])
def logout(request):
    request.session.flush()  # Clear session
    return Response({"message": "Logged out successfully"}, status=200)


class SpaceViewSet(viewsets.ModelViewSet):
    queryset = Space.objects.all()
    serializer_class = SpaceSerializer
    permission_classes = [permissions.IsAuthenticated]
    
    def get_queryset(self):
        # Users can see all spaces, but we could restrict this if needed
        return Space.objects.all()
    
    def perform_create(self, serializer):
        # Automatically assign the current user as the owner
        serializer.save(owner=self.request.user)
    
    def create(self, request, *args, **kwargs):
        serializer = self.get_serializer(data=request.data)
        if serializer.is_valid():
            self.perform_create(serializer)
            return Response(serializer.data, status=status.HTTP_201_CREATED)
        return Response(serializer.errors, status=status.HTTP_400_BAD_REQUEST)