from django.db import models

class Support(models.Model):
    question = models.ForeignKey(
        "question.Question", related_name="supports", on_delete=models.CASCADE, null=True, blank=True
    )
    name = models.CharField(max_length=20)
    horizontal_reaction = models.IntegerField(default=0)
    vertical_reaction = models.IntegerField(null=True, blank=True)
    slope = models.IntegerField(default=0)
    deflection = models.IntegerField(default=0)
    left_half_vertical_reaction = models.IntegerField(null=True, blank=True)
    right_half_vertical_reaction = models.IntegerField(null=True, blank=True)
    horizontal_distance_from_left_end_origin = models.IntegerField()
    vertical_distance_from_left_end_origin = models.IntegerField(default=0)

    def __str__(self):
        return f"{self.id} - {self.name}"

    def save(self, *args, **kwargs):
        left = self.left_half_vertical_reaction or 0
        right = self.right_half_vertical_reaction or 0
        self.vertical_reaction = left + right

        super().save(*args, **kwargs)