# Court Hierarchy & Blocking Logic (Visual Guide)

This document provides a visual representation of how our court inventory management handles overlapping spaces and hierarchical dependencies.

---

## 1. Visual Diagram
![Court Blocking Logic Diagram](./court_logic.png)

---

## 2. Physical Layout Visualization
This diagram shows how smaller courts are nested within a larger "Full Court" and how different sports overlap in the same physical zone.

```mermaid
graph TD
    subgraph ZONE1 ["ZONE 1 (Physical Space)"]
        subgraph FC ["Full Court: 7-a-Side (Football / Box Cricket)"]
            A["Small Court A (5-a-Side)"]
            B["Small Court B (5-a-Side)"]
        end
    end

    style A fill:#e1f5fe,stroke:#01579b,stroke-width:2px
    style B fill:#e1f5fe,stroke:#01579b,stroke-width:2px
    style FC fill:#fff9c4,stroke:#fbc02d,stroke-width:3px,stroke-dasharray: 5 5
```

---

## 3. Blocking Logic Flow
These rules are enforced by the **Conflict Engine** in the database layer.

### Rule A: Hierarchical Blocking (Small vs Full)
```mermaid
flowchart LR
    subgraph "Small Court Booking"
        S_A[Book Small A] --> F_B[Block Full Court]
        S_B[Book Small B] --> F_B[Block Full Court]
    end

    subgraph "Full Court Booking"
        F_C[Book Full Court] --> S_BA[Block Small A]
        F_C --> S_BB[Block Small B]
    end

    style F_B fill:#ffebee,stroke:#c62828
    style S_BA fill:#ffebee,stroke:#c62828
    style S_BB fill:#ffebee,stroke:#c62828
```

### Rule B: Cross-Sport Blocking (Shared Space)
Because Box Cricket and Football use the same ground, booking one shuts down the other.

```mermaid
graph LR
    FB[Football] <== "Mutual Block" ==> BC[Box Cricket]
    
    style FB fill:#e8f5e9,stroke:#2e7d32
    style BC fill:#fff3e0,stroke:#ef6c00
```

---

## 4. Logic Matrix Summary

| User Action | Resulting Block | Why? |
| :--- | :--- | :--- |
| **Book 7-a-Side Football** | Blocks 5-a-Side A & B + Box Cricket | Space is fully occupied by the big game. |
| **Book 5-a-Side A** | Blocks 7-a-Side Football | You can't play 7-a-Side if part of the pitch is busy. |
| **Book Box Cricket** | Blocks Football (all variations) | Different sports cannot share the same surface simultaneously. |
| **Book 5-a-Side A** | **Small B remains OPEN** | Independent sub-courts can run 5-a-Side matches together. |

---
**Note**: This logic is implemented via `court_dependency` mappings and handled automatically.
