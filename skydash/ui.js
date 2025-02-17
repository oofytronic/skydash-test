import {capitalize, truncateString, applyMarkdown, fileToDataUrl} from './utilities.js';


// MAIN
function createSkyDashUI() {
	const skyHTML = `
	<div class="skydash-user">
		<button
			data-sky-open="dashboard"
		  	style="border-radius: 50%; width: 50px; height: 50px; padding: 0; border: 1px; overflow: hidden; display: flex; justify-content: center; align-items: center;">
		</button>
	</div>

	<dialog data-sky-dialog="dashboard" id="dashboardDialog" class="dashboard-dialog"></dialog>
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
			transition: width 0.5s ease-in-out, height 0.5s ease-in-out;
			z-index: 10000;
    	}

    	dialog::backdrop {
          background-color: rgb(0 0 0 / 0%);
        }

        dialog[open]::backdrop {
          background-color: rgb(0 0 0 / 0%);
        }

        #componentsDialog, #editDialog {
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
        .skydash-user {
            position: fixed;
            bottom: 1rem;
            right: 1rem;
            display: flex;
            flex-direction: column;
            align-items: center;
            gap: 1rem;
            border: 2px solid #ccc;
			border-radius: 10px;
			padding: 5px;
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
			box-shadow: inset 0 0 0 1px #7F557B;
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
			box-shadow: inset 0 0 0 1px #7F557B;
		}

		.sky-edit-toolbar {
		    position: absolute;
		    top: -33px;
		    left: -1px;
		    display: none;
		    background-color: none;
			border-top: 1px solid #7F557B;
			border-right: 1px solid #7F557B;
			border-left: 1px solid #7F557B;
			border-bottom: 1px solid transparent;
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

		[contenteditable="true"] {
		    outline: none; /* Removes the default focus outline */
		}

		[contenteditable="true"]:focus {
		    background: none; /* Example: subtle background color change to indicate focus/edit mode */
		}
    `;

    const styleSheet = document.createElement('style');
    styleSheet.type = 'text/css';
    styleSheet.textContent = cssStyles.trim();
    document.head.appendChild(styleSheet);
}

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

        const editorDialog = document.querySelector('[data-sky-dialog="edit"]');
        const body = renderInstanceEditForm(collection, instance);
        editorDialog.innerHTML = body;
        editorDialog.show();

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

async function changeImage(editableId) {
    return new Promise(async (resolve, reject) => {
        // Open the media library dialog
        const mediaDialog = document.querySelector('[data-sky-dialog="media"]');
        mediaDialog.show();
        const body = renderMediaDialog();
        mediaDialog.innerHTML = body;

        await renderMediaItems();

        // Set up a single event listener on the mediaDialog for delegation
        const clickHandler = async (event) => {
            // Check if the clicked element is a media item
            if (event.target.classList.contains('media-item')) {
                const selectedMediaUrl = event.target.src;
                const editableWrapper = document.querySelector(`[data-sky-id="${editableId}"]`);
                const editableElement = editableWrapper.querySelector('img');

                if (editableElement) {
                    editableElement.src = selectedMediaUrl;
                    await updateEditable(editableId, editableElement.outerHTML);
                    resolve(selectedMediaUrl); // Resolve the promise with the selected media URL
                } else {
                    reject("Editable element not found.");
                }

                // Cleanup: remove this event listener and close the dialog
                mediaDialog.removeEventListener('click', clickHandler);
                mediaDialog.close();
            }
        };

        // Attach the event listener to the mediaDialog for event delegation
        mediaDialog.addEventListener('click', clickHandler);
    });
}

