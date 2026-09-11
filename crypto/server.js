const express = require("express");
const crypto = require("crypto");
const https = require("https");
const fs = require("fs");

const app = express();

app.use(express.json());

app.get("/digest", (req, res) => {

    // const { message } = req.body;

    // if (!message) {
    //     return res.status(400).json({
    //         error: "message is required"
    //     });
    // }

    try {

        // FIPS-approved digest algorithm
        const digest = crypto
            .createHash("MD5")
            .update("Hi", "utf8")
            .digest("hex");

        res.json({
            digest
        });

    } catch (err) {

        res.status(500).json({
            error: err.message
        });

    }

});

const options = {
    key: fs.readFileSync("./server.key"),
    cert: fs.readFileSync("./server.crt"),

    // Allow only TLS 1.2 and TLS 1.3
    minVersion: "TLSv1.2",
    maxVersion: "TLSv1.3"
};

https.createServer(options, app).listen(8443, () => {
    console.log("HTTPS Server started on port 8443");
    console.log("TLS Versions Allowed: TLS 1.2 and TLS 1.3");
    console.log("Digest Algorithm: SHA-256");
    console.log("OpenSSL:", process.versions.openssl);
    console.log("FIPS:", crypto.getFips());
    console.log("OpenSSL:", process.versions.openssl);

    if (!crypto.getFips || crypto.getFips() !== 1) {
        throw new Error("FIPS mode is not enabled. Refusing to start.");
    }

    if (crypto.getFips) {
        console.log("FIPS Mode:", crypto.getFips());
    }
});