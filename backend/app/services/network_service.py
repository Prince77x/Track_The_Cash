from typing import Any, Dict, List, Set, Tuple

from sqlalchemy.orm import Session

from backend.app.models import EntityLink


def build_entity_network(db: Session, entity_type: str, entity_id: str) -> Dict[str, Any]:
    links = db.query(EntityLink).filter(
        ((EntityLink.source_type == entity_type) & (EntityLink.source_id == entity_id)) |
        ((EntityLink.target_type == entity_type) & (EntityLink.target_id == entity_id))
    ).all()

    nodes: Set[str] = set()
    edges: List[Dict[str, Any]] = []
    for link in links:
        src_key = f"{link.source_type}:{link.source_id}"
        tgt_key = f"{link.target_type}:{link.target_id}"
        nodes.add(src_key)
        nodes.add(tgt_key)
        edges.append({
            "source": src_key,
            "target": tgt_key,
            "type": link.link_type,
            "weight": float(link.confidence or 0.0),
        })

    result_nodes = []
    for node in sorted(nodes):
        node_type, label = node.split(":", 1)
        result_nodes.append({"id": node, "type": node_type, "label": label})

    return {"nodes": result_nodes, "edges": edges}