function editEditable(wrapper, button, skyKey) {
	const index = wrapper.getAttribute('data-sky-index');
	const id = wrapper.getAttribute('data-sky-id');
	const type = button.getAttribute('data-sky-type');
	const field = wrapper.querySelector('[data-sky-field]');
    const editable = wrapper.querySelector('[data-sky-element]');
    const action = button.getAttribute('data-sky-action');

    if (type === "field") {
    	openFieldEditor(field);
    }

    if (type === "component") {
    	openComponentEditor();
    }
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

// TEMPLATES (HTML)
function renderUserIsland(user) {
	return `
		<button
			data-sky-open="dashboard"
		  	style="border-radius: 50%; width: 50px; height: 50px; padding: 0; border: 1px; overflow: hidden; display: flex; justify-content: center; align-items: center;">
		  <img src="${user.favicon}" alt="headshot" style="width: 100%; height: auto; pointer-events: none;">
		</button>
	`;
}

function wrapEditableElement(element, id) {
    const wrapper = document.createElement('div');

    let toolbarHTML;

    if (element.getAttribute('data-sky-field')) {
    	wrapper.className = 'editable-wrapper';
    	toolbarHTML = renderEditableToolbar("field", id);
    } else if (element.getAttribute('data-sky-component')) {
    	wrapper.className = 'editable-wrapper-open';
    	toolbarHTML = renderEditableToolbar('component', id);
    } else {
    	wrapper.className = 'editable-wrapper';
    	wrapper.setAttribute('data-sky-id', id);			
    	const editableType = inferEditableType(element.tagName);
    	toolbarHTML = renderEditableToolbar(editableType, id);
    }
    
    element.parentNode.insertBefore(wrapper, element);
    
    wrapper.appendChild(element);

    const toolbar = document.createElement('div');
    toolbar.innerHTML = toolbarHTML;

    Array.from(toolbar.children).forEach(child => {
        wrapper.appendChild(child);
    });
}

function renderEditableToolbar(editableType, id) {
    switch (editableType) {
        case 'image':
            return `<div class="sky-edit-toolbar">
            		IMAGE
	                <button class="sky-edit-button" data-sky-id="${id}" data-sky-type="${editableType}" data-sky-action="change-image">Change</button>
                </div>`;
        case 'text':
            return `
            	<div class="sky-edit-toolbar">
	                TEXT
	                <button class="sky-edit-button" data-sky-id="${id}" data-sky-type="${editableType}" data-sky-action="bold">B</button>
	                <button class="sky-edit-button" data-sky-id="${id}" data-sky-type="${editableType}" data-sky-action="italicize">I</button>
	                <button class="sky-edit-button" data-sky-id="${id}" data-sky-type="${editableType}" data-sky-action="underline">U</button>
	                <button class="sky-edit-button" data-sky-id="${id}" data-sky-type="${editableType}" data-sky-action="link">Link</button>
                </div>
            `;
        case 'block':
            return `<div class="sky-edit-toolbar">
	                BLOCK
	                <button class="sky-edit-button" data-sky-id="${id}" data-sky-type="${editableType}" data-sky-action="bold">B</button>
	                <button class="sky-edit-button" data-sky-id="${id}" data-sky-type="${editableType}" data-sky-action="italicize">I</button>
	                <button class="sky-edit-button" data-sky-id="${id}" data-sky-type="${editableType}" data-sky-action="underline">U</button>
	                <button class="sky-edit-button" data-sky-id="${id}" data-sky-type="${editableType}" data-sky-action="link">Link</button>
                </div>`;
        case 'field':
            return `<div class="sky-edit-toolbar">
            		FIELD
	                <button class="sky-edit-button" data-sky-type="${editableType}" data-sky-action="field">Edit</button>
                </div>`;
        case 'component':
            return `<div class="sky-edit-toolbar-inside">
            		COMPONENT
	                <button class="sky-edit-button" data-sky-type="${editableType}" data-sky-action="component">Edit</button>
                </div>`;
        default:
            return `<div class="sky-edit-toolbar">
	                <button class="sky-edit-button" data-sky-id="${id}" data-sky-type="${editableType}" data-sky-action="edit">Edit</button>
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

async function renderDashboardDialog(collections) {
	const userData = await readUsers();
	const userDash = userData.map(user => {
		return `<div class="sky-badge"
			style="background: linear-gradient(45deg, darkblue, blue, lightblue); width: 40%; height: 225px; color: white; padding: 0.5rem;
		    border-radius: 10px;
		    margin: 0.5rem 0;
		    box-shadow: 0 4px 8px rgba(0, 0, 0, 0.2),
		                0 6px 20px rgba(0, 0, 0, 0.2);
		    transition: transform 0.3s ease-in-out, box-shadow 0.3s ease-in-out;"
		>
			<div style="position: relative; display: flex; justify-content: space-between; height: 100%">
				<div>
					<h2>SkyBadge</h2>
					<p>${user.name}</p>
					<div>
						${user.roles.map(role => `<p>${role}</p>`).join('')}
					</div>
					<button class="edit-user-button" data-sky-id="${user.id}">Edit User</button>
					<!-- <button class="delete-user-button" data-sky-id="${user.id}">Delete User</button> -->
				</div>
				<div>
					<img src="${user.favicon}" alt="headshot" style="height: 100%; border-radius: 10px;">
				</div>
			</div>
		</div>`;
	}).join('');

	const collectionData = await readCollections();
	const collectionsDash = collectionData.map(collection => {
		return `<div style="background: gray; color: white; width: 10%;
		    padding: 0.5rem;
		    border-radius: 10px;
		    margin: 0.5rem 0;">
			<p>${collection.displayName}</p>
			<p>${collection.instances.length}</p>
			<button class="instance-view-button" data-collection-id="${collection.id}">View</button>
			<button data-collection-id="${collection.id}" class="delete-collection-button">Delete</button>
		</div>`
	}).join('');


	return `
		<div style="display: flex; justify-content: space-between; width: 100%;">
	    	<h1>Dashboard</h1>
	    	<div style="display: flex; gap: 1rem;">
	    		<button data-sky-open="media">Media</button>
			    <button data-sky-close="dashboard">Close</button>
		    </div>
		</div>
		<div>
			<div>
				<div style="display: flex; gap: 1rem; justify-content: start; align-items: center;">
					<h2>Users</h2>
					<!-- <button class="create-user-button">Create User</button> -->
				</div>
				<div class="sky-users-preview" style="display: flex; gap: 1rem;">${userDash}</div>
			</div>
			<div>
				<div style="display: flex; gap: 1rem; justify-content: start; align-items: center;">
					<h2>Collections</h2>
					<button onclick="document.querySelector('#form-container').style.display = 'block';">Create Collection</button>
				</div>
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
				<div class="sky-collections-preview" style="display: flex; gap: 1rem;">${collectionsDash}</div>
			</div>
		</div>
	`;
}

function renderMediaDialog(media) {
    return `
    <div style="display: flex; flex-direction: column; gap: 1rem; width: 100%;">
    	<div style="display: flex; justify-content: space-between;">
	    	<h1>Media Library</h1>
	    	<div style="display: flex; gap: 1rem;">
			    <input type="file" id="media-upload-input" multiple accept="image/*,video/*,application/pdf" style="display:none;">
			    <button id="openFileUpload">Upload Image</button>
			    <button data-sky-close="media">Close</button>
		    </div>
		</div>

	    <div id="mediaGallery"></div>
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
		<button class="expand-dialog-button" data-expanded="false">Expand</button>
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

async function renderMediaItems() {
    const mediaGallery = document.getElementById('mediaGallery');
    mediaGallery.innerHTML = ''; // Clear current media items

    const mediaItems = await readAllMedia(); // Assume this fetches all media items from IDB
    mediaItems.forEach(media => {
        const mediaElement = document.createElement('div');
        mediaElement.innerHTML = `
            <div>
                <img class="media-item" src="${media.content}" alt="${media.name}" style="max-width: 100px; max-height: 100px;" />
                <p>${media.name}</p>
                <button class="deleteMediaButton" data-media-id="${media.id}">Delete</button>
            </div>
        `;
        mediaGallery.appendChild(mediaElement);
    });

    // Add delete functionality
    document.querySelectorAll('.deleteMediaButton').forEach(button => {
        button.addEventListener('click', async function() {
            const mediaId = this.getAttribute('data-media-id');
            await deleteMedia(mediaId); // Delete from IDB
            await renderMediaItems(); // Refresh the display
        });
    });
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

function genNewEditableObject({ id, skyKey, content }) {
	return {
		id,
		skyKey,
		createdAt: new Date().toISOString(),
		updatedAt: new Date().toISOString(),
		content
	};
}

function genNewInstanceObject(data) {
	return {
		id: data.newId,
		createdAt: new Date().toISOString(),
		updatedAt: new Date().toISOString()
	}
}

function genNewUserObject(data) {
	return {
	    id: data.id,
	    did: data.did,
	    name: data.name,
	    roles: [data.role],
	    favicon: data.favicon,
	    createdAt: new Date().toISOString(),
	    updatedAt: new Date().toISOString(),
	}
}

function genNewRoleObject(data) {
	return {
	    id: data.newId,
	    name: data.name,
	  	permissions: data.permissions
	}
}

// CACHE
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

		if (!db.objectStoreNames.contains('users')) {
		    db.createObjectStore('users', { keyPath: 'id' });
		}

		if (!db.objectStoreNames.contains("roles")) {
			db.createObjectStore("roles", { keyPath: "id", autoIncrement: true });
		}
    };
  });
}

