from typing import Dict, List, Tuple
import numpy as np
from sympy import symbols, Eq, solve, sympify
import re


class MomentEquilibriumSolver:
    """
    Step 3: Equate moment equations at supports and joints
    Solves for unknown slopes (theta values)
    """
    
    def __init__(self, spans: List[Dict], supports: List[Dict]):
        self.spans = spans
        self.supports = supports
        self.joints = []
        print(f"\n[EQUILIBRIUM] Initialized MomentEquilibriumSolver")
        
    def detect_joints(self) -> List[Dict]:
        """
        Detect joints: positions where spans connect without a support.
        A joint exists if at least 2 spans meet at a position but no support exists there.
        """
        print(f"[EQUILIBRIUM] Detecting joints...")
        position_spans = {}  # Map positions to spans at that position
        
        # Collect all span end positions
        for span in self.spans:
            h = span.get('horizontal_distance_from_left_end_origin', 0)
            v = span.get('vertical_distance_from_left_end_origin', 0)
            axis = span.get('axis')
            length = span.get('length', 0)
            
            # Left/start end
            pos_key = (round(h, 2), round(v, 2))
            if pos_key not in position_spans:
                position_spans[pos_key] = []
            position_spans[pos_key].append((span.get('id'), 'left'))
            
            # Right/end end
            if axis in ['x', '-x']:
                h_end = h + (length if axis == 'x' else -length)
            else:
                h_end = h
            if axis in ['y', '-y']:
                v_end = v + (length if axis == 'y' else -length)
            else:
                v_end = v
            
            pos_key_end = (round(h_end, 2), round(v_end, 2))
            if pos_key_end not in position_spans:
                position_spans[pos_key_end] = []
            position_spans[pos_key_end].append((span.get('id'), 'right'))
        
        # Find joints: positions with multiple spans but no support
        for pos, span_list in position_spans.items():
            if len(span_list) >= 2:  # Multiple spans at this position
                # Check if support exists
                support_exists = any(
                    abs(s.get('horizontal_distance_from_left_end_origin', 0) - pos[0]) < 0.01 and
                    abs(s.get('vertical_distance_from_left_end_origin', 0) - pos[1]) < 0.01
                    for s in self.supports
                )
                
                if not support_exists:
                    joint = {
                        'h': pos[0],
                        'v': pos[1],
                        'type': 'joint',
                        'span_connections': span_list
                    }
                    self.joints.append(joint)
                    print(f"  ✓ Joint detected at h={pos[0]}, v={pos[1]} connecting {len(span_list)} spans")
        
        return self.joints
    
    def get_moment_equation_at_position(self, h: float, v: float, side: str, 
                                       moment_equations: Dict) -> str:
        """
        Get moment equation at a specific position and side.
        side: 'left'/'right'/'up'/'down'
        """
        for span_id, eqn in moment_equations.items():
            span = next(s for s in self.spans if s.get('id') == span_id)
            span_h = span.get('horizontal_distance_from_left_end_origin', 0)
            span_v = span.get('vertical_distance_from_left_end_origin', 0)
            span_axis = span.get('axis')
            span_length = span.get('length', 0)
            
            # Check if span ends at this position
            if span_axis in ['x', '-x']:
                h_end = span_h + (span_length if span_axis == 'x' else -span_length)
                v_end = span_v
            else:
                h_end = span_h
                v_end = span_v + (span_length if span_axis == 'y' else -span_length)
            
            # Left end matches
            if abs(span_h - h) < 0.01 and abs(span_v - v) < 0.01:
                if side == 'left' or (side == 'up' and span_axis in ['y', '-y']) or (side == 'down' and span_axis in ['y', '-y']):
                    return eqn.get('moment_left_eqn'), span_id
            
            # Right end matches
            if abs(h_end - h) < 0.01 and abs(v_end - v) < 0.01:
                if side == 'right' or (side == 'up' and span_axis in ['y', '-y']) or (side == 'down' and span_axis in ['y', '-y']):
                    return eqn.get('moment_right_eqn'), span_id
        
        return None, None
    
    def create_equilibrium_equations(self, moment_equations: Dict) -> List[str]:
        """
        Create moment equilibrium equations for each support and joint.
        At each point, sum of moments = 0.
        """
        print(f"\n[EQUILIBRIUM] Creating equilibrium equations...")
        equilibrium_eqns = []
        
        equilibrium_points = []
        
        # Add intermediate supports (non-terminal)
        for support in self.supports:
            h = support.get('horizontal_distance_from_left_end_origin', 0)
            v = support.get('vertical_distance_from_left_end_origin', 0)
            name = support.get('name', 'unknown')
            
            # Check if intermediate (has spans on both sides)
            left_span = None
            right_span = None
            up_span = None
            down_span = None
            
            for span_id, eqn in moment_equations.items():
                span = next(s for s in self.spans if s.get('id') == span_id)
                span_h = span.get('horizontal_distance_from_left_end_origin', 0)
                span_v = span.get('vertical_distance_from_left_end_origin', 0)
                span_axis = span.get('axis')
                span_length = span.get('length', 0)
                
                if span_axis in ['x', '-x']:
                    h_end = span_h + (span_length if span_axis == 'x' else -span_length)
                    v_end = span_v
                else:
                    h_end = span_h
                    v_end = span_v + (span_length if span_axis == 'y' else -span_length)
                
                # Left end at support
                if abs(span_h - h) < 0.01 and abs(span_v - v) < 0.01:
                    if span_axis in ['x', '-x']:
                        left_span = (span_id, 'left')
                    else:
                        up_span = (span_id, 'left')
                
                # Right end at support
                if abs(h_end - h) < 0.01 and abs(v_end - v) < 0.01:
                    if span_axis in ['x', '-x']:
                        right_span = (span_id, 'right')
                    else:
                        down_span = (span_id, 'right')
            
            is_intermediate = (left_span or right_span) and (left_span and right_span or up_span or down_span)
            if is_intermediate or name != 'hinge':
                equilibrium_points.append({
                    'h': h, 'v': v, 'type': 'support', 'support_id': support.get('id'),
                    'left': left_span, 'right': right_span, 'up': up_span, 'down': down_span
                })
                print(f"  Intermediate support {support.get('id')} at h={h}, v={v}")
        
        # Add joints
        for joint in self.joints:
            equilibrium_points.append({
                'h': joint['h'], 'v': joint['v'], 'type': 'joint',
                'span_connections': joint['span_connections']
            })
            print(f"  Joint at h={joint['h']}, v={joint['v']}")
        
        # Create equations
        for point in equilibrium_points:
            h, v = point['h'], point['v']
            print(f"\n  [EQUILIBRIUM EQUATION] At h={h}, v={v} ({point['type']}):")
            
            equations_to_sum = []
            
            if point['type'] == 'support':
                # For support: M_right(left_span) + M_left(right_span) + M_right(up_span) + M_left(down_span) = 0
                if point['right']:
                    span_id, end = point['right']
                    eqn = moment_equations[span_id].get('moment_right_eqn')
                    equations_to_sum.append((eqn, 'positive', span_id, end))
                    print(f"    + M_right from span {span_id}")
                
                if point['left']:
                    span_id, end = point['left']
                    eqn = moment_equations[span_id].get('moment_left_eqn')
                    equations_to_sum.append((eqn, 'positive', span_id, end))
                    print(f"    + M_left from span {span_id}")
                
                if point['up']:
                    span_id, end = point['up']
                    eqn = moment_equations[span_id].get('moment_right_eqn')
                    equations_to_sum.append((eqn, 'positive', span_id, end))
                    print(f"    + M_right from span {span_id}")
                
                if point['down']:
                    span_id, end = point['down']
                    eqn = moment_equations[span_id].get('moment_left_eqn')
                    equations_to_sum.append((eqn, 'positive', span_id, end))
                    print(f"    + M_left from span {span_id}")
            
            elif point['type'] == 'joint':
                for span_id, end in point['span_connections']:
                    if end == 'right':
                        eqn = moment_equations[span_id].get('moment_right_eqn')
                    else:
                        eqn = moment_equations[span_id].get('moment_left_eqn')
                    equations_to_sum.append((eqn, 'positive', span_id, end))
                    print(f"    + M_{end} from span {span_id}")
            
            if equations_to_sum:
                equilibrium_eqns.append({
                    'point': (h, v),
                    'equations': equations_to_sum
                })
        
        print(f"\n[EQUILIBRIUM] Created {len(equilibrium_eqns)} equilibrium equations")
        return equilibrium_eqns
    
    def solve_for_slopes(self, equilibrium_equations: List[Dict]) -> Dict:
        """
        Solve system of moment equilibrium equations for unknown slopes.
        Returns dictionary of theta values.
        """

        print("\n[EQUILIBRIUM] Solving for slopes (theta values)...")

        try:
            # ---------------------------------------------------------
            # 1. Collect all theta variable names (SAFE FORMAT)
            # ---------------------------------------------------------
            raw_theta_vars = set()

            for eq in equilibrium_equations:
                for eqn_str, _, _, _ in eq['equations']:
                    if isinstance(eqn_str, str) and 'theta_' in eqn_str:
                        raw_theta_vars.update(
                            re.findall(r'theta_[\w\-]+', eqn_str)
                        )

            if not raw_theta_vars:
                print("  No slope variables found.")
                return {}

            # ---------------------------------------------------------
            # 2. Normalize names (NO dashes)
            #    e.g. theta_J-4-0 → theta_J_4_0
            # ---------------------------------------------------------
            name_map = {
                raw: raw.replace('-', '_') for raw in raw_theta_vars
            }

            print("  Unknown slope variables:")
            for raw, safe in name_map.items():
                print(f"    {raw} → {safe}")

            # Create SymPy symbols
            theta_symbols = {
                safe: symbols(safe) for safe in name_map.values()
            }

            # ---------------------------------------------------------
            # 3. Build equilibrium equations
            # ---------------------------------------------------------
            sympy_eqns = []

            for point_idx, eq in enumerate(equilibrium_equations):
                total_moment = 0

                print(f"\n  Joint {point_idx} equilibrium:")

                for eqn_str, sign, span_id, end in eq['equations']:
                    if eqn_str == 0 or eqn_str == '0':
                        continue

                    # Normalize variable names in equation string
                    safe_eqn_str = eqn_str
                    for raw, safe in name_map.items():
                        safe_eqn_str = safe_eqn_str.replace(raw, safe)

                    print(f"    {safe_eqn_str}")

                    # Convert to SymPy expression
                    expr = sympify(safe_eqn_str, locals=theta_symbols)
                    total_moment += expr

                # ΣM = 0
                sympy_eqns.append(Eq(total_moment, 0))
                print(f"    ⇒ Equation: {total_moment} = 0")

            # ---------------------------------------------------------
            # 4. Solve system
            # ---------------------------------------------------------
            solution = solve(sympy_eqns, list(theta_symbols.values()), dict=True)

            if not solution:
                print("  ✗ No solution found")
                return {}

            solution = solution[0]

            print("\n  ✓ Solved slope values:")
            for k, v in solution.items():
                print(f"    {k} = {v}")

            # ---------------------------------------------------------
            # 5. Return results using ORIGINAL names
            # ---------------------------------------------------------
            final_solution = {}
            for raw, safe in name_map.items():
                if theta_symbols[safe] in solution:
                    final_solution[raw] = float(solution[theta_symbols[safe]])

            return final_solution

        except Exception as e:
            print(f"  ✗ Error solving for slopes: {str(e)}")
            import traceback
            print(traceback.format_exc())
            return {}
        