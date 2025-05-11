from rest_framework import serializers
from .models import Space, Tag, Node, Edge
from django.contrib.auth.hashers import make_password, check_password
from django.contrib.auth.models import User

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
        fields = ('id', 'username', 'email')


class TagSerializer(serializers.ModelSerializer):
    class Meta:
        model = Tag
        fields = ('id', 'name', 'wikidata_id', 'description')

class NodeSerializer(serializers.ModelSerializer):
    creator = UserSerializer(read_only=True)
    
    class Meta:
        model = Node
        fields = ('id', 'space', 'creator', 'wikidata_id', 'label', 'description', 
                 'properties', 'created_at', 'updated_at')
        read_only_fields = ('creator',)

class EdgeSerializer(serializers.ModelSerializer):
    source_node = NodeSerializer(read_only=True)
    target_node = NodeSerializer(read_only=True)
    
    class Meta:
        model = Edge
        fields = ('id', 'source_node', 'target_node', 'property_wikidata_id', 'created_at')
        read_only_fields = ('source_node', 'target_node')

class SpaceSerializer(serializers.ModelSerializer):
    owner = UserSerializer(read_only=True)
    contributors = UserSerializer(many=True, read_only=True)
    tags = TagSerializer(many=True, read_only=True)
    nodes = NodeSerializer(many=True, read_only=True)
    is_owner = serializers.SerializerMethodField()
    is_contributor = serializers.SerializerMethodField()
    
    class Meta:
        model = Space
        fields = ('id', 'title', 'description', 'owner', 'contributors', 'tags', 
                 'nodes', 'created_at', 'updated_at', 'is_owner', 'is_contributor')
        read_only_fields = ('owner', 'contributors', 'nodes')
    
    def get_is_owner(self, obj):
        request = self.context.get('request')
        if request and request.user.is_authenticated:
            return obj.owner == request.user
        return False
    
    def get_is_contributor(self, obj):
        request = self.context.get('request')
        if request and request.user.is_authenticated:
            return request.user in obj.contributors.all()
        return False
    
    def create(self, validated_data):
        request = self.context.get('request')
        if not request or not request.user.is_authenticated:
            raise serializers.ValidationError("User must be authenticated to create a space")
        
        space = Space.objects.create(
            owner=request.user,
            title=validated_data.get('title'),
            description=validated_data.get('description')
        )
        
        tag_ids = self.context.get('tag_ids', [])
        if tag_ids:
            tags = Tag.objects.filter(id__in=tag_ids)
            space.tags.add(*tags)
        
        return space
    
    def update(self, instance, validated_data):
        tag_ids = validated_data.pop('tag_ids', None)
        
        instance.title = validated_data.get('title', instance.title)
        instance.description = validated_data.get('description', instance.description)
        instance.save()
        
        if tag_ids is not None:
            instance.tags.clear()
            tags = Tag.objects.filter(id__in=tag_ids)
            instance.tags.add(*tags)
            
        return instance