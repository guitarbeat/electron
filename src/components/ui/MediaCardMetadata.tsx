import React from "react";

interface MediaCardMetadataProps {
  items: (string | number | undefined | null)[];
  chips?: string[];
  badge?: string;
  className?: string;
}

export const MediaCardMetadata: React.FC<MediaCardMetadataProps> = ({
  items,
  chips = [],
  badge,
  className = "",
}) => {
  const filteredItems = items.filter(Boolean);

  return (
    <div className={`media-card-metadata ${className}`.trim()}>
      <div className="media-card-metadata__row">
        {filteredItems.map((item, index) => (
          <React.Fragment key={`${item}-${index}`}>
            {index > 0 ? (
              <span className="media-card-metadata__separator">&bull;</span>
            ) : null}
            <span className="media-card-metadata__item">{item}</span>
          </React.Fragment>
        ))}
        {badge && (
          <span
            className="media-card-metadata__badge"
            aria-label={`Badge: ${badge}`}
          >
            {badge}
          </span>
        )}
      </div>
      {chips.length > 0 && (
        <div className="media-card-metadata__chips-row">
          {chips.map((chip) => (
            <span key={chip} className="media-card-metadata__chip">
              {chip}
            </span>
          ))}
        </div>
      )}
    </div>
  );
};

export default MediaCardMetadata;