// Editables
async function createEditable(content) {
    const db = await openDB();
    const transaction = db.transaction("editables", "readwrite");
    const store = transaction.objectStore("editables");

    return new Promise((resolve, reject) => {
        const request = store.add(content);
        request.onsuccess = () => resolve(request.result);
        request.onerror = (event) => reject(event.target.error);
    });
}

async function readEditable(id) {
    const db = await openDB();
    const transaction = db.transaction("editables", "readonly");
    const store = transaction.objectStore("editables");

    return new Promise((resolve, reject) => {
        const request = store.get(id);
        request.onsuccess = () => resolve(request.result);
        request.onerror = (event) => reject(event.target.error);
    });
}

async function readEditables(skyKey) {
    const db = await openDB();
    const tx = db.transaction("editables", "readonly");
    const store = tx.objectStore("editables");
    const allEditablesRequest = store.getAll();

    return new Promise((resolve, reject) => {
        allEditablesRequest.onsuccess = () => {
            // Ensure the result is always treated as an array
            const allEditables = allEditablesRequest.result || [];
            // Filter the editables by skyKey
            const filteredEditables = allEditables.filter(item => item.skyKey === skyKey);
            resolve(filteredEditables);
        };
        allEditablesRequest.onerror = (event) => {
            console.error("Failed to read all editables from IndexedDB:", event.target.error);
            reject(event.target.error);
        };
    });
}

async function updateEditable(id, newContent) {
    const db = await openDB();
    const transaction = db.transaction("editables", "readwrite");
    const store = transaction.objectStore("editables");
    const editableRequest = store.get(id);

    return new Promise((resolve, reject) => {
        editableRequest.onsuccess = async () => {
            const editable = editableRequest.result;
            if (editable) {
                editable.content = newContent; // Assuming 'html' is where the content is stored
                const updateRequest = store.put(editable);
                updateRequest.onsuccess = () => resolve(updateRequest.result);
                updateRequest.onerror = (event) => reject(event.target.error);
            } else {
                reject(new Error("Editable not found"));
            }
        };
        editableRequest.onerror = (event) => reject(event.target.error);
    });
}

async function deleteEditable(id) {
    const db = await openDB();
    const transaction = db.transaction("editables", "readwrite");
    const store = transaction.objectStore("editables");

    return new Promise((resolve, reject) => {
        const request = store.delete(id);
        request.onsuccess = () => resolve(request.result);
        request.onerror = (event) => reject(event.target.error);
    });
}

async function initializeEditables() {
    const skyKey = document.body.getAttribute('data-sky-key');
    const editablesOnPage = document.querySelectorAll('[data-sky-element]');
    const editablesInDb = await readEditables(skyKey);

    await Promise.all(Array.from(editablesOnPage).map(async (element, index) => {
    	function createElementFromHTML(htmlString) {
		    const div = document.createElement('div');
		    div.innerHTML = htmlString.trim();

		    return div.firstChild;
		}

        const id = `${skyKey}-${index}`;
        const contentFromDb = editablesInDb.find(item => item.id === id);

        // Wrap the element with the wrapper and pass the unique ID
        wrapEditableElement(element, id);

        if (contentFromDb) {
        	element.outerHTML = contentFromDb.content;
        } else {
            const newEditableObject = genNewEditableObject({ id, skyKey, content: element.outerHTML });
            await createEditable(newEditableObject);
        }
    }));
}

