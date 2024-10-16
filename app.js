document.getElementById("startAuth").addEventListener("click", async () => {
    const clientId = "NgBBKBdswHZqlUVaBtF1gjSJlFyCyeHT";  // Your Client ID
    const deviceCodeUrl = "https://auth.isranicloud.com/oauth/device/code";
    const tokenUrl = "https://auth.isranicloud.com/oauth/token";
    const audience = "https://ipa.isranicloud.com"; // Your audience

    try {
        // Step 1: Request the Device Code
        const response = await fetch(deviceCodeUrl, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/x-www-form-urlencoded'
            },
            body: `client_id=${clientId}&scope=openid profile email&audience=${audience}`
        });

        if (!response.ok) {
            const error = await response.json();
            throw new Error(error.error_description || 'Failed to request device code');
        }

        const data = await response.json();

        // Show QR Code and User Code
        document.getElementById("qrCodeContainer").style.display = "block";
        document.getElementById("userCode").textContent = data.user_code;
        document.getElementById("verificationUri").textContent = data.verification_uri;

        // Generate QR Code
        QRCode.toCanvas(document.getElementById("qrCode"), data.verification_uri_complete, (error) => {
            if (error) console.error("QR Code generation error:", error);
        });

        // Step 2: Poll for the token every 5 seconds
        const interval = 5000; // Set to 5 seconds
        const poll = setInterval(async () => {
            const tokenResponse = await fetch(tokenUrl, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/x-www-form-urlencoded'
                },
                body: `grant_type=urn:ietf:params:oauth:grant-type:device_code&device_code=${data.device_code}&client_id=${clientId}`
            });

            const tokenData = await tokenResponse.json();

            if (tokenResponse.ok && tokenData.access_token) {
                clearInterval(poll);
                document.getElementById("qrCodeContainer").style.display = "none";
                document.getElementById("resultContainer").style.display = "block";

                // Extract user-specific data and display it
                const userInfo = {
                    Username: tokenData.user_name || "N/A",
                    Email: tokenData.email || "N/A",
                    Expiry: tokenData.expires_in ? `${tokenData.expires_in} seconds` : "N/A",
                    TokenType: tokenData.token_type || "N/A"
                };

                document.getElementById("username").textContent = `Username: ${userInfo.Username}`;
                document.getElementById("email").textContent = `Email: ${userInfo.Email}`;
                document.getElementById("expiry").textContent = `Expires In: ${userInfo.Expiry}`;
                document.getElementById("tokenType").textContent = `Token Type: ${userInfo.TokenType}`;
                document.getElementById("authTime").textContent = `Authenticated At: ${new Date().toLocaleString()}`;
            } else {
                handleTokenErrors(tokenData, poll);
            }
        }, interval);

    } catch (error) {
        console.error("Error:", error);
        alert(`Error: ${error.message}`);
    }
});

// Function to handle token errors
function handleTokenErrors(tokenData, poll) {
    if (tokenData.error) {
        if (tokenData.error === "expired_token" || tokenData.error === "invalid_grant") {
            clearInterval(poll);
            alert("The device code has expired. Please restart the authorization process.");
        } else {
            console.error("Token Error:", tokenData.error_description || tokenData.error);
            alert(`Error: ${tokenData.error_description || tokenData.error}`);
        }
    }
}
