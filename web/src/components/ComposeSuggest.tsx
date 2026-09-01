"use client";

export type SuggestRow = { id: string; title: string };

export function ComposeSuggest({
  items,
  active,
  onPick,
  onActive,
}: {
  items: SuggestRow[];
  active: number;
  onPick: (title: string) => void;
  onActive: (index: number) => void;
}) {
  if (items.length === 0) return null;
  return (
    <ul
      className="compose-suggest"
      role="listbox"
      aria-label="Suggested questions"
    >
      {items.map((item, index) => (
        <li key={item.id}>
          <button
            type="button"
            role="option"
            aria-selected={index === active}
            className={`compose-suggest-item${
              index === active ? " is-active" : ""
            }`}
            onMouseDown={(event) => event.preventDefault()}
            onMouseEnter={() => onActive(index)}
            onClick={() => onPick(item.title)}
          >
            {item.title}
          </button>
        </li>
      ))}
    </ul>
  );
}
