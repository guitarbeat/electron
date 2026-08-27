import re

with open("apps/web/src/components/movies/MovieSectionBody.tsx", "r") as f:
    content = f.read()

# Remove the early return
content = re.sub(r'  if \(collectionState === "loading"\) \{\n    return <DriftWallLoading isMobile=\{isMobile\} />;\n  \}\n', '', content)

# Change unifiedCards logic
new_logic = """
  const allPosters = [...sections.queue, ...sections.completed];
  const suggestionCards = sections.suggestions.map((suggestion) => (
    <SuggestionCard
      key={`suggestion-${suggestion.id}`}
      suggestion={suggestion}
      onAccept={() => void onAcceptSuggestion(suggestion)}
      onReject={() => void onRejectSuggestion(suggestion)}
      canRespond={Boolean(currentUser)}
      disableActions={!currentUser}
      isProcessing={processingSuggestionId === suggestion.id}
    />
  ));
  const movieCards = allPosters.map(renderMovie);
  
  let unifiedCards: React.ReactNode[];
  if (collectionState === "loading") {
    const skeletonCount = isMobile ? 15 : 40;
    unifiedCards = Array.from({ length: skeletonCount }, (_, i) => (
      <div
        key={`loading-tile-${i}`}
        className="drift-wall-loading__tile"
        style={
          {
            "--loading-tile": Math.floor(i / (isMobile ? 3 : 8)),
            "--loading-column": i % (isMobile ? 3 : 8),
            width: "100%",
            height: "100%",
          } as React.CSSProperties
        }
      />
    ));
  } else {
    unifiedCards = interleaveCollectionItems(
      suggestionCards,
      movieCards,
      posterPlaceCards,
    );
  }
"""

content = re.sub(
    r'  const allPosters = \[.*?posterPlaceCards,\n  \);',
    new_logic.strip(),
    content,
    flags=re.DOTALL
)

with open("apps/web/src/components/movies/MovieSectionBody.tsx", "w") as f:
    f.write(content)
