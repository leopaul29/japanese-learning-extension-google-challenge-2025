// config.js - Configuration des clés API

// Fonction pour récupérer la clé API depuis le storage
async function getApiKey() {
	return new Promise((resolve) => {
		chrome.storage.local.get(["geminiApiKey"], (result) => {
			resolve(result.geminiApiKey || null);
		});
	});
}

// Fonction pour sauvegarder la clé API
async function saveApiKey(apiKey) {
	return new Promise((resolve) => {
		chrome.storage.local.set({ geminiApiKey: apiKey }, () => {
			resolve(true);
		});
	});
}

// Fonction pour vérifier si une clé API est configurée
async function hasApiKey() {
	const key = await getApiKey();
	return key !== null && key !== "";
}

// Export des fonctions
if (typeof module !== "undefined" && module.exports) {
	module.exports = { getApiKey, saveApiKey, hasApiKey };
}
