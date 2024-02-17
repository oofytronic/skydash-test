// MEDIA LIBRARY
export function addMediaToLibrary(imageSrc) {
    const mediaLibrary = JSON.parse(localStorage.getItem('mediaLibrary')) || [];
    mediaLibrary.push({ url: imageSrc });
    localStorage.setItem('mediaLibrary', JSON.stringify(mediaLibrary));
}

export function loadMediaPreviews() {
    const mediaLibrary = JSON.parse(localStorage.getItem('mediaLibrary')) || [];
    const mediaGallery = document.getElementById('mediaGallery');
    mediaGallery.innerHTML = '';
    mediaLibrary.forEach((media, index) => {
        const imageElement = `<img src="${media.url}" alt="Image ${index}" style="width: 100px; margin: 5px;">`;
        mediaGallery.innerHTML += imageElement;
    });
}

export function readAndPreviewImage(file) {
    const reader = new FileReader();
    reader.onload = function(event) {
        const imageSrc = event.target.result;
        addMediaToLibrary(imageSrc);
        loadMediaPreviews();
    };
    reader.readAsDataURL(file);
}