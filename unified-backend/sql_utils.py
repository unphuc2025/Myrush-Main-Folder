"""
SQL Utility functions for proper parameter binding and query construction
"""

from sqlalchemy import text
from sqlalchemy.orm import Session
from typing import Dict, Any, List, Union
import uuid

def safe_execute_sql(
    db: Session,
    query: str,
    params: Dict[str, Any],
    debug: bool = False
) -> List[Dict[str, Any]]:
    """
    Safely execute SQL query with proper parameter binding for UUID and other types.

    This function handles the conversion of parameters to the correct format for SQLAlchemy,
    avoiding common parameter binding issues.

    Args:
        db: SQLAlchemy database session
        query: SQL query string with :param_name placeholders
        params: Dictionary of parameters
        debug: Whether to print debug information

    Returns:
        List of dictionaries representing the query results

    Example:
        # Instead of: WHERE admin_branches.city_id = %(city_id_1)s::UUID
        # Use: WHERE admin_branches.city_id = :city_id
        result = safe_execute_sql(
            db,
            "SELECT * FROM admin_branches WHERE city_id = :city_id AND area_id = :area_id",
            {"city_id": "1d0e64bb-e916-4932-bcc2-63c68b50896c", "area_id": "82dbaa98-fae3-4b4c-8515-a21fa0737b02"}
        )
    """
    try:
        if debug:
            print(f"[SQL_UTILS] Executing query: {query}")
            print(f"[SQL_UTILS] With params: {params}")

        # Convert UUID strings to UUID objects for proper type handling
        processed_params = {}
        for key, value in params.items():
            if isinstance(value, str) and len(value) == 36 and value.count('-') == 4:
                # This looks like a UUID string
                try:
                    processed_params[key] = uuid.UUID(value)
                except ValueError:
                    processed_params[key] = value
            else:
                processed_params[key] = value

        if debug and processed_params != params:
            print(f"[SQL_UTILS] Converted params: {processed_params}")

        # Execute the query with proper parameter binding
        result = db.execute(text(query), processed_params)

        # Convert result to list of dictionaries
        rows = result.fetchall()
        if not rows:
            return []

        # Get column names from cursor description
        # Handle case where cursor might be None or description might not be available
        try:
            column_names = [desc[0] for desc in result.cursor.description]
        except (AttributeError, TypeError):
            # Fallback: try to get column names from the first row keys if available
            if rows and hasattr(rows[0], '_keys'):
                column_names = list(rows[0]._keys())
            else:
                # If we can't determine column names, return empty list
                return []

        return [dict(zip(column_names, row)) for row in rows]

    except Exception as e:
        print(f"[SQL_UTILS] Error executing query: {e}")
        import traceback
        traceback.print_exc()
        raise

def build_safe_where_clause(
    conditions: List[str],
    params: Dict[str, Any]
) -> tuple:
    """
    Build a safe WHERE clause with proper parameter binding.

    Args:
        conditions: List of condition strings with :param_name placeholders
        params: Dictionary of parameters

    Returns:
        tuple: (where_clause_string, processed_params_dict)

    Example:
        conditions = [
            "admin_branches.city_id = :city_id",
            "admin_branches.area_id = :area_id"
        ]
        params = {
            "city_id": "1d0e64bb-e916-4932-bcc2-63c68b50896c",
            "area_id": "82dbaa98-fae3-4b4c-8515-a21fa0737b02"
        }

        where_clause, safe_params = build_safe_where_clause(conditions, params)
        # where_clause: "admin_branches.city_id = :city_id AND admin_branches.area_id = :area_id"
        # safe_params: {"city_id": UUID(...), "area_id": UUID(...)}

        query = f"SELECT * FROM admin_branches WHERE {where_clause}"
        result = safe_execute_sql(db, query, safe_params)
    """
    if not conditions:
        return "", {}

    # Process parameters (convert UUID strings to UUID objects)
    processed_params = {}
    for key, value in params.items():
        if isinstance(value, str) and len(value) == 36 and value.count('-') == 4:
            try:
                processed_params[key] = uuid.UUID(value)
            except ValueError:
                processed_params[key] = value
        else:
            processed_params[key] = value

    # Build WHERE clause
    where_clause = " AND ".join(conditions)

    return where_clause, processed_params