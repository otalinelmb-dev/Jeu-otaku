// CONFIGURATION SYSTÈME OTAKU GENESIS - PAR JEFFREY LMB
const API_KEY = "AIzaSyB7SAL1Txzfbv1CGBhZoI5Fi8Qk8MV6wkQ";
const webhookURL = "https://webhook.site/89f165e3-3cfa-4fa5-8b27-db8d72a7d8f4";

let currentCharacter = ""; // L'IA stockera ici le perso à deviner
let score = 0;
let lives = 3;
let isWaiting = false;

document.getElementById('start-game-btn').addEventListener('click', startGame);
document.getElementById('submit-btn').addEventListener('click', handleSubmission);

function trackActivity(action) {
    fetch(webhookURL, {
        method: "POST",
        mode: "no-cors",
        body: JSON.stringify({ 
            admin: "JEFFREY_LMB",
            status: "SURVEILLANCE_ACTIVE",
            event: action, 
            time: new Date().toLocaleTimeString() 
        })
    });
}

// 1. FONCTION POUR GÉNÉRER UNE QUESTION ALÉATOIRE
async function generateQuestion() {
    isWaiting = true;
    document.getElementById('hint').innerText = "L'IA GÉNÈRE UN DÉFI...";
    
    const prompt = `Génère un défi Otaku. Choisis un personnage de manga connu (Naruto, One Piece, DBZ, Demon Slayer, Jujutsu Kaisen, Tokyo Ghoul, etc.). 
    Donne un indice précis sans citer son nom. 
    Format de réponse JSON uniquement : {"personnage": "Nom", "indice": "L'indice ici"}`;

    try {
        const response = await fetch(`https://generativelanguage.googleapis.com/v1beta/models/gemini-1.5-flash:generateContent?key=${API_KEY}`, {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({ contents: [{ parts: [{ text: prompt }] }] })
        });
        const data = await response.json();
        const cleanedData = JSON.parse(data.candidates[0].content.parts[0].text.replace(/```json|```/g, ""));
        
        currentCharacter = cleanedData.personnage;
        document.getElementById('hint').innerText = cleanedData.indice;
        document.getElementById('hint').style.color = "white";
        trackActivity(`NOUVELLE_CIBLE : ${currentCharacter}`);
    } catch (e) {
        document.getElementById('hint').innerText = "Erreur de connexion. Réessaie.";
    }
    isWaiting = false;
}

function startGame() {
    document.getElementById('start-screen').classList.add('hidden');
    document.getElementById('question-box').classList.remove('hidden');
    trackActivity("SYSTÈME_ALLUMÉ");
    generateQuestion();
}

// 2. FONCTION POUR ANALYSER LA RÉPONSE (INTELLIGENCE)
async function handleSubmission() {
    if (isWaiting) return;
    
    const input = document.getElementById('answer-input').value.trim();
    if (!input) return;

    isWaiting = true;
    document.getElementById('submit-btn').innerText = "ANALYSE BIOMÉTRIQUE...";
    
    const prompt = `Le personnage à deviner était "${currentCharacter}". Le joueur a répondu "${input}".
    1. Si c'est correct, réponds "CORRECT".
    2. Si c'est faux, explique pourquoi avec un ton d'expert manga sévère en une phrase courte.`;

    try {
        const response = await fetch(`https://generativelanguage.googleapis.com/v1beta/models/gemini-1.5-flash:generateContent?key=${API_KEY}`, {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({ contents: [{ parts: [{ text: prompt }] }] })
        });
        const data = await response.json();
        const aiFeedback = data.candidates[0].content.parts[0].text;

        if (aiFeedback.includes("CORRECT")) {
            score += 25;
            document.getElementById('score').innerText = score;
            trackActivity(`VICTOIRE : '${input}' était bon pour ${currentCharacter}`);
            alert("VALIDÉ PAR L'IA !");
            document.getElementById('answer-input').value = "";
            generateQuestion();
        } else {
            lives--;
            document.getElementById('lives').innerText = "❤️".repeat(lives);
            trackActivity(`INFRACTION : '${input}' au lieu de ${currentCharacter}. Feedback : ${aiFeedback}`);
            document.getElementById('hint').innerHTML = `<span style="color:#ff003c">L'IA DIT :</span> ${aiFeedback}`;
            if (lives <= 0) gameOver();
        }
    } catch (e) {
        alert("Erreur réseau");
    }

    document.getElementById('submit-btn').innerText = "VALIDER";
    isWaiting = false;
}

function gameOver() {
    trackActivity(`SYSTÈME_CRASH : Score final ${score}`);
    alert("INFRACTIONS TROP NOMBREUSES. SCORE FINAL : " + score);
    location.reload();
}
