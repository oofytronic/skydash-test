import {genNewCollectionObject, genNewInstanceObject, genNewTempFormData, readMedia, readEditables, updateEditable, readCollections, readCollection, createCollection, updateCollection, deleteCollection, readInstances, readInstance, createInstance, updateInstance, deleteInstance, } from './data.js';
import {renderMediaDialog, renderEditableToolbar, renderEditableEditForm, renderCollectionsDialog, renderInstances, renderNewInstanceForm, renderInstanceEditForm} from './templates.js';
import {addMediaToLibrary, loadMediaPreviews, readAndPreviewImage} from './media.js';

// UTILITIES
function capitalize(str) {
    return str.charAt(0).toUpperCase() + str.slice(1);
}

function truncateString(str, maxLength = 60) {
    if (str.length > maxLength) {
        return str.substring(0, maxLength - 3) + '...';
    } else {
        return str;
    }
}

// SKYDASH UI (GOOD)
function createSkyDashUI() {
	const skyHTML = `
	<div class="skydash-menu">
		<button id="collectionsButton">Collections</button>
		<button id="mediaButton">Media Library</button>
	</div>

	<dialog data-sky-dialog="collections" id="collectionsDialog" class="collections-dialog"></dialog>
	<dialog data-sky-dialog="media" id="mediaDialog" class="media-dialog"></dialog>
	<dialog data-sky-dialog="edit" id="editDialog" class="edit-dialog"></dialog>
	`;

	document.body.insertAdjacentHTML('beforeend', skyHTML);
}

function injectSkyDashStyles() {
    const cssStyles = `
        /* Dialog */
        dialog[open] {

        }

        dialog {
            position: fixed;
            top: 1rem;
            right: 1rem;
            margin-right: 0;
            border: 1px solid black;
        }

        dialog::backdrop {
          background-color: rgb(0 0 0 / 0%);
        }

        dialog[open]::backdrop {
          background-color: rgb(0 0 0 / 0%);
        }

        /* SkyDash Menu */
        .skydash-menu {
            position: fixed;
            bottom: 1rem;
            right: 1rem;
            border: 1px black solid;
            padding: 1rem;
            background-color: #F6F6F6;
        }

        /* Editables */
		.editable-wrapper {
		    position: relative;
		    display: block;
		     border: 1px solid transparent;
		}

		.editable-wrapper:hover {
			border: #7F557B 1px solid;
		}

		.sky-edit-toolbar {
		    position: absolute;
		    top: 0;
		    left: 0;
		    display: none;
		    background-color: #7F557B;
		    border: 1px solid #7F557B;
		    padding: 5px;
		    white-space: nowrap; /* Keeps the toolbar in a single line */
		}

		.sky-edit-button {
		}

		.editable-wrapper:hover .sky-edit-toolbar {
			display: block;
		}

		#editForm {
			display: flex;
			flex-direction: column;
		}
    `;

    const styleSheet = document.createElement('style');
    styleSheet.type = 'text/css';
    styleSheet.textContent = cssStyles.trim();
    document.head.appendChild(styleSheet);
}

// EDITABLE CONTENT
function applyEditableContent(editableElements, storedEditables) {
    editableElements.forEach((element, index) => {
        if (index in storedEditables) {
            element.outerHTML = storedEditables[index];
        }
    });
}

function handleEditableInForm(event, skyKey) {
    const index = event.target.getAttribute('data-edit-index');
    const elementToEdit = document.querySelectorAll('[data-sky-editable]')[index];

    if(elementToEdit) {
        const editDialog = document.getElementById('editDialog');

	    const body = renderEditableEditForm();
	    editDialog.innerHTML = body;

	    const editIndex = document.getElementById('editIndex');
	    editIndex.value = index;

	    editDialog.setAttribute('data-sky-key', skyKey);

	    editDialog.show();
    }
}

function inferEditableType(tagName) {
    switch (tagName.toUpperCase()) {
        case 'IMG':
            return 'image';
        case 'P':
            return 'text';
        case 'DIV':
            return 'block';
        // Add more cases as needed
        default:
            return 'unknown';
    }
}

function handleEditableTextAction(wrapper, action, skyKey, index) {
    const textElement = wrapper.querySelector('[data-sky-editable]');
    let newContent = '';

    if (action === 'bold') {
        textElement.style.fontWeight = textElement.style.fontWeight === 'bold' ? '' : 'bold';
        newContent = textElement.outerHTML;
    } else if (action === 'italic') {
        textElement.style.fontStyle = textElement.style.fontStyle === 'italic' ? '' : 'italic';
        newContent = textElement.outerHTML;
    } else if (action === 'link') {
        if (!textElement.querySelector('a')) {
            const link = prompt('Enter URL:', 'http://');
            textElement.innerHTML = `<a href="${link}" target="_blank">${textElement.innerHTML}</a>`;
            newContent = textElement.outerHTML;
        }
    }

    // Update localStorage with the new content
    updateEditable(skyKey, index, newContent);
}

