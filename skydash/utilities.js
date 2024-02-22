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