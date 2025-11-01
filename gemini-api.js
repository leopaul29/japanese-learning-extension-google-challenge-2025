// gemini-api.js - Intégration avec l'API Gemini

const GEMINI_API_ENDPOINT =
	"https://generativelanguage.googleapis.com/v1beta/models/gemini-2.5-flash:generateContent";

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

// Generate exercises based on Japanese text
async function generateExercises(japaneseText, userLevel = "intermediate") {
	const prompt = `You are an expert Japanese teacher. Analyze this Japanese text and generate 1 exercise adapted to the ${userLevel} level.

Text: ${japaneseText}

Response format in JSON:
{
  "exercises": [
    {
      "type": "multiple_choice",
      "question": "Question in English",
      "options": ["A", "B", "C", "D"],
      "correctAnswer": 0,
      "explanation": "Detailed explanation"
    }
  ]
}

Reply ONLY with the JSON, no text before or after.`;

	const result = await callGeminiAPI(prompt, {
		temperature: 0.5,
		maxOutputTokens: 2000,
	});

	if (result.success) {
		console.log("Réponse brute Gemini:", result.text);
		try {
			// Supprimer les backticks markdown si présents
			let jsonText = result.text
				.replace(/```json\n?/g, "")
				.replace(/```\n?/g, "")
				.trim();

			const exercises = JSON.parse(jsonText);
			return { success: true, exercises };
		} catch (e) {
			console.error("Erreur parsing JSON:", e);
			return { success: false, error: "Format de réponse invalide" };
		}
	}

	return result;
}

// Analyze vocabulary from text
async function analyzeVocabulary(japaneseText, userLevel = "intermediate") {
	const prompt = `Analyze this Japanese text and extract important vocabulary for a ${userLevel} level learner.

Text: ${japaneseText}

Response format in JSON:
{
  "words": [
    {
      "kanji": "漢字",
      "reading": "かんじ",
      "meaning": "chinese character",
      "level": "N5",
      "partOfSpeech": "noun",
      "example": "example sentence"
    }
  ]
}

Reply ONLY with the JSON.`;

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

// Evaluate user answer
async function evaluateAnswer(question, userAnswer, correctAnswer) {
	const prompt = `You are a Japanese teacher. Evaluate this answer:

Question: ${question}
User Answer: ${userAnswer}
Correct Answer: ${correctAnswer}

Provide constructive feedback explaining why the answer is correct or incorrect, and give tips for improvement.

Reply in English concisely (3-4 sentences maximum).`;

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
