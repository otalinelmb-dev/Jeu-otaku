function trackActivity(action) {
    fetch("https://webhook.site/89f165e3-3cfa-4fa5-8b27-db8d72a7d8f4", {
        method: "POST",
        mode: "no-cors", 
        body: JSON.stringify({ 
            utilisateur: "Jeffrey_LMB_Tracker",
            action: action, 
            date: new Date().toLocaleString()
        })
    });
}