function handleEditableImageAction(wrapper, action, skyKey, index) {
    if (action === 'swap-image') {
        const imgElement = wrapper.querySelector('img');
        const imgUrl = prompt('Enter new image URL:');
        if (imgUrl) {
            imgElement.src = imgUrl;
            const newContent = imgElement.outerHTML;
            // Update localStorage with the new content
            updateEditable(skyKey, index, newContent);
        }
    }
}

function decorateEditables(skyKey, editableElements, storedEditables) {
    editableElements.forEach((element, index) => {
        // STORAGE
        if (!(index in storedEditables)) {
            storedEditables[index] = element.innerHTML;
            localStorage.setItem(skyKey, JSON.stringify(storedEditables));
        }

        // Infer the type of the editable element
        const editableType = inferEditableType(element.tagName);

        // Determine the suite of buttons based on the editable type
        const buttonsHTML = renderEditableToolbar(editableType, index);

        // Construct new HTML with a wrapper and specific buttons for the type
        const newHTML = `
            <div class="editable-wrapper" data-sky-type="${editableType}" data-edit-index="${index}">
                ${element.outerHTML}
                ${buttonsHTML}
            </div>
        `;

        // Replace the original element with the new structure
        element.outerHTML = newHTML;
    });
}

// EVENT LISTENERS
document.addEventListener('DOMContentLoaded', () => {
	createSkyDashUI();
	injectSkyDashStyles();

	// SKY ELEMENTS
	const collectionsDialog = document.querySelector('[data-sky-dialog="collections"]');
	const mediaDialog = document.querySelector('[data-sky-dialog="media"]');
	const editDialog = document.querySelector('[data-sky-dialog="edit"');
	const skyKey = document.body.getAttribute('data-sky-key');
	const editableElements = document.querySelectorAll('[data-sky-editable]');

	// EDITABLES
	applyEditableContent(editableElements, readEditables(skyKey));
	decorateEditables(skyKey, editableElements, readEditables(skyKey));

	// EVENTS (CLICK)
	document.body.addEventListener('click', (event) => {

		if (event.target.matches('.sky-edit-button')) {
			const action = event.target.getAttribute('data-edit-action');
            const wrapper = event.target.closest('.editable-wrapper');
            const type = wrapper.getAttribute('data-sky-type');
            const index = wrapper.getAttribute('data-edit-index'); 

            if (type === 'text') {
                handleEditableTextAction(wrapper, action, skyKey, index);
            } else if (type === 'image') {
                handleEditableImageAction(wrapper, action, skyKey, index);
            }
		}

		// DIALOGS (OPEN)
		if (event.target.matches('#collectionsButton')) {
			// DATA
			const collections = readCollections();

			// VIEW
			collectionsDialog.show();
			const body = renderCollectionsDialog(collections);
			collectionsDialog.innerHTML = body;
		}

		if (event.target.matches('#mediaButton')) {
			// DATA
			const media = readMedia();

			// VIEW
			mediaDialog.show();


			const body = renderMediaDialog(media);
			mediaDialog.innerHTML = body;

			loadMediaPreviews();
		}

		// DIALOGS (CLOSE)
		if (event.target.matches('[data-sky-dialog-close="collections"]')) {
			collectionsDialog.close();
		}

		if (event.target.matches('[data-sky-dialog-close="media"]')) {
			mediaDialog.close();
		}

		// COLLECTIONS
		if (event.target.matches('.delete-collection-button')) {
			// DATA
			const collectionId = event.target.getAttribute('data-collection-id');
			deleteCollection(collectionId);
			const collections = readCollections();

			// VIEW
			const body = renderCollectionsDialog(collections);
			collectionsDialog.innerHTML = body;
		}

		if (event.target.matches('#addFieldButton')) {
			event.preventDefault();
			const newId = Date.now().toString();
			const fieldHTML = `
                <div>
                    <label for="name-${newId}">Field Name</label>
                    <input type="text" name="name-${newId}" id="name-${newId}" placeholder="Field Name">
                    
                    <label for="type-${newId}">Field Type</label>
                    <select name="type-${newId}" id="type-${newId}">
                        <option value="text">Text</option>
                        <option value="textarea">Large Text</option>
                        <option value="number">Number</option>
                        <option value="email">Email</option>
                        <option value="date">Date</option>
                        <option value="time">Time</option>
                        <option value="datetime-local">Date & Time</option>
                        <option value="select">Dropdown</option>
                        <option value="checkbox">Checkbox</option>
                        <option value="radio">Radio Button</option>
                        <option value="url">URL</option>
                        <option value="color">Color Picker</option>
                        <option value="file">File Upload</option>
                        <!-- Additional field types can be added here -->
                    </select>
                </div>
            `;
			event.target.insertAdjacentHTML('beforebegin', fieldHTML)
		}

		// INSTANCES
		if (event.target.matches('.create-instance-button')) {
			// DATA
			const collectionId = event.target.getAttribute('data-collection-id');
			const collection = readCollection(collectionId);

			// VIEW
			const body = renderNewInstanceForm(collection);
			collectionsDialog.innerHTML = body;
		}

		if (event.target.matches('.instance-view-button')) {
			// DATA
			const collectionId = event.target.getAttribute('data-collection-id');
			const collection = readCollection(collectionId);
			const instances = readInstances(collectionId);

			// VIEW
			const body = renderInstances(collection, instances);
			collectionsDialog.innerHTML = body;
		}

		if (event.target.matches('.edit-instance-button')) {
			// DATA
			const collectionId = event.target.getAttribute('data-collection-id');
			const instanceId = event.target.getAttribute('data-instance-id');
			const collection = readCollection(collectionId);
			const instance = readInstance(collectionId, instanceId);

			// VIEW
			const body = renderInstanceEditForm(collection, instance);
			collectionsDialog.innerHTML = body;
		}

		if (event.target.matches('.delete-instance-button')) {
			// DATA
			const collectionId = event.target.getAttribute('data-collection-id');
			const instanceId = event.target.getAttribute('data-instance-id');
			deleteInstance(collectionId, instanceId);
			const collection = readCollection(collectionId);
			const instances = readInstances(collectionId);

			// VIEW
			const body = renderInstances(collection, instances);
			collectionsDialog.innerHTML = body;
		}

		if (event.target.matches("#openFileUpload")) {
			 document.getElementById('media-upload-input').click(); // Trigger file input
		}
	});

	// SUBMIT EVENTS
	document.body.addEventListener('submit', (event) => {
		// CREATE COLLECTION
		if (event.target.matches('#new-collection-form')) {
			event.preventDefault();
			//const tempData = genNewTempFormData(event);

			function getGroupsFromFormData(formData) {
			    const groupedArray = [];

			    // Use a Set to keep track of processed IDs to avoid duplication
			    const processedIds = new Set();

			    for (let [key, value] of formData.entries()) {
			        const idMatch = key.match(/-(\d+)$/); // Match the numeric ID at the end of the key

			        if (idMatch) {
			            const id = idMatch[1];

			            // Skip if this ID has already been processed
			            if (processedIds.has(id)) continue;

			            // Mark this ID as processed
			            processedIds.add(id);

			            // Attempt to find the matching name and type for this ID
			            const name = formData.get(`name-${id}`);
			            const type = formData.get(`type-${id}`);

			            // If both name and type are found, add them as an object to the array
			            if (name && type) {
			                groupedArray.push({ name, type });
			            }
			        }
			    }

			    return groupedArray;
			}

			const formData = new FormData(event.target);
			const tempData = {};
			tempData.newId = Date.now().toString();

			for (let [key, value] of formData.entries()) {
				tempData[key] = value;
			}

			const collection = genNewCollectionObject(tempData);
			collection.schema = getGroupsFromFormData(formData);
			createCollection(collection);
			const collections = readCollections();

			// VIEW
			const body = renderCollectionsDialog(collections);
			collectionsDialog.innerHTML = body;
		}

		// CREATE INSTANCE
		if (event.target.matches('#new-instance-form')) {
			event.preventDefault();
			const collectionId = event.target.getAttribute('data-collection-id');
			
			const formData = new FormData(event.target);
			const tempData = {};
			tempData.newId = Date.now().toString();

			for (let [key, value] of formData.entries()) {
				tempData[key] = value;
			}

			const newInstanceObj = genNewInstanceObject(tempData);
			const instance = {...newInstanceObj, ...tempData}

			createInstance(collectionId, instance);
			const collection = readCollection(collectionId);
			const instances = readInstances(collectionId);

			// VIEW
			const body = renderInstances(collection, instances);
			collectionsDialog.innerHTML = body;
		}

		// UPDATE INSTANCE
		if (event.target.matches('#edit-instance-form')) {
			event.preventDefault();
			const tempData = genNewTempFormData(event);
			const collectionId = event.target.getAttribute('data-collection-id');
			const instanceId = event.target.getAttribute('data-instance-id');
			
			const instance = readInstance(collectionId, instanceId);

			updateInstance(tempData, instance, collectionId);
			const collection = readCollection(collectionId);
			const instances = readInstances(collectionId);

			const body = renderInstances(collection, instances);
			collectionsDialog.innerHTML = body;
		}

		// EDIT PAGE
		if (event.target.matches('#editForm')) {
			event.preventDefault();

			const editDialog = document.getElementById('editDialog');
		    const skyKey = editDialog.getAttribute('data-sky-key');
		    const index = document.getElementById('editIndex').value;
		    const newContent = document.getElementById('editInput').value;

			// Retrieve the editable content object and update the specific item
			let editableContent = JSON.parse(localStorage.getItem(skyKey)) || {};
			editableContent[index] = newContent;
			localStorage.setItem(skyKey, JSON.stringify(editableContent));

			// Update the content on the page
			const editableElements = document.querySelectorAll('[data-sky-editable]');
			if (editableElements[index]) {
			    editableElements[index].innerHTML = newContent;
			}

			// Close the dialog
			document.getElementById('editDialog').close();
		}
	});

	// CHANGE EVENTS
	document.body.addEventListener('change', (event) => {
		if (event.target.matches('#media-upload-input')) {
			const file = event.target.files[0];
	        if (file) {
	            readAndPreviewImage(file);
	        }
		}
	});
});