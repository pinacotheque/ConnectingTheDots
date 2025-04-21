from rest_framework import serializers
from .models import User, Space, Tag
from django.contrib.auth.hashers import make_password, check_password

class RegisterSerializer(serializers.ModelSerializer):
    email = serializers.EmailField(required=True)
    username = serializers.CharField(required=True, min_length=3)
    password = serializers.CharField(write_only=True, style={'input_type': 'password'})

    class Meta:
        model = User
        fields = ["id", "username", "email", "password"]

    def validate_username(self, value):
        if User.objects.filter(username=value).exists():
            raise serializers.ValidationError("Username is already taken.")
        return value

    def validate_email(self, value):
        if User.objects.filter(email=value).exists():
            raise serializers.ValidationError("Email is already registered.")
        return value

    def create(self, validated_data):
        validated_data["password"] = make_password(validated_data["password"])
        return super().create(validated_data)

class LoginSerializer(serializers.Serializer):
    username = serializers.CharField(required=True)
    password = serializers.CharField(write_only=True, required=True, style={'input_type': 'password'})

    def validate(self, data):
        username = data.get("username")
        password = data.get("password")

        try:
            user = User.objects.get(username=username)
        except User.DoesNotExist:
            raise serializers.ValidationError("Invalid username or password.")

        if not check_password(password, user.password):
            raise serializers.ValidationError("Invalid username or password.")

        return {"id": user.id, "username": user.username, "email": user.email} 


class UserSerializer(serializers.ModelSerializer):
    class Meta:
        model = User
        fields = ["id", "username", "email"]


class TagSerializer(serializers.ModelSerializer):
    class Meta:
        model = Tag
        fields = ['id', 'name']

class SpaceSerializer(serializers.ModelSerializer):
    tags = TagSerializer(many=True, required=False)
    
    class Meta:
        model = Space
        fields = ['id', 'title', 'description', 'created_at', 'updated_at', 'owner', 'tags']
        read_only_fields = ['owner', 'created_at', 'updated_at']
    
    def create(self, validated_data):
        tags_data = validated_data.pop('tags', [])
        space = Space.objects.create(**validated_data)
        
        # Process tags
        for tag_data in tags_data:
            tag_name = tag_data.get('name')
            tag, _ = Tag.objects.get_or_create(name=tag_name)
            space.tags.add(tag)
            
        return space