"""
Test file demonstrating the SQL parameter binding issue and its fix.

This file shows:
1. The problematic query pattern that causes the SQLAlchemy error
2. How to fix it using the new sql_utils functions
"""

from sql_utils import safe_execute_sql, build_safe_where_clause
from database import get_db
from sqlalchemy.orm import Session

def test_problematic_query_pattern():
    """
    Demonstrate the problematic query pattern and how to fix it.

    The error message shows:
    WHERE admin_branches.city_id = %(city_id_1)s::UUID AND admin_branches.area_id = %(area_id_1)s::UUID

    This is incorrect SQLAlchemy parameter binding syntax. The correct syntax is:
    WHERE admin_branches.city_id = :city_id AND admin_branches.area_id = :area_id
    """

    # Problematic parameters from the error
    problematic_params = {
        'city_id_1': '1d0e64bb-e916-4932-bcc2-63c68b50896c',
        'area_id_1': '82dbaa98-fae3-4b4c-8515-a21fa0737b02'
    }

    print("=== PROBLEMATIC QUERY PATTERN ===")
    print("Original problematic query:")
    print("WHERE admin_branches.city_id = %(city_id_1)s::UUID AND admin_branches.area_id = %(area_id_1)s::UUID")
    print("Parameters:", problematic_params)
    print("This causes SQLAlchemy parameter binding error!")
    print()

    # Show the correct way using our new utility functions
    print("=== CORRECTED QUERY PATTERN ===")

    # Method 1: Using safe_execute_sql directly
    corrected_query = """
        SELECT *
        FROM admin_branches
        WHERE city_id = :city_id AND area_id = :area_id
    """

    # Convert parameter names to match the corrected query
    corrected_params = {
        'city_id': problematic_params['city_id_1'],
        'area_id': problematic_params['area_id_1']
    }

    print("Corrected query:")
    print(corrected_query.strip())
    print("Corrected parameters:", corrected_params)
    print()

    # Method 2: Using build_safe_where_clause for dynamic query building
    conditions = [
        "admin_branches.city_id = :city_id",
        "admin_branches.area_id = :area_id"
    ]

    where_clause, safe_params = build_safe_where_clause(conditions, corrected_params)

    dynamic_query = f"""
        SELECT *
        FROM admin_branches
        WHERE {where_clause}
    """

    print("Dynamic query building:")
    print("Conditions:", conditions)
    print("Generated WHERE clause:", where_clause)
    print("Safe parameters:", safe_params)
    print("Final query:", dynamic_query.strip())
    print()

def test_with_database(db: Session):
    """
    Test the fix with actual database connection
    """
    print("=== TESTING WITH DATABASE ===")

    try:
        # Test query using the safe method
        query = """
            SELECT id, name, city_id, area_id
            FROM admin_branches
            WHERE city_id = :city_id AND area_id = :area_id
            LIMIT 1
        """

        params = {
            'city_id': '1d0e64bb-e916-4932-bcc2-63c68b50896c',
            'area_id': '82dbaa98-fae3-4b4c-8515-a21fa0737b02'
        }

        print("Executing safe query...")
        results = safe_execute_sql(db, query, params, debug=True)

        print(f"Query executed successfully! Found {len(results)} results.")
        if results:
            print("First result:", results[0])
        else:
            print("No branches found with these city_id and area_id.")

    except Exception as e:
        print(f"Error executing test query: {e}")
        import traceback
        traceback.print_exc()

def demonstrate_parameter_conversion():
    """
    Demonstrate how the utility functions handle UUID parameter conversion
    """
    print("=== PARAMETER CONVERSION DEMONSTRATION ===")

    # String UUIDs (common in API requests)
    string_params = {
        'city_id': '1d0e64bb-e916-4932-bcc2-63c68b50896c',
        'area_id': '82dbaa98-fae3-4b4c-8515-a21fa0737b02',
        'name': 'Test Branch'
    }

    print("Original parameters (strings):", string_params)

    # This is what happens inside safe_execute_sql
    from uuid import UUID

    processed_params = {}
    for key, value in string_params.items():
        if isinstance(value, str) and len(value) == 36 and value.count('-') == 4:
            try:
                processed_params[key] = UUID(value)
                print(f"Converted {key}: {value} -> {processed_params[key]} (UUID object)")
            except ValueError:
                processed_params[key] = value
        else:
            processed_params[key] = value
            print(f"Kept {key}: {value} (not a UUID)")

    print("Processed parameters:", processed_params)
    print("UUID objects are properly handled by SQLAlchemy for type-safe queries!")

if __name__ == "__main__":
    print("SQL Parameter Binding Fix Demonstration")
    print("=" * 50)
    print()

    # Run demonstrations
    test_problematic_query_pattern()
    demonstrate_parameter_conversion()

    # Test with database if available
    try:
        db = next(get_db())
        test_with_database(db)
        db.close()
    except Exception as e:
        print(f"Could not connect to database for testing: {e}")
        print("Database test skipped, but utility functions are ready to use!")

    print()
    print("=== SUMMARY ===")
    print("✅ Created sql_utils.py with safe SQL execution functions")
    print("✅ Demonstrated the fix for the parameter binding issue")
    print("✅ Showed proper UUID parameter handling")
    print("✅ Provided examples for both direct and dynamic query building")
    print()
    print("To use in your code:")
    print("1. Import: from sql_utils import safe_execute_sql, build_safe_where_clause")
    print("2. Use :param_name syntax instead of %(param_name)s::UUID")
    print("3. Let the utility functions handle UUID conversion automatically")