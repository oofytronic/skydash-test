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

    // Check if the selection is already wrapped in the desired tag
    const parentNode = selection.anchorNode.parentElement;
    const alreadyApplied = (action === "bold" && parentNode.tagName === "STRONG") ||
                            (action === "italicize" && parentNode.tagName === "EM") ||
                            (action === "underline" && parentNode.style.textDecoration === "underline");

    // Toggle the formatting based on the current state
    if (alreadyApplied) {
        // If already applied, unwrap the text from the tag
        let textNode = document.createTextNode(parentNode.textContent);
        parentNode.parentNode.replaceChild(textNode, parentNode);
        selection.removeAllRanges();
        let newRange = document.createRange();
        newRange.selectNodeContents(textNode);
        selection.addRange(newRange);
    } else {
        // Apply the formatting by wrapping the selected text
        let tag;
        switch (action) {
            case "bold":
                tag = document.createElement('strong');
                break;
            case "italicize":
                tag = document.createElement('em');
                break;
            case "underline":
                const span = document.createElement('span');
                span.style.textDecoration = 'underline';
                tag = span;
                break;
            case "link":
                if (linkURL) {
                    tag = document.createElement('a');
                    tag.href = linkURL;
                    tag.textContent = range.toString();
                    range.deleteContents(); // Remove the selected text
                    range.insertNode(tag);
                }
                break;
        }

        if (action !== "link") {
            range.surroundContents(tag);
        }

        // Update the selection to the new node
        selection.removeAllRanges();
        let newRange = document.createRange();
        newRange.selectNodeContents(tag);
        selection.addRange(newRange);
    }
}