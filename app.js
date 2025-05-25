require("dotenv").config();
const express = require("express");
const fetch = require("node-fetch");
const path = require("path");
const fs = require("fs");
import cors from 'cors';

const app = express();
app.use(express.json());
app.use(cors());

const HEYGEN_V2 = "https://api.heygen.com/v2";
const HEYGEN_API_URL = process.env.HEYGEN_API_URL || "https://api.heygen.com/v1";
const KEY = process.env.HEYGEN_API_KEY;

// ——— 1) List available streaming avatars ——
app.get("/api/avatars", async (_, res) => {
    try {
        console.log("Fetching avatars");
        const response = await fetch(`${HEYGEN_API_URL}/streaming/avatar.list`, {
            headers: { "X-Api-Key": KEY },
        });
        const { data } = await response.json();
        console.log("Avatars fetched", data);
        // data.data is an array of { avatar_id, ... }
        res.json({ avatars: data });
    } catch (err) {
        console.error("Avatar list error:", err.response?.data || err.message);
        res.status(500).json({ error: "Could not fetch avatar list" });
    }
});

app.get("/api/video-avatars", async (_, res) => {
    try {
        console.log("Fetching video generation avatars");
        const response = await fetch("https://api.heygen.com/v2/avatars", {
            headers: { "X-Api-Key": KEY },
        });
        const { data } = await response.json();
        const avatars = data.avatars || [];
        console.log("Video avatars fetched", avatars);
        res.json({ avatars });
    } catch (err) {
        console.error("Video avatar list error:", err.response?.data || err.message);
        res.status(500).json({ error: "Could not fetch video avatar list" });
    }
});

app.get("/api/voices", async (_, res) => {
    try {
        console.log("Fetching voices");
        const response = await fetch("https://api.heygen.com/v2/voices", {
            headers: { "X-Api-Key": KEY },
        });
        const { data } = await response.json();
        const voices = data.voices || [];
        console.log("Voices fetched", voices);
        res.json({ voices });
    } catch (err) {
        console.error("Voice list error:", err.response?.data || err.message);
        res.status(500).json({ error: "Could not fetch voice list" });
    }
});

// ——— 2) Generate streaming token ——
app.get("/api/token", async (req, res) => {
    try {
        console.log("Generating token");
        const response = await fetch(`${HEYGEN_API_URL}/streaming.create_token`, {
            method: "POST",
            headers: { "X-Api-Key": KEY },
        });
        const { data } = await response.json();
        console.log("Token generated", data);
        res.json({ token: data.token });
    } catch (err) {
        console.error("Token error:", err.response?.data || err.message);
        res.status(500).json({ error: "Token generation failed" });
    }
});

app.post("/api/videos/create", async (req, res) => {
    const { avatar_id, voice_id, input_text } = req.body;

    const response = await fetch("https://api.heygen.com/v2/video/generate", {
        method: "POST",
        headers: {
            "X-Api-Key": process.env.HEYGEN_API_KEY,
            "Content-Type": "application/json",
        },
        body: JSON.stringify({
            video_inputs: [
                {
                    character: {
                        type: "avatar",
                        avatar_id,
                        avatar_style: "normal",
                    },
                    voice: {
                        type: "text",
                        input_text,
                        voice_id,
                    },
                    background: { type: "color", value: "#FFFFFF" },
                },
            ],
            dimension: { width: 360, height: 640 },
            title: "Generated Video",
        }),
    });

    const data = await response.json();
    console.log("Video generated", data);
    res.json(data);
});

app.get("/api/videos/:video_id", async (req, res) => {
    console.log("Fetching video status", req.params);
    const { video_id } = req.params;

    const response = await fetch(`https://api.heygen.com/v1/video_status.get?video_id=${video_id}`, {
        headers: { "X-Api-Key": process.env.HEYGEN_API_KEY },
    });

    const data = await response.json();
    console.log("Video status fetched", data);
    res.json(data);
});

// ——— 3) Video generation endpoints ——
app.post("/api/videos", async (req, res) => {
    try {
        const payload = {
            video_inputs: [
                {
                    character: { type: "avatar", avatar_id: "default", avatar_style: "normal" },
                    voice: { type: "text", input_text: "Hello from HeyGen video API!" },
                },
            ],
            dimension: { width: 320, height: 480 },
        };
        const response = await fetch(`${HEYGEN_API_URL}/video/generate`, {
            method: "POST",
            headers: { "X-Api-Key": KEY },
            body: JSON.stringify(payload),
        });
        const { data } = await response.json();
        res.json({ video_id: data.data.video_id });
    } catch (err) {
        console.error("Video generate error:", err.response?.data || err.message);
        res.status(500).json({ error: "Video creation failed" });
    }
});

app.get("/api/videos/:id", async (req, res) => {
    try {
        const response = await fetch(`${HEYGEN_API_URL}/video_status.get?video_id=${req.params.id}`, {
            headers: { "X-Api-Key": KEY },
        });
        const { data } = await response.json();
        res.json(data.data);
    } catch (err) {
        console.error("Video status error:", err.response?.data || err.message);
        res.status(500).json({ error: "Video status failed" });
    }
});

async function listAllAvatarsInGroup(group_id) {
    const response = await fetch(`https://api.heygen.com/v2/avatar_group/${group_id}/avatars`, {
        headers: { "X-Api-Key": KEY },
    });
    const { data } = await response.json();
    console.log("Avatars fetched", data);
    return data;
}

