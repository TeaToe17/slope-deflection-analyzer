"""
Slope-Deflection Method Solver
Creates moment equations for each span using the slope-deflection formula:
Mab = FEMab + (2EI/L)(2θA + θB) - (6EIΔ/L²)
Mba = FEMba + (2EI/L)(2θB + θA) - (6EIΔ/L²)
"""
from typing import Dict, List, Tuple


class SlopeDeflectionSolver:
    def __init__(self, spans: List[Dict], supports: List[Dict], loads: List[Dict]):
        self.spans = spans
        self.supports = supports
        self.loads = loads
        self.joints = []

        print(f"\n[SOLVER] Initialized SlopeDeflectionSolver with {len(spans)} spans, {len(supports)} supports")

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
    
        
    def get_support_at_position(self, h: float, v: float):
        """Find support at given position"""
        for support in self.supports:
            if (abs(support.get('horizontal_distance_from_left_end_origin', 0) - h) < 0.01 and
                abs(support.get('vertical_distance_from_left_end_origin', 0) - v) < 0.01):
                return support
        return None
    
    def has_joint_at_position(self, h: float, v: float) -> bool:
        """
        Check if multiple spans connect at this position (joint exists)
        A joint exists when 2+ spans meet at a position but no support is there.
        If there's a joint, it's NOT a cantilever end.
        """
        connecting_spans = []
        
        for span in self.spans:
            span_h = span.get('horizontal_distance_from_left_end_origin', 0)
            span_v = span.get('vertical_distance_from_left_end_origin', 0)
            span_axis = span.get('axis')
            span_length = span.get('length', 0)
            
            # Check left/start end
            if abs(span_h - h) < 0.01 and abs(span_v - v) < 0.01:
                connecting_spans.append((span.get('id'), 'left'))
            
            # Check right/end end
            if span_axis in ['x', '-x']:
                h_end = span_h + (span_length if span_axis == 'x' else -span_length)
                v_end = span_v
            else:
                h_end = span_h
                v_end = span_v + (span_length if span_axis == 'y' else -span_length)
            
            if abs(h_end - h) < 0.01 and abs(v_end - v) < 0.01:
                connecting_spans.append((span.get('id'), 'right'))
        
        has_joint = len(connecting_spans) >= 2
        if has_joint:
            print(f"    [SOLVER] Joint detected at h={h}, v={v}: {len(connecting_spans)} spans connect")
        return has_joint
    
    def is_cantilever_end(self, h: float, v: float, axis: str):
        """
        Check if this is a free end (cantilever).
        It's cantilever if: NO support AND NO joint at this position.
        If there's a joint (other spans connecting), it's NOT cantilever.
        """
        support = self.get_support_at_position(h, v)
        joint_exists = self.has_joint_at_position(h, v)
        
        is_cantilever = (support is None) and (not joint_exists)
        
        if is_cantilever:
            print(f"    [SOLVER] End at h={h}, v={v} IS CANTILEVER (no support, no joint)")
        else:
            if support:
                print(f"    [SOLVER] End at h={h}, v={v} has support (NOT cantilever)")
            elif joint_exists:
                print(f"    [SOLVER] End at h={h}, v={v} has joint (NOT cantilever)")
        
        return is_cantilever
    
    def calculate_cantilever_moment(self, span: Dict, loads_on_span: List[Dict], is_left_end: bool):
        """
        For cantilever spans, calculate moment at the CONNECTED end only.
        - At FREE end: moment = 0
        - At CONNECTED end: moment = sum of (load resultant × distance from centroid)
        """
        print(f"    [SOLVER] Calculating cantilever moment (is_left_end={is_left_end})...")
        
        span_axis = span.get('axis')
        span_h = span.get('horizontal_distance_from_left_end_origin', 0)
        span_v = span.get('vertical_distance_from_left_end_origin', 0)
        span_length = span.get('length', 0)
        
        # Determine free end and connected end
        if span_axis in ['x', '-x']:
            h_right = span_h + (span_length if span_axis == 'x' else -span_length)
            v_right = span_v
        else:
            h_right = span_h
            v_right = span_v + (span_length if span_axis == 'y' else -span_length)
        
        # Check which end is free
        left_is_free = self.is_cantilever_end(span_h, span_v, span_axis)
        right_is_free = self.is_cantilever_end(h_right, v_right, span_axis)
        
        # At FREE end, moment is always 0
        if (is_left_end and left_is_free) or (not is_left_end and right_is_free):
            print(f"      This is the FREE end - moment = 0")
            return "0"
        
        # At CONNECTED end, calculate moment from loads
        print(f"      This is the CONNECTED end - calculating moment from loads...")
        
        if not loads_on_span:
            print(f"        No loads on cantilever - moment = 0")
            return "0"
        
        # For connected end, distance is measured from that end
        moment = 0
        for load in loads_on_span:
            load_type = load.get('name')
            load_h = load.get('horizontal_distance_from_left_end_origin', 0)
            load_v = load.get('vertical_distance_from_left_end_origin', 0)
            
            # Distance from connected end
            if is_left_end:
                # Connected end is at left
                distance = span_length
            else:
                # Connected end is at right
                distance = span_length
            
            print(f"        Load {load.get('id')}: type={load_type}")

            if load_type == 'point_load':
                W = load.get('point_load_magnitude', 0)
                # Distance from this load to connected end
                if span_axis in ['x', '-x']:
                    d = abs(load_h - (span_h if is_left_end else h_right))
                else:
                    d = abs(load_v - (span_v if is_left_end else v_right))
                M = W * d
                print(f"          Point load: W={W}, distance_from_connected_end={d}, M={M}")
                moment += M
            
            elif load_type == 'udl':
                w = load.get('load_per_distance', 0)
                # UDL acts over entire span
                resultant = w * span_length
                # Centroid of UDL is at L/2 from either end
                centroid_dist = span_length / 2
                M = resultant * centroid_dist
                print(f"          UDL: w={w}, resultant={resultant}, centroid_dist_from_end={centroid_dist}, M={M}")
                moment += M
            
            elif load_type == 'vdl':
                w_left = load.get('left_load_per_distance', 0)
                w_right = load.get('right_load_per_distance', 0)
                # Resultant of VDL
                resultant = ((w_left + w_right) / 2) * span_length
                # Centroid location from left end = L/3 * (2wr + wl) / (wr + wl)
                if w_left + w_right > 0:
                    centroid_from_left = span_length * (2 * w_right + w_left) / (3 * (w_right + w_left))
                    if is_left_end:
                        centroid_dist = centroid_from_left
                    else:
                        centroid_dist = span_length - centroid_from_left
                else:
                    centroid_dist = span_length / 2
                M = resultant * centroid_dist
                print(f"          VDL: resultant={resultant}, centroid_dist_from_end={centroid_dist}, M={M}")
                moment += M
        
        print(f"        Final moment at connected end: {moment}")
        return str(moment)
    
    def create_moment_equations(self, span: Dict, fem_left: float, fem_right: float, 
                               loads_on_span: List[Dict]) -> Tuple[str, str]:
        """
        Create slope-deflection moment equations for a span.
        Mab = FEMab + (2EI/L)(2θA + θB) - (6EIΔ/L²)
        Mba = FEMba + (2EI/L)(2θB + θA) - (6EIΔ/L²)
        """
        span_id = span.get('id')
        span_h = span.get('horizontal_distance_from_left_end_origin', 0)
        span_v = span.get('vertical_distance_from_left_end_origin', 0)
        span_axis = span.get('axis')
        span_length = span.get('length', 0)
        EI = span.get('ei', 1)  # Default to 1 if not provided
        
        # Calculate end positions
        if span_axis in ['x', '-x']:
            h_end = span_h + (span_length if span_axis == 'x' else -span_length)
            v_end = span_v
        else:
            h_end = span_h
            v_end = span_v + (span_length if span_axis == 'y' else -span_length)
        
        print(f"    [SOLVER] Creating moment equations for Span {span_id}")
        print(f"      Length={span_length}, EI={EI}, FEM_left={fem_left}, FEM_right={fem_right}")
        
        left_is_cantilever = self.is_cantilever_end(span_h, span_v, span_axis)
        right_is_cantilever = self.is_cantilever_end(h_end, v_end, span_axis)
        
        print(f"      Left end cantilever={left_is_cantilever}, Right end cantilever={right_is_cantilever}")
        
        # CHECKING NATURE OF SUPPORT TO KNOW IF SLOPE IS PRESENT
        left_support = self.get_support_at_position(span_h,span_v)
        right_support = self.get_support_at_position(h_end, v_end)
        print("SUPPORTS ",left_support, right_support)

        # CHECKING IF THERE IS AJOINT AT THAT POINT WHICH WILL BE USED FOR NAMING SLOPE
        self.detect_joints()

        left_joint = next((joint for joint in self.joints if joint["h"] == span_h and joint["v"] == span_v ), None)
        right_joint = next((joint for joint in self.joints if joint["h"] == h_end and joint["v"] == v_end ), None)
        print("JOINT", left_joint, right_joint)

        # CREATING CONVENTIONAL NAMES
        left_node_name = (
            (left_joint and f"J_{left_joint['h']}_{left_joint['v']}")
            or (left_support and f"S_{left_support.get('id')}")
        )

        right_node_name = (
            (right_joint and f"J_{right_joint['h']}_{right_joint['v']}")
            or (right_support and f"S_{right_support.get('id')}")
        )

        # LEFT END MOMENT EQUATION
        if left_is_cantilever:
            # moment_left_eqn = self.calculate_cantilever_moment(span, loads_on_span, is_left_end=True)
            moment_left_eqn = "0"
            print(f"      Left end is cantilever: moment_left_eqn = {moment_left_eqn}")
            if not right_is_cantilever:
                moment_right_eqn = "-" + self.calculate_cantilever_moment(span, loads_on_span, is_left_end=False)
                print(f"      Right end is cantilever: moment_right_eqn = {moment_right_eqn}")

        elif not right_is_cantilever:
            # Standard slope-deflection equation
            # Mab = FEMab + (2EI/L)(2θA + θB) - (6EIΔ/L²)

            # GETTING THE JOINT THERE IF IT EXISTS AT THIS POINT

            print(left_support and left_support.get("name") == "hinge")
            deflection = 0  # Default to 0 if not provided in data
            term1 = fem_left
            print("LEFT SUPPORT", left_support)
            if left_support and left_support.get("name") == "hinge":
                term2 = f"(2*{EI}/{span_length})*(theta_{right_node_name})"
            if right_support and right_support.get("name") == "hinge":
                term2 = f"(2*{EI}/{span_length})*(2*theta_{left_node_name})"

            if left_support and left_support.get("name") != "hinge" and right_support and right_support.get("name") != "hinge":
                term2 = f"(2*{EI}/{span_length})*(2*theta_{left_node_name} + theta_{right_node_name})"
            term3 = f"(6*{EI}/{span_length**2})*{deflection}"
            moment_left_eqn = f"{term1} + {term2} - {term3}"
            print(f"      Left end equation: M_left = {moment_left_eqn}")
        
        # RIGHT END MOMENT EQUATION
        if right_is_cantilever:
            # moment_right_eqn = self.calculate_cantilever_moment(span, loads_on_span, is_left_end=False)
            moment_right_eqn = "0"
            print(f"      Right end is cantilever: moment_right_eqn = {moment_right_eqn}")
            if not left_is_cantilever:
                moment_left_eqn = self.calculate_cantilever_moment(span, loads_on_span, is_left_end=True)
                print(f"      Left end is cantilever: moment_left_eqn = {moment_left_eqn}")
        elif not left_is_cantilever:
            # Standard slope-deflection equation
            # Mba = FEMba + (2EI/L)(2θB + θA) - (6EIΔ/L²)
            deflection = 0  # Default to 0 if not provided in data
            term1 = fem_right
            if right_support and right_support.get("name") == "hinge":
                term2 = f"(2*{EI}/{span_length})*(theta_{left_node_name})"
            if left_support and left_support.get("name") == "hinge":
                term2 = f"(2*{EI}/{span_length})*(2*theta_{right_node_name})"

            elif right_support and right_support.get("name") != "hinge" and left_support and left_support.get("name") != "hinge":
                term2 = f"(2*{EI}/{span_length})*(2*theta_{right_node_name} + theta_{left_node_name})"
            term3 = f"(6*{EI}/{span_length**2})*{deflection}"
            moment_right_eqn = f"{term1} + {term2} - {term3}"
            print(f"      Right end equation: M_right = {moment_right_eqn}")
        
        return moment_left_eqn, moment_right_eqn
    
    def solve(self, fem_results: Dict) -> Dict:
        """
        Main solve function: creates moment equations for all spans
        """
        print(f"\n[SOLVER] ===== SOLVING FOR MOMENT EQUATIONS =====")
        results = {}
        
        for span in self.spans:
            span_id = span.get('id')
            print(f"\n[SOLVER] Processing Span {span_id}...")
            
            # Get FEM values for this span
            fem_left = fem_results.get(span_id, {}).get('fem_left', 0)
            fem_right = fem_results.get(span_id, {}).get('fem_right', 0)
            loads_on_span = fem_results.get(span_id, {}).get('loads_on_span', [])
            
            print(f"  FEM values: left={fem_left}, right={fem_right}")
            print(f"  Loads on span: {len(loads_on_span)}")
            
            # Create moment equations
            moment_left_eqn, moment_right_eqn = self.create_moment_equations(
                span, fem_left, fem_right, loads_on_span
            )
            
            results[span_id] = {
                'moment_left_eqn': moment_left_eqn,
                'moment_right_eqn': moment_right_eqn,
                'fem_left': fem_left,
                'fem_right': fem_right
            }
        
        print(f"\n[SOLVER] ===== MOMENT EQUATIONS COMPLETE =====")
        return results
