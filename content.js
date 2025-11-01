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

	// Créer et afficher le panneau avec le loader
	const panel = document.createElement("div");
	panel.id = "jl-exercise-panel";
	panel.className = "jl-panel";
	panel.innerHTML = `
		<div class="jl-panel-content">
			<div class="jl-panel-header">
				<h2>✨ Generated Exercises</h2>
				<button class="jl-panel-close">×</button>
			</div>
			<div class="jl-panel-body">
				<div class="jl-loader-container">
					<div class="jl-loader"></div>
					<div class="jl-loader-text">Génération des exercices en cours...</div>
				</div>
			</div>
		</div>
	`;
	document.body.appendChild(panel);

	panel.querySelector(".jl-panel-close").addEventListener("click", () => {
		panel.remove();
	});

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
				panel.remove(); // Supprimer le panneau avec le loader
			} else {
				// En cas d'erreur, afficher un message
				panel.querySelector(".jl-panel-body").innerHTML = `
					<div class="jl-info-message">
						⚠️ Une erreur est survenue lors de la génération des exercices.
						Veuillez réessayer.
					</div>
				`;
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

	let exercisesHTML = "";

	if (exercises.exercises && exercises.exercises.length > 0) {
		exercisesHTML = exercises.exercises
			.map((ex, idx) => {
				if (ex.type === "info") {
					return `<div class="jl-info-message">⚠️ ${ex.message}</div>`;
				}

				if (ex.type === "multiple_choice") {
					const optionsHTML = ex.options
						.map(
							(opt, i) => `
          <label class="jl-option">
            <input type="radio" name="q${idx}" value="${i}">
            <span>${opt}</span>
          </label>
        `
						)
						.join("");

					return `
          <div class="jl-exercise-card" data-answer="${
						ex.correctAnswer
					}" data-idx="${idx}">
            <div class="jl-exercise-question">
              <span class="jl-exercise-number">Question ${idx + 1}</span>
              <p>${ex.question}</p>
            </div>
            <div class="jl-exercise-options">
              ${optionsHTML}
            </div>
            <button class="jl-check-btn">
              ✓ Check Answer
            </button>
            ${
							ex.explanation
								? `
              <div class="jl-explanation" style="display:none;">
                💡 <strong>Explanation:</strong> ${ex.explanation}
              </div>
            `
								: ""
						}
          </div>
        `;
				}

				return "";
			})
			.join("");
	} else {
		exercisesHTML = `<div class="jl-info-message">⚠️ Please configure your Gemini API key in settings</div>`;
	}

	panel.innerHTML = `
    <div class="jl-panel-content">
      <div class="jl-panel-header">
        <h2>✨ Generated Exercises</h2>
        <button class="jl-panel-close">×</button>
      </div>
      <div class="jl-panel-body">
        ${exercisesHTML}
      </div>
    </div>
  `;

	document.body.appendChild(panel);

	// Ajouter les event listeners pour les boutons de vérification
	const checkButtons = panel.querySelectorAll(".jl-check-btn");
	checkButtons.forEach((btn) => {
		btn.addEventListener("click", () => {
			const card = btn.closest(".jl-exercise-card");
			const questionIndex = Number.parseInt(card.dataset.idx);
			const correctAnswer = Number.parseInt(card.dataset.answer);
			checkAnswer(btn, questionIndex, correctAnswer);
		});
	});

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

// Fonction pour vérifier la réponse à une question
function checkAnswer(button, questionIndex, correctAnswer) {
	console.log("Vérification de la réponse pour la question", questionIndex);
	console.log("Réponse correcte:", correctAnswer);

	const exerciseCard = button.closest(".jl-exercise-card");
	console.log("Carte d'exercice:", exerciseCard);
	const selectedOption = exerciseCard.querySelector(
		'input[name="q' + questionIndex + '"]:checked'
	);
	const explanation = exerciseCard.querySelector(".jl-explanation");

	if (!selectedOption) {
		alert("Veuillez sélectionner une réponse");
		return;
	}

	const selectedAnswer = parseInt(selectedOption.value);
	const isCorrect = selectedAnswer === correctAnswer;

	// Désactiver les options après la réponse
	exerciseCard.querySelectorAll('input[type="radio"]').forEach((input) => {
		input.disabled = true;
	});

	// Marquer les bonnes/mauvaises réponses
	exerciseCard.querySelectorAll(".jl-option").forEach((option, index) => {
		if (index === correctAnswer) {
			option.classList.add("jl-correct");
		} else if (index === selectedAnswer && !isCorrect) {
			option.classList.add("jl-incorrect");
		}
	});

	// Mettre à jour le style du bouton et désactiver
	button.disabled = true;
	button.classList.add(isCorrect ? "jl-correct-btn" : "jl-incorrect-btn");
	button.textContent = isCorrect ? "✓ Correct!" : "✗ Incorrect";

	// Afficher l'explication si elle existe
	if (explanation) {
		explanation.style.display = "block";
	}

	// Sauvegarder la progression
	chrome.runtime.sendMessage({
		action: "saveProgress",
		wordsLearned: isCorrect ? 1 : 0,
	});
}

// Listener pour les messages du service worker
chrome.runtime.onMessage.addListener((request, sender, sendResponse) => {
	if (request.action === "getSelectedText") {
		const selectedText = window.getSelection().toString().trim();
		sendResponse({ text: selectedText });
	}
});

console.log("🎌 Japanese Learning Assistant activé!");
