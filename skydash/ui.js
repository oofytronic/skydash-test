// SkyDash Script: Client Interface

// UTILITIES
function capitalize(str) {
    return str.charAt(0).toUpperCase() + str.slice(1);
}

// SKYDASH UI | *GOOD FOR NOW*
function createSkyDashUI() {
	const uiHTML = `
	<div class="skydash-menu">
		<button id="collectionsButton">Collections</button>
		<button id="mediaButton">Media Library</button>
	</div>

	<dialog data-sky-dialog="collections" id="collectionsDialog" class="collections-dialog"></dialog>
	<dialog data-sky-dialog="media" id="mediaDialog" class="media-dialog"></dialog>
	<dialog data-sky-dialog="edit" id="editDialog" class="edit-dialog">
		<form id="editForm">
			<textarea id="editInput" name="content"></textarea>
			<input type="hidden" id="editIndex" name="index">
			<button type="submit">Save Changes</button>
			<button type="button" onclick="document.getElementById('editDialog').close();">Cancel</button>
		</form>
	</dialog>
	`;

	document.body.insertAdjacentHTML('beforeend', uiHTML);
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
        }
    `;

    const styleSheet = document.createElement('style');
    styleSheet.type = 'text/css';
    styleSheet.textContent = cssStyles.trim();
    document.head.appendChild(styleSheet);
}

//EDITABLE CONTENT | *GOOD FOR NOW*
function applyEditableContent(editableContent) {
    const editableElements = document.querySelectorAll('[data-sky-editable]');
    editableElements.forEach((element, index) => {
        if (index in editableContent) {
            element.innerHTML = editableContent[index];
        }
    });
}

function editContent(element, index, skyKey) {
    const editDialog = document.getElementById('editDialog');
    const editInput = document.getElementById('editInput');
    const editIndex = document.getElementById('editIndex');

    // Populate the form with the current content and index
    editInput.value = element.innerHTML;
    editIndex.value = index;

    // Show the dialog
    editDialog.show(); // or .show() depending on your requirements

    // Save skyKey in the form for access during submission
    editDialog.setAttribute('data-sky-key', skyKey);
}

// TEMPLATES (HTML)
function renderMediaDialog(media) {
	return `
		<button data-sky-dialog-close="media">Close</button>
		<button>Add Media</button>
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
	const display = schema.map(obj => {
		const instances = collectionData.instances;
		instances.map(instance => {
			for (const [key, value] of Object.entries(instances)) {
				if (key === obj.name) {
					
				}
			}
		})
		
	})
	return `
		<h1>${collectionData.displayName}</h1>
		<button class="create-instance-button" data-collection-id="${collectionData.id}">+ New ${capitalize(collectionData.singularId)}</button>
		${instances.length > 0 ? instances.map(instance => {
			return `
			<div>
				<h2>${instance.title}</h2>
				<p>${instance.content}</p>
				<button data-collection-id="${collectionData.id}" data-instance-id="${instance.id}" class="edit-instance-button">Edit</button>
				<button data-collection-id="${collectionData.id}" data-instance-id="${instance.id}" class="delete-instance-button">Delete</button>
			</div>
		`;
		}).join('') : `<p>Add ${capitalize(collectionData.singularId)}</p>`}
	`;
}

function renderNewInstanceForm(collectionData) {
	const schema = collectionData.schema;

	const fields = schema.map(obj => {
		if (obj.type === 'text') {
			return `
			<label for="${obj.name}">
				${obj.name}
				<input type="text" id="${obj.name}" name="${obj.name}" placeholder="${obj.name}" required>
			</label>`;
		} else if (obj.type === 'textarea') {
			return `
			<label for="${obj.name}">
				${obj.name}
				<textarea id="${obj.name}" name="${obj.name}" placeholder="${obj.name}" required></textarea>
			</label>`;
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

function renderInstanceEditForm(collectionId, instance) {
	return `
		<form
			id="edit-instance-form"
			style="display: flex; flex-direction: column; gap: 1rem;"
			data-collection-id="${collectionId}"
			data-instance-id="${instance.id}"
			>
			<input type="text" name="title" value="${instance.title}" required>
			<textarea name="content" required>${instance.content}</textarea>
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

function getEditables(skyKey) {
	let editableContent = {};

    if (localStorage.getItem(skyKey)) {
        editableContent = JSON.parse(localStorage.getItem(skyKey));
        applyEditableContent(editableContent);
    }

    return editableContent;
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

    collections[collectionIndex].instances.filter(instance => instance.id !== instanceId);
    localStorage.setItem('collections', JSON.stringify(collections));
}

// EVENT LISTENERS (EDITABLE)
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
	const editables = getEditables(skyKey);

    editableElements.forEach((element, index) => {
        if (!(index in editables)) {
            editables[index] = element.innerHTML;
            localStorage.setItem(skyKey, JSON.stringify(editables));
        }

        const editButton = document.createElement('button');
        editButton.textContent = 'Edit';
        editButton.addEventListener('click', () => editContent(element, index, skyKey));
        element.parentNode.insertBefore(editButton, element.nextSibling);
    });

	// EVENTS (CLICK)
	document.body.addEventListener('click', (event) => {
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
			const field = `
			<div>
			<label for="name-${newId}">
				<input type="text" name="name-${newId}" id="name-${newId}">
			</label>
			<label for="type-${newId}">
				<select name="type-${newId}" id="type-${newId}">
					<option value="text">Text</option>
					<option value="textarea">Large Text</option>
				</select>
			</label>
			</div>
			`
			event.target.insertAdjacentHTML('beforebegin', field)
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
			const instance = readInstance(collectionId, instanceId);

			// VIEW
			const body = renderInstanceEditForm(collectionId, instance);
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
			const collections = readCollections();
			const collectionId = event.target.getAttribute('data-collection-id');
			const collection = readCollection(collectionId);
			
			const formData = new FormData(event.target);
			const tempData = {};
			tempData.newId = Date.now().toString();

			for (let [key, value] of formData.entries()) {
				tempData[key] = value;
			}

			const newInstanceObj = genNewInstanceObject(tempData);
			const instance = {...newInstanceObj, ...tempData}

			createInstance(collectionId, instance);
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
			const collection = readCollection(collectionId);
			const instances = readInstances(collectionId);
			const instance = readInstance(collectionId, instanceId);

			updateInstance(tempData, instance, collectionId);

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
	})
});