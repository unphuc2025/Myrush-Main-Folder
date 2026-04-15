import ast

def parse_sqlalchemy_models(file_path):
    with open(file_path, 'r', encoding='utf-8') as f:
        content = f.read()

    tree = ast.parse(content)
    
    markdown = "# Database Schema & Table Structure\n\n"
    markdown += "This document contains the detailed database schema along with table relationships (links), automatically extracted from the SQLAlchemy `models.py`.\n\n"
    
    for node in tree.body:
        if isinstance(node, ast.ClassDef):
            table_name = None
            columns = []
            relationships = []
            
            for item in node.body:
                if isinstance(item, ast.Assign):
                    for target in item.targets:
                        if isinstance(target, ast.Name):
                            if target.id == '__tablename__':
                                if isinstance(item.value, ast.Constant):
                                    table_name = item.value.value
                            else:
                                if isinstance(item.value, ast.Call) and isinstance(item.value.func, ast.Name):
                                    if item.value.func.id == 'Column':
                                        col_name = target.id
                                        col_type = "Unknown"
                                        fk = None
                                        
                                        for arg in item.value.args:
                                            if isinstance(arg, ast.Name):
                                                col_type = arg.id
                                            elif isinstance(arg, ast.Call) and isinstance(arg.func, ast.Name):
                                                col_type = arg.func.id
                                            elif isinstance(arg, ast.Call) and isinstance(arg.func, ast.Name) and arg.func.id == 'ForeignKey':
                                                if len(arg.args) > 0 and isinstance(arg.args[0], ast.Constant):
                                                    fk = arg.args[0].value
                                        
                                        # Also scan keywords for foreign key or specific column types, but positional is handled
                                        columns.append({"name": col_name, "type": col_type, "fk": fk})
                                    
                                    elif item.value.func.id == 'relationship':
                                        rel_name = target.id
                                        target_model = "Unknown"
                                        if len(item.value.args) > 0 and isinstance(item.value.args[0], ast.Constant):
                                            target_model = item.value.args[0].value
                                        relationships.append({"name": rel_name, "target": target_model})

            if table_name and (columns or relationships):
                markdown += f"## Table: `{table_name}`\n\n"
                markdown += f"**Model Class**: `{node.name}`\n\n"
                markdown += "### Columns\n"
                markdown += "| Column Name | Data Type | Foreign Key (Link) |\n"
                markdown += "| :--- | :--- | :--- |\n"
                for col in columns:
                    fk_str = f"`{col['fk']}`" if col['fk'] else "-"
                    markdown += f"| `{col['name']}` | `{col['type']}` | {fk_str} |\n"
                
                if relationships:
                    markdown += "\n### ORM Relationships\n"
                    markdown += "| Relationship | Target Model |\n"
                    markdown += "| :--- | :--- |\n"
                    for rel in relationships:
                        markdown += f"| `{rel['name']}` | `{rel['target']}` |\n"
                        
                markdown += "\n---\n\n"
                
    with open('db_table_structure.md', 'w', encoding='utf-8') as f:
        f.write(markdown)
        
if __name__ == '__main__':
    parse_sqlalchemy_models('unified-backend/models.py')
    print("Generated db_table_structure.md successfully with links.")
