// TEMPLATES (HTML)
export function renderMediaDialog(media) {
    return `
        <button data-sky-dialog-close="media">Close</button>
	    <input type="file" id="media-upload-input" accept="image/*" style="display:none;">
	    <button id="openFileUpload">Upload Image</button>
	    <div id="mediaGallery"></div>
    `;
}

export function renderEditableToolbar(editableType, index) {
    switch (editableType) {
        case 'image':
            return `<div class="sky-edit-toolbar">
	                <button class="sky-edit-button" data-edit-index="${index}" data-edit-action="swap-image">Swap Image</button>
                </div>`;
        case 'text':
            return `
            	<div class="sky-edit-toolbar">
	                <button class="sky-edit-button" data-edit-index="${index}" data-edit-action="edit">Edit Text</button>
	                <button class="sky-edit-button" data-edit-index="${index}" data-edit-action="bold">Bold</button>
	                <button class="sky-edit-button" data-edit-index="${index}" data-edit-action="italicize">Italicize</button>
                </div>
            `;
        case 'block':
            return `<div class="sky-edit-toolbar">
	                <button class="sky-edit-button" data-edit-index="${index}" data-edit-action="block">Edit Block</button>
                </div>`;
        default:
            return `<div class="sky-edit-toolbar">
	                <button class="sky-edit-button" data-edit-index="${index}" data-edit-action="edit">Edit</button>
                </div>`;
    }
}

export function renderEditableEditForm() {
	return `<form id="editForm">
			<textarea id="editInput" name="content"></textarea>
			<input type="hidden" id="editIndex" name="index">
			<button type="submit">Save Changes</button>
			<button type="button" onclick="document.getElementById('editDialog').close();">Cancel</button>
		</form>`;
}

export function renderCollectionsDialog(collections) {
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

export function renderInstances(collectionData, instances) {
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

export function renderNewInstanceForm(collectionData) {
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

export function renderInstanceEditForm(collectionData, instance) {
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