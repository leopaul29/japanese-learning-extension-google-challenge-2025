// gemini-api.js - Intégration avec l'API Gemini

const GEMINI_API_ENDPOINT =
	"https://generativelanguage.googleapis.com/v1beta/models/gemini-1.5-flash:generateContent";

// Fonction pour obtenir la clé API
async function getApiKey() {
	return new Promise((resolve, reject) => {
		chrome.storage.local.get(["geminiApiKey"], (result) => {
			if (result.geminiApiKey) {
				resolve(result.geminiApiKey);
			} else {
				reject(new Error("Clé API non configurée"));
			}
		});
	});
}

// Fonction pour incrémenter le compteur d'utilisation
function incrementApiUsage() {
	chrome.storage.local.get(["apiUsage", "lastUsed"], (result) => {
		const now = new Date().toLocaleString("fr-FR");
		chrome.storage.local.set({
			apiUsage: (result.apiUsage || 0) + 1,
			lastUsed: now,
		});
	});
}

// Fonction principale pour appeler l'API Gemini
async function callGeminiAPI(prompt, options = {}) {
	try {
		const apiKey = await getApiKey();

		const requestBody = {
			contents: [
				{
					parts: [
						{
							text: prompt,
						},
					],
				},
			],
			generationConfig: {
				temperature: options.temperature || 0.7,
				topK: options.topK || 40,
				topP: options.topP || 0.95,
				maxOutputTokens: options.maxOutputTokens || 2048,
			},
		};

		const response = await fetch(`${GEMINI_API_ENDPOINT}?key=${apiKey}`, {
			method: "POST",
			headers: {
				"Content-Type": "application/json",
			},
			body: JSON.stringify(requestBody),
		});

		if (!response.ok) {
			const error = await response.json();
			throw new Error(error.error?.message || "Erreur API");
		}

		const data = await response.json();
		incrementApiUsage();

		// Extraire le texte de la réponse
		const text = data.candidates?.[0]?.content?.parts?.[0]?.text;
		return { success: true, text, data };
	} catch (error) {
		console.error("Erreur Gemini API:", error);
		return { success: false, error: error.message };
	}
}

// Générer des exercices basés sur un texte japonais
async function generateExercises(japaneseText, userLevel = "intermediate") {
	const prompt = `Tu es un professeur de japonais expert. Analyse ce texte japonais et génère 3 exercices adaptés au niveau ${userLevel}.

Texte: ${japaneseText}

Format de réponse en JSON:
{
  "vocabulary": [
    {"word": "mot", "reading": "lecture", "meaning": "sens", "level": "N5"}
  ],
  "exercises": [
    {
      "type": "multiple_choice",
      "question": "Question en français",
      "options": ["A", "B", "C", "D"],
      "correctAnswer": 0,
      "explanation": "Explication détaillée"
    }
  ],
  "grammar": [
    {"pattern": "forme grammaticale", "explanation": "explication"}
  ]
}

Réponds UNIQUEMENT avec le JSON, sans texte avant ou après.`;

	const result = await callGeminiAPI(prompt, {
		temperature: 0.5,
		maxOutputTokens: 2000,
	});

	if (result.success) {
		try {
			// Nettoyer le texte pour extraire le JSON
			let jsonText = result.text.trim();

			// Supprimer les backticks markdown si présents
			jsonText = jsonText.replace(/```json\n?/g, "").replace(/```\n?/g, "");

			const exercises = JSON.parse(jsonText);
			return { success: true, exercises };
		} catch (e) {
			console.error("Erreur parsing JSON:", e);
			return { success: false, error: "Format de réponse invalide" };
		}
	}

	return result;
}

// Analyser le vocabulaire d'un texte
async function analyzeVocabulary(japaneseText, userLevel = "intermediate") {
	const prompt = `Analyse ce texte japonais et extrait le vocabulaire important pour un apprenant de niveau ${userLevel}.

Texte: ${japaneseText}

Format de réponse en JSON:
{
  "words": [
    {
      "kanji": "漢字",
      "reading": "かんじ",
      "meaning": "caractère chinois",
      "level": "N5",
      "partOfSpeech": "nom",
      "example": "exemple de phrase"
    }
  ]
}

Réponds UNIQUEMENT avec le JSON.`;

	const result = await callGeminiAPI(prompt, {
		temperature: 0.3,
		maxOutputTokens: 1500,
	});

	if (result.success) {
		try {
			let jsonText = result.text.trim();
			jsonText = jsonText.replace(/```json\n?/g, "").replace(/```\n?/g, "");
			const vocabulary = JSON.parse(jsonText);
			return { success: true, vocabulary };
		} catch (e) {
			console.error("Erreur parsing JSON:", e);
			return { success: false, error: "Format de réponse invalide" };
		}
	}

	return result;
}

// Évaluer une réponse d'utilisateur
async function evaluateAnswer(question, userAnswer, correctAnswer) {
	const prompt = `Tu es un professeur de japonais. Évalue cette réponse:

Question: ${question}
Réponse de l'utilisateur: ${userAnswer}
Réponse correcte: ${correctAnswer}

Fournis un feedback constructif en expliquant pourquoi la réponse est correcte ou incorrecte, et donne des conseils pour s'améliorer.

Réponds en français de manière concise (3-4 phrases maximum).`;

	const result = await callGeminiAPI(prompt, {
		temperature: 0.7,
		maxOutputTokens: 300,
	});

	return result;
}

// Export des fonctions pour utilisation dans d'autres scripts
if (typeof module !== "undefined" && module.exports) {
	module.exports = {
		callGeminiAPI,
		generateExercises,
		analyzeVocabulary,
		evaluateAnswer,
	};
}
