from django.urls import path
from . import views


urlpatterns = [
    path('', views.home, name='hunyo-home'),
    path('about/', views.about, name='hunyo-about'),
]