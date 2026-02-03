from django.db import models

class Span(models.Model):
    question = models.ForeignKey(
        "question.Question", related_name="spans", on_delete=models.CASCADE, null=True, blank=True
    )
    length = models.IntegerField()
    ei = models.IntegerField(default=1)
    axis = models.CharField(max_length=20)
    fem_left = models.IntegerField(null=True, blank=True)
    fem_right = models.IntegerField(null=True, blank=True)
    shear_left = models.IntegerField(null=True, blank=True)
    shear_right = models.IntegerField(null=True, blank=True)
    moment_left = models.IntegerField(null=True, blank=True)
    moment_right = models.IntegerField(null=True, blank=True)
    moment_left_eqn = models.CharField(max_length=200,null=True, blank=True)
    moment_right_eqn = models.CharField(max_length=200,null=True, blank=True)
    horizontal_distance_from_left_end_origin = models.IntegerField()
    vertical_distance_from_left_end_origin = models.IntegerField(default=0)