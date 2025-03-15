from django.db import models
from django.contrib.auth.models import User


class User(models.Model):
    username = models.CharField(max_length=150, unique=True)
    email = models.EmailField(unique=True)
    password = models.CharField(max_length=255)
    def __str__(self):
        return self.username

class Space(models.Model):
    name = models.CharField(max_length=255)
    description = models.TextField()
    contributors = models.ManyToManyField(User, related_name="spaces")
