from django.db import models

from django.db import models

class Question(models.Model):
    title = models.CharField(max_length=100, blank=True)

    def save(self, *args, **kwargs):
        if not self.title:
            last_id = Question.objects.count() + 1
            self.title = f"Q{last_id}"
        super().save(*args, **kwargs)
