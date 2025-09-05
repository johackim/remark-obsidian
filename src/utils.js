export const removeIgnoreParts = (tree) => {
    const start = tree.children.findIndex(({ commentValue }) => commentValue?.trim() === 'ignore');
    const end = tree.children.findIndex(({ commentValue }) => commentValue?.trim() === 'end ignore');

    if (start === -1) return;

    const elementsToDelete = (end === -1 ? tree.children.length : end) - start + 1;
    tree.children.splice(start, elementsToDelete);

    removeIgnoreParts(tree);
};

export const addPaywall = (tree, paywall) => {
    if (!paywall) return;

    const start = tree.children.findIndex(({ commentValue }) => commentValue?.trim() === 'private');
    const end = tree.children.findIndex(({ commentValue }) => commentValue?.trim() === 'end private');

    if (start === -1) return;

    const elementsToReplace = (end === -1 ? tree.children.length : end) - start + 1;
    tree.children.splice(start, elementsToReplace, { type: 'html', value: paywall });

    addPaywall(tree);
};
