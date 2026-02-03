from rest_framework import serializers

from span.serializers import SpanSerializer
from support.serializers import SupportSerializer
from load.serializers import LoadSerializer
from .models import Question
from support.models import Support
from load.models import Load
from span.models import Span


class QuestionSerializer(serializers.ModelSerializer):
    supports = SupportSerializer(many=True)
    spans = SpanSerializer(many=True)
    loads = LoadSerializer(many=True)

    class Meta:
        model = Question
        fields = ["id", "title", "supports", "spans", "loads"]

    def create(self, validated_data):
        supports_data = validated_data.pop("supports", [])
        spans_data = validated_data.pop("spans", [])
        loads_data = validated_data.pop("loads", [])

        question = Question.objects.create(**validated_data)

        supports = [
            Support.objects.create(question=question, **s)
            for s in supports_data
        ]

        spans = [
            Span.objects.create(question=question, **s)
            for s in spans_data
        ]

        loads = [
            Load.objects.create(question=question, **l)
            for l in loads_data
        ]

        # You now have IDs
        support_ids = [s.id for s in supports]
        span_ids = [s.id for s in spans]
        load_ids = [l.id for l in loads]


        return question
