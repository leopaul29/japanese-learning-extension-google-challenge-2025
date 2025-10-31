// settings.js - Gestion des paramètres et de la clé API

let isKeyVisible = false;

// Charger la clé API existante
async function loadApiKey() {
	chrome.storage.local.get(["geminiApiKey"], (result) => {
		const apiKeyInput = document.getElementById("api-key");
		const keyStatus = document.getElementById("key-status");
		const statusIcon = document.getElementById("status-icon");
		const statusText = document.getElementById("status-text");

		if (result.geminiApiKey) {
			apiKeyInput.value = result.geminiApiKey;
			keyStatus.classList.remove("not-configured");
			keyStatus.classList.add("configured");
			statusIcon.textContent = "✅";
			statusText.textContent = "Clé API configurée";
		} else {
			keyStatus.classList.remove("configured");
			keyStatus.classList.add("not-configured");
			statusIcon.textContent = "⚠️";
			statusText.textContent = "Aucune clé API configurée";
		}
	});

	// Charger les statistiques
	chrome.storage.local.get(["apiUsage", "lastUsed"], (result) => {
		document.getElementById("api-usage").textContent = result.apiUsage || 0;
		document.getElementById("last-used").textContent =
			result.lastUsed || "Jamais";
	});
}

// Sauvegarder la clé API
document.getElementById("save-key").addEventListener("click", () => {
	const apiKey = document.getElementById("api-key").value.trim();
	const statusMessage = document.getElementById("status-message");

	if (!apiKey) {
		showStatus("error", "❌ Veuillez entrer une clé API");
		return;
	}

	// Vérifier le format de la clé (commence par AIza pour Google)
	if (!apiKey.startsWith("AIza")) {
		showStatus(
			"error",
			'⚠️ Format de clé invalide. Les clés Gemini commencent par "AIza"'
		);
		return;
	}

	// Sauvegarder dans le storage local
	chrome.storage.local.set({ geminiApiKey: apiKey }, () => {
		showStatus("success", "✅ Clé API sauvegardée avec succès !");
		loadApiKey(); // Recharger l'affichage
	});
});

// Supprimer la clé API
document.getElementById("clear-key").addEventListener("click", () => {
	if (confirm("Êtes-vous sûr de vouloir supprimer votre clé API ?")) {
		chrome.storage.local.remove("geminiApiKey", () => {
			document.getElementById("api-key").value = "";
			showStatus("success", "🗑️ Clé API supprimée");
			loadApiKey();
		});
	}
});

// Toggle visibilité de la clé
document.getElementById("toggle-key").addEventListener("click", () => {
	const apiKeyInput = document.getElementById("api-key");
	const toggleBtn = document.getElementById("toggle-key");

	isKeyVisible = !isKeyVisible;
	apiKeyInput.type = isKeyVisible ? "text" : "password";
	toggleBtn.textContent = isKeyVisible ? "Masquer" : "Afficher";
});

// Afficher un message de statut
function showStatus(type, message) {
	const statusMessage = document.getElementById("status-message");
	statusMessage.className = `status ${type} show`;
	statusMessage.textContent = message;

	// Masquer après 3 secondes
	setTimeout(() => {
		statusMessage.classList.remove("show");
	}, 3000);
}

// Charger au démarrage
loadApiKey();
