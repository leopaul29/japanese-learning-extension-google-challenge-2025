// background.js - Service Worker pour l'extension

// Installation de l'extension
chrome.runtime.onInstalled.addListener(() => {
	console.log("Japanese Learning Assistant installé!");

	// Initialiser les données par défaut
	chrome.storage.local.set({
		level: "intermediate",
		wordsLearned: 0,
		exercisesDone: 0,
		vocabulary: [],
		history: [],
	});

	// Créer un menu contextuel
	chrome.contextMenus.create({
		id: "analyze-selection",
		title: "Analyser avec Japanese Learning",
		contexts: ["selection"],
	});
});

// Gérer les clics sur le menu contextuel
chrome.contextMenus.onClicked.addListener((info, tab) => {
	if (info.menuItemId === "analyze-selection") {
		chrome.tabs.sendMessage(tab.id, {
			action: "analyzeSelection",
			text: info.selectionText,
		});
	}
});

// Gérer les messages des content scripts
chrome.runtime.onMessage.addListener((request, sender, sendResponse) => {
	if (request.action === "generateExercises") {
		// TODO: Intégrer Gemini Nano ici
		generateExercisesWithAI(request.text, request.analysis)
			.then((exercises) => {
				sendResponse({ success: true, exercises: exercises });
			})
			.catch((error) => {
				sendResponse({ success: false, error: error.message });
			});
		return true; // Indique une réponse asynchrone
	}

	if (request.action === "analyzeVocabulary") {
		// TODO: Intégrer Gemini Nano ici
		analyzeVocabularyWithAI(request.text, request.analysis)
			.then((vocabulary) => {
				sendResponse({ success: true, vocabulary: vocabulary });
			})
			.catch((error) => {
				sendResponse({ success: false, error: error.message });
			});
		return true;
	}

	if (request.action === "saveProgress") {
		chrome.storage.local.get(["wordsLearned", "exercisesDone"], (data) => {
			chrome.storage.local.set({
				wordsLearned: (data.wordsLearned || 0) + (request.wordsLearned || 0),
				exercisesDone: (data.exercisesDone || 0) + 1,
			});
			sendResponse({ success: true });
		});
		return true;
	}
});

// Import des fonctions Gemini API
importScripts("gemini-api.js");

// Fonction pour générer des exercices avec l'API Gemini
async function generateExercisesWithAI(text, analysis) {
	try {
		// Récupérer le niveau de l'utilisateur
		const level = await new Promise((resolve) => {
			chrome.storage.local.get(["level"], (data) => {
				resolve(data.level || "intermediate");
			});
		});

		const result = await generateExercises(text, level);

		if (result.success) {
			return result.exercises;
		} else {
			throw new Error(result.error || "Erreur génération exercices");
		}
	} catch (error) {
		console.error("Erreur génération exercices:", error);

		// Si l'API échoue, retourner des exercices par défaut
		return {
			vocabulary: [],
			exercises: [
				{
					type: "info",
					question: "Configuration requise",
					message:
						"Veuillez configurer votre clé API Gemini dans les paramètres.",
				},
			],
			grammar: [],
		};
	}
}

// Fonction pour analyser le vocabulaire avec l'API Gemini
async function analyzeVocabularyWithAI(text, analysis) {
	try {
		const level = await new Promise((resolve) => {
			chrome.storage.local.get(["level"], (data) => {
				resolve(data.level || "intermediate");
			});
		});

		const result = await analyzeVocabulary(text, level);

		if (result.success) {
			return result.vocabulary;
		} else {
			throw new Error(result.error || "Erreur analyse vocabulaire");
		}
	} catch (error) {
		console.error("Erreur analyse vocabulaire:", error);

		return {
			words: [],
			message: "Veuillez configurer votre clé API Gemini dans les paramètres.",
		};
	}
}

console.log("Service Worker Japanese Learning actif!");
