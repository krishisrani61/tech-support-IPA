document.getElementById("startAuth").addEventListener("click", async () => {
    const clientId = "NgBBKBdswHZqlUVaBtF1gjSJlFyCyeHT";  // Your Client ID
    const deviceCodeUrl = "https://auth.isranicloud.com/oauth/device/code";
    const tokenUrl = "https://auth.isranicloud.com/oauth/token";
    const audience = "https://ipa.isranicloud.com"; // Your audience

    // Helper function to convert characters to phonetic alphabet with dashes
    function toPhoneticAlphabet(code) {
        const phoneticMap = {
            A: "Alpha", B: "Bravo", C: "Charlie", D: "Delta", E: "Echo", 
            F: "Foxtrot", G: "Golf", H: "Hotel", I: "India", J: "Juliett", 
            K: "Kilo", L: "Lima", M: "Mike", N: "November", O: "Oscar", 
            P: "Papa", Q: "Quebec", R: "Romeo", S: "Sierra", T: "Tango", 
            U: "Uniform", V: "Victor", W: "Whiskey", X: "X-ray", 
            Y: "Yankee", Z: "Zulu", 
            0: "Zero", 1: "One", 2: "Two", 3: "Three", 4: "Four", 
            5: "Five", 6: "Six", 7: "Seven", 8: "Eight", 9: "Nine"
        };

        return code.toUpperCase().split("").map(char => phoneticMap[char] || char).join(" - ");
    }

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

        // Show QR Code and User Code with Phonetic Alphabet
        document.getElementById("qrCodeContainer").style.display = "block";
        const phoneticCode = toPhoneticAlphabet(data.user_code);
        document.getElementById("userCode").textContent = phoneticCode;
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

                // Decode the ID token to extract user-specific information
                const decoded = jwt_decode(tokenData.id_token);

                // Display user-specific information
                document.getElementById("username").textContent = `Username: ${decoded.name || "N/A"}`;
                document.getElementById("email").textContent = `Email: ${decoded.email || "N/A"}`;
                document.getElementById("picture").src = decoded.picture || "";
                document.getElementById("authTime").textContent = `Authenticated At: ${new Date().toLocaleString()}`;
            } else {
                handleTokenErrors(tokenData, poll);
            }
        }, interval);

    } catch (error) {
        console.error("Error:", error);
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
        }
    }
}
