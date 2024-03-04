import {capitalize, truncateString} from './utilities.js';

// MISC
function applyMarkdown(action) {
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

// SKYDASH UI
function createSkyDashUI() {
	const skyHTML = `
	<div class="skydash-menu">
		<button data-sky-open="dashboard">Dashboard</button>
		<button data-sky-open="collections">Collections</button>
		<button data-sky-open="media">Media Library</button>
		<div style="width: 30px; height: 30px; border-radius: 50%; background: gray;"></div>
	</div>

	<dialog data-sky-dialog="dashboard" id="dashboardDialog" class="dashboard-dialog"></dialog>
	<dialog data-sky-dialog="collections" id="collectionsDialog" class="collections-dialog"></dialog>
	<dialog data-sky-dialog="media" id="mediaDialog" class="media-dialog"></dialog>
	<dialog data-sky-dialog="edit" id="editDialog" class="edit-dialog"></dialog>
	<dialog data-sky-dialog="components" id="componentsDialog" class="components-dialog"></dialog>
	`;

	document.body.insertAdjacentHTML('beforeend', skyHTML);
}

function injectSkyDashStyles() {
    const cssStyles = `
    	button {
    		height: fit-content;
    		width: fit-content;
    	}
        /* Dialog */
    	dialog {
			border: 2px solid #ccc;
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

        #collectionsDialog, #componentsDialog, #editDialog {
            position: fixed;
            bottom: 6rem;
            right: 1rem;
            margin-right: 0;
            min-height: 30%;
            max-height: 70%;
            width: 30%;
        }

        #dashboardDialog, #mediaDialog {
			position: fixed;
			width: calc(100% - 4rem);
			height: calc(100% - 4rem);
			top: 50%;
			left: 50%;
			transform: translate(-50%, -50%);
			z-index: 10000;
		}

		#mediaGallery {
			display: flex;
			gap: 1rem;
		}

        /* SkyDash Menu */
        .skydash-menu {
            position: fixed;
            bottom: 1rem;
            right: 1rem;
            display: flex;
            align-items: center;
            gap: 1rem;
            border: 2px solid #ccc;
			border-radius: 10px;
			padding: 20px;
			box-shadow: 0 4px 6px rgba(0,0,0,0.1);
            background-color: #F6F6F6;
        }

        /* Editables */
		.editable-wrapper {
		    position: relative;
		    display: block;
		    /* border: none;
		    border-color: transparent; */
		    border-radius: 0 5px 5px 5px;
		    transition: 0.25s;
		    width: fit-content;
		    height: fit-content;
		}

		.editable-wrapper:hover {
			/* border: #7F557B 1px solid; */
			box-shadow: inset 0 0 0 2px #7F557B;
		}

		.editable-wrapper-open {
		    position: relative;
		    display: block;
		    /* border: none;
		    border-color: transparent; */
		    border-radius: 0 5px 5px 5px;
		    transition: 0.25s;
		}

		.editable-wrapper-open:hover {
			/* border: #7F557B 1px solid; */
			box-shadow: inset 0 0 0 2px #7F557B;
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

		.sky-edit-toolbar-inside {
		    position: absolute;
		    top: 0px;
		    left: -1px;
		    display: none;
		    background-color: #7F557B;
		    border: 1px solid #7F557B;
		    border-radius: 0 0 5px 0;
		    padding: 5px;
		    white-space: nowrap; /* Keeps the toolbar in a single line */
		}

		.sky-edit-button {
		}

		.editable-wrapper:hover .sky-edit-toolbar, .editable-wrapper-open:hover .sky-edit-toolbar-inside {
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
async function openFieldEditor(field) {
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

    try {
        const collections = await readCollections();
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
    } catch (error) {
        console.error('Error opening field editor:', error);
    }
}

function openComponentEditor(component) {
	const componentsDialog = document.querySelector('[data-sky-dialog="components"]');
	const body = renderComponentsDialog();
	componentsDialog.innerHTML = body;
	componentsDialog.show();
}

async function openMediaLibrary(callback) {
	// Open the media library dialog
	const mediaDialog = document.getElementById('mediaDialog')
	mediaDialog.show();
	const body = renderMediaDialog();
	mediaDialog.innerHTML = body;
	await loadMediaPreviews();

	// Handle selection of an image
  function handleMediaSelection(event) {
    const selectedImageSrc = event.target.src; // Get the src of the selected image
    callback(selectedImageSrc); // Pass the selected image src back to the callback
    document.getElementById('mediaDialog').close(); // Close the media library dialog
  }

  // Remove any previous click event listeners to prevent multiple assignments
  const mediaGallery = document.getElementById('mediaGallery');
  const existingImages = mediaGallery.querySelectorAll('img');
  existingImages.forEach(img => {
    img.removeEventListener('click', handleMediaSelection);
  });

  // Add a click event listener to each image for selection
  existingImages.forEach(img => {
    img.addEventListener('click', handleMediaSelection);
  });
}

function swapImageSource(oldImageElement, newImageSrc, index, skyKey, wrapper) {
  oldImageElement.src = newImageSrc; // Swap the src attribute of the original image
  updateEditable(skyKey, index, wrapper.outerHTML);
}

async function loadMediaPreviews() {
    const mediaLibrary = await readAllMedia();
    const mediaGallery = document.getElementById('mediaGallery');
    mediaGallery.innerHTML = '';
    mediaLibrary.forEach((media, index) => {
        const imageElement = `
        <div style="display: flex; flex-direction: column; border: 1px solid black; width: fit-content; height: fit-content;">
        	<img src="${media.url}" alt="Image ${index}" data-media-index="${index}" data-media-id="${media.id}" style="width: 100px; margin: 5px;">
        	<button class="delete-media-button">Delete</button>
        </div>
        `;
        mediaGallery.innerHTML += imageElement;
    });
}

async function readAndPreviewImage(file) {
    const reader = new FileReader();
    reader.onload = async function(event) {
        const imageSrc = event.target.result;
        addMedia(imageSrc);
        await loadMediaPreviews();
    };
    reader.readAsDataURL(file);
}

function inferEditableType(tagName) {
    switch (tagName.toUpperCase()) {
        case 'IMG':
            return 'image';
        case 'P':
            return 'text';
        case 'SPAN':
            return 'text';
        case 'DIV':
            return 'block';
        case 'SECTION':
            return 'block';
        default:
            return 'unknown';
    }
}

function wrapEditableElement(element, index) {
    const wrapper = document.createElement('div');

    let toolbarHTML;

    if (element.getAttribute('data-sky-field')) {
    	wrapper.className = 'editable-wrapper-open';
    	// wrapper.setAttribute('data-sky-index', index);
    	toolbarHTML = renderEditableToolbar("field", index);
    } else if (element.getAttribute('data-sky-component')) {
    	wrapper.className = 'editable-wrapper-open';
    	// wrapper.setAttribute('data-sky-index', index);
    	toolbarHTML = renderEditableToolbar('component', index);
    } else {
    	wrapper.className = 'editable-wrapper';
    	wrapper.setAttribute('data-sky-index', index);			
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
    const editable = wrapper.querySelector('[data-sky-element]');
    const action = button.getAttribute('data-sky-action');

    if (type === "text") {
    	if (action === "edit") {
    		const editDialog = document.querySelector('[data-sky-dialog="edit"');
    		editDialog.show();
    		const body = renderEditDialog();
    		editDialog.innerHTML = body;

    		editDialog.innerHTML += `
    		<form id="editForm" data-sky-index="${index}">
    		<input name="newEditable" id="newEditable" type="text" value="${editable.innerText || editable.textContent}">
    		<button type="submit" data-sky-index="${index}">Save</button>
    		</form>
    		`;
    	}

    	if (action === "bold") {
    		alert('BOLD');
    	}

    	if (action === "italicize") {
    		alert('ITALICIZE');
    	}
    }

    if (type === "block") {

    	const editDialog = document.querySelector('[data-sky-dialog="edit"');
    		editDialog.show();
    		const body = renderEditDialog();
    		editDialog.innerHTML = body;

    		editDialog.innerHTML += `
    		<form id="editForm" data-sky-index="${index}">
    		<div id="toolbar">
			    <button data-sky-mark="bold">Bold</button>
			    <button data-sky-mark="italicize">Italic</button>
			</div>
			<div id="editor" contenteditable="true" style="border: 1px solid #ccc; min-height: 200px;">${editable.innerText || editable.textContent}</div>
			<button type="submit" data-sky-index="${index}">Save</button>
			</form>
    		`;
    }

    if (type === "image") {
    	const imageToSwap = button.closest('.editable-wrapper, .editable-wrapper-open').querySelector('img'); // Adjust selector as needed

	    // Open the media library and define what to do once an image is selected
	    openMediaLibrary(function(selectedImageSrc) {
	      swapImageSource(imageToSwap, selectedImageSrc, index, skyKey, wrapper);
	    });
    }

    if (type === "field") {
    	openFieldEditor(field);
    }

    if (type === "component") {
    	openComponentEditor();
    }
}

// TEMPLATES (HTML)
function renderMediaDialog(media) {
    return `
    <div style="display: flex; flex-direction: column; gap: 1rem; width: 100%;">
    	<div style="display: flex; justify-content: space-between;">
	    	<h1>Media Library</h1>
	    	<div style="display: flex; gap: 1rem;">
			    <input type="file" id="media-upload-input" accept="image/*" style="display:none;">
			    <button id="openFileUpload">Upload Image</button>
			    <button data-sky-close="media">Close</button>
		    </div>
		</div>
	    
	    <div id="mediaGallery"></div>
    </div>
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
            return `<div class="sky-edit-toolbar-inside">
	                <button class="sky-edit-button" data-sky-type="${editableType}" data-sky-action="field">Edit Collection Field</button>
                </div>`;
        case 'component':
            return `<div class="sky-edit-toolbar-inside">
	                <button class="sky-edit-button" data-sky-type="${editableType}" data-sky-action="component">Edit Component</button>
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
		<div style="display: flex; justify-content: space-between; width: 100%;">
	    	<h1>Dashboard</h1>
	    	<div style="display: flex; gap: 1rem;">
			    <button data-sky-close="dashboard">Close</button>
		    </div>
		</div>
		<div>
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

function renderComponentsDialog(collections) {
	return `
		<button data-sky-close="components">Close</button>
	`;
}

function renderEditDialog(editable) {
	return `
		<button data-sky-close="edit">Cancel</button>
	`;
}

function renderCollectionsDialog(collections) {
	return `
		<button data-sky-close="collections">Close</button>
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

function genNewEditableObject(data) {
	return {
		id: data.newId,
		name: data.skyKey,
		createdAt: new Date().toISOString(),
		updatedAt: new Date().toISOString(),
		content: {}
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

// CACHE LAYER
async function openDB() {
  if (!window.indexedDB) {
    console.error("IndexedDB is not supported by this browser.");
    throw new Error("IndexedDB not supported");
  }

  return new Promise((resolve, reject) => {
    const request = indexedDB.open("SkyDashDatabase", 1);

    request.onerror = (event) => {
      console.error("Database error: ", event.target.error);
      reject(event.target.error);
    };

    request.onsuccess = (event) => {
      const db = event.target.result;
      resolve(db);
    };

    request.onupgradeneeded = (event) => {
      const db = event.target.result;
      if (!db.objectStoreNames.contains("collections")) {
        db.createObjectStore("collections", { keyPath: "id" });
      }

      if (!db.objectStoreNames.contains("mediaLibrary")) {
        db.createObjectStore("mediaLibrary", { keyPath: "id" });
      }

      if (!db.objectStoreNames.contains("editables")) {
        db.createObjectStore("editables", { keyPath: "id" });
      }
    };
  });
}

// Editables
async function initializeEditables(skyKey) {
    if (!skyKey) return;

    let editableContent = await readEditables(skyKey);

    if (Object.keys(editableContent).length === 0) {
        // If no editable content is found for the skyKey, gather initial content
        const initialContent = getEditablesFromPage();
        console.log("Initial content:", initialContent);

        // Create a new entry in IndexedDB for this skyKey
        await createEditables(skyKey, initialContent);

        editableContent = initialContent;
    }

    // Use editableContent to update the page
    updatePageWithEditables(skyKey, editableContent);
}

function getEditablesFromPage(skyKey) {
    const editables = document.querySelectorAll('[data-sky-element]');

    const content = {};

    editables.forEach((editable, index) => {
        content[index] = editable.outerHTML;
    });

    return content;
}

function updatePageWithEditables(skyKey, editableContent) {
    Object.entries(editableContent).forEach(([index, html]) => {
        const editableElement = document.querySelector(`[data-sky-element][data-sky-index="${index}"]`);
        if (editableElement) {
            editableElement.innerHTML = html;
        }
    });
}

async function createEditables(skyKey, content) {
    const db = await openDB();
    const tx = db.transaction("editables", "readwrite");
    const store = tx.objectStore("editables");
    const request = store.put({ id: skyKey, content });

    return new Promise((resolve, reject) => {
        request.onsuccess = () => resolve(request.result);
        request.onerror = (event) => reject(event.target.error);
    });
}

async function readEditables(skyKey) {
    const db = await openDB();
    const tx = db.transaction("editables", "readonly");
    const store = tx.objectStore("editables");
    const request = store.get(skyKey);

    return new Promise((resolve, reject) => {
        request.onsuccess = () => {
            const result = request.result;
            resolve(result.content);
        };
        request.onerror = () => reject(request.error);
    });
}

async function updateEditable(skyKey, index, newContent) {
    const db = await openDB();
    const tx = db.transaction("editables", "readwrite");
    const store = tx.objectStore("editables");

    // Use a promise to wait for the get operation to complete
    const editableContent = await new Promise((resolve, reject) => {
        const request = store.get(skyKey);
        request.onsuccess = () => {
            // Check if the entry exists, if not, create a new structure
            resolve(request.result || { id: skyKey, content: {} });
        };
        request.onerror = (event) => {
            reject(event.target.error);
        };
    });

    // Now, editableContent is properly awaited and should be an object or a new structure
    // Modify the content
    editableContent.content[index] = newContent;

    // Use a promise to wait for the put operation to complete
    return new Promise((resolve, reject) => {
        const updateRequest = store.put(editableContent);
        updateRequest.onsuccess = () => resolve(updateRequest.result);
        updateRequest.onerror = (event) => reject(event.target.error);
    });
}

// Collections
async function createCollection(collection) {
  const db = await openDB();
  const tx = db.transaction("collections", "readwrite");
  const store = tx.objectStore("collections");
  const request = store.add(collection);

  return new Promise((resolve, reject) => {
    request.onsuccess = () => {
      resolve(request.result);
    };
    request.onerror = (event) => {
      reject(event.target.error);
    };
  });
}

async function readCollections() {
  const db = await openDB();
  const tx = db.transaction("collections", "readonly");
  const store = tx.objectStore("collections");
  const request = store.getAll();

  return new Promise((resolve, reject) => {
    request.onsuccess = () => {
      resolve(request.result);
    };
    request.onerror = (event) => {
      reject(event.target.error);
    };
  });
}

async function readCollection(collectionId) {
    const db = await openDB();
    const tx = db.transaction("collections", "readonly");
    const store = tx.objectStore("collections");
    const request = store.get(collectionId);

    return new Promise((resolve, reject) => {
        request.onsuccess = () => resolve(request.result);
        request.onerror = (event) => reject(event.target.error);
    });
}

async function updateCollection(collectionId, updateCallback) {
    const db = await openDB(); // Open the database
    const tx = db.transaction("collections", "readwrite"); // Open a read-write transaction
    const store = tx.objectStore("collections");
    const request = store.get(collectionId);

    request.onsuccess = async () => {
        let collection = request.result;
        if (!collection) {
            console.error('Collection not found');
            return;
        }

        // Perform the update operation provided by the callback
        // The callback is expected to modify the collection object directly
        updateCallback(collection);

        // Put the updated collection back into the store
        const updateRequest = store.put(collection);
        updateRequest.onsuccess = () => {
            console.log('Collection updated successfully');
        };
        updateRequest.onerror = () => {
            console.error('Failed to update collection');
        };
    };
    request.onerror = () => {
        console.error('Failed to retrieve collection');
    };

    // Wait for the transaction to complete
    await tx.done;
}

async function deleteCollection(collectionId) {
    const db = await openDB();
    const tx = db.transaction("collections", "readwrite");
    const store = tx.objectStore("collections");
    const request = store.delete(collectionId);

    return new Promise((resolve, reject) => {
        request.onsuccess = () => resolve(request.result);
        request.onerror = (event) => reject(event.target.error);
    });
}

// Instances
async function createInstance(collectionId, newInstance) {
    updateCollection(collectionId, (collection) => {
        // Add the new instance to the collection's instances array
        collection.instances.push(newInstance);
    }).then(() => {
        console.log('Instance created successfully');
    }).catch((error) => {
        console.error('Error creating instance:', error);
    });
}

async function readInstances(collectionId) {
    const collection = await readCollection(collectionId);
    return collection ? collection.instances : [];
}

async function readInstance(collectionId, instanceId) {
    const db = await openDB(); // Assuming openDB() is a function that opens your IndexedDB database
    const tx = db.transaction("collections", "readonly");
    const store = tx.objectStore("collections");
    const request = store.get(collectionId);

    return new Promise((resolve, reject) => {
        request.onsuccess = () => {
            const collection = request.result;
            if (!collection) {
                resolve(undefined);
                return;
            }
            const instance = collection.instances.find(instance => instance.id === instanceId);
            resolve(instance);
        };
        request.onerror = () => reject(request.error);
    });
}

async function updateInstance(updatedData, collectionId, instanceId) {
    updateCollection(collectionId, (collection) => {
        // Find the instance index in the collection
        const index = collection.instances.findIndex(instance => instance.id === instanceId);
        if (index === -1) {
            console.error('Instance not found');
            return;
        }

        // Update the instance with the new data
        collection.instances[index] = { ...collection.instances[index], ...updatedData };
    }).then(() => {
        console.log('Instance updated successfully');
    }).catch((error) => {
        console.error('Error updating instance:', error);
    });
}

async function deleteInstance(collectionId, instanceId) {
    updateCollection(collectionId, (collection) => {
        // Filter out the instance to be deleted
        const filteredInstances = collection.instances.filter(instance => instance.id !== instanceId);
        // Reassign the filtered instances back to the collection
        collection.instances = filteredInstances;
    }).then(() => {
        console.log('Instance deleted successfully');
    }).catch((error) => {
        console.error('Error deleting instance:', error);
    });
}

// Media
async function addMedia(imageSrc) {
    // Assuming a structure where each media item is a separate entry in the store
    const db = await openDB();
    const tx = db.transaction("mediaLibrary", "readwrite");
    const store = tx.objectStore("mediaLibrary");
    const request = store.add({ url: imageSrc, id: Date.now().toString() });

    return new Promise((resolve, reject) => {
        request.onsuccess = () => resolve(request.result);
        request.onerror = (event) => reject(event.target.error);
    });
}

async function readAllMedia() {
    const db = await openDB();
    const tx = db.transaction('mediaLibrary', 'readonly');
    const store = tx.objectStore('mediaLibrary');
    const request = store.getAll();

    return new Promise((resolve, reject) => {
        request.onsuccess = () => {
            resolve(request.result); // This resolves with the actual array of media items
        };
        request.onerror = () => {
            reject(request.error);
        };
    });
}

async function readMedia(mediaId) {
    const db = await openDB(); // Assuming openDB() opens your IndexedDB database
    const tx = db.transaction('mediaLibrary', 'readonly');
    const store = tx.objectStore('mediaLibrary');
    const mediaItem = await store.get(mediaId);
    db.close();
    return mediaItem; // This will return the media item object; adjust as necessary for your application
}

async function deleteMedia(mediaId) {
    const db = await openDB();
    const tx = db.transaction('mediaLibrary', 'readwrite');
    const store = tx.objectStore('mediaLibrary');
    const request = store.delete(mediaId);

    return new Promise((resolve, reject) => {
        request.onsuccess = () => resolve();
        request.onerror = (event) => reject(event.target.error);
    });
}


// EVENT LISTENERS
document.addEventListener('DOMContentLoaded', async () => {
	createSkyDashUI();
	injectSkyDashStyles();

	// SKY ELEMENTS
	const dashboardDialog = document.querySelector('[data-sky-dialog="dashboard"]');
	const collectionsDialog = document.querySelector('[data-sky-dialog="collections"]');
	const componentsDialog = document.querySelector('[data-sky-dialog="components"]');
	const mediaDialog = document.querySelector('[data-sky-dialog="media"]');
	const editDialog = document.querySelector('[data-sky-dialog="edit"');
	const skyKey = document.body.getAttribute('data-sky-key');
	const editableElements = document.querySelectorAll('[data-sky-element]');
	const editableFields = document.querySelectorAll('[data-sky-field]');
	const editableComponents = document.querySelectorAll('[data-sky-component]');

	// PREP ELEMENTS
	editableElements.forEach((element, index) => {
        wrapEditableElement(element, index);
    });

    editableFields.forEach((element, index) => {
    	wrapEditableElement(element, index);
    });

    editableComponents.forEach((element, index) => {
    	wrapEditableElement(element, index);
    });

	await openDB()
	.then(initializeEditables(skyKey))
	.catch(error => console.error('Error initializing IndexedDB:', error));

	// EVENTS (CLICK)
	document.body.addEventListener('click', async (event) => {

		if (event.target.matches('button[data-sky-mark]')) {
			event.preventDefault();
	        const action = event.target.getAttribute('data-sky-mark');
	        applyMarkdown(action);
	    }

		if (event.target.matches('.sky-edit-button')) {
            const wrapper = event.target.closest('.editable-wrapper , .editable-wrapper-open');
            const button = event.target;
            editEditable(wrapper, button, skyKey);
        }

		// DIALOGS (OPEN)
        if (event.target.matches('[data-sky-open="dashboard"]')) {
        	dashboardDialog.show();
        	const body = renderDashboardDialog();
			dashboardDialog.innerHTML = body;
        }

		if (event.target.matches('[data-sky-open="collections"]')) {
			// DATA
			const collections = await readCollections();

			// VIEW
			collectionsDialog.show();
			const body = renderCollectionsDialog(collections);
			collectionsDialog.innerHTML = body;
		}

		if (event.target.matches('[data-sky-open="media"]')) {
			// VIEW
			mediaDialog.show();


			const body = renderMediaDialog();
			mediaDialog.innerHTML = body;

			await loadMediaPreviews();
		}

		if (event.target.matches('.delete-media-button')) {
		    const mediaWrapper = event.target.closest('div'); // Assuming each image and button are wrapped in a div
	        const imageElement = mediaWrapper.querySelector('img'); // Find the img element within the same wrapper
	        const mediaId = imageElement.dataset.mediaId;
		    console.log(mediaId)

		    await deleteMedia(mediaId);

		    // Update the preview
		   await loadMediaPreviews();
 		}
		// DIALOGS (CLOSE)
		if (event.target.matches('[data-sky-close="dashboard"]')) {
			dashboardDialog.close();
		}

		if (event.target.matches('[data-sky-close="collections"]')) {
			collectionsDialog.close();
		}

		if (event.target.matches('[data-sky-close="media"]')) {
			mediaDialog.close();
		}

		if (event.target.matches('[data-sky-close="components"]')) {
			componentsDialog.close();
		}

		if (event.target.matches('[data-sky-close="edit"]')) {
			editDialog.close();
		}

		// COLLECTIONS
		if (event.target.matches('.delete-collection-button')) {
			// DATA
			const collectionId = event.target.getAttribute('data-collection-id');
			await deleteCollection(collectionId);
			const collections = await readCollections();

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
			const collection = await readCollection(collectionId);

			// VIEW
			const body = renderNewInstanceForm(collection);
			collectionsDialog.innerHTML = body;
		}

		if (event.target.matches('.instance-view-button')) {
			// DATA
			const collectionId = event.target.getAttribute('data-collection-id');
			const collection = await readCollection(collectionId);
			const instances = await readInstances(collectionId);

			// VIEW
			const body = renderInstances(collection, instances);
			collectionsDialog.innerHTML = body;
		}

		if (event.target.matches('.edit-instance-button')) {
			// DATA
			const collectionId = event.target.getAttribute('data-collection-id');
			const instanceId = event.target.getAttribute('data-instance-id');
			const collection = await readCollection(collectionId);
			const instance = await readInstance(collectionId, instanceId);

			// VIEW
			const body = renderInstanceEditForm(collection, instance);
			collectionsDialog.innerHTML = body;
		}

		if (event.target.matches('.delete-instance-button')) {
			// DATA
			const collectionId = event.target.getAttribute('data-collection-id');
			const instanceId = event.target.getAttribute('data-instance-id');
			await deleteInstance(collectionId, instanceId);
			const collection = await readCollection(collectionId);
			const instances = await readInstances(collectionId);

			// VIEW
			const body = renderInstances(collection, instances);
			collectionsDialog.innerHTML = body;
		}

		if (event.target.matches("#openFileUpload")) {
			 document.getElementById('media-upload-input').click(); // Trigger file input
		}
	});

	// EVENTS (SUBMIT)
	document.body.addEventListener('submit', async (event) => {
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
			await createCollection(collection);
			const collections = await readCollections();

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

			await createInstance(collectionId, instance);
			const collection = await readCollection(collectionId);
			const instances = await readInstances(collectionId);

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
			
			const instance = await readInstance(collectionId, instanceId);

			await updateInstance(tempData, collectionId, instance.id);
			const collection = await readCollection(collectionId);
			const instances = await readInstances(collectionId);

			const body = renderInstances(collection, instances);
			collectionsDialog.innerHTML = body;
		}

		// EDIT PAGE
		if (event.target.matches('#editForm')) {
	        event.preventDefault();

	        const editDialog = document.getElementById('editDialog');
	        const skyKey = document.body.getAttribute('data-sky-key');
	        const index = event.target.getAttribute('data-sky-index');

	        const formData = new FormData(event.target);
	        const newContent = formData.get('newEditable');

	        await updateEditable(skyKey, index, newContent);

	        // Update the content on the page directly, if necessary
	        const editableElement = document.querySelector(`[data-sky-index="${index}"]`);
	        console.log(editableElement)
	        if (editableElement) {
	            const contentElement = editableElement.querySelector('[data-sky-element]');
	            if (contentElement) {
	            	console.log('yup')
	                contentElement.innerHTML = newContent;
	            }
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