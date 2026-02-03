from django.db import models

class Load(models.Model):
    question = models.ForeignKey(
        "question.Question", related_name="loads", on_delete=models.CASCADE, null=True, blank=True
    )
    name = models.CharField(max_length=100)
    point_load_magnitude = models.IntegerField(null=True, blank=True)
    load_span = models.IntegerField(null=True, blank=True)
    load_per_distance = models.IntegerField(null=True, blank=True)
    left_load_per_distance = models.IntegerField(null=True, blank=True)
    right_load_per_distance = models.IntegerField(null=True, blank=True)
    axis = models.CharField(max_length=10, default="-y")
    horizontal_distance_from_left_end_origin = models.IntegerField()
    vertical_distance_from_left_end_origin = models.IntegerField(default=0) 