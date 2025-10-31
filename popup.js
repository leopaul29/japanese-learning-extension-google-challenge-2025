// popup.js - Gestion de l'interface popup

// Charger les données utilisateur
function loadUserData() {
	chrome.storage.local.get(
		["level", "wordsLearned", "exercisesDone"],
		(data) => {
			// Niveau
			const level = data.level || "intermediate";
			document.querySelectorAll(".level-btn").forEach((btn) => {
				btn.classList.toggle("active", btn.dataset.level === level);
			});

			// Statistiques
			document.getElementById("words-learned").textContent =
				data.wordsLearned || 0;
			document.getElementById("exercises-done").textContent =
				data.exercisesDone || 0;
		}
	);
}

// Sauvegarder le niveau
document.querySelectorAll(".level-btn").forEach((btn) => {
	btn.addEventListener("click", () => {
		const level = btn.dataset.level;

		// Mettre à jour l'UI
		document.querySelectorAll(".level-btn").forEach((b) => {
			b.classList.remove("active");
		});
		btn.classList.add("active");

		// Sauvegarder
		chrome.storage.local.set({ level: level }, () => {
			console.log("Niveau sauvegardé:", level);
		});
	});
});

// Bouton de pratique
document.getElementById("practice-btn").addEventListener("click", () => {
	chrome.tabs.query({ active: true, currentWindow: true }, (tabs) => {
		chrome.tabs.sendMessage(tabs[0].id, { action: "openPractice" });
	});
});

// Bouton de révision
document.getElementById("review-btn").addEventListener("click", () => {
	chrome.tabs.query({ active: true, currentWindow: true }, (tabs) => {
		chrome.tabs.sendMessage(tabs[0].id, { action: "openReview" });
	});
});

// Bouton paramètres
document.getElementById("settings-btn").addEventListener("click", () => {
	chrome.tabs.query({ active: true, currentWindow: true }, (tabs) => {
		chrome.tabs.sendMessage(tabs[0].id, { action: "openSettings" });
	});
});

// Charger les données au démarrage
loadUserData();

// Rafraîchir les stats toutes les secondes
setInterval(loadUserData, 1000);
