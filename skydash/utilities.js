export function capitalize(str) {
    return str.charAt(0).toUpperCase() + str.slice(1);
}

export function truncateString(str, maxLength = 60) {
    if (str.length > maxLength) {
        return str.substring(0, maxLength - 3) + '...';
    } else {
        return str;
    }
}

export function applyMarkdown(action, linkURL = '') {
    const selection = window.getSelection();
    if (!selection.rangeCount) return false;
    let range = selection.getRangeAt(0);

    if (!range || selection.isCollapsed) {
        return false; // No text is selected or there is no range
    }

    const span = document.createElement('span');

    if (action === "bold" || action === "italicize" || action === "underline") {
        span.style.fontWeight = (action === "bold") ? 'bold' : '';
        span.style.fontStyle = (action === "italicize") ? 'italic' : '';
        span.style.textDecoration = (action === "underline") ? 'underline' : '';
        range.surroundContents(span);
    } else if (action === "link" && linkURL) {
        const link = document.createElement('a');
        link.href = linkURL;
        link.textContent = range.toString();
        range.deleteContents(); // Remove the selected text
        range.insertNode(link);
    }

    selection.removeAllRanges(); // Clear the selection
    const newRange = document.createRange();
    newRange.selectNodeContents(action === "link" ? link : span);
    selection.addRange(newRange);
}
