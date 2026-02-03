from django.urls import path

from .views import ReceiveQuestion

urlpatterns = [
    path("", ReceiveQuestion.as_view(), name="receive-question"),
]