export function kmeans(data: number[], k: number, maxIterations = 50): number[] {
  if (data.length === 0) return [];
  if (k >= data.length) return data.map((_, i) => i % k);

  const sorted = [...data].sort((a, b) => a - b);
  let centroids = Array.from({ length: k }, (_, i) =>
    sorted[Math.floor((i * sorted.length) / k)]
  );

  let assignments = new Array(data.length).fill(0);

  for (let iter = 0; iter < maxIterations; iter++) {
    const newAssignments = data.map((val) => {
      let minDist = Infinity;
      let closest = 0;
      for (let c = 0; c < k; c++) {
        const dist = Math.abs(val - centroids[c]);
        if (dist < minDist) {
          minDist = dist;
          closest = c;
        }
      }
      return closest;
    });

    const changed = newAssignments.some((a, i) => a !== assignments[i]);
    assignments = newAssignments;

    if (!changed) break;

    for (let c = 0; c < k; c++) {
      const members = data.filter((_, i) => assignments[i] === c);
      if (members.length > 0) {
        centroids[c] = members.reduce((s, v) => s + v, 0) / members.length;
      }
    }
  }

  return assignments;
}

export function clusterMeans(data: number[], assignments: number[], k: number): number[] {
  return Array.from({ length: k }, (_, c) => {
    const members = data.filter((_, i) => assignments[i] === c);
    if (members.length === 0) return 0;
    return members.reduce((s, v) => s + v, 0) / members.length;
  });
}
