// SKYDASH
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
		<button id="dashboardButton">Dashboard</button>
		<button id="collectionsButton">Collections</button>
		<button id="mediaButton">Media Library</button>
	</div>

	<dialog data-sky-dialog="dashboard" id="dashboardDialog" class="dashboard-dialog"></dialog>
	<dialog data-sky-dialog="collections" id="collectionsDialog" class="collections-dialog"></dialog>
	<dialog data-sky-dialog="media" id="mediaDialog" class="media-dialog"></dialog>
	<dialog data-sky-dialog="edit" id="editDialog" class="edit-dialog"></dialog>
	`;

	document.body.insertAdjacentHTML('beforeend', skyHTML);
}

function injectSkyDashStyles() {
    const cssStyles = `
        /* Dialog */
    	dialog {
			border: 1px solid #ccc;
			border-radius: 10px;
			padding: 20px;
			box-shadow: 0 4px 6px rgba(0,0,0,0.1);
			background-color: #F6F6F6;
			overflow-y: auto;
			z-index: 10000;
    	}

    	dialog::backdrop {
          background-color: rgb(0 0 0 / 0%);
        }

        dialog[open]::backdrop {
          background-color: rgb(0 0 0 / 0%);
        }

        #collectionsDialog, #mediaDialog, #editDialog {
            position: fixed;
            top: 1rem;
            right: 1rem;
            margin-right: 0;
        }

        #dashboardDialog {
		  position: fixed;
		  width: 90%;
			height: 90%;
		  top: 50%;
		  left: 50%;
		  transform: translate(-50%, -50%);
		  z-index: 10000;
		}

        /* SkyDash Menu */
        .skydash-menu {
            position: fixed;
            bottom: 1rem;
            right: 1rem;
            border: 1px solid #ccc;
			border-radius: 10px;
			padding: 20px;
			box-shadow: 0 4px 6px rgba(0,0,0,0.1);
            background-color: #F6F6F6;
        }

        /* Editables */
		.editable-wrapper {
		    position: relative;
		    display: block;
		    border: 1px solid transparent;
		    border-radius: 0 5px 5px 5px;
		    width: fit-content;
		    height: fit-content;
		}

		.editable-wrapper:hover {
			border: #7F557B 1px solid;
		}

		.sky-edit-toolbar {
		    position: absolute;
		    top: -33px;
		    left: -1px;
		    display: none;
		    background-color: #7F557B;
		    border: 1px solid #7F557B;
		    border-radius: 5px 5px 0 0;
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

function openFieldEditor(field) {

	function activateFieldInDialog(fieldName) {
	    const input = document.querySelector(`[name="${fieldName}"]`);
	    if (input) {
	        input.focus();
	    }
	}

	const fieldValue = field.getAttribute('data-sky-field');

    // Step 1: Parse the data-sky-field value
    const parts = fieldValue.split('.');
    if (parts.length !== 3) {
        console.error('Invalid data-sky-field format');
        return;
    }
    const [collectionName, instanceId, fieldName] = parts;

    const collections = JSON.parse(localStorage.getItem('collections')) || {};
    const collection = collections.find(collection => collection.pluralId === collectionName);
    if (!collection) {
        console.error('Collection not found');
        return;
    }

    const instance = collection.instances.find(instance => instance.id === instanceId);
    if (!instance) {
        console.error('Instance not found');
        return;
    }

    const collectionsDialog = document.querySelector('[data-sky-dialog="collections"]');
	const body = renderInstanceEditForm(collection, instance);
	collectionsDialog.innerHTML = body;
	collectionsDialog.show();

    activateFieldInDialog(fieldName);
}

function inferEditableType(tagName) {
    switch (tagName.toUpperCase()) {
        case 'IMG':
            return 'image';
        case 'P':
            return 'text';
        case 'DIV':
            return 'block';
        case 'SECTION':
            return 'block';
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

function handleEditableField(wrapper, action, skyKey, index) {
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

function wrapEditableElement(element, index) {
    const wrapper = document.createElement('div');
    wrapper.className = 'editable-wrapper';
    wrapper.setAttribute('data-sky-index', index);

    let toolbarHTML;

    if (element.getAttribute('data-sky-field')) {
    	toolbarHTML = renderEditableToolbar("field", index);
    } else {
    	const editableType = inferEditableType(element.tagName);
    	toolbarHTML = renderEditableToolbar(editableType, index);
    }
    
    element.parentNode.insertBefore(wrapper, element);
    
    wrapper.appendChild(element);

    const toolbar = document.createElement('div');
    toolbar.innerHTML = toolbarHTML;

    // Append each toolbar button as a child of the wrapper. 
    Array.from(toolbar.children).forEach(child => {
        wrapper.appendChild(child);
    });
}

function editEditable(wrapper, button, skyKey) {
	const index = wrapper.getAttribute('data-sky-index');
	const type = button.getAttribute('data-sky-type');
	const field = wrapper.querySelector('[data-sky-field]');
    const editable = wrapper.querySelector('[data-sky-editable]');
    const action = button.getAttribute('data-sky-action');

    if (type === "text") {
    	if (action === "edit") {
    		const newText = prompt('Edit text:', editable.innerText || editable.textContent);

		    if (newText !== null && newText !== editable.innerText) {
		        editable.innerText = newText; // Update the text content

		        updateEditableStorage(index, skyKey, wrapper.outerHTML);
		    }
    	}

    	if (action === "bold") {
    		alert('BOLD');
    	}

    	if (action === "italicize") {
    		alert('ITALICIZE');
    	}
    }

    if (type === "block") {
    	alert('Editing BLOCK');
    }

    if (type === "image") {
    	alert('Editing IMAGE');
    }

    if (type === "field") {
    	openFieldEditor(field);
    }
}

function updateEditableStorage(index, skyKey, newContent) {
    const storedEditables = JSON.parse(localStorage.getItem(skyKey)) || {};
    storedEditables[index] = newContent; // Update or add the new content by index
    localStorage.setItem(skyKey, JSON.stringify(storedEditables)); // Save back to localStorage
}

// MEDIA LIBRARY
function addMediaToLibrary(imageSrc) {
    const mediaLibrary = JSON.parse(localStorage.getItem('mediaLibrary')) || [];
    mediaLibrary.push({ url: imageSrc });
    localStorage.setItem('mediaLibrary', JSON.stringify(mediaLibrary));
}

// INCOMPLETE
function deleteMedia(imageSrc) {
	 // Filter out the instance to delete
    const mediaLibrary = JSON.parse(localStorage.getItem('mediaLibrary'));

    mediaLibrary

    // Save the updated collections back to localStorage
    localStorage.setItem('collections', JSON.stringify(collections));
}

function useMediaFromLibrary() {}

function loadMediaPreviews() {
    const mediaLibrary = JSON.parse(localStorage.getItem('mediaLibrary')) || [];
    const mediaGallery = document.getElementById('mediaGallery');
    mediaGallery.innerHTML = '';
    mediaLibrary.forEach((media, index) => {
        const imageElement = `
        <div style="border: 1px solid black;">
        	<img src="${media.url}" alt="Image ${index}" style="width: 100px; margin: 5px;">
        	<button class="delete-media-button">Delete</button>
        </div>
        `;
        mediaGallery.innerHTML += imageElement;
    });
}

function readAndPreviewImage(file) {
    const reader = new FileReader();
    reader.onload = function(event) {
        const imageSrc = event.target.result;
        addMediaToLibrary(imageSrc);
        loadMediaPreviews();
    };
    reader.readAsDataURL(file);
}

// TEMPLATES (HTML)
function renderMediaDialog(media) {
    return `
        <button data-sky-dialog-close="media">Close</button>
	    <input type="file" id="media-upload-input" accept="image/*" style="display:none;">
	    <button id="openFileUpload">Upload Image</button>
	    <div id="mediaGallery"></div>
    `;
}

function renderEditableToolbar(editableType, index) {
    switch (editableType) {
        case 'image':
            return `<div class="sky-edit-toolbar">
	                <button class="sky-edit-button" data-sky-index="${index}" data-sky-type="${editableType}" data-sky-action="swap-image">Swap Image</button>
                </div>`;
        case 'text':
            return `
            	<div class="sky-edit-toolbar">
	                <button class="sky-edit-button" data-sky-index="${index}" data-sky-type="${editableType}" data-sky-action="edit">Edit Text</button>
	                <button class="sky-edit-button" data-sky-index="${index}" data-sky-type="${editableType}" data-sky-action="bold">Bold</button>
	                <button class="sky-edit-button" data-sky-index="${index}" data-sky-type="${editableType}" data-sky-action="italicize">Italicize</button>
	                <button class="sky-edit-button" data-sky-index="${index}" data-sky-type="${editableType}" data-sky-action="underline">Underline</button>
	                <button class="sky-edit-button" data-sky-index="${index}" data-sky-type="${editableType}" data-sky-action="link">Insert Link</button>
                </div>
            `;
        case 'block':
            return `<div class="sky-edit-toolbar">
	                <button class="sky-edit-button" data-sky-index="${index}" data-sky-type="${editableType}" data-sky-action="block">Edit Block</button>
                </div>`;
        case 'field':
            return `<div class="sky-edit-toolbar">
	                <button class="sky-edit-button" data-sky-index="${index}" data-sky-type="${editableType}" data-sky-action="block">Edit Collection Field</button>
                </div>`;
        default:
            return `<div class="sky-edit-toolbar">
	                <button class="sky-edit-button" data-sky-index="${index}" data-sky-type="${editableType}" data-sky-action="edit">Edit</button>
                </div>`;
    }
}

function renderEditableEditForm() {
	return `<form id="editForm">
			<textarea id="editInput" name="content"></textarea>
			<input type="hidden" id="editIndex" name="index">
			<button type="submit">Save Changes</button>
			<button type="button" onclick="document.getElementById('editDialog').close();">Cancel</button>
		</form>`;
}

function renderDashboardDialog(collections) {
	return `
		<button data-sky-dialog-close="dashboard">Close</button>
		<div>
			<h1>Dashboard</h1>
			<div>
				<h2>Users</h2>
			</div>
			<div>
				<h2>Collections</h2>
			</div>
			<div>
				<h2>Site Overview</h2>
			</div>
			<div>
				<h2>Account Settings</h2>
			</div>
		</div>
	`;
}

function renderCollectionsDialog(collections) {
	return `
		<button data-sky-dialog-close="collections">Close</button>
		<button onclick="document.querySelector('#form-container').style.display = 'block';">Create Collection</button>
		<div id="form-container" style="display:none;">
			<form
				id="new-collection-form"
				style="display: flex; flex-direction: column; gap: 1rem;">
				<label>
					Plural Name
					<input type="text" name="collectionPlural" placeholder="Plural Name" required>
				</label>
				<label>
					Singular Name
					<input type="text" name="collectionSingular" placeholder="Singular Name" required>
				</label>
				<label>
					Display Name
					<input type="text" name="collectionDisplay" placeholder="Display Name" required>
				</label>
				<div>
					<p>Collection Template</p>
					<button id="addFieldButton">+ Field</button>
				</div>
				<button type="submit">Create Collection</button>
			</form>
		</div>

		${collections.length > 0 ? collections.map(collection => {
			return `
			<div>
				<h2>${collection.displayName}</h2>
				<button class="instance-view-button" data-collection-id="${collection.id}">View</button>
				<button data-collection-id="${collection.id}" class="delete-collection-button">Delete</button>
			</div>
		`;
		}).join('') : '<p>No Collections</p>'}
	`;
}

function renderInstances(collectionData, instances) {
	const schema = collectionData.schema;
    const display = instances.map(instance => {
        const fields = schema.map(field => {
            let fieldValue = instance[field.name] || '';
            // Default display if field type is not handled explicitly
            let fieldDisplay = `<div class="${field.type}"><label>${field.name}:</label> <span>${fieldValue}</span></div>`;

            switch (field.type) {
                case 'textarea':
                    fieldDisplay = `<div class="${field.type}"><label>${field.name}:</label> <span>${truncateString(fieldValue, 60)}</span></div>`;
                    break;
                case 'checkbox':
                    // Assuming boolean representation for checkbox
                    fieldValue = fieldValue ? 'Yes' : 'No';
                    break;
                case 'select':
                case 'radio':
                    // Assumed handled similarly to text fields, potentially with additional logic to match display value to option text
                    break;
                case 'color':
                    // Displaying the color with a visual representation
                    fieldDisplay = `<div class="${field.type}"><label>${field.name}:</label> <span style="background-color: ${fieldValue}; width: 20px; height: 20px; border: 1px solid #000; display: inline-block;"></span> ${fieldValue}</div>`;
                    break;
                case 'file':
                    // Simplified display, consider implementing a more complex handler for actual file objects
                    fieldDisplay = `<div class="${field.type}"><label>${field.name}:</label> <span>File uploaded</span></div>`;
                    break;
                case 'date':
                case 'datetime-local':
                case 'email':
                case 'number':
                case 'text':
                case 'time':
                case 'url':
                    // These all render similarly to the default with plain text representation
                    break;
                // Implement additional specific cases as needed
            }

            return fieldDisplay;
        }).join('');

        return `<div class="instance">${fields}
                    <button data-collection-id="${collectionData.id}" data-instance-id="${instance.id}" class="edit-instance-button">Edit</button>
                    <button data-collection-id="${collectionData.id}" data-instance-id="${instance.id}" class="delete-instance-button">Delete</button>
                </div>`;
    }).join('');


	return `
		<h1>${collectionData.displayName}</h1>
		<button class="create-instance-button" data-collection-id="${collectionData.id}">+ New ${capitalize(collectionData.singularId)}</button>
		${instances.length > 0 ? display : `<p>Add ${capitalize(collectionData.singularId)}</p>`}
	`;
}

function renderNewInstanceForm(collectionData) {
    const schema = collectionData.schema;

    const fields = schema.map(field => {
        switch (field.type) {
            case 'text':
                return `<label>${field.name}<input type="text" name="${field.name}" placeholder="${field.name}" required></label>`;
            case 'textarea':
                return `<label>${field.name}<textarea name="${field.name}" placeholder="${field.name}" required></textarea></label>`;
            case 'number':
                return `<label>${field.name}<input type="number" name="${field.name}" placeholder="Enter a number" required></label>`;
            case 'email':
                return `<label>${field.name}<input type="email" name="${field.name}" placeholder="Enter an email" required></label>`;
            case 'date':
                return `<label>${field.name}<input type="date" name="${field.name}" required></label>`;
            case 'time':
                return `<label>${field.name}<input type="time" name="${field.name}" required></label>`;
            case 'datetime-local':
                return `<label>${field.name}<input type="datetime-local" name="${field.name}" required></label>`;
            case 'select':
                // Placeholder for select; actual options should come from the schema or related configuration
                return `<label>${field.name}<select name="${field.name}"><option value="option1">Option 1</option></select></label>`;
            case 'checkbox':
                return `<label><input type="checkbox" name="${field.name}" value="true"> ${field.name}</label>`;
            case 'radio':
                // Placeholder for radio buttons; actual options should be dynamically generated
                return `<fieldset>
                            <legend>${field.name}</legend>
                            <label><input type="radio" name="${field.name}" value="option1"> Option 1</label>
                            <label><input type="radio" name="${field.name}" value="option2"> Option 2</label>
                        </fieldset>`;
            case 'url':
                return `<label>${field.name}<input type="url" name="${field.name}" placeholder="https://example.com" required></label>`;
            case 'color':
                return `<label>${field.name}<input type="color" name="${field.name}" required></label>`;
            case 'file':
                return `<label>${field.name}<input type="file" name="${field.name}" required></label>`;
            // Implement WYSIWYG/Rich Text editor initialization in a separate step, as it requires JavaScript
            default:
                return `<p>Unsupported field type: ${field.type}</p>`;
        }
    }).join('');

    return `
    <form
        id="new-instance-form"
        style="display: flex; flex-direction: column; gap: 1rem;"
        data-collection-id="${collectionData.id}">
        ${fields}
        <button type="submit">Create ${capitalize(collectionData.singularId)}</button>
    </form>
    `;
}

function renderInstanceEditForm(collectionData, instance) {
	const schema = collectionData.schema;
	const fields = schema.map(field => {
		if (instance.hasOwnProperty(field.name)) {
			if (field.type === 'text') {
				return `
				<label for="${field.name}">
					${field.name}
					<input type="text" id="${field.name}" name="${field.name}" placeholder="${field.name}" value="${instance[field.name]}" required>
				</label>`;
			}

			if (field.type === 'textarea') {
				return `
				<label for="${field.name}">
					${field.name}
					<textarea id="${field.name}" name="${field.name}" placeholder="${field.name}" required>${instance[field.name]}</textarea>
				</label>`;
			}
		}
	}).join('');

	return `
		<form
			id="edit-instance-form"
			style="display: flex; flex-direction: column; gap: 1rem;"
			data-collection-id="${collectionData.id}"
			data-instance-id="${instance.id}"
			>
			${fields}
			<button type="submit">Update</button>
		</form>
	`;
}

// TEMPLATES (DATA)
function genNewCollectionObject(data) {
	return {
		id: data.newId,
		singularId: data.collectionSingular,
		pluralId: data.collectionPlural,
		displayName: data.collectionDisplay,
		createdAt: new Date().toISOString(),
		updatedAt: new Date().toISOString(),
		schema: [],
		instances: []
	};
}

function genNewInstanceObject(data) {
	return {
		id: data.newId,
		createdAt: new Date().toISOString(),
		updatedAt: new Date().toISOString()
	}
}

function genNewTempFormData(event) {
	const formData = new FormData(event.target);
	const tempData = {};
	tempData.newId = Date.now().toString();

	for (let [key, value] of formData.entries()) {
	    tempData[key] = value;
	}

	return tempData;
}

//CACHE LAYER
function readMedia() {
	return {};
}

function readEditables(skyKey) {
	let editableContent = {};

    if (localStorage.getItem(skyKey)) {
        editableContent = JSON.parse(localStorage.getItem(skyKey));
    }

    return editableContent;
}

function updateEditable(skyKey, index, newContent) {
    const editableContent = JSON.parse(localStorage.getItem(skyKey)) || {};
    editableContent[index] = newContent;
    localStorage.setItem(skyKey, JSON.stringify(editableContent));
}

function readCollections() {
    // Attempt to retrieve the collections object from localStorage
    const collectionsJSON = localStorage.getItem('collections');

    // Check if the collections object exists in localStorage
    if (collectionsJSON) {
        try {
            // Parse the JSON string back into an object and return it
            return JSON.parse(collectionsJSON);
        } catch (e) {
            console.error('Error parsing collections from localStorage:', e);
            // Return a default value in case of error
            return {};
        }
    } else {
        // Return a default value if the collections object doesn't exist in localStorage
        return {};
    }
}

function readCollection(collectionId) {
	const collections = readCollections();
	const collection = collections.find(c => c.id === collectionId);
	return collection;
}

function createCollection(newCollection) {
	// Retrieve existing collections from localStorage or initialize to an empty object/array
	let collections = JSON.parse(localStorage.getItem('collections')) || [];

	// Add the new collection
	collections.push(newCollection);

	// Save the updated collections back to localStorage
	localStorage.setItem('collections', JSON.stringify(collections));

	// Optionally, refresh the collections display or close the dialog
}

function updateCollection() {
	// Update Fields (*optional* fields only)
}

function deleteCollection(collectionId) {
	const collections = readCollections();
    const newCollections = collections.filter(c => c.id !== collectionId);
    localStorage.setItem('collections', JSON.stringify(newCollections));
}

function readInstances(collectionId) {
	const collections = readCollections();
	const collection = collections.find(c => c.id === collectionId);
	const instances = collection.instances;
	return instances;
}

function readInstance(collectionId, instanceId) {
	const collections = readCollections();
	const instances = readInstances(collectionId);
	const instance = instances.find(i => i.id === instanceId);
	return instance;
}

function createInstance(collectionId, newInstance) {
    // Retrieve existing collections from localStorage
    const collections = readCollections();
    
    // Find the collection by ID
    const collectionIndex = collections.findIndex(c => c.id === collectionId);
    if (collectionIndex === -1) {
        console.error('Collection not found');
        return;
    }

    collections[collectionIndex].instances.push(newInstance);

    // Save the updated collections array back to localStorage
    localStorage.setItem('collections', JSON.stringify(collections));
}

function updateInstance(newInstance, currentInstance, collectionId) {
	const updatedInstance = {...currentInstance, ...newInstance};
    
    let collections = readCollections();

    const collectionIndex = collections.findIndex(collection => collection.id === collectionId);
    if (collectionIndex === -1) {
        console.error('Collection not found');
        return;
    }

    const instanceIndex = collections[collectionIndex].instances.findIndex(instance => instance.id === currentInstance.id);
    if (instanceIndex === -1) {
        console.error('Instance not found');
        return;
    }

    collections[collectionIndex].instances[instanceIndex] = updatedInstance;

    // Save the updated collections back to localStorage
    localStorage.setItem('collections', JSON.stringify(collections));
}

function deleteInstance(collectionId, instanceId) {
    const collections = readCollections();
    
    // Find the collection by ID
    const collectionIndex = collections.findIndex(c => c.id === collectionId);
    if (collectionIndex === -1) {
        console.error('Collection not found');
        return;
    }

    // Filter out the instance to delete
    const filteredInstances = collections[collectionIndex].instances.filter(instance => instance.id !== instanceId);

    // Reassign the filtered instances back to the collection
    collections[collectionIndex].instances = filteredInstances;

    // Save the updated collections back to localStorage
    localStorage.setItem('collections', JSON.stringify(collections));
}

// EVENT LISTENERS
document.addEventListener('DOMContentLoaded', () => {
	createSkyDashUI();
	injectSkyDashStyles();

	// SKY ELEMENTS
	const dashboardDialog = document.querySelector('[data-sky-dialog="dashboard"]');
	const collectionsDialog = document.querySelector('[data-sky-dialog="collections"]');
	const mediaDialog = document.querySelector('[data-sky-dialog="media"]');
	const editDialog = document.querySelector('[data-sky-dialog="edit"');
	const skyKey = document.body.getAttribute('data-sky-key');
	const editableElements = document.querySelectorAll('[data-sky-editable]');
	const editableFields = document.querySelectorAll('[data-sky-field]');
	const storedEditables = JSON.parse(localStorage.getItem(skyKey)) || {};

    editableElements.forEach((element, index) => {
        const storedHtml = storedEditables[index];
        if (storedHtml) {
            // Apply stored edits
            element.outerHTML = storedHtml;
        }
        // Re-query the element in case it was replaced by storedHtml
        const updatedElement = document.querySelectorAll('[data-sky-editable]')[index];
        wrapEditableElement(updatedElement, index);
    });

    editableFields.forEach((element, index) => {
    	wrapEditableElement(element, index);
    });

	// EVENTS (CLICK)
	document.body.addEventListener('click', (event) => {

		if (event.target.matches('.sky-edit-button')) {
            const wrapper = event.target.closest('.editable-wrapper');
            const button = event.target;
            editEditable(wrapper, button, skyKey);
        }

		// DIALOGS (OPEN)
        if (event.target.matches('#dashboardButton')) {
        	dashboardDialog.show();
        	const body = renderDashboardDialog();
			dashboardDialog.innerHTML = body;
        }

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

		if (event.target.matches('.delete-media-button')) {
			deleteMedia();
			loadMediaPreviews();
		}

		// DIALOGS (CLOSE)
		if (event.target.matches('[data-sky-dialog-close="dashboard"]')) {
			dashboardDialog.close();
		}

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

	// EVENTS (SUBMIT)
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

	// EVENTS (CHANGE)
	document.body.addEventListener('change', (event) => {
		if (event.target.matches('#media-upload-input')) {
			const file = event.target.files[0];
	        if (file) {
	            readAndPreviewImage(file);
	        }
		}
	});
});