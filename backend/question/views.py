from django.shortcuts import render
from rest_framework import generics
from rest_framework.response import Response
import traceback
from .serializers import QuestionSerializer
from span.models import Span
from support.models import Support
from load.models import Load
from slope_deflection.analysis import perform_structural_analysis


class ReceiveQuestion(generics.CreateAPIView):
    serializer_class = QuestionSerializer

    def perform_create(self, serializer):
        # Store the analysis results to return in create_response
        self.analysis_results = None
        print("\n" + "="*80)
        print("BACKEND ANALYSIS STARTED")
        print("="*80)
        
        question = serializer.save()
        print(f"\n[DEBUG] Question created with ID: {question.id}")

        # 🔥 IDs are now available
        support_ids = list(question.supports.values_list("id", flat=True))
        span_ids = list(question.spans.values_list("id", flat=True))
        load_ids = list(question.loads.values_list("id", flat=True))

        print(f"\n[DEBUG] Support IDs: {support_ids}")
        print(f"[DEBUG] Span IDs: {span_ids}")
        print(f"[DEBUG] Load IDs: {load_ids}")

        spans = Span.objects.filter(id__in=span_ids)
        supports = Support.objects.filter(id__in=support_ids)
        loads = Load.objects.filter(id__in=load_ids)

        print(f"\n[DEBUG] ===== SPANS DATA =====")
        for span in spans:
            print(f"  Span ID {span.id}: length={span.length}, axis={span.axis}, "
                  f"h_dist={span.horizontal_distance_from_left_end_origin}, "
                  f"v_dist={span.vertical_distance_from_left_end_origin}, "
                  f"EI={getattr(span, 'ei', 'N/A')}")

        print(f"\n[DEBUG] ===== SUPPORTS DATA =====")
        for support in supports:
            print(f"  Support ID {support.id}: type={support.name}, "
                  f"h_dist={support.horizontal_distance_from_left_end_origin}, "
                  f"v_dist={support.vertical_distance_from_left_end_origin}, "
                  f"deflection={getattr(support, 'deflection', 0)}")

        print(f"\n[DEBUG] ===== LOADS DATA =====")
        for load in loads:
            print(f"  Load ID {load.id}: type={load.name}, axis={load.axis}, "
                  f"h_dist={load.horizontal_distance_from_left_end_origin}, "
                  f"v_dist={load.vertical_distance_from_left_end_origin}, "
                  f"magnitude={getattr(load, 'point_load_magnitude', getattr(load, 'load_per_distance', 'N/A'))}")

        try:
            print(f"\n[DEBUG] Calling perform_structural_analysis()...")
            analysis_results = perform_structural_analysis(
                spans=spans,
                supports=supports,
                loads=loads
            )

            print(f"\n[DEBUG] ===== ANALYSIS RESULTS =====")
            print(f"[DEBUG] Status: {analysis_results.get('status', 'Unknown')}")
            
            if analysis_results.get('status') == 'error':
                print(f"[DEBUG] Error: {analysis_results.get('error_trace', 'No trace')}")

            print(f"\n[DEBUG] Span results:")
            for span_id, span_data in analysis_results.get('spans', {}).items():
                print(f"  Span {span_id}: moment_left={span_data.get('moment_left')}, "
                      f"moment_right={span_data.get('moment_right')}, "
                      f"shear_left={span_data.get('shear_left')}, "
                      f"shear_right={span_data.get('shear_right')}")

            print(f"\n[DEBUG] Support results:")
            for support_id, support_data in analysis_results.get('supports', {}).items():
                print(f"  Support {support_id}: reaction_v={support_data.get('reaction_vertical')}, "
                      f"reaction_h={support_data.get('reaction_horizontal')}, "
                      f"reaction_m={support_data.get('reaction_moment')}")

            if analysis_results['status'] == 'success':
                print(f"\n[DEBUG] Saving results to database...")
                for span_id, span_data in analysis_results['spans'].items():
                    # print(span_data)
                    span = Span.objects.get(id=span_id)
                    span.moment_left = span_data.get('moment_left', 0)
                    span.moment_right = span_data.get('moment_right', 0)
                    span.shear_left = span_data.get('shear_left', 0)
                    span.shear_right = span_data.get('shear_right', 0)
                    span.save()
                    print(f"  ✓ Saved Span {span_id}")

                for support_id, support_data in analysis_results['supports'].items():
                    support = Support.objects.get(id=support_id)
                    support.reaction_vertical = support_data.get('reaction_vertical', 0)
                    support.reaction_horizontal = support_data.get('reaction_horizontal', 0)
                    support.reaction_moment = support_data.get('reaction_moment', 0)
                    support.save()
                    print(f"  ✓ Saved Support {support_id}")

                question.analysis_status = 'completed'
                question.save()
                print(f"\n[DEBUG] Analysis completed and saved successfully!")
                # Store results to send back to frontend
                self.analysis_results = analysis_results

        except Exception as e:
            print(f"\n[ERROR] Exception occurred during analysis:")
            print(f"[ERROR] {str(e)}")
            print(f"[ERROR] Traceback:")
            print(traceback.format_exc())
            
            question.analysis_status = f'error: {str(e)}'
            question.save()
        
        print("\n" + "="*80)
        print("BACKEND ANALYSIS FINISHED")
        print("="*80 + "\n")

    def create(self, request, *args, **kwargs):
        response = super().create(request, *args, **kwargs)
        # Add analysis results to response with all fields properly included
        if hasattr(self, 'analysis_results') and self.analysis_results:
            print(f"\n[DEBUG] Preparing analysis results for response...")
            
            # Get span objects to fetch span properties
            span_id_strings = list(self.analysis_results.get('spans', {}).keys())
            span_ids = [int(sid) for sid in span_id_strings]  # Convert strings to ints
            spans_dict = {span.id: span for span in Span.objects.filter(id__in=span_ids)}
            print(f"[DEBUG] Fetching spans with IDs: {span_ids}")
            print(f"[DEBUG] Found {len(spans_dict)} spans from database")
            
            analysis_data = {
                'status': self.analysis_results.get('status'),
                'spans': {},
                'supports': {}
            }
            
            # Include all span data with loads details
            for span_id_str, span_data in self.analysis_results.get('spans', {}).items():
                span_id_int = int(span_id_str)
                span_obj = spans_dict.get(span_id_int)
                print(f"[DEBUG] Processing span {span_id_int}: span_obj={'found' if span_obj else 'NOT FOUND'}")
                analysis_data['spans'][str(span_id_int)] = {
                    'fem_left': span_data.get('fem_left'),
                    'fem_right': span_data.get('fem_right'),
                    'moment_left_eqn': span_data.get('moment_left_eqn'),
                    'moment_right_eqn': span_data.get('moment_right_eqn'),
                    'moment_left': span_data.get('moment_left'),
                    'moment_right': span_data.get('moment_right'),
                    'shear_left': span_data.get('shear_left'),
                    'shear_right': span_data.get('shear_right'),
                    'length': span_obj.length if span_obj else None,
                    'horizontal_distance_from_left_end_origin': span_obj.horizontal_distance_from_left_end_origin if span_obj else None,
                    'vertical_distance_from_left_end_origin': span_obj.vertical_distance_from_left_end_origin if span_obj else None,
                    'axis': span_obj.axis if span_obj else None,
                    'ei': getattr(span_obj, 'ei', None) if span_obj else None,
                    'loads_on_span': [
                        {
                            'name': load.get('name'),
                            'axis': load.get('axis'),
                            'horizontal_distance_from_left_end_origin': load.get('horizontal_distance_from_left_end_origin'),
                            'vertical_distance_from_left_end_origin': load.get('vertical_distance_from_left_end_origin'),
                            'point_load_magnitude': load.get('point_load_magnitude'),
                            'load_per_distance': load.get('load_per_distance'),
                            'load_span': load.get('load_span'),
                            'left_load_per_distance': load.get('left_load_per_distance'),
                            'right_load_per_distance': load.get('right_load_per_distance'),
                        }
                        for load in span_data.get('loads_on_span', [])
                    ]
                }
            
            # Include all support reaction data
            support_id_strings = list(self.analysis_results.get('supports', {}).keys())
            support_ids = [int(sid) for sid in support_id_strings]  # Convert strings to ints
            supports_dict = {support.id: support for support in Support.objects.filter(id__in=support_ids)}
            print(f"[DEBUG] Fetching supports with IDs: {support_ids}")
            print(f"[DEBUG] Found {len(supports_dict)} supports from database")
            
            for support_id_str, support_data in self.analysis_results.get('supports', {}).items():
                support_id_int = int(support_id_str)
                support_obj = supports_dict.get(support_id_int)
                print(f"[DEBUG] Processing support {support_id_int}: support_obj={'found' if support_obj else 'NOT FOUND'}")
                analysis_data['supports'][str(support_id_int)] = {
                    'id': support_data.get('id'),
                    'reaction_vertical': support_data.get('reaction_vertical'),
                    'reaction_horizontal': support_data.get('reaction_horizontal'),
                    'reaction_moment': support_data.get('reaction_moment'),
                    'deflection': support_obj.deflection if support_obj else None,
                }
            
            response.data['analysis_results'] = analysis_data
            print(f"\n[DEBUG] Analysis results added to response")
        return response