async function initializeEditableFields() {
	const editableFields = document.querySelectorAll('[data-sky-field]');

	editableFields.forEach((element, index) => {
    	wrapEditableElement(element, index);
    });

	for (const field of editableFields) {
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

		    field.innerHTML = instance[fieldName];
		} catch (error) {
		    console.error('Error opening field editor:', error);
		}
	}
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
async function addMedia(imageObj) {
    // Assuming a structure where each media item is a separate entry in the store
    const db = await openDB();
    const tx = db.transaction("mediaLibrary", "readwrite");
    const store = tx.objectStore("mediaLibrary");
    const request = store.add(imageObj);

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

// Users
async function createUser(user) {
    const db = await openDB();
    const transaction = db.transaction('users', 'readwrite');
    const store = transaction.objectStore('users');
    return new Promise((resolve, reject) => {
        const request = store.add(user);
        request.onsuccess = () => resolve(request.result);
        request.onerror = (event) => reject(event.target.error);
    });
}

async function readUsers() {
    const db = await openDB();
    const transaction = db.transaction('users', 'readonly');
    const store = transaction.objectStore('users');
    return new Promise((resolve, reject) => {
        const request = store.getAll();
        request.onsuccess = () => resolve(request.result);
        request.onerror = (event) => reject(event.target.error);
    });
}

async function readUser(id) {
    const db = await openDB();
    const transaction = db.transaction('users', 'readonly');
    const store = transaction.objectStore('users');
    return new Promise((resolve, reject) => {
        const request = store.get(id);
        request.onsuccess = () => resolve(request.result);
        request.onerror = (event) => reject(event.target.error);
    });
}

async function updateUser(user) {
    const db = await openDB();
    const transaction = db.transaction('users', 'readwrite');
    const store = transaction.objectStore('users');
    return new Promise((resolve, reject) => {
        const request = store.put(user);
        request.onsuccess = () => resolve(request.result);
        request.onerror = (event) => reject(event.target.error);
    });
}

async function deleteUser(id) {
    const db = await openDB();
    const transaction = db.transaction('users', 'readwrite');
    const store = transaction.objectStore('users');
    return new Promise((resolve, reject) => {
        const request = store.delete(id);
        request.onsuccess = () => resolve(request.result);
        request.onerror = (event) => reject(event.target.error);
    });
}

const permissionsList = [
    "CREATE_COLLECTION",
    "READ_COLLECTION",
    "UPDATE_COLLECTION",
    "DELETE_COLLECTION",
    "CREATE_INSTANCE",
    "READ_INSTANCE",
    "UPDATE_INSTANCE",
    "DELETE_INSTANCE",
    "UPLOAD_MEDIA",
    "DELETE_MEDIA",
    "READ_MEDIA",
    "EDIT_CONTENT",
    "PUBLISH_CONTENT",
    "CREATE_USER",
    "DELETE_USER",
    "UPDATE_USER_PERMISSIONS"
]

function isValidPermission(permission) {
    return permissionsList.includes(permission);
}

async function canUserPerformOperation(userObj, operationPermission) {
    const userRoles = userObj.roles;

    const permissions = await Promise.all(userRoles.map(async roleName => {
        const roleObj = await readRoleByName(roleName);
        return roleObj.permissions;
    }));

    const uniquePermissions = [...new Set(permissions.flat())];

    return uniquePermissions.includes(operationPermission);
}

// Roles
async function createRole(roleData) {
  const db = await openDB();
  const tx = db.transaction('roles', 'readwrite');
  const store = tx.objectStore('roles');
  return new Promise((resolve, reject) => {
	    const request = store.add(roleData);
	    request.onsuccess = () => resolve(request.result);
	    request.onerror = (event) => reject(event.target.error);
	});
}

async function readRoles() {
    const db = await openDB();
    const transaction = db.transaction('roles', 'readonly');
    const store = transaction.objectStore('roles');
    return new Promise((resolve, reject) => {
        const request = store.getAll();
        request.onsuccess = () => resolve(request.result);
        request.onerror = (event) => reject(event.target.error);
    });
}

async function readRole(id) {
  const db = await openDB();
  const tx = db.transaction('roles', 'readonly');
  const store = tx.objectStore('roles');
  return new Promise((resolve, reject) => {
        const request = store.get(id);
        request.onsuccess = () => resolve(request.result);
        request.onerror = (event) => reject(event.target.error);
    });
}

async function readRoleByName(roleName) {
    const db = await openDB(); // Your function to open IndexedDB
    const tx = db.transaction("roles", "readonly");
    const store = tx.objectStore("roles");
    
    // Use a promise to properly wait for getAll to complete
    const allRoles = await new Promise((resolve, reject) => {
        const request = store.getAll();
        request.onsuccess = () => resolve(request.result);
        request.onerror = (e) => reject(e.target.error);
    });

    // Ensure allRoles is an array before using .find
    if (Array.isArray(allRoles)) {
        const roleObj = allRoles.find(role => role.name === roleName);
        db.close();
        return roleObj;
    } else {
        console.error("Expected an array of roles, received:", allRoles);
        db.close();
        return undefined; // or handle this case as you see fit
    }
}

async function updateRole(id, updates) {
  const db = await openDB();
  const tx = db.transaction('roles', 'readwrite');
  const store = tx.objectStore('roles');
  const role = await store.get(id);
  const updatedRole = { ...role, ...updates };
  const result = await store.put(updatedRole);
  console.log('Role updated', result);
  return result;
}

async function deleteRole(id) {
  const db = await openDB();
  const tx = db.transaction('roles', 'readwrite');
  const store = tx.objectStore('roles');
  return new Promise((resolve, reject) => {
        const request = store.delete(id);
        request.onsuccess = () => resolve(request.result);
        request.onerror = (event) => reject(event.target.error);
    });
}

function setCurrentUser(userId) {
    localStorage.setItem('currentUser', userId);
}

function getCurrentUser() {
    return localStorage.getItem('currentUser');
}

function clearCurrentUser() {
    localStorage.removeItem('currentUser');
}

//Keygen
async function generateKeyPair() {
  try {
    const keyPair = await window.crypto.subtle.generateKey(
      {
        name: "ECDSA",
        namedCurve: "P-256" // Can use "P-384" or "P-521" for different curve parameters
      },
      true, // Whether the key is extractable (i.e., can be used in exportKey)
      ["sign", "verify"] // Can use the key for these operations
    );

    return keyPair;
  } catch (error) {
    console.error("Error generating key pair:", error);
  }
}

// Mock function for base58 encoding (for demonstration purposes)
function base58Encode(arrayBuffer) {
  // In a real scenario, replace this with actual base58 encoding logic or use a library like `bs58`
  return "MockBase58" + btoa(String.fromCharCode.apply(null, new Uint8Array(arrayBuffer)));
}

async function exportAndEncodePublicKey(keyPair) {
  try {
    const exportedKey = await window.crypto.subtle.exportKey(
      "raw", // Export in raw format
      keyPair.publicKey // Public key from the key pair
    );

    // Encode the exported public key using base58 (or a similar encoding method)
    const encodedKey = base58Encode(exportedKey);
    return encodedKey;
  } catch (error) {
    console.error("Error exporting or encoding public key:", error);
  }
}

function formDidKey(encodedPublicKey) {
  return `did:key:${encodedPublicKey}`;
}

async function registerUser(userData) {
  // Generate the key pair for DID
  const keyPair = await generateKeyPair();
  const encodedPublicKey = await exportAndEncodePublicKey(keyPair);
  const didKey = formDidKey(encodedPublicKey);
  const userToken = crypto.randomUUID();

  const initData = {
    id: userToken,
    did: didKey
  };

  const fullData = {...initData, ...userData}

  setCurrentUser(userToken);

  const userObj = genNewUserObject(fullData);

  await createUser(userObj);
}

// IPFS Related
async function gatherDataFromIDB() {
  let data = {
    collections: [],
    editables: [],
    mediaLibrary: [],
    users: [],
    rbac: []
  };

  // Open a connection to your IDB database
  const db = await openDB("YourDatabaseName", 1);

  // Gather data from each store and add to the data object
  // This is a simplified version; you may need to adjust based on your actual data structure and async handling
  data.collections = await db.getAllFromStore("collections");
  data.editables = await db.getAllFromStore("editables");
  data.mediaLibrary = await db.getAllFromStore("mediaLibrary");
  data.users = await db.getAllFromStore("users");
  data.rbac = await db.getAllFromStore("rbac");

  // Close the database connection if needed
  db.close();

  return data;
}


// EVENT LISTENERS
document.addEventListener('DOMContentLoaded', async () => {
	createSkyDashUI();
	injectSkyDashStyles();
	
	const skyUserIsland = document.querySelector('.skydash-user');
	const dashboardDialog = document.querySelector('[data-sky-dialog="dashboard"]');
	const componentsDialog = document.querySelector('[data-sky-dialog="components"]');
	const mediaDialog = document.querySelector('[data-sky-dialog="media"]');
	const editDialog = document.querySelector('[data-sky-dialog="edit"');
	const skyKey = document.body.getAttribute('data-sky-key');
	const editableElements = document.querySelectorAll('[data-sky-element]');
	const editableFields = document.querySelectorAll('[data-sky-field]');
	const editableComponents = document.querySelectorAll('[data-sky-component');

    await initializeEditables();

    await initializeEditableFields();


    // WWWORKING
    editableComponents.forEach(comp => console.log(comp.dataset.skyComponent))

	let currentEditable = null;
	let currentObserver = null;

	// AUTO CAPTAIN
	const roles = await readRoles();
	const rolesStatus = roles.length;
	
	if (rolesStatus === 0) {
		const data =
		{
			id: crypto.randomUUID(),
		    name: 'captain',
		  	permissions: ['EDIT_CONTENT']
	    }

	    await createRole(data);
	}

	if (!getCurrentUser()) {
		skyUserIsland.innerHTML = `
			<form id="create-user-form" style="display: flex; flex-direction: column; gap: 1rem;">
				<p>Setup Your Profile</p>
				<label>
					Name
					<input type="text" name="name">
				</label>

				<label>
					Role
					<select name="role">
						<option value="captain">Captain</option>
					</select>
				</label>

				<label>
					Favicon
					<input type="file" name="favicon">
				</label>

				<button type="submit">Create User</button>
			</form>
		`;
	} else {
		const currentUserObj = await readUser(getCurrentUser());

		skyUserIsland.innerHTML = renderUserIsland(currentUserObj);

		const userCaptain = await canUserPerformOperation(currentUserObj, "EDIT_CONTENT");

		if (userCaptain) {
			console.log('Hello Captain! Welcome Back!')
		} else {
			console.log('Hello Crewmember! Welcome Back!')
		}
	}

	// EVENTS (CLICK)
	document.body.addEventListener('click', async (event) => {
		function setupContentObserver(element, id) {
		    const observer = new MutationObserver((mutationsList, observer) => {
		        // Here, we can handle the changes and update IDB as needed
		        for (let mutation of mutationsList) {
		            if (mutation.type === 'childList' || mutation.type === 'characterData' || mutation.type === 'attributes') {
		                console.log(`Mutation observed: ${mutation.type}`);
		                // Call function to update IDB, assuming it's async
		                updateEditable(id, element.outerHTML).catch(console.error);
		            }
		        }
		    });

		    // Configuration of the observer:
		    const config = { attributes: true, childList: true, subtree: true, characterData: true };

		    // Start observing the target element for configured mutations
		    observer.observe(element, config);

		    // Return the observer instance for later disconnection
		    return observer;
		}

		function enterEditMode(element) {
		    if (!element.classList.contains('is-editing')) {
		    	const wrapper = element.closest('.editable-wrapper, .editable-wrapper-open');
		        const id = wrapper.dataset.skyId;
		        element.contentEditable = true;
		        element.classList.add('is-editing');
		        currentEditable = element;

		        currentObserver = setupContentObserver(element, id);
		    }
		}

		function exitEditMode(element) {
		    if (element && element.classList.contains('is-editing')) {
		        const wrapper = element.closest('.editable-wrapper, .editable-wrapper-open');
		        const id = wrapper.dataset.skyId; // Retrieve the id from the wrapper
		        element.contentEditable = false;
		        element.classList.remove('is-editing');
		       
		        updateEditable(id, element.outerHTML);

		        if (currentObserver) {
		            currentObserver.disconnect(); // Disconnect the observer when editing is done
		            currentObserver = null;
		        }

		        currentEditable = null; // Clear the reference to the current editable element
		    }
		}

		const targetEditable = event.target.closest('[data-sky-element]');

	    if (targetEditable) {
	        if (currentEditable && currentEditable !== targetEditable) {
	            exitEditMode(currentEditable);
	        }

	        enterEditMode(targetEditable);
	    } else if (currentEditable && !currentEditable.contains(event.target)) {
	        exitEditMode(currentEditable);
	    }

	    if (event.target.matches('.create-user-button')) {
	    	await registerUser();

			const userData = await readUsers();
			const userDash = userData.map(user => {
				return `
				<div class="sky-badge"
					style="background: linear-gradient(45deg, red, blue); width: 50%; height: 225px; color: white; padding: 0.5rem;
				    border-radius: 10px;
				    margin: 0.5rem 0;
				    box-shadow: 0 4px 8px rgba(0, 0, 0, 0.1),
				                0 6px 20px rgba(0, 0, 0, 0.1);
				    transition: transform 0.3s ease-in-out, box-shadow 0.3s ease-in-out;"
				>
					<h2>SkyBadge</h2>
					<p>${user.name}</p>
					<div>
						${user.roles.map(role => `<p>${role}</p>`).join('')}
					</div>
					<button class="edit-user-button" data-sky-id="${user.id}">Edit User</button>
					<button class="delete-user-button" data-sky-id="${user.id}">Delete User</button>
				</div>`;
			}).join('');

			const userPane = document.querySelector('.sky-users-preview');
			userPane.innerHTML = userDash;

			const collectionData = await readCollections();
			const collectionsDash = collectionData.map(collection => {
				return `<div style="background: gray; color: white; width: 10%;
				    padding: 0.5rem;
				    border-radius: 10px;
				    margin: 0.5rem 0;">
					<p>${collection.displayName}</p>
					<p>${collection.instances.length}</p>
				</div>`
			}).join('');

			const collectionPane = document.querySelector('.sky-collections-preview');
			collectionPane.innerHTML = collectionsDash;
	    }

	    if (event.target.matches('.edit-user-button')) {
	    	const id = event.target.dataset.skyId;
	    	const userData = await readUser(id);

	    	dashboardDialog.innerHTML = `
	    	<div style="display: flex; justify-content: space-between; width: 100%;">
		    	<h1>Dashboard</h1>
		    	<div style="display: flex; gap: 1rem;">
				    <button data-sky-close="dashboard">Close</button>
			    </div>
			</div>
			<div>
				<form id="edit-user-form" data-sky-id="${userData.id}">
					<input type="text" name="name" value="${userData.name}">
					<input type="text" name="role" value="${userData.roles}">
					<input type="file" name="favicon">
					<img src="${userData.favicon}" style="max-height: 200px;">
					<button type="submit">Submit</button>
				</form>
			</div>`;
	    }

	    if (event.target.matches('.delete-user-button')) {
	    	const id = event.target.dataset.skyId;
	    	await deleteUser(id);

			const userData = await readUsers();
			const userDash = userData.map(user => {
				return `<div class="sky-badge"
					style="background: linear-gradient(45deg, red, blue); width: 50%; height: 225px; color: white; padding: 0.5rem;
				    border-radius: 10px;
				    margin: 0.5rem 0;
				    box-shadow: 0 4px 8px rgba(0, 0, 0, 0.1),
				                0 6px 20px rgba(0, 0, 0, 0.1);
				    transition: transform 0.3s ease-in-out, box-shadow 0.3s ease-in-out;"
				>
					<h2>SkyBadge</h2>
					<p>${user.name}</p>
					<div>
						${user.roles.map(role => `<p>${role}</p>`).join('')}
					</div>
					<button class="edit-user-button" data-sky-id="${user.id}">Edit User</button>
					<button class="delete-user-button" data-sky-id="${user.id}">Delete User</button>
				</div>`;
			}).join('');

			const userPane = document.querySelector('.sky-users-preview');
			userPane.innerHTML = userDash;
	    }

	    if (event.target.matches('.create-role-button')) {
	    	const data =
			{
				id: crypto.randomUUID(),
			    name: 'editor',
			  	permissions: ['EDIT_CONTENT']
		    }

		    await createRole(data);

			const roleData = await readRoles();
			const roleDash = roleData.map(role => {
				return `<div style="background: gray; color: white; width: 10%;
					    padding: 0.5rem;
					    border-radius: 10px;
					    margin: 0.5rem 0;">
						<p>${role.name}</p>
					<button class="edit-role-button" data-sky-id="${role.id}">Edit Role</button>
					<button class="delete-role-button" data-sky-id="${role.id}">Delete Role</button>
				</div>`;
			}).join('');

			const rolePane = document.querySelector('.sky-roles-preview');
			rolePane.innerHTML = roleDash;
	    }

	    if (event.target.matches('.delete-role-button')) {
	    	const id = event.target.dataset.skyId;
	    	await deleteRole(id);

	    	const roleData = await readRoles();
			const roleDash = roleData.map(role => {
				return `<div style="background: gray; color: white; width: 10%;
					    padding: 0.5rem;
					    border-radius: 10px;
					    margin: 0.5rem 0;">
						<p>${role.name}</p>
					<button class="edit-role-button" data-sky-id="${role.id}">Edit Role</button>
					<button class="delete-role-button" data-sky-id="${role.id}">Delete Role</button>
				</div>`;
			}).join('');

			const rolePane = document.querySelector('.sky-roles-preview');
			rolePane.innerHTML = roleDash;
	    }

		if (event.target.matches('button[data-sky-action]')) {
			event.preventDefault();
	        const action = event.target.getAttribute('data-sky-action');

	        if (action === "change-image") {
	        	try {
	        		const editableId = event.target.dataset.skyId;
	        		const selectedMediaUrl = await changeImage(editableId);
	        	} catch (error) {
	        		console.log(error);
	        	}
	        } else {
	        	if (action === "link") {
	        		const inputWrapper = document.createElement('div');
	        		inputWrapper.style = "position: absolute; top: 0; left: 0;";
			        inputWrapper.innerHTML = `
			            <input type="text" id="linkInput" placeholder="Enter web address">
			            <button id="confirmLink">OK</button>
			        `;

			        const parent = event.target.closest('.editable-wrapper');

			        parent.appendChild(inputWrapper);

			        // Focus the input for user convenience
			        document.getElementById('linkInput').focus();

			        // Wait for the user to confirm the link
			        const linkAddress = await new Promise((resolve) => {
			            document.getElementById('confirmLink').addEventListener('click', () => {
			                const input = document.getElementById('linkInput');
			                const value = input.value.trim();
			                // Clean up: remove the input field from the DOM
			                inputWrapper.remove();
			                // Resolve the promise with the input value
			                resolve(value);
			            });
			        });

			        applyMarkdown(action, linkAddress);
	        	} else {
	        		applyMarkdown(action);
	        	}
	        }
	    }

		if (event.target.matches('.sky-edit-button')) {
            const wrapper = event.target.closest('.editable-wrapper , .editable-wrapper-open');
            const button = event.target;
            editEditable(wrapper, button, skyKey);
        }

        if (event.target.matches('.expand-dialog-button')) { // Assuming the button has a class 'expand-dialog-button'
	        const dialog = event.target.closest('dialog');

	        const isExpanded = event.target.dataset.expanded === 'true'; // Use a data attribute to track the state

	        if (dialog) {
	            if (isExpanded) {
	                // Shrink the dialog
	                 dialog.removeAttribute('style');
	                event.target.textContent = 'Expand'; // Change the button text to "Expand"
	            } else {
	                // Expand the dialog
	                dialog.style.width = 'calc(100% - 4rem)';
		            dialog.style.height = 'calc(100% - 4rem)';
		            dialog.style.bottom = 'auto';
		            dialog.style.right = 'auto';
		            dialog.style.top = '50%';
		            dialog.style.left = '50%';
		            dialog.style.transform = 'translate(-50%, -50%)';
		            dialog.style.margin = 'auto';
		            dialog.style.minHeight = '10%';
		            dialog.style.maxHeight = 'inherit';
	                event.target.textContent = 'Shrink'; // Change the button text to "Shrink"
	            }

	            event.target.dataset.expanded = !isExpanded; // Toggle the expanded state
	        }
	    }

        if (event.target.matches('[data-sky-open="dashboard"]')) {
        	document.querySelectorAll('[data-sky-dialog]').forEach(dialog => {
			    if (dialog.dataset.skyDialog !== event.target.dataset.skyOpen) {
			      dialog.close();
			    }
			});

        	dashboardDialog.show();
        	const body = await renderDashboardDialog();
			dashboardDialog.innerHTML = body;
        }

		if (event.target.matches('[data-sky-open="media"]')) {
			document.querySelectorAll('[data-sky-dialog]').forEach(dialog => {
			    if (dialog.dataset.skyDialog !== event.target.dataset.skyOpen) {
			      dialog.close();
			    }
			});

			mediaDialog.show();

			const body = renderMediaDialog();
			mediaDialog.innerHTML = body;

			await renderMediaItems();
		}

		if (event.target.matches('[data-sky-close="dashboard"]')) {
			dashboardDialog.close();
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
			const collectionId = event.target.getAttribute('data-collection-id');
			await deleteCollection(collectionId);
			const collections = await readCollections();

			dashboardDialog.innerHTML = await renderDashboardDialog();
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
			const collectionId = event.target.getAttribute('data-collection-id');
			const collection = await readCollection(collectionId);

			const body = renderNewInstanceForm(collection);
			dashboardDialog.innerHTML = body;
		}

		if (event.target.matches('.instance-view-button')) {
			const collectionId = event.target.getAttribute('data-collection-id');
			const collection = await readCollection(collectionId);
			const instances = await readInstances(collectionId);

			const body = renderInstances(collection, instances);
			dashboardDialog.innerHTML = body;
		}

		if (event.target.matches('.edit-instance-button')) {
			const collectionId = event.target.getAttribute('data-collection-id');
			const instanceId = event.target.getAttribute('data-instance-id');
			const collection = await readCollection(collectionId);
			const instance = await readInstance(collectionId, instanceId);

			const body = renderInstanceEditForm(collection, instance);
			dashboardDialog.innerHTML = body;
		}

		if (event.target.matches('.delete-instance-button')) {
			const collectionId = event.target.getAttribute('data-collection-id');
			const instanceId = event.target.getAttribute('data-instance-id');
			await deleteInstance(collectionId, instanceId);
			const collection = await readCollection(collectionId);
			const instances = await readInstances(collectionId);

			const body = renderInstances(collection, instances);
			dashboardDialog.innerHTML = body;
		}

		if (event.target.matches("#openFileUpload")) {
			 document.getElementById('media-upload-input').click();
		}
	});

	// EVENTS (SUBMIT)
	document.body.addEventListener('submit', async (event) => {
		// CREATE USER
		if (event.target.matches('#create-user-form')) {
			event.preventDefault();

			const formData = new FormData(event.target);
			const tempData = {};

			for (let [key, value] of formData.entries()) {
				if (key === 'favicon') {
					tempData[key] = await fileToDataUrl(value);
				} else {
					tempData[key] = value;
				}
			}

			await registerUser(tempData);

			const currentUserObj = await readUser(getCurrentUser());

			skyUserIsland.innerHTML = renderUserIsland(currentUserObj);
		}

		// CREATE COLLECTION
		if (event.target.matches('#new-collection-form')) {
			event.preventDefault();

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

			// const body = renderCollectionsDialog(collections);
			dashboardDialog.innerHTML = await renderDashboardDialog();
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

			const body = renderInstances(collection, instances);
			dashboardDialog.innerHTML = body;
		}

		// UPDATE INSTANCE
		if (event.target.matches('#edit-instance-form')) {
			event.preventDefault();

			const formData = new FormData(event.target);
			let tempData = {};
			tempData.newId = Date.now().toString();

			for (let [key, value] of formData.entries()) {
			    tempData[key] = value;
			}

			const collectionId = event.target.getAttribute('data-collection-id');
			const instanceId = event.target.getAttribute('data-instance-id');
			
			const instance = await readInstance(collectionId, instanceId);

			await updateInstance(tempData, collectionId, instance.id);
			const collection = await readCollection(collectionId);
			const instances = await readInstances(collectionId);

			const body = renderInstances(collection, instances);
			dashboardDialog.innerHTML = body;
		}

		// EDIT PAGE
		if (event.target.matches('#editForm')) {
		    event.preventDefault();

		    // Extract the 'data-sky-id' directly from the form element
		    const id = event.target.dataset.skyId;

		    // Ensure the ID is correctly retrieved before proceeding
		    if (!id) {
		        console.error("No sky ID found on the form");
		        return;
		    }

		    const formData = new FormData(event.target);
		    const newContent = formData.get('newEditable');

		    try {
		        // Update the content in IndexedDB
		        await updateEditable(id, newContent);

		        // Find the wrapper using the ID to update the DOM
		        const wrapper = document.querySelector(`.editable-wrapper[data-sky-id="${id}"]`);
		        if (!wrapper) {
		            console.error("Wrapper not found");
		            return;
		        }

		        // Assuming the editable content directly within the wrapper needs to be updated
		        const contentElement = wrapper.querySelector('[data-sky-element]');
		        if (contentElement) {
		            contentElement.innerHTML = newContent;
		        }

		        // Close the dialog once update is successful
		        document.getElementById('editDialog').close();
		    } catch (error) {
		        console.error("Error updating editable:", error);
		        // Optionally, handle the error, e.g., show an error message to the user
		    }
		}

		// EDIT USER
		if (event.target.matches('#edit-user-form')) {
			event.preventDefault();

			const formData = new FormData(event.target);
			let tempData = {};
			// tempData.newId = Date.now().toString();

			for (let [key, value] of formData.entries()) {
				if (key === 'favicon') {
					tempData[key] = await fileToDataUrl(value);
				} else {
					tempData[key] = value;
				}
			}

			const userId = event.target.dataset.skyId;

			const oldData = await readUser(userId);
			const newData = {...oldData, ...tempData};

			await updateUser(newData);

			dashboardDialog.close();
		}
	});

	// EVENTS (CHANGE)
	document.body.addEventListener('change', async (event) => {
		if (event.target.matches('#media-upload-input')) {
	        const files = Array.from(event.target.files);
		    for (const file of files) {
		        const content = await fileToDataUrl(file); // Convert file to DataURL for display/storage
		        await addMedia({
		        	id: Date.now().toString(),
		            name: file.name,
		            type: file.type,
		            content: content
		        });
		    }
		    await renderMediaItems(); // Refresh the display
		}
	});
});