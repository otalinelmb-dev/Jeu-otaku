// CONFIGURATION
const API_KEY = "AIzaSyB7SAL1Txzfbv1CGBhZoI5Fi8Qk8MV6wkQ";
const webhookURL = "https://webhook.site/89f165e3-3cfa-4fa5-8b27-db8d72a7d8f4";

let currentCharacter = "";
let score = 0;
let lives = 3;
let isWaiting = false;

// Sécurité : Attendre que la page soit prête
window.onload = function() {
    console.log("Système LMB-SYS prêt");
    
    const startBtn = document.getElementById('start-game-btn');
    const submitBtn = document.getElementById('submit-btn');

    if(startBtn) {
        startBtn.addEventListener('click', startGame);
    }
    if(submitBtn) {
        submitBtn.addEventListener('click', handleSubmission);
    }
};

function trackActivity(event, details) {
    fetch(webhookURL, {
        method: "POST",
        mode: "no-cors",
        body: JSON.stringify({ admin: "JEFFREY_LMB", type: event, data: details })
    });
}

async function generateQuestion() {
    isWaiting = true;
    const hintElement = document.getElementById('hint');
    hintElement.innerText = "L'IA GÉNÈRE UN DÉFI...";
    
    try {
        const response = await fetch(`https://generativelanguage.googleapis.com/v1beta/models/gemini-1.5-flash:generateContent?key=${API_KEY}`, {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({ contents: [{ parts: [{ text: 'Génère un perso de manga connu. Réponds UNIQUEMENT en JSON: {"nom": "Nom", "indice": "Description sans dire le nom"}' }] }] })
        });
        const data = await response.json();
        const content = data.candidates[0].content.parts[0].text.replace(/```json|```/g, "").trim();
        const parsed = JSON.parse(content);
        
        currentCharacter = parsed.nom;
        hintElement.innerText = parsed.indice;
        trackActivity("NOUVELLE_CIBLE", currentCharacter);
    } catch (e) {
        hintElement.innerText = "ERREUR IA. RECLIQUE SUR INITIALISER.";
    }
    isWaiting = false;
}

function startGame() {
    console.log("Démarrage...");
    document.getElementById('start-screen').classList.add('hidden');
    document.getElementById('question-box').classList.remove('hidden');
    trackActivity("START", "Jeu lancé");
    generateQuestion();
}

async function handleSubmission() {
    if (isWaiting) return;
    const inputField = document.getElementById('answer-input');
    const input = inputField.value.trim();
    if (!input) return;

    isWaiting = true;
    const btn = document.getElementById('submit-btn');
    btn.innerText = "ANALYSE...";
    
    try {
        const response = await fetch(`https://generativelanguage.googleapis.com/v1beta/models/gemini-1.5-flash:generateContent?key=${API_KEY}`, {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({ contents: [{ parts: [{ text: `Le perso était ${currentCharacter}. Réponse joueur: ${input}. Si bon dis "OK", sinon explique l'erreur (15 mots max).` }] }] })
        });
        const data = await response.json();
        const feedback = data.candidates[0].content.parts[0].text.trim();

        if (feedback.toUpperCase().includes("OK")) {
            score += 25;
            document.getElementById('score').innerText = score;
            trackActivity("OK", input);
            inputField.value = "";
            generateQuestion();
        } else {
            lives--;
            document.getElementById('lives').innerText = "❤️".repeat(lives);
            document.getElementById('hint').innerHTML = `<span style="color:#ff003c">IA :</span> ${feedback}`;
            trackActivity("FAIL", input);
            if (lives <= 0) {
                alert("GAME OVER ! Score : " + score);
                location.reload();
            }
        }
    } catch (e) { alert("ERREUR RÉSEAU"); }
    btn.innerText = "VALIDER";
    isWaiting = false;
}
