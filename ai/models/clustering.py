# ai/models/clustering.py
# Agrupamento de problemas com K-Means

try:
    from sklearn.cluster import KMeans
    from sklearn.preprocessing import StandardScaler
    SKLEARN_AVAILABLE = True
except ImportError:
    SKLEARN_AVAILABLE = False


def cluster_problems(problems: list, n_clusters: int = 3) -> list:
    """
    Agrupa problemas por frequência e impacto usando K-Means.
    Retorna lista de problemas com cluster_id atribuído.
    """
    if not problems:
        return []

    if len(problems) < n_clusters:
        n_clusters = max(1, len(problems))

    features = [[p["frequency"], p["impact"]] for p in problems]

    if SKLEARN_AVAILABLE:
        scaler   = StandardScaler()
        scaled   = scaler.fit_transform(features)
        kmeans   = KMeans(n_clusters=n_clusters, random_state=42, n_init=10)
        labels   = kmeans.fit_predict(scaled)
    else:
        # Fallback simples sem sklearn
        labels = [i % n_clusters for i in range(len(problems))]

    cluster_names = {0: "Alta Urgência", 1: "Média Urgência", 2: "Baixa Urgência"}

    return [
        {**p, "cluster_id": int(labels[i]), "cluster_name": cluster_names.get(int(labels[i]), f"Grupo {labels[i]}")}
        for i, p in enumerate(problems)
    ]
