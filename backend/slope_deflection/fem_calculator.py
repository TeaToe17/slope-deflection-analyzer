"""
Fixed End Moments (FEM) Calculator
Calculates FEM for different load types using standard formulas
"""
from math import pi


def get_loads_on_span(span, loads):
    """
    Get all loads that fall within a given span.
    - UDL: axis must match span axis (load is along that axis)
    - Point Load: only check position, axis is direction of action not location
    """
    print(f"\n    [FEM] Getting loads for span at h={span.get('horizontal_distance_from_left_end_origin')}, v={span.get('vertical_distance_from_left_end_origin')}, axis={span.get('axis')}")
    loads_on_span = []
    
    span_h_start = span.get('horizontal_distance_from_left_end_origin', 0)
    span_v_start = span.get('vertical_distance_from_left_end_origin', 0)
    span_axis = span.get('axis')
    span_length = span.get('length', 0)
    
    # Calculate span endpoints
    if span_axis in ['x']:
        span_h_end = span_h_start + span_length
        span_v_end = span_v_start
    elif span_axis in ['-x']:
        span_h_end = span_h_start - span_length
        span_v_end = span_v_start
    elif span_axis in ['y']:
        span_h_end = span_h_start
        span_v_end = span_v_start + span_length
    elif span_axis in ['-y']:
        span_h_end = span_h_start
        span_v_end = span_v_start - span_length
    else:
        print(f"      [FEM] ERROR: Unknown span axis {span_axis}")
        return []
    
    print(f"      Span extent: h=[{min(span_h_start, span_h_end)}, {max(span_h_start, span_h_end)}], v=[{min(span_v_start, span_v_end)}, {max(span_v_start, span_v_end)}]")
    
    for load in loads:
        load_id = load.get('id')
        load_type = load.get('name')
        load_h = load.get('horizontal_distance_from_left_end_origin', 0)
        load_v = load.get('vertical_distance_from_left_end_origin', 0)
        load_axis = load.get('axis')
        
        print(f"      [FEM] Checking load {load_id} (type={load_type}, axis={load_axis}, h={load_h}, v={load_v})")
        
        if load_type == 'udl':
            # UDL: axis must match span axis (load is along that direction)
            if load_axis != span_axis:
                print(f"        ✗ UDL axis {load_axis} doesn't match span axis {span_axis}")
                continue
            # Check if load is at same perpendicular position
            if span_axis in ['x', '-x']:
                if abs(load_v - span_v_start) > 0.01:
                    print(f"        ✗ UDL vertical position {load_v} doesn't match span vertical position {span_v_start}")
                    continue
                in_range = min(span_h_start, span_h_end) <= load_h <= max(span_h_start, span_h_end)
            else:  # y or -y
                if abs(load_h - span_h_start) > 0.01:
                    print(f"        ✗ UDL horizontal position {load_h} doesn't match span horizontal position {span_h_start}")
                    continue
                in_range = min(span_v_start, span_v_end) <= load_v <= max(span_v_start, span_v_end)
            
            if in_range:
                print(f"        ✓ UDL load {load_id} acts on this span")
                loads_on_span.append(load)
            else:
                print(f"        ✗ UDL position not in span range")
        
        else:  # point_load or vdl
            # Point Load/VDL: axis is direction of action, check position only
            # For horizontal spans: load must be at same v, within h range
            # For vertical spans: load must be at same h, within v range
            if span_axis in ['x', '-x']:
                # Horizontal span: point load acts perpendicular (vertical loads)
                if abs(load_v - span_v_start) > 0.01:
                    print(f"        ✗ Load vertical position {load_v} doesn't match span vertical position {span_v_start}")
                    continue
                in_range = min(span_h_start, span_h_end) <= load_h <= max(span_h_start, span_h_end)
            else:  # y or -y
                # Vertical span: point load acts perpendicular (horizontal loads)
                if abs(load_h - span_h_start) > 0.01:
                    print(f"        ✗ Load horizontal position {load_h} doesn't match span horizontal position {span_h_start}")
                    continue
                in_range = min(span_v_start, span_v_end) <= load_v <= max(span_v_start, span_v_end)
            
            if in_range:
                print(f"        ✓ {load_type.upper()} load {load_id} acts on this span")
                loads_on_span.append(load)
            else:
                print(f"        ✗ Load position not in span range")
    
    print(f"      [FEM] Total loads on span: {len(loads_on_span)}")
    return loads_on_span


def calculate_fem_for_span(span, loads_on_span):
    """
    Calculate Fixed End Moments for a span given the loads acting on it.
    """
    L = span.get('length', 0)
    print(f"    [FEM] Calculating FEM for span length={L}, num_loads={len(loads_on_span)}")
    
    if L == 0:
        print(f"      [FEM] Span length is 0, returning (0, 0)")
        return 0, 0
    
    fem_left = 0
    fem_right = 0
    
    span_start_h = span.get('horizontal_distance_from_left_end_origin', 0)
    span_start_v = span.get('vertical_distance_from_left_end_origin', 0)
    span_axis = span.get('axis')
    
    for load in loads_on_span:
        load_type = load.get('name')
        load_h = load.get('horizontal_distance_from_left_end_origin', 0)
        load_v = load.get('vertical_distance_from_left_end_origin', 0)
        
        if span_axis in ['x', '-x']:
            load_dist = abs(load_h - span_start_h)
        else:
            load_dist = abs(load_v - span_start_v)
        
        print(f"      [FEM] Processing {load_type} at distance {load_dist} from span start")
        
        if load_type == 'udl':
            w = load.get('load_per_distance', 0)
            fem_magnitude = (w * L * L) / 12
            fem_left += fem_magnitude
            fem_right -= fem_magnitude
            print(f"        UDL: w={w}, FEM contribution: left={fem_magnitude}, right={-fem_magnitude}")
        
        elif load_type == 'point_load':
            W = load.get('point_load_magnitude', 0)
            a = load_dist
            b = L - load_dist
            
            if abs(a - b) < 0.01:
                fem_magnitude = (W * L) / 8
                print(f"        Point Load (symmetrical): W={W}, FEM={fem_magnitude}")
            else:
                fem_magnitude_left = (W * b * b * a) / (L * L)
                fem_magnitude_right = (W * a * a * b) / (L * L)
                fem_left += fem_magnitude_left
                fem_right -= fem_magnitude_right
                print(f"        Point Load (asymmetrical): W={W}, a={a}, b={b}, FEM_left={fem_magnitude_left}, FEM_right={-fem_magnitude_right}")
                continue
            
            fem_left += fem_magnitude
            fem_right -= fem_magnitude
        
        elif load_type == 'vdl':
            w_left = load.get('left_load_per_distance', 0)
            w_right = load.get('right_load_per_distance', 0)
            fem_left_contrib = (w_left * L * L) / 20
            fem_right_contrib = (w_right * L * L) / 30
            fem_left += fem_left_contrib
            fem_right -= fem_right_contrib
            print(f"        VDL: w_left={w_left}, w_right={w_right}, FEM_left={fem_left_contrib}, FEM_right={-fem_right_contrib}")
    
    print(f"      [FEM] Final FEM for span: left={fem_left}, right={fem_right}")
    return fem_left, fem_right