async function fetchAllHeygenVoicesAndCountThem() {
    const response = await fetch("https://api.heygen.com/v2/voices", {
        headers: { "X-Api-Key": KEY },
    });
    const { data } = await response.json();
    console.log("Voices fetched", data.voices.length);
}

async function listAllActiveStreams() {
    const response = await fetch("https://api.heygen.com/v1/streaming.list", {
        headers: { "X-Api-Key": KEY },
    });
    console.log("Streams fetched", await response.json());
}

async function stopActiveStreamByID(session_id) {
    const response = await fetch(`https://api.heygen.com/v1/streaming.stop`, {
        method: "POST",
        headers: { "X-Api-Key": KEY },
        body: JSON.stringify({ session_id }),
    });
    console.log("Stream stopped", await response.json());
}

async function listAllAvatars() {
    const response = await fetch("https://api.heygen.com/v2/avatars", {
        headers: { "X-Api-Key": KEY },
    });
    const { data } = await response.json();
    console.log("Avatars fetched", data.avatars);
}

/**
 * Return an array of voices that CAN accept locale:"pt-BR".
 * (Those are the ones with support_locale === true and language includes "Portuguese".)
 *
 * @param {string} apiKey  HeyGen API key
 * @returns {Promise<Array<{voice_id:string,name:string,language:string}>>}
 */
async function listPtBRCapableVoices(apiKey) {
    const headers = { "X-Api-Key": apiKey };

    // 1️⃣  Check that pt-BR exists in the global locale list
    const localesRsp = await fetch("https://api.heygen.com/v2/voices/locales", { headers });
    const locales = (await localesRsp.json()).data?.locales || [];
    if (!locales.some((l) => l.locale === "pt-BR")) {
        console.warn("⚠️  Locale pt-BR is NOT enabled in this workspace.");
        return [];
    }

    // 2️⃣  Fetch the full voice catalogue
    const voicesRsp = await fetch("https://api.heygen.com/v2/voices", { headers });
    const voices = (await voicesRsp.json()).data?.voices || [];

    // 3️⃣  Keep Portuguese voices that advertise locale support
    const voices1 = voices.filter((v) => v.support_locale === true && (v.language || "").toLowerCase().includes("portuguese"));

    console.table(
        voices1.map((v) => ({
            id: v.voice_id,
            name: v.name,
            lang: v.language,
        }))
    );

    /* Example speak/video payload */
    if (voices1.length) {
        const voiceId = voices1[0].voice_id; // pick any from the list
        const payload = {
            script: {
                type: "text",
                input_text: "Olá, tudo bem?",
                voice_id: voiceId,
                locale: "pt-BR", // forces Brazilian accent
            },
        };
        console.log("→ Use this payload:", payload);
    }
}

async function uploadImageToHeygen() {
    // File and API details
    const filePath = path.join(__dirname, "IMG_0187.jpeg");
    const url = "https://upload.heygen.com/v1/asset";
    const apiKey = KEY;

    // Read file as buffer
    const fileBuffer = fs.readFileSync(filePath);

    // Upload using fetch
    fetch(url, {
        method: "POST",
        headers: {
            "Content-Type": "image/jpeg",
            "X-Api-Key": apiKey,
        },
        body: fileBuffer,
    })
        .then(async (res) => {
            console.log(res.status);
            const json = await res.json();
            console.log(json);
        })
        .catch((err) => {
            console.error("Upload failed:", err);
        });
}

async function createPhotoAvatarGroup() {
    fetch("https://api.heygen.com/v2/photo_avatar/avatar_group/create", {
        method: "POST",
        headers: {
            accept: "application/json",
            "Content-Type": "application/json",
            "X-Api-Key": KEY,
        },
        // body: '{\n    "name": "Sylvia",\n    "image_key": "image/47b2367366d94ee79894ed1f692b33ae/original"\n}',
        body: JSON.stringify({
            name: "N",
            image_key: "image/40080b26e0634035a6201bfdfb80f2f1/original",
        }),
    });
}

async function generatePhotoAvatar() {
    fetch("https://api.heygen.com/v2/photo_avatar/photo/generate", {
        method: "POST",
        headers: {
            "X-Api-Key": KEY,
            "Content-Type": "application/json",
        },
        body: JSON.stringify({
            name: "Button Man",
            age: "Early Middle Age",
            gender: "Man",
            ethnicity: "White",
            orientation: "horizontal",
            pose: "half_body",
            style: "Realistic",
            appearance: "A man with buttons as eyes and nose, muscular body and round shaped head.",
        }),
    })
        .then((res) => {
            console.log(res.status);
            return res.json();
        })
        .then((data) => {
            console.log(data);
        })
        .catch((err) => {
            console.error(err);
        });
}

async function getPhotoAvatar(id) {
    fetch(`https://api.heygen.com/v2/photo_avatar/generation/${id}`, {
        method: "GET",
        headers: {
            "X-Api-Key": KEY,
            "Content-Type": "application/json",
        },
    })
        .then((res) => {
            console.log(res.status);
            return res.json();
        })
        .then((data) => {
            console.log(data);
        });
}

// ——— 4) Serve built Vue + SPA fallback ——
const clientDist = path.join(__dirname, "heygen-client", "dist");
app.use(express.static(clientDist));
app.get("*", (_, res) => {
    res.sendFile(path.join(clientDist, "index.html"));
});

// ——— 5) Start server ——
const PORT = process.env.PORT || 3000;
app.listen(PORT, () => {
    console.log(`Server running on ${PORT}`);
    getPhotoAvatar("904ad704bbab4a0196905db28670d173");
});
