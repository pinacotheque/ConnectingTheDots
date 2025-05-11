from django.db import models
from django.contrib.auth.models import User


class Tag(models.Model):
    name = models.CharField(max_length=100)
    wikidata_id = models.CharField(max_length=20, unique=True)
    description = models.TextField(blank=True, null=True)
    
    def __str__(self):
        return self.name

class Space(models.Model):
    title = models.CharField(max_length=200)
    description = models.TextField()
    owner = models.ForeignKey(User, on_delete=models.CASCADE, related_name='owned_spaces')
    contributors = models.ManyToManyField(User, related_name='contributed_spaces', blank=True)
    tags = models.ManyToManyField(Tag, blank=True)
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)
    
    def __str__(self):
        return self.title
    
    class Meta:
        ordering = ['-created_at']

class Node(models.Model):
    space = models.ForeignKey(Space, on_delete=models.CASCADE, related_name='nodes')
    creator = models.ForeignKey(User, on_delete=models.CASCADE, related_name='created_nodes')
    wikidata_id = models.CharField(max_length=20)
    label = models.CharField(max_length=200)
    description = models.TextField(blank=True, null=True)
    properties = models.JSONField(default=dict)  # Store selected Wikidata properties
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)

    def __str__(self):
        return f"{self.label} ({self.wikidata_id})"

    class Meta:
        ordering = ['-created_at']

class Edge(models.Model):
    source_node = models.ForeignKey(Node, on_delete=models.CASCADE, related_name='outgoing_edges')
    target_node = models.ForeignKey(Node, on_delete=models.CASCADE, related_name='incoming_edges')
    property_wikidata_id = models.CharField(max_length=20)  # The Wikidata property ID that defines this relationship
    created_at = models.DateTimeField(auto_now_add=True)

    class Meta:
        unique_together = ('source_node', 'target_node', 'property_wikidata_id')
        ordering = ['-created_at']

    def __str__(self):
        return f"{self.source_node} -> {self.target_node} ({self.property_wikidata_id})"