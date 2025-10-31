// content.js - Script injecté dans toutes les pages web

// Détection du texte japonais
function containsJapanese(text) {
	// Détecte hiragana, katakana, ou kanji
	return /[\u3040-\u309F\u30A0-\u30FF\u4E00-\u9FAF]/.test(text);
}

// Analyse basique du texte japonais
function analyzeJapaneseText(text) {
	const hiragana = text.match(/[\u3040-\u309F]/g) || [];
	const katakana = text.match(/[\u30A0-\u30FF]/g) || [];
	const kanji = text.match(/[\u4E00-\u9FAF]/g) || [];

	return {
		text: text,
		length: text.length,
		hiraganaCount: hiragana.length,
		katakanaCount: katakana.length,
		kanjiCount: kanji.length,
		hasJapanese: hiragana.length > 0 || katakana.length > 0 || kanji.length > 0,
	};
}

// Créer le popup de sélection
function createSelectionPopup(selectedText, rect) {
	// Supprimer l'ancien popup s'il existe
	const existingPopup = document.getElementById("japanese-learning-popup");
	if (existingPopup) {
		existingPopup.remove();
	}

	const analysis = analyzeJapaneseText(selectedText);

	if (!analysis.hasJapanese) {
		return; // Ne rien afficher si pas de japonais
	}

	const popup = document.createElement("div");
	popup.id = "japanese-learning-popup";
	popup.className = "jl-popup";

	// Positionner le popup près de la sélection
	popup.style.position = "absolute";
	popup.style.left = `${rect.left + window.scrollX}px`;
	popup.style.top = `${rect.bottom + window.scrollY + 5}px`;

	popup.innerHTML = `
    <div class="jl-popup-content">
      <div class="jl-popup-header">
        <span class="jl-popup-title">📚 Texte japonais détecté</span>
        <button class="jl-popup-close" id="jl-close-btn">×</button>
      </div>
      <div class="jl-popup-stats">
        <span class="jl-stat">📝 ${analysis.length} caractères</span>
        <span class="jl-stat">🔤 ${analysis.kanjiCount} kanji</span>
      </div>
      <div class="jl-popup-text">
        ${selectedText.substring(0, 100)}${
		selectedText.length > 100 ? "..." : ""
	}
      </div>
      <div class="jl-popup-actions">
        <button class="jl-btn jl-btn-primary" id="jl-generate-exercises">
          ✨ Générer des exercices
        </button>
        <button class="jl-btn jl-btn-secondary" id="jl-analyze-text">
          🔍 Analyser le vocabulaire
        </button>
      </div>
    </div>
  `;

	document.body.appendChild(popup);

	// Ajouter les event listeners
	document.getElementById("jl-close-btn").addEventListener("click", () => {
		popup.remove();
	});

	document
		.getElementById("jl-generate-exercises")
		.addEventListener("click", () => {
			generateExercises(selectedText, analysis);
		});

	document.getElementById("jl-analyze-text").addEventListener("click", () => {
		analyzeVocabulary(selectedText, analysis);
	});

	// Fermer si on clique ailleurs
	setTimeout(() => {
		document.addEventListener("click", function closePopup(e) {
			if (!popup.contains(e.target)) {
				popup.remove();
				document.removeEventListener("click", closePopup);
			}
		});
	}, 100);
}

// Générer des exercices (placeholder pour l'instant)
function generateExercises(text, analysis) {
	console.log("Génération d'exercices pour:", text);

	// Envoyer au service worker pour traitement
	chrome.runtime.sendMessage(
		{
			action: "generateExercises",
			text: text,
			analysis: analysis,
		},
		(response) => {
			if (response && response.success) {
				showExercisePanel(response.exercises);
			}
		}
	);
}

// Analyser le vocabulaire (placeholder)
function analyzeVocabulary(text, analysis) {
	console.log("Analyse du vocabulaire:", text);

	chrome.runtime.sendMessage(
		{
			action: "analyzeVocabulary",
			text: text,
			analysis: analysis,
		},
		(response) => {
			if (response && response.success) {
				showVocabularyPanel(response.vocabulary);
			}
		}
	);
}

// Afficher le panneau d'exercices
function showExercisePanel(exercises) {
	const panel = document.createElement("div");
	panel.id = "jl-exercise-panel";
	panel.className = "jl-panel";
	panel.innerHTML = `
    <div class="jl-panel-content">
      <div class="jl-panel-header">
        <h2>✨ Exercices générés</h2>
        <button class="jl-panel-close">×</button>
      </div>
      <div class="jl-panel-body">
        <p>🚧 Fonctionnalité en cours de développement</p>
        <p>Les exercices seront générés ici avec Gemini Nano</p>
      </div>
    </div>
  `;

	document.body.appendChild(panel);

	panel.querySelector(".jl-panel-close").addEventListener("click", () => {
		panel.remove();
	});
}

// Afficher le panneau de vocabulaire
function showVocabularyPanel(vocabulary) {
	const panel = document.createElement("div");
	panel.id = "jl-vocabulary-panel";
	panel.className = "jl-panel";
	panel.innerHTML = `
    <div class="jl-panel-content">
      <div class="jl-panel-header">
        <h2>🔍 Analyse du vocabulaire</h2>
        <button class="jl-panel-close">×</button>
      </div>
      <div class="jl-panel-body">
        <p>🚧 Fonctionnalité en cours de développement</p>
        <p>Le vocabulaire sera analysé ici</p>
      </div>
    </div>
  `;

	document.body.appendChild(panel);

	panel.querySelector(".jl-panel-close").addEventListener("click", () => {
		panel.remove();
	});
}

// Écouter les sélections de texte
document.addEventListener("mouseup", (e) => {
	// Attendre un peu pour que la sélection soit complète
	setTimeout(() => {
		const selection = window.getSelection();
		const selectedText = selection.toString().trim();

		if (selectedText.length > 0) {
			const range = selection.getRangeAt(0);
			const rect = range.getBoundingClientRect();

			createSelectionPopup(selectedText, rect);
		}
	}, 10);
});

// Listener pour les messages du service worker
chrome.runtime.onMessage.addListener((request, sender, sendResponse) => {
	if (request.action === "getSelectedText") {
		const selectedText = window.getSelection().toString().trim();
		sendResponse({ text: selectedText });
	}
});

console.log("🎌 Japanese Learning Assistant activé!");
