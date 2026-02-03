import sympy as sp
from typing import Dict, List, Tuple


def calculate_upward_load(span: Dict, loads: List[Dict]) -> float:
    """
    Calculate total upward (positive) load on a span.
    """
    total_load = 0

    for load in loads:
        load_type = load.get('name')

        if load_type == 'point_load':
            mag = load.get('point_load_magnitude', 0)
            total_load += mag

        elif load_type == 'udl':
            w = load.get('load_per_distance', 0)
            L = load.get('load_span', span.get('length', 0))
            total_load += w * L

        elif load_type == 'vdl':
            w1 = load.get('left_load_per_distance', 0)
            w2 = load.get('right_load_per_distance', 0)
            L = load.get('load_span', span.get('length', 0))
            total_load += (w1 + w2) * L / 2

    return total_load


def get_load_centroid(load: Dict, span: Dict) -> float:
    """
    Distance from left end to load centroid.
    """
    load_type = load.get('name')
    load_span = load.get('load_span', load.get('load_span'))
    h_start = load.get('horizontal_distance_from_left_end_origin', 0)
    v_start = load.get('vertical_distance_from_left_end_origin', 0)
    span_axis = span.get("axis")
    load_axis = load.get('axis')

    AXIS_X = {"x", "-x"}
    AXIS_Y = {"y", "-y"}

    if load_type == "point_load":
        if span_axis in AXIS_X and load_axis in AXIS_Y:
            return abs(h_start)
        elif span_axis in AXIS_Y and load_axis in AXIS_X:
            return abs(v_start)

    elif load_type == 'udl':
        if span_axis in AXIS_X and load_axis in AXIS_X:
            return abs(h_start + load_span / 2)
        elif span_axis in AXIS_Y and load_axis in AXIS_Y:
            return abs(v_start + load_span / 2)

    elif load_type == 'vdl':
        w1 = load.get('left_load_per_distance', 0)
        w2 = load.get('right_load_per_distance', 0)

        if span_axis in AXIS_X and load_axis in AXIS_X:
            start = h_start
        elif span_axis in AXIS_Y and load_axis in AXIS_Y:
            start = v_start

        if w1 + w2 == 0:
            return abs(start + load_span / 2)

        centroid = (w1 * load_span / 3 + w2 * 2 * load_span / 3) / (w1 + w2)
        return abs(start + centroid)

    return 0


def calculate_reactions(
    span: Dict,
    loads_on_span: List[Dict],
    moment_left: float,
    moment_right: float
) -> Tuple[float, float]:
    """
    Calculate left and right reactions using equilibrium equations.
    """

    span_id = span.get("id", "UNKNOWN")
    L = span.get("length", 0)

    print("\n" + "=" * 70)
    print(f"[REACTIONS] Span {span_id}")
    print(f"  Length L = {L}")
    print(f"  End moments: M_left = {moment_left}, M_right = {moment_right}")

    if L == 0:
        print("  [WARNING] Zero-length span → reactions set to 0")
        return 0.0, 0.0

    # ---------------------------------------------------------
    # Load summary
    # ---------------------------------------------------------
    total_load = calculate_upward_load(span, loads_on_span)
    print(f"\n[LOAD SUMMARY]")
    print(f"  Total upward load = {total_load}")

    for i, load in enumerate(loads_on_span, 1):
        mag = calculate_upward_load(span, [load])
        centroid = get_load_centroid(load, span)
        print(
            f"  Load {i}: {load.get('name')} | "
            f"Magnitude = {mag} | "
            f"Centroid from left = {centroid}"
        )

    # No need for equillibrium equations if cantilever
    if moment_left == 0:
        V_L = 0
        V_R = mag
        print("\n[SOLUTION]")
        print(f"  V_left  = {V_L}")
        print(f"  V_right = {V_R}")

        # Sanity check
        print("\n[CHECK]")
        print(f"  V_left + V_right = {V_L + V_R} (expected {total_load})")
        return V_L,V_R
    elif moment_right == 0:
        V_L = mag
        V_R = 0
        print("\n[SOLUTION]")
        print(f"  V_left  = {V_L}")
        print(f"  V_right = {V_R}")

        # Sanity check
        print("\n[CHECK]")
        print(f"  V_left + V_right = {V_L + V_R} (expected {total_load})")
        return V_L,V_R

    # ---------------------------------------------------------
    # Equilibrium equations
    # ---------------------------------------------------------
    V_left, V_right = sp.symbols("V_left V_right")

    # Vertical equilibrium
    eq1 = sp.Eq(V_left + V_right, total_load)

    # Moment equilibrium about left
    moment_expr = moment_left + moment_right + V_right * L

    for load in loads_on_span:
        mag = calculate_upward_load(span, [load])
        centroid = get_load_centroid(load, span)
        moment_expr -= mag * centroid

    eq2 = sp.Eq(moment_expr, 0)

    print("\n[EQUILIBRIUM EQUATIONS]")
    print(f"  ΣFy = 0  →  {eq1}")
    print(f"  ΣM_left = 0  →  {eq2}")

    # ---------------------------------------------------------
    # Solve system
    # ---------------------------------------------------------
    try:
        solution = sp.solve([eq1, eq2], [V_left, V_right])

        V_L = float(solution[V_left])
        V_R = float(solution[V_right])

        print("\n[SOLUTION]")
        print(f"  V_left  = {V_L}")
        print(f"  V_right = {V_R}")

        # Sanity check
        print("\n[CHECK]")
        print(f"  V_left + V_right = {V_L + V_R} (expected {total_load})")

        return V_L, V_R

    except Exception as e:
        print("\n[ERROR] Reaction solve failed")
        print(f"  Reason: {e}")
        print("  Fallback → equal load distribution")

        fallback = total_load / 2
        return fallback, fallback
