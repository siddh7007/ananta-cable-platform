import os
from typing import List, Optional, Dict, Any
import psycopg2
import psycopg2.extras
from models import PartRef

class MDMDAO:
    def __init__(self):
        # Connect to PG Extra database for MDM tables
        # Falls back to BFF database if MDM_DATABASE_URL not set
        self.db_url = os.getenv(
            'MDM_DATABASE_URL',
            os.getenv('BFF_DATABASE_URL', 'postgresql://postgres:postgres@pg-extra:5432/extradb')
        )

    def _get_connection(self):
        return psycopg2.connect(self.db_url)

    def find_ribbon_by(self, ways: int, pitch_in: float, temp_min: int = 80, shield: str = "none") -> List[Dict[str, Any]]:
        """Find ribbon cables by specifications."""
        with self._get_connection() as conn:
            with conn.cursor(cursor_factory=psycopg2.extras.RealDictCursor) as cur:
                cur.execute("""
                    SELECT * FROM mdm_cables
                    WHERE type = 'ribbon'
                      AND conductor_count = %s
                      AND pitch_in = %s
                      AND temp_rating_c >= %s
                      AND shield = %s
                      AND status = 'active'
                    ORDER BY od_in ASC
                """, (ways, pitch_in, temp_min, shield))
                return [dict(row) for row in cur.fetchall()]

    def find_round_cable_by(self, cond_count: int, awg_range: List[int], voltage_min: int = 300,
                           temp_min: int = 80, shield: str = "foil", flex_class: str = "flexible") -> List[Dict[str, Any]]:
        """Find round shielded cables by specifications."""
        with self._get_connection() as conn:
            with conn.cursor(cursor_factory=psycopg2.extras.RealDictCursor) as cur:
                cur.execute("""
                    SELECT * FROM mdm_cables
                    WHERE type = 'round_shielded'
                      AND conductor_count = %s
                      AND conductor_awg = ANY(%s)
                      AND voltage_rating_v >= %s
                      AND temp_rating_c >= %s
                      AND shield = %s
                      AND flex_class = %s
                      AND status = 'active'
                    ORDER BY od_in ASC
                """, (cond_count, awg_range, voltage_min, temp_min, shield, flex_class))
                return [dict(row) for row in cur.fetchall()]

    def find_contacts_by(self, connector_family: str, awg: int, plating_pref: str = "tin") -> List[Dict[str, Any]]:
        """Find contacts by connector family and AWG."""
        with self._get_connection() as conn:
            with conn.cursor(cursor_factory=psycopg2.extras.RealDictCursor) as cur:
                # First try preferred plating
                cur.execute("""
                    SELECT * FROM mdm_contacts
                    WHERE connector_family = %s
                      AND %s = ANY(awg_range)
                      AND plating = %s
                      AND status = 'active'
                    ORDER BY plating DESC
                """, (connector_family, awg, plating_pref))
                results = [dict(row) for row in cur.fetchall()]

                # If no results, try any plating
                if not results:
                    cur.execute("""
                        SELECT * FROM mdm_contacts
                        WHERE connector_family = %s
                          AND %s = ANY(awg_range)
                          AND status = 'active'
                        ORDER BY plating DESC
                    """, (connector_family, awg))
                    results = [dict(row) for row in cur.fetchall()]

                return results

    def find_lugs_by(self, stud_size: str, awg: int) -> List[Dict[str, Any]]:
        """Find ring lugs by stud size and AWG."""
        with self._get_connection() as conn:
            with conn.cursor(cursor_factory=psycopg2.extras.RealDictCursor) as cur:
                cur.execute("""
                    SELECT * FROM mdm_connectors
                    WHERE family = 'TE Ring Lugs'
                      AND stud_size = %s
                      AND %s = ANY(compatible_contacts_awg)
                      AND status = 'active'
                    ORDER BY positions ASC
                """, (stud_size, awg))
                return [dict(row) for row in cur.fetchall()]

    def find_accessories_by(self, connector_family: str, cable_od: float) -> List[Dict[str, Any]]:
        """Find accessories by connector family and cable OD."""
        with self._get_connection() as conn:
            with conn.cursor(cursor_factory=psycopg2.extras.RealDictCursor) as cur:
                cur.execute("""
                    SELECT * FROM mdm_accessories
                    WHERE connector_family = %s
                      AND %s >= cable_od_range_in[1]
                      AND %s <= cable_od_range_in[2]
                      AND status = 'active'
                    ORDER BY type ASC
                """, (connector_family, cable_od, cable_od))
                return [dict(row) for row in cur.fetchall()]

    def find_connector_by_family_termination(self, family: str, termination: str, positions: Optional[int] = None) -> List[Dict[str, Any]]:
        """Find connectors by family, termination, and optional positions."""
        with self._get_connection() as conn:
            with conn.cursor(cursor_factory=psycopg2.extras.RealDictCursor) as cur:
                if positions:
                    cur.execute("""
                        SELECT * FROM mdm_connectors
                        WHERE family = %s
                          AND termination = %s
                          AND positions = %s
                          AND status = 'active'
                        ORDER BY positions ASC
                    """, (family, termination, positions))
                else:
                    cur.execute("""
                        SELECT * FROM mdm_connectors
                        WHERE family = %s
                          AND termination = %s
                          AND status = 'active'
                        ORDER BY positions ASC
                    """, (family, termination))
                return [dict(row) for row in cur.fetchall()]