export function computePosterMatrix<T>(
  cards: T[],
  columnCount: number,
  cardsPerBand: number,
): T[][] {
  if (!cards || cards.length === 0) {
    return Array.from({ length: columnCount }, () => []);
  }

  const columns: T[][] = Array.from({ length: columnCount }, () => []);

  cards.forEach((card, index) => {
    const col = index % columnCount;
    columns[col].push(card);
  });

  // Ensure each column has enough items to cover the scroll band
  columns.forEach((col, _colIndex) => {
    if (col.length === 0) return;
    let fillIndex = 0;
    while (col.length < cardsPerBand) {
      col.push(col[fillIndex % col.length]);
      fillIndex++;
    }
  });

  return columns;
}
