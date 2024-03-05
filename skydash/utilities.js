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

export function applyMarkdown(action) {
    const selection = window.getSelection();
    if (!selection.rangeCount) return false;
    let range = selection.getRangeAt(0);
    if (range && !selection.isCollapsed) {
        const span = document.createElement('span');
        if (action === "bold") {
            span.style["fontWeight"] = 'bold';
        }
        //span.style[action] = action === 'fontWeight' ? 'bold' : 'italic'; // Adjust based on the style being applied
        range.surroundContents(span);
        selection.removeAllRanges();
        selection.addRange(range);
    }
}