// SETTINGS
async function fetchSettings() {
	try {
		const response = await fetch('settings.json');
		if (!response.ok) {
			throw new Error('Failed to fetch settings.json');
		}
		return response.json();
	} catch (error) {
		console.error('Error fetching settings:', error);
	}
}


async function loadSettings(settings) {
    try {
    	const settings = await fetchSettings()
    	console.log(settings)
        generateUI(settings);
    } catch (error) {
        console.error('Error loading settings file:', error);
    }
}

// CONFIG
async function fetchConfig() {
	try {
		const response = await fetch('config.json');
		if (!response.ok) {
			throw new Error('Failed to fetch config.json');
		}
		return response.json();
	} catch (error) {
		console.error('Error fetching config:', error);
	}
}


async function loadConfig(config) {
    try {
    	const config = await fetchConfig()
    	console.log(config)
        generateUI(config);
    } catch (error) {
        console.error('Error loading config file:', error);
    }
}

function generateUI(data) {
	console.log('Generating UI');
}

window.onload = () => {
	loadSettings();
	loadConfig();
};