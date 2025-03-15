from rest_framework.decorators import api_view, permission_classes
from rest_framework.permissions import AllowAny
from rest_framework.response import Response
from django.contrib.auth.hashers import check_password
from .models import User
from .serializers import LoginSerializer, RegisterSerializer

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
            request.session['user_id'] = user.id  # Store user ID in session
            return Response({"message": "Login successful"}, status=200)
        else:
            return Response({"message": "Invalid credentials"}, status=400)
    except User.DoesNotExist:
        return Response({"message": "User not found"}, status=404)

@api_view(['POST'])
@permission_classes([AllowAny])
def login(request):
    serializer = LoginSerializer(data=request.data)
    if serializer.is_valid():
        request.session['user_id'] = serializer.validated_data['id']  # Store user session
        return Response({"message": "Login successful", "user": serializer.validated_data}, status=200)
    return Response(serializer.errors, status=400)



@api_view(['POST'])
def logout(request):
    request.session.flush()  # Clear session
    return Response({"message": "Logged out successfully"}, status=200)
