document.getElementById("startAuth").addEventListener("click", async () => {
    const clientId = "NgBBKBdswHZqlUVaBtF1gjSJlFyCyeHT";  // Replace with your actual Client ID
    const deviceCodeUrl = "https://auth.isranicloud.com/oauth/device/code";
    const tokenUrl = "https://auth.isranicloud.com/oauth/token";

    try {
        // Step 1: Request the Device Code
        let response = await fetch(deviceCodeUrl, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/x-www-form-urlencoded'
            },
            body: `client_id=${clientId}&scope=openid profile&audience=MwoCvqJrJdgBAqONf6JIEZZeTZ9KbfF3`
        });
        let data = await response.json();

        // Show QR Code and User Code
        document.getElementById("qrCodeContainer").style.display = "block";
        document.getElementById("userCode").textContent = data.user_code;
        document.getElementById("verificationUri").textContent = data.verification_uri;
        
        QRCode.toCanvas(document.getElementById("qrCode"), data.verification_uri_complete, function (error) {
            if (error) console.error(error);
        });

        // Step 2: Poll for the token
const interval = data.interval * 1000;
const poll = setInterval(async () => {
    let tokenResponse = await fetch(tokenUrl, {
        method: 'POST',
        headers: {
            'Content-Type': 'application/x-www-form-urlencoded'
        },
        body: `grant_type=urn:ietf:params:oauth:grant-type:device_code&device_code=${data.device_code}&client_id=${clientId}`
    });
    let tokenData = await tokenResponse.json();

    if (tokenData.access_token) {
        clearInterval(poll);
        document.getElementById("qrCodeContainer").style.display = "none";
        document.getElementById("resultContainer").style.display = "block";
        document.getElementById("username").textContent = tokenData.user_name;
        document.getElementById("authTime").textContent = new Date().toLocaleString();
    } else if (tokenData.error === "expired_token" || tokenData.error === "invalid_grant") {
        clearInterval(poll);
        alert("The device code has expired. Please restart the authorization process.");
    } else {
        clearInterval(poll);
        console.error("Error:", tokenData.error_description || tokenData.error);
        alert(`Error: ${tokenData.error_description || tokenData.error}`);
    }
        // Do nothing, continue polling.
    } else {
        // Stop polling and handle errors.
        clearInterval(poll);
        console.error("Error:", tokenData.error_description || tokenData.error);
        alert(`Error: ${tokenData.error_description || tokenData.error}`);
    }
}, interval);
    } catch (error) {
        console.error("Error:", error);
    }
});
