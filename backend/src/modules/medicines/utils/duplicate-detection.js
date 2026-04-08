function normalizeForComparison(value) {
  return String(value || '')
    .toLowerCase()
    .replace(/[^a-z0-9\s]/g, ' ')
    .replace(/\s+/g, ' ')
    .trim();
}

function uniqueNonEmpty(values) {
  return [...new Set(values.map(normalizeForComparison).filter(Boolean))];
}

function levenshteinDistance(left, right) {
  if (left === right) {
    return 0;
  }

  if (!left.length) {
    return right.length;
  }

  if (!right.length) {
    return left.length;
  }

  const rows = Array.from({ length: left.length + 1 }, () => new Array(right.length + 1).fill(0));

  for (let row = 0; row <= left.length; row += 1) {
    rows[row][0] = row;
  }

  for (let column = 0; column <= right.length; column += 1) {
    rows[0][column] = column;
  }

  for (let row = 1; row <= left.length; row += 1) {
    for (let column = 1; column <= right.length; column += 1) {
      const substitutionCost = left[row - 1] === right[column - 1] ? 0 : 1;
      rows[row][column] = Math.min(
        rows[row - 1][column] + 1,
        rows[row][column - 1] + 1,
        rows[row - 1][column - 1] + substitutionCost
      );
    }
  }

  return rows[left.length][right.length];
}

function calculateSimilarity(left, right) {
  const normalizedLeft = normalizeForComparison(left);
  const normalizedRight = normalizeForComparison(right);

  if (!normalizedLeft || !normalizedRight) {
    return 0;
  }

  if (normalizedLeft === normalizedRight) {
    return 1;
  }

  const maxLength = Math.max(normalizedLeft.length, normalizedRight.length);

  if (!maxLength) {
    return 0;
  }

  return 1 - levenshteinDistance(normalizedLeft, normalizedRight) / maxLength;
}

function collectMedicineNameCandidates(source) {
  return uniqueNonEmpty([
    source?.name,
    source?.displayName,
    source?.brandName,
    source?.brand_name,
    source?.genericName,
    source?.generic_name,
  ]);
}

function describeMatch(score, leftValue, rightValue) {
  if (score >= 0.985) {
    return `Exact match with "${rightValue}"`;
  }

  if (score >= 0.92) {
    return `Very similar to "${rightValue}"`;
  }

  return `Looks similar to "${rightValue}"`;
}

function findPotentialDuplicateMatches(input, documents, { limit = 5 } = {}) {
  const inputCandidates = collectMedicineNameCandidates(input);

  if (!inputCandidates.length) {
    return [];
  }

  const matches = documents
    .map((document) => {
      const candidateNames = collectMedicineNameCandidates(document);
      let bestScore = 0;
      let bestInput = '';
      let bestExisting = '';

      for (const leftValue of inputCandidates) {
        for (const rightValue of candidateNames) {
          const score = calculateSimilarity(leftValue, rightValue);

          if (score > bestScore) {
            bestScore = score;
            bestInput = leftValue;
            bestExisting = rightValue;
          }
        }
      }

      if (bestScore < 0.8) {
        return null;
      }

      return {
        id: String(document._id),
        medicineId: document.medicineId || '',
        name: document.name || document.displayName || '',
        brandName: document.brandName || document.brand_name || '',
        genericName: document.genericName || document.generic_name || '',
        score: Number(bestScore.toFixed(3)),
        blocking: bestScore >= 0.92,
        matchReason: describeMatch(bestScore, bestInput, bestExisting),
        matchInput: bestInput,
        matchAgainst: bestExisting,
      };
    })
    .filter(Boolean)
    .sort((left, right) => right.score - left.score)
    .slice(0, limit);

  return matches;
}

module.exports = {
  normalizeForComparison,
  calculateSimilarity,
  findPotentialDuplicateMatches,
};
