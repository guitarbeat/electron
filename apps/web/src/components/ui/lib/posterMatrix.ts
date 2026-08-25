import React from 'react';

/**
 * Fairly interleaves multiple streams of items (e.g. movies, suggestions, places)
 * based on their relative proportions without creating long homogeneous runs.
 *
 * @param streams Multiple arrays of items to interleave.
 * @returns A single unified array containing all elements in balanced, interleaved order.
 */
export function interleaveCollectionItems(
  ...streams: (React.ReactNode[] | undefined)[]
): React.ReactNode[] {
  const activeStreams = streams.filter(
    (stream): stream is React.ReactNode[] => Boolean(stream && stream.length > 0)
  );
  if (activeStreams.length === 0) return [];
  if (activeStreams.length === 1) return [...activeStreams[0]];

  const totalItemCount = activeStreams.reduce((sum, stream) => sum + stream.length, 0);
  const streamReadPointers = activeStreams.map(() => 0);
  const interleavedResult: React.ReactNode[] = [];

  for (let stepIndex = 0; stepIndex < totalItemCount; stepIndex++) {
    let optimalStreamIndex = -1;
    let maximumLag = -Infinity;

    for (let streamIndex = 0; streamIndex < activeStreams.length; streamIndex++) {
      const currentStream = activeStreams[streamIndex];
      const currentPointer = streamReadPointers[streamIndex];

      if (currentPointer < currentStream.length) {
        const idealFraction = (stepIndex + 1) / totalItemCount;
        const currentFraction = currentPointer / currentStream.length;
        const lagDifference = idealFraction - currentFraction;

        if (lagDifference > maximumLag) {
          maximumLag = lagDifference;
          optimalStreamIndex = streamIndex;
        }
      }
    }

    if (optimalStreamIndex !== -1) {
      const selectedItem = activeStreams[optimalStreamIndex][streamReadPointers[optimalStreamIndex]];
      interleavedResult.push(selectedItem);
      streamReadPointers[optimalStreamIndex]++;
    }
  }

  return interleavedResult;
}

/**
 * Calculates a penalty score for placing a candidate item at a specific grid position,
 * penalizing spatial proximity to identical duplicate items.
 */
function calculateNeighborPenalty(
  candidateIndex: number,
  columnIndex: number,
  rowIndex: number,
  grid: number[][],
  itemFrequencies: number[],
  cardsPerBand: number
): number {
  let penalty = itemFrequencies[candidateIndex] * 12;

  // 1. Vertical neighbors within the same column
  const verticalLookback = Math.min(cardsPerBand - 1, 3);
  for (let distance = 1; distance <= verticalLookback; distance++) {
    const priorRow = (rowIndex - distance + cardsPerBand) % cardsPerBand;
    if (grid[columnIndex][priorRow] === candidateIndex) {
      penalty += distance === 1 ? 5000 : distance === 2 ? 1500 : 500;
    }
  }

  // 2. Horizontal and diagonal neighbors in immediate left column
  if (columnIndex > 0) {
    for (let rowOffset = -2; rowOffset <= 2; rowOffset++) {
      const neighborRow = (rowIndex + rowOffset + cardsPerBand) % cardsPerBand;
      if (grid[columnIndex - 1][neighborRow] === candidateIndex) {
        penalty += rowOffset === 0 ? 6000 : Math.abs(rowOffset) === 1 ? 2500 : 800;
      }
    }
  }

  // 3. Horizontal and diagonal neighbors two columns to the left
  if (columnIndex > 1) {
    for (let rowOffset = -1; rowOffset <= 1; rowOffset++) {
      const neighborRow = (rowIndex + rowOffset + cardsPerBand) % cardsPerBand;
      if (grid[columnIndex - 2][neighborRow] === candidateIndex) {
        penalty += rowOffset === 0 ? 1200 : 400;
      }
    }
  }

  // Add deterministic jitter to break ties evenly
  const deterministicJitter = (((columnIndex * 37 + rowIndex * 19 + candidateIndex * 13) % 23) / 23) * 0.1;
  return penalty + deterministicJitter;
}

/**
 * Generates an optimal 2D poster distribution matrix that minimizes duplicate neighbors
 * across adjacent columns and vertical rows.
 *
 * @param posterCards The list of card ReactNodes to distribute.
 * @param columnCount Number of visual columns in the wall.
 * @param cardsPerBand Number of cards per repeated band in each column.
 * @returns A 2D array [columns][rows] of ReactNodes.
 */
export function computePosterMatrix(
  posterCards: React.ReactNode[],
  columnCount: number,
  cardsPerBand: number
): React.ReactNode[][] {
  const totalCards = posterCards.length;
  if (totalCards === 0) return [];

  if (totalCards === 1) {
    const singleCard = posterCards[0];
    return Array.from({ length: columnCount }, (_, columnIndex) =>
      Array.from({ length: cardsPerBand }, (_, rowIndex) =>
        React.isValidElement(singleCard)
          ? React.cloneElement(singleCard, {
              key: `col-${columnIndex}-card-${rowIndex}-0`,
            })
          : singleCard
      )
    );
  }

  const grid: number[][] = Array.from({ length: columnCount }, () =>
    Array(cardsPerBand).fill(-1)
  );
  const itemFrequencies = Array(totalCards).fill(0);

  for (let columnIndex = 0; columnIndex < columnCount; columnIndex++) {
    for (let rowIndex = 0; rowIndex < cardsPerBand; rowIndex++) {
      let optimalCandidateIndex = 0;
      let lowestPenalty = Infinity;

      for (let candidateIndex = 0; candidateIndex < totalCards; candidateIndex++) {
        const candidatePenalty = calculateNeighborPenalty(
          candidateIndex,
          columnIndex,
          rowIndex,
          grid,
          itemFrequencies,
          cardsPerBand
        );

        if (candidatePenalty < lowestPenalty) {
          lowestPenalty = candidatePenalty;
          optimalCandidateIndex = candidateIndex;
        }
      }

      grid[columnIndex][rowIndex] = optimalCandidateIndex;
      itemFrequencies[optimalCandidateIndex]++;
    }
  }

  return grid.map((columnIndices, columnIndex) =>
    columnIndices.map((itemIndex, rowIndex) => {
      const cardElement = posterCards[itemIndex];
      return React.isValidElement(cardElement)
        ? React.cloneElement(cardElement, {
            key: `col-${columnIndex}-row-${rowIndex}-item-${itemIndex}`,
          })
        : cardElement;
    })
  );
}
