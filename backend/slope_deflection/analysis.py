"""
Main analysis orchestrator using slope-deflection method
Works with Django model instances
"""
from .fem_calculator import get_loads_on_span, calculate_fem_for_span
from .slope_deflection_solver import SlopeDeflectionSolver
from .reaction_calculator import calculate_reactions
from .moment_equilibrium import MomentEquilibriumSolver
from .moment_substitution import substitute_slopes_in_moments

def model_to_dict(model_instance):
    """Convert Django model instance to dictionary for analysis"""
    if hasattr(model_instance, '__dict__'):
        data = model_instance.__dict__.copy()
        data.pop('_state', None)
        return data
    return model_instance


def perform_structural_analysis(spans, supports, loads):
    """
    Perform complete structural analysis using slope-deflection method.
    Works with Django ORM querysets/instances.
    """
    results = {
        'spans': {},
        'supports': {},
        'status': 'success'
    }
    
    try:
        print("\n[ANALYSIS] Converting models to dictionaries...")
        spans_data = [model_to_dict(s) for s in spans]
        supports_data = [model_to_dict(s) for s in supports]
        loads_data = [model_to_dict(l) for l in loads]
        print(f"[ANALYSIS] Converted {len(spans_data)} spans, {len(supports_data)} supports, {len(loads_data)} loads")
        
        # Step 1: Calculate FEM for each span
        print(f"\n[ANALYSIS] ===== STEP 1: CALCULATING FEM =====")
        fem_results = {}
        span_objs = {}
        
        for span_obj, span_dict in zip(spans, spans_data):
            print(f"\n[ANALYSIS] Processing Span {span_obj.id}...")
            span_objs[span_obj.id] = span_obj
            
            loads_on_span = get_loads_on_span(span_dict, loads_data)
            fem_left, fem_right = calculate_fem_for_span(span_dict, loads_on_span)
            
            print(f"  FEM result: fem_left={fem_left}, fem_right={fem_right}")
            
            fem_results[span_obj.id] = {
                'fem_left': fem_left,
                'fem_right': fem_right,
                'loads_on_span': loads_on_span
            }
        
        # Step 2: Create moment equations using slope-deflection
        print(f"\n[ANALYSIS] ===== STEP 2: CREATING MOMENT EQUATIONS =====")
        solver = SlopeDeflectionSolver(spans_data, supports_data, loads_data)
        moment_equations = solver.solve(fem_results)
        
        for span_id, eqn_result in moment_equations.items():
            fem_results[span_id].update(eqn_result)
        
        # Step 3: MOMENT EQUILIBRIUM & SLOPE SOLVING
        print(f"\n[ANALYSIS] ===== STEP 3: MOMENT EQUILIBRIUM & SLOPE SOLVING =====")
        equilibrium_solver = MomentEquilibriumSolver(spans_data, supports_data)
        equilibrium_solver.detect_joints()
        equilibrium_eqns = equilibrium_solver.create_equilibrium_equations(moment_equations)
        slopes = equilibrium_solver.solve_for_slopes(equilibrium_eqns)
        print(f"[ANALYSIS] Solved slopes: {slopes}")
        
        # Step 4: Substitute slopes into moment equations
        print(f"\n[ANALYSIS] ===== STEP 4: SUBSTITUTING SLOPES INTO MOMENT EQUATIONS =====")
        fem_results = substitute_slopes_in_moments(fem_results, slopes, span_objs)
        
        results['spans'] = fem_results
        
        # Step 5: Calculate reactions
        print(f"\n[ANALYSIS] ===== STEP 5: CALCULATING REACTIONS =====")
        for span_id, span_result in results['spans'].items():
            print(f"\n[ANALYSIS] Calculating reactions for Span {span_id}...")
            span_obj = span_objs[span_id]
            span_dict = next(s for s in spans_data if s.get('id') == span_id)
            loads_on_span = span_result['loads_on_span']
            
            v_left, v_right = calculate_reactions(
                span_dict,
                loads_on_span,
                span_result['moment_left'],
                span_result['moment_right']
            )
            
            span_result['shear_left'] = v_left
            span_result['shear_right'] = v_right
        
        # Step 6: Aggregate reactions at supports
        print(f"\n[ANALYSIS] ===== STEP 6: AGGREGATING SUPPORT REACTIONS =====")
        support_reactions = {}
        for support_obj in supports:
            h = getattr(support_obj, 'horizontal_distance_from_left_end_origin', 0)
            v = getattr(support_obj, 'vertical_distance_from_left_end_origin', 0)
            print(f"\n[ANALYSIS] Processing Support {support_obj.id} at h={h}, v={v}...")
            support_reactions[support_obj.id] = {
                'id': support_obj.id,
                'reaction_vertical': 0,
                'reaction_horizontal': 0,
                'reaction_moment': 0,
                'deflection': getattr(support_obj, 'deflection', 0)
            }
        
        for span_id, span_result in results['spans'].items():
            span_obj = span_objs[span_id]
            span_h = getattr(span_obj, 'horizontal_distance_from_left_end_origin', 0)
            span_v = getattr(span_obj, 'vertical_distance_from_left_end_origin', 0)
            
            for support_id, support_result in support_reactions.items():
                support_obj = next(s for s in supports if s.id == support_id)
                support_h = getattr(support_obj, 'horizontal_distance_from_left_end_origin', 0)
                support_v = getattr(support_obj, 'vertical_distance_from_left_end_origin', 0)
                
                if span_h == support_h and span_v == support_v:
                    print(f"  ✓ Span {span_id} left end matches Support {support_id}")
                    support_result['reaction_vertical'] += span_result['shear_left']
        
        results['supports'] = support_reactions
        
        # Convert integer keys to strings for JSON serialization
        print(f"\n[ANALYSIS] Converting integer keys to strings for JSON serialization...")
        stringified_spans = {}
        for span_id, span_data in results['spans'].items():
            stringified_spans[str(span_id)] = span_data
        
        stringified_supports = {}
        for support_id, support_data in results['supports'].items():
            stringified_supports[str(support_id)] = support_data
        
        results['spans'] = stringified_spans
        results['supports'] = stringified_supports
        
        print(f"\n[ANALYSIS] ===== ANALYSIS COMPLETE =====")
        return results
    
    except Exception as e:
        print(f"\n[ANALYSIS ERROR] Exception: {str(e)}")
        import traceback
        print(traceback.format_exc())
        results['status'] = f'error: {str(e)}'
        return results
