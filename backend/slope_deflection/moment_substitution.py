"""
Step 4: Substituting solved slopes into moment equations
Evaluates moment equations with actual slope values to get numerical moments
"""
import re

def substitute_slopes_in_moments(fem_results, slopes, span_objs):
    """
    Substitute solved slope values into moment equations.
    
    Args:
        fem_results: Dictionary with span results including moment equations
        slopes: Dictionary of solved slope values {theta_var: value}
        span_objs: Dictionary mapping span_id to Django span objects
    
    Returns:
        Updated fem_results with moment_left and moment_right calculated
    """
    print(f"\n[ANALYSIS] ===== STEP 4: SUBSTITUTING SLOPES INTO MOMENT EQUATIONS =====")
    
    for span_id, span_result in fem_results.items():
        span_obj = span_objs[span_id]
        print(f"\n[ANALYSIS] Substituting slopes for Span {span_id}...")
        
        moment_left_eqn = span_result.get('moment_left_eqn', '0')
        moment_right_eqn = span_result.get('moment_right_eqn', '0')
        
        print(f"  Left equation: {moment_left_eqn}")
        print(f"  Right equation: {moment_right_eqn}")
        
        try:
            # Create a safe namespace for evaluation with slope values
            eval_namespace = slopes.copy()
            
            # Extract all theta variables from equations
            all_theta_vars = set()
            for eqn in [moment_left_eqn, moment_right_eqn]:
                all_theta_vars.update(re.findall(r'theta_[\w\-]+', eqn))
            
            print(f"  Found theta variables: {all_theta_vars}")
            print(f"  Available slopes: {list(slopes.keys())}")
            
            # Evaluate left equation
            if moment_left_eqn != '0':
                moment_left_value = eval(moment_left_eqn, {"__builtins__": {}}, eval_namespace)
            else:
                moment_left_value = 0
            
            # Evaluate right equation
            if moment_right_eqn != '0':
                moment_right_value = eval(moment_right_eqn, {"__builtins__": {}}, eval_namespace)
            else:
                moment_right_value = 0
            
            print(f"  Moment left: {moment_left_value}")
            print(f"  Moment right: {moment_right_value}")
            
            # Save to span results
            span_result['moment_left'] = moment_left_value
            span_result['moment_right'] = moment_right_value
            
            # Update Django model instances
            span_obj.moment_left = moment_left_value
            span_obj.moment_right = moment_right_value
            
        except Exception as e:
            print(f"  [ERROR] Failed to evaluate moment equations: {str(e)}")
            span_result['moment_left'] = 0
            span_result['moment_right'] = 0
            span_obj.moment_left = 0
            span_obj.moment_right = 0
    
    return fem_results
