// SKYDASH UI
function createSkyDashUI() {
	const uiHTML = `
	<div class="skydash-menu">
		<button id="collectionsButton">Collections</button>
		<button id="mediaButton">Media Library</button>
	</div>

	<dialog data-sky-dialog="collections" id="collectionsDialog" class="collections-dialog"></dialog>
	<dialog data-sky-dialog="media" id="mediaDialog" class="media-dialog"></dialog>
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

//EDITABLE CONTENT
function applyEditableContent(editableContent) {
    const editableElements = document.querySelectorAll('[data-sky-editable]');
    editableElements.forEach((element, index) => {
        if (index in editableContent) {
            element.innerHTML = editableContent[index];
        }
    });
}

function editContent(element, index, skyKey) {
    const newContent = prompt("Edit Content:", element.innerHTML);
    
    if (newContent !== null && newContent !== element.innerHTML) {
        element.innerHTML = newContent;
        // Update localStorage
        let editableContent = JSON.parse(localStorage.getItem(skyKey)) || {};
        editableContent[index] = newContent;
        localStorage.setItem(skyKey, JSON.stringify(editableContent));
    }
}

// HTML TEMPLATES
function collectionsDialogInnerHTML(collections) {
	return `
		<button data-dialog-close>Close</button>
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
				<button type="submit">Create Collection</button>
			</form>
		</div>

		${collections.length > 0 ? collections.map(collection => {
			return `
			<div>
				<h2>${collection.displayName}</h2>
				<button hx-get='/collections/${collection.pluralId}' hx-target="#collectionsDialog" hx-swap="innerHTML">View</button>
			</div>
		`;
		}).join('') : '<p>No Collections</p>'}
	`;
}

//DATABASE FUNCTIONS
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

function saveCollection(newCollection) {
	// Retrieve existing collections from localStorage or initialize to an empty object/array
	let collections = JSON.parse(localStorage.getItem('collections')) || [];

	// Add the new collection
	collections.push(newCollection);

	// Save the updated collections back to localStorage
	localStorage.setItem('collections', JSON.stringify(collections));

	// Optionally, refresh the collections display or close the dialog
}

// EVENT LISTENERS (EDITABLE)
document.addEventListener('DOMContentLoaded', () => {
	createSkyDashUI();
	injectSkyDashStyles();

	const collectionsDialog = document.querySelector('[data-sky-dialog="collections"]');
	const mediaDialog = document.querySelector('[data-sky-dialog="media"]');
	const skyKey = document.body.getAttribute('data-sky-key');
	const editableElements = document.querySelectorAll('[data-sky-editable]');

	// CLICK EVENTS
	document.body.addEventListener('click', (event) => {
		if (event.target.matches('#collectionsButton')) {
			const collections = readCollections();

			collectionsDialog.show();
			const body = collectionsDialogInnerHTML(collections);

			collectionsDialog.innerHTML = body;
		}

		if (event.target.matches('[data-dialog-close]')) {
			console.log('closed')
			collectionsDialog.close();
		}

		if (event.target.matches('#mediaButton')) {
			mediaDialog.show();

			const body = `
				<button data-dialog-close="media">Close</button>
				<button>Add Media</button>
			`;

			mediaDialog.innerHTML = body;
		}

		if (event.target.matches('[data-dialog-close="media"]')) {
			console.log('closed')
			mediaDialog.close();
		}
	});

	// SUBMIT EVENTS
	document.body.addEventListener('submit', (event) => {
		if (event.target.matches('#new-collection-form')) {
			event.preventDefault();

			const formData = new FormData(event.target);
			const tempCollection = {};

			for (let [key, value] of formData.entries()) {
			    tempCollection[key] = value;
			}

			const newId = Date.now().toString();

			const collection = {
				id: newId,
				singularId: tempCollection.collectionSingular,
				pluralId: tempCollection.collectionPlural,
				displayName: tempCollection.collectionDisplay,
				createdAt: new Date().toISOString(),
				updatedAt: new Date().toISOString(),
				fields: []
			};

			saveCollection(collection);

			const collections = readCollections();
			const body = collectionsDialogInnerHTML(collections);
			collectionsDialog.innerHTML = body;
		}
	})

    let editableContent = {};

    if (localStorage.getItem(skyKey)) {
        editableContent = JSON.parse(localStorage.getItem(skyKey));
        applyEditableContent(editableContent);
    }

    editableElements.forEach((element, index) => {
        if (!(index in editableContent)) {
            editableContent[index] = element.innerHTML;
            localStorage.setItem(skyKey, JSON.stringify(editableContent));
        }

        const editButton = document.createElement('button');
        editButton.textContent = 'Edit';
        editButton.addEventListener('click', () => editContent(element, index, skyKey));
        element.parentNode.insertBefore(editButton, element.nextSibling);
    });
});