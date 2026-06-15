export interface WorkspaceSection<T, S> {
  id: string;
  header: string;
  items: T[];
}

export function buildCollectionSections<T, S>(
  items: T[],
  getSectionId: (item: T) => string,
  getSectionHeader: (item: T) => string,
  sortSections?: (a: S, b: S) => number,
): WorkspaceSection<T, S>[] {
  const sectionsMap = new Map<string, WorkspaceSection<T, S>>();

  for (const item of items) {
    const id = getSectionId(item);
    if (!sectionsMap.has(id)) {
      sectionsMap.set(id, {
        id,
        header: getSectionHeader(item),
        items: [],
      });
    }
    sectionsMap.get(id)!.items.push(item);
  }

  const sections = Array.from(sectionsMap.values());

  if (sortSections) {
    // Note: sortSections typed with S, but sections are WorkspaceSection<T, S>
    // Assuming S was meant to be the section type for sorting.
    sections.sort(sortSections as any);
  }

  return sections;
}
