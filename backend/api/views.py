from rest_framework.decorators import api_view, permission_classes
from rest_framework.permissions import AllowAny
from rest_framework.response import Response
from .models import Space
from .serializers import  RegisterSerializer, SpaceSerializer
from rest_framework import viewsets, permissions, status
from rest_framework.response import Response
from django.contrib.auth import authenticate
from rest_framework_simplejwt.tokens import RefreshToken


@api_view(['POST'])
@permission_classes([AllowAny])
def register(request):
    serializer = RegisterSerializer(data=request.data)
    if serializer.is_valid():
        print('req.data', request.data)
        serializer.save()
        return Response({"message": "User registered successfully"}, status=201)
    return Response(serializer.errors, status=400)

@api_view(['POST'])
@permission_classes([AllowAny])
def login(request):
    username = request.data.get('username')
    password = request.data.get('password')

    user = authenticate(request, username=username, password=password)
    
    print(user)
    if user:
        refresh = RefreshToken.for_user(user)
        return Response({
            "message": "Login successful",
            "token": str(refresh.access_token),
        })
    else:
        return Response({"message": "Invalid credentials"}, status=400)

@api_view(['POST'])
def logout(request):
    request.session.flush()
    return Response({"message": "Logged out successfully"}, status=200)


class SpaceViewSet(viewsets.ModelViewSet):
    queryset = Space.objects.all()
    serializer_class = SpaceSerializer
    permission_classes = [permissions.IsAuthenticated]
    
    def get_queryset(self):
        # Users can see all spaces, but we could restrict this if needed
        return Space.objects.all()
    
    def perform_create(self, serializer):
        # Automatically assign the current u2ser as the owner
        serializer.save(owner=self.request.user)
    
    def create(self, request, *args, **kwargs):
        serializer = self.get_serializer(data=request.data)
        if serializer.is_valid():
            self.perform_create(serializer)
            return Response(serializer.data, status=status.HTTP_201_CREATED)
        return Response(serializer.errors, status=status.HTTP_400_BAD_REQUEST)