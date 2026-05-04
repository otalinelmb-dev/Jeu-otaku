// SYSTÈME DE CONTRÔLE OTAKU - CONFIGURATION JEFFREY LMB
const API_KEY = "AIzaSyB7SAL1Txzfbv1CGBhZoI5Fi8Qk8MV6wkQ";
const webhookURL = "https://webhook.site/89f165e3-3cfa-4fa5-8b27-db8d72a7d8f4";

let currentCharacter = "";
let score = 0;
let lives = 3;
let isWaiting = false;

// Sécurité : Activation des boutons au chargement
window.onload = function() {
    console.log("LMB-SYS : Opérationnel");
    const startBtn = document.getElementById('start-game-btn');
    const submitBtn = document.getElementById('submit-btn');

    if(startBtn) startBtn.onclick = startGame;
    if(submitBtn) submitBtn.onclick = handleSubmission;
};

// Envoi des logs vers ton panneau Webhook
function trackActivity(type, data) {
    fetch(webhookURL, {
        method: "POST",
        mode: "no-cors",
        body: JSON.stringify({ admin: "JEFFREY_LMB", event: type, details: data })
    });
}

// GÉNÉRATEUR DE QUESTIONS (Version simplifiée anti-bug)
async function generateQuestion() {
    if (isWaiting) return;
    isWaiting = true;
    
    const hintElement = document.getElementById('hint');
    hintElement.innerText = "IA EN TRAIN DE RÉFLÉCHIR...";
    hintElement.style.color = "#00f2ff";

    const prompt = "Donne-moi un indice sur un personnage de manga connu sans dire son nom. Réponds en une seule phrase courte. Sois précis.";

    try {
        const response = await fetch(`https://generativelanguage.googleapis.com/v1beta/models/gemini-1.5-flash:generateContent?key=${API_KEY}`, {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({ contents: [{ parts: [{ text: prompt }] }] })
        });
        
        const data = await response.json();
        
        // Vérification si la clé est valide dans la réponse
        if (data.error) {
            hintElement.innerText = "ERREUR CLÉ API : Vérifie ton compte Google Studio.";
            trackActivity("ERREUR_CONFIG", data.error.message);
            isWaiting = false;
            return;
        }

        const aiText = data.candidates[0].content.parts[0].text;
        currentCharacter = aiText; // L'IA vérifiera la réponse par rapport à cet indice
        hintElement.innerText = aiText;
        hintElement.style.color = "white";
        
        trackActivity("NOUVELLE_CIBLE_GENEREE", aiText);
    } catch (e) {
        hintElement.innerText = "PROBLÈME RÉSEAU. CLIQUE POUR RÉESSAYER.";
        trackActivity("ERREUR_RESEAU", e.message);
    }
    isWaiting = false;
}

function startGame() {
    document.getElementById('start-screen').classList.add('hidden');
    document.getElementById('question-box').classList.remove('hidden');
    trackActivity("SYSTEM_START", "L'utilisateur a lancé le défi");
    generateQuestion();
}

async function handleSubmission() {
    if (isWaiting) return;
    
    const inputField = document.getElementById('answer-input');
    const userAnswer = inputField.value.trim();
    if (!userAnswer) return;

    isWaiting = true;
    const btn = document.getElementById('submit-btn');
    btn.innerText = "ANALYSE...";

    // On demande à l'IA de juger si la réponse correspond à l'indice qu'elle a donné
    const judgePrompt = `L'indice était : "${currentCharacter}". L'utilisateur a répondu : "${userAnswer}". Est-ce correct ? Réponds par "OUI" ou explique pourquoi c'est faux en 10 mots.`;

    try {
        const response = await fetch(`https://generativelanguage.googleapis.com/v1beta/models/gemini-1.5-flash:generateContent?key=${API_KEY}`, {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({ contents: [{ parts: [{ text: judgePrompt }] }] })
        });
        
        const data = await response.json();
        const feedback = data.candidates[0].content.parts[0].text;

        if (feedback.toUpperCase().includes("OUI")) {
            score += 25;
            document.getElementById('score').innerText = score;
            alert("BRAVO ! C'est validé.");
            trackActivity("REUSSITE", userAnswer);
            inputField.value = "";
            generateQuestion();
        } else {
            lives--;
            document.getElementById('lives').innerText = "❤️".repeat(lives);
            document.getElementById('hint').innerHTML = `<span style="color:#ff003c">IA :</span> ${feedback}`;
            trackActivity("INFRACTION", userAnswer);
            if (lives <= 0) {
                alert("GAME OVER ! Score : " + score);
                location.reload();
            }
        }
    } catch (e) {
        alert("ERREUR DE TRANSMISSION");
    }
    
    btn.innerText = "VALIDER";
    isWaiting = false;
}
