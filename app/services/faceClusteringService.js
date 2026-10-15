const DEFAULT_SIMILARITY_THRESHOLD = 0.88;

export const cosineSimilarity = (left, right) => {
    if (!Array.isArray(left) || !Array.isArray(right) || left.length !== right.length || left.length === 0) {
        return -1;
    }

    let dotProduct = 0;
    let leftMagnitude = 0;
    let rightMagnitude = 0;
    for (let index = 0; index < left.length; index += 1) {
        dotProduct += left[index] * right[index];
        leftMagnitude += left[index] * left[index];
        rightMagnitude += right[index] * right[index];
    }

    if (leftMagnitude === 0 || rightMagnitude === 0) return -1;
    return dotProduct / Math.sqrt(leftMagnitude * rightMagnitude);
};

export const normalizeEmbedding = (embedding) => {
    if (!Array.isArray(embedding) || embedding.length < 32 || embedding.length > 4096) {
        throw new TypeError('Face descriptor has an invalid length.');
    }
    if (embedding.some(value => !Number.isFinite(value))) {
        throw new TypeError('Face descriptor contains invalid values.');
    }

    const magnitude = Math.sqrt(embedding.reduce((sum, value) => sum + value * value, 0));
    if (magnitude === 0) throw new TypeError('Face descriptor cannot be empty.');
    return embedding.map(value => value / magnitude);
};

export const updateCentroid = (centroid, embedding, count) => {
    if (!Number.isInteger(count) || count < 1 || centroid.length !== embedding.length) {
        throw new TypeError('Cannot update this face group centroid.');
    }
    return normalizeEmbedding(centroid.map((value, index) => value * count + embedding[index]));
};

export const matchFacesToPeople = (faces, people, threshold = 0.88, minimumMargin = 0.03) => {
    if (!Array.isArray(faces) || !Array.isArray(people)) throw new TypeError('Faces and people must be arrays.');
    if (!Number.isFinite(threshold) || threshold < 0 || threshold > 1 || !Number.isFinite(minimumMargin) || minimumMargin < 0 || minimumMargin > 1) {
        throw new RangeError('Match threshold and margin must be between 0 and 1.');
    }

    const matches = [];
    for (const face of faces) {
        const scoredPeople = people.flatMap(person => {
            const similarities = (person.embeddings || []).map(embedding => cosineSimilarity(face.embedding, embedding));
            if (!similarities.length) return [];
            return [{ person, similarity: Math.max(...similarities) }];
        }).sort((left, right) => right.similarity - left.similarity);

        const [best, second] = scoredPeople;
        if (!best || best.similarity < threshold || (second && best.similarity - second.similarity < minimumMargin)) continue;
        matches.push({ face, personId: best.person.id, personName: best.person.name, similarity: best.similarity });
    }
    return matches.sort((left, right) => right.similarity - left.similarity);
};

export const clusterFaces = (faces, threshold = DEFAULT_SIMILARITY_THRESHOLD) => {
    if (!Array.isArray(faces)) throw new TypeError('Faces must be an array.');
    if (!Number.isFinite(threshold) || threshold < 0 || threshold > 1) {
        throw new RangeError('Similarity threshold must be between 0 and 1.');
    }

    const groups = [];
    for (const face of faces) {
        const embedding = normalizeEmbedding(face.embedding);
        let bestGroup = null;
        let bestSimilarity = threshold;

        for (const group of groups) {
            const similarity = cosineSimilarity(group.centroid, embedding);
            if (similarity > bestSimilarity) {
                bestGroup = group;
                bestSimilarity = similarity;
            }
        }

        if (!bestGroup) {
            groups.push({ key: `suggestion-${groups.length + 1}`, centroid: embedding, faces: [face] });
            continue;
        }

        bestGroup.centroid = updateCentroid(bestGroup.centroid, embedding, bestGroup.faces.length);
        bestGroup.faces.push(face);
    }

    return groups;
};

export default { cosineSimilarity, normalizeEmbedding, updateCentroid, clusterFaces, matchFacesToPeople };