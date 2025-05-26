export interface DeckNode {
  name: string;
  fullName: string;
  children: Record<string, DeckNode>;
  isExpanded?: boolean;
  level: number;
}

export function organizeDeckTree(decks: string[]): DeckNode {
  const root: DeckNode = { name: '', fullName: '', children: {}, level: -1 };

  decks.forEach(deck => {
    const parts = deck.split('::');
    let current = root;
    let fullPath = '';

    parts.forEach((part, index) => {
      fullPath = fullPath ? `${fullPath}::${part}` : part;
      if (!current.children[part]) {
        current.children[part] = {
          name: part,
          fullName: fullPath,
          children: {},
          isExpanded: false, // Start collapsed
          level: index
        };
      }
      current = current.children[part];
    });
  });

  return root;
}

export function flattenDeckTree(node: DeckNode, result: string[] = []): string[] {
  Object.values(node.children)
    .sort((a, b) => a.name.localeCompare(b.name))
    .forEach(child => {
      result.push(child.fullName);
      // Only show children if explicitly expanded
      if (child.isExpanded === true && Object.keys(child.children).length > 0) {
        flattenDeckTree(child, result);
      }
    });
  return result;
}
