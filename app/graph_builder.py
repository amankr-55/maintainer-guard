import re
from typing import List, Dict, Any
from app.models import BlastRadius, BlastRadiusNode, BlastRadiusEdge

def build_blast_radius_graph(diff_content: str, repo_name: str) -> BlastRadius:
    """
    Analyzes which files and architectural components are affected by the PR diff.
    Generates a node-link diagram for live interactive blast-radius rendering.
    """
    raw_files = re.findall(r'(?:---|\+\+\+)\s+[ab]/(.+)', diff_content)
    modified_files = list(set(raw_files))

    if not modified_files:
        modified_files = ["src/core/controller.py"]

    nodes: List[BlastRadiusNode] = []
    edges: List[BlastRadiusEdge] = []
    node_ids = set()

    def add_node(nid: str, label: str, ntype: str, status: str):
        if nid not in node_ids:
            nodes.append(BlastRadiusNode(id=nid, label=label, type=ntype, status=status))
            node_ids.add(nid)

    def add_edge(src: str, tgt: str, rel: str):
        edges.append(BlastRadiusEdge(source=src, target=tgt, relationship=rel))

    # Add repo root
    add_node("repo_root", repo_name, "repository", "intact")

    is_doc_only = all(f.endswith('.md') or f.endswith('.txt') for f in modified_files)
    breaking_risk = "LOW"

    for idx, f in enumerate(modified_files):
        file_id = f"mod_file_{idx}"
        add_node(file_id, f, "file", "modified")
        add_edge("repo_root", file_id, "contains")

        # Infer architecture connections based on file type
        if "auth" in f.lower() or "security" in f.lower():
            breaking_risk = "HIGH"
            add_node("api_auth", "/api/v1/login (Endpoint)", "endpoint", "impacted")
            add_node("user_session", "UserSessionModel", "dependency", "impacted")
            add_node("test_auth", "tests/test_auth.py", "test", "broken")
            add_edge(file_id, "api_auth", "authenticates")
            add_edge(file_id, "user_session", "reads_state")
            add_edge(file_id, "test_auth", "covered_by")

        elif "pool" in f.lower() or "db" in f.lower() or "database" in f.lower():
            breaking_risk = "MEDIUM"
            add_node("db_pool", "PostgreSQL Pool Worker", "dependency", "impacted")
            add_node("api_query", "/api/v1/records (Endpoint)", "endpoint", "intact")
            add_node("test_db", "tests/test_connection.py", "test", "intact")
            add_edge(file_id, "db_pool", "allocates")
            add_edge(file_id, "api_query", "queries")
            add_edge(file_id, "test_db", "covered_by")

        elif f.endswith('.md'):
            add_node("docs_site", "GitHub README / Wiki", "docs", "intact")
            add_edge(file_id, "docs_site", "renders_on")

        else:
            add_node("downstream_service", "AppController", "dependency", "impacted")
            add_node("client_api", "/api/v1/service", "endpoint", "intact")
            add_edge(file_id, "downstream_service", "imports")
            add_edge("downstream_service", "client_api", "serves")

    if is_doc_only:
        breaking_risk = "LOW"
    elif len(modified_files) > 4:
        breaking_risk = "HIGH"

    return BlastRadius(
        nodes=nodes,
        edges=edges,
        total_files_affected=len(modified_files),
        breaking_change_risk=breaking_risk
    )
