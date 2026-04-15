from database import SessionLocal
import models

db = SessionLocal()
courts = db.query(models.Court).filter(models.Court.is_active == True).all()
with open('audit_output.txt', 'w', encoding='utf-8') as f:
    f.write("List of ALL Active Courts:\n")
    for c in courts:
        branch_name = c.branch.name if c.branch else "N/A"
        f.write(f"Branch: {branch_name} | Court: {c.name} | Logic: {c.logic_type} | Active: {c.is_active}\n")
