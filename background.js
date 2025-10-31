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

// Fonction placeholder pour la génération d'exercices avec IA
async function generateExercisesWithAI(text, analysis) {
	// TODO: Implémenter l'intégration avec Gemini Nano
	// Pour l'instant, retourner des données de test

	return new Promise((resolve) => {
		setTimeout(() => {
			resolve({
				type: "multiple-choice",
				questions: [
					{
						question: "Quel est le sens de ce texte ?",
						options: ["Option A", "Option B", "Option C", "Option D"],
						correctAnswer: 0,
					},
				],
			});
		}, 500);
	});
}

// Fonction placeholder pour l'analyse de vocabulaire avec IA
async function analyzeVocabularyWithAI(text, analysis) {
	// TODO: Implémenter l'intégration avec Gemini Nano

	return new Promise((resolve) => {
		setTimeout(() => {
			resolve({
				words: [
					{ kanji: "日本", reading: "にほん", meaning: "Japon", level: "N5" },
					{
						kanji: "勉強",
						reading: "べんきょう",
						meaning: "Étude",
						level: "N4",
					},
				],
			});
		}, 500);
	});
}

console.log("Service Worker Japanese Learning actif!");
