require("dotenv").config();
const express = require("express");
const fetch = require("node-fetch");
const path = require("path");
const fs = require("fs");
const cors = require("cors");

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
            headers: { Authorization: `Bearer ${KEY}` },
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

async function checkVideoAvatar() {
    try {
        console.log("Fetching video generation avatars");
        const response = await fetch("https://api.heygen.com/v2/avatars", {
            headers: { Authorization: `Bearer ${KEY}` },
        });
        const { data } = await response.json();
        const avatars = data.avatars || [];
        console.log("Video avatars fetched", avatars);
        const avatar_id = "Juan_standing_office_front";
        /** Find avatar with avatar_id from the fetched avatars and console log it */
        const avatar = avatars.find((avatar) => avatar.avatar_id === avatar_id);
        console.log("Avatar found", avatar);
    } catch (err) {
        console.error("Video avatar list error:", err.response?.data || err.message);
        res.status(500).json({ error: "Could not fetch video avatar list" });
    }
}

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
                        matting: true,
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
        headers: { Authorization: `Bearer ${KEY}` },
    });
    const { data } = await response.json();
    console.log("Avatars fetched", data);
    return data;
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
    const headers = { Authorization: `Bearer ${KEY}` };

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
            Authorization: `Bearer ${KEY}`,
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
            Authorization: `Bearer ${KEY}`,
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

async function fetchAllHeygenVoicesAndCountThem() {
    const response = await fetch("https://api.heygen.com/v2/voices", {
        headers: { "X-Api-Key": KEY },
    });
    const { data } = await response.json();
    console.log("Voices fetched", data.voices.length);
}

async function fetchAvatarID() {
    const response = await fetch("https://api.heygen.com/v2/avatar/Annie_expressive12_public/details", {
        headers: { "X-Api-Key": KEY },
    });
    const { data } = await response.json();
    console.log("Avatar details fetched", data);
}

async function generateSpecificAvatar() {
    await fetch("https://api.heygen.com/v2/video/generate", {
        method: "POST",
        headers: {
            accept: "application/json,text/html,application/xhtml+xml,application/xml,text/*;q=0.9, image/*;q=0.8, */*;q=0.7",
            /* accept: "application/json", */
            "content-type": "application/json",
            "x-api-key": KEY,
        },
        body: JSON.stringify({
            video_inputs: [
                {
                    character: { type: "avatar", avatar_id: "e0e84faea390465896db75a83be45085", avatar_style: "normal", scale: 1, offset: { x: 0, y: 0 }, matting: true },
                    voice: {
                        type: "text",
                        input_text:
                            "Are you ready for a shocking truth? Airlines are now charging solo travelers more than families! It sounds unbelievable, but it's true! A new article reveals how solo passengers might find themselves paying a higher fare compared to those traveling in groups. According to the article, when a group books tickets, the cost often barely increases for extra members, while a lone traveler could be hit with significant fees. This pricing strategy could affect many people who prefer traveling alone, making it more expensive for them. Hit follow to stay ahead in AI!",
                        voice_id: "ce41f11a48e0489a97ee683d9af75c81",
                        speed: 1.1,
                        pitch: 50,
                        emotion: "Excited",
                    },
                    background: {
                        type: "video",
                        url: "https://database.blotato.io/storage/v1/object/public/public_media/4ddd33eb-e811-4ab5-93e1-2cd0b7e8fb3f/videogen2-render-e6b398a2-5859-4a77-88ef-2345bcefdc98.mp4",
                        play_style: "loop",
                        fit: "cover",
                    },
                },
            ],
            dimension: { width: 720, height: 1280 },
            aspect_ratio: "9:16",
            caption: false,
            title: "n8n TEST AVATAR",
        }),
        gzip: true,
        rejectUnauthorized: true,
        followRedirect: true,
        resolveWithFullResponse: true,
        followAllRedirects: true,
        timeout: 300000,
        encoding: null,
        json: false,
        useStream: true,
    })
        .then((res) => res.json())
        .then((json) => console.log(json))
        .catch((err) => console.error(err));
}

async function getTransparentStudioAvatars() {
    fetch("https://api.heygen.com/v2/avatars", {
        method: "GET",
        headers: { "X-Api-Key": KEY },
    })
        .then(async (res) => {
            if (!res.ok) {
                const text = await res.text().catch(() => "");
                throw new Error(`HeyGen API error ${res.status}: ${text || res.statusText}`);
            }

            const body = await res.json();
            const avatars = body?.data?.avatars ?? [];
            console.log("Total avatars count:", avatars.length);

            const studioAvatars = avatars.filter((avatar) => !avatar.avatar_id.includes("public"));
            console.log("Studio avatars:", studioAvatars.length);
        })
        .catch((err) => {
            console.error(err);
        });
}

async function generateVideoFromTemplate() {
    fetch("https://api.heygen.com/v2/template/f52003c9d1294e2fb919970dd02ed162/generate", {
        method: "POST",
        headers: {
            "X-Api-Key": KEY,
            "Content-Type": "application/json",
        },
        body: JSON.stringify({
            caption: true,
            title: "Some Awesome Title",
            variables: {
                script_en: {
                    name: "script_en",
                    type: "text",
                    properties: {
                        content: "Hey there, how are you today?",
                    },
                },
                script1_voice: {
                    name: "script1_voice",
                    type: "voice",
                    properties: {
                        voice_id: "8b92884579014f8e8147836bbd0c13ca",
                    },
                },
            },
            dimension: { width: 1280, height: 720 },
        }),
    })
        .then((res) => res.json())
        .then((json) => console.log(json))
        .catch((err) => console.error(err));
}

async function listAllWebhooks() {
    const url = "https://api.heygen.com/v1/webhook/webhook.list";
    const options = {
        method: "GET",
        headers: {
            accept: "application/json",
            "x-api-key": "MDY0NmNkNmQ1ZTgxNGRlMGEzZDVkMWM4MGVkYTNkYWYtMTc0NjM3Mzg3MA==",
        },
    };

    fetch(url, options)
        .then((res) => res.json())
        .then((json) => console.log(json))
        .catch((err) => console.error(err));
}

async function listActiveWebhooks() {
    const url = "https://api.heygen.com/v1/webhook/endpoint.list";
    const options = {
        method: "GET",
        headers: {
            accept: "application/json",
            "x-api-key": "M2UwNTMxZGExOGFmNDQwOGIyYjU4NzlmNDFjMzE0ZWEtMTY5NTE1NDM0MA==",
        },
    };

    fetch(url, options)
        .then((res) => res.json())
        .then((json) => {
            json.data.forEach((webhook) => {
                console.log("\nWebhook:", {
                    endpoint_id: webhook.endpoint_id,
                    url: webhook.url,
                    status: webhook.status,
                    events: webhook.events,
                });
            });
        })
        .catch((err) => console.error(err));
}

async function POST() {
    try {
        if (!HEYGEN_API_KEY) {
            throw new Error("API key is missing from .env");
        }

        const res = await fetch("https://api.heygen.com/v1/streaming.create_token", {
            method: "POST",
            headers: {
                "x-api-key": "YTJhOTM3NDNlOTYyNDVhNGE0OWNkOTg0YzliYTJhYzctMTc0Mzk4NjEyNw==",
            },
        });
        const data = await res.json();

        console.log(data);

        return new Response(data.data.token, {
            status: 200,
        });
    } catch (error) {
        console.error("Error retrieving access token:", error);

        return new Response("Failed to retrieve access token", {
            status: 500,
        });
    }
}

async function translateVideo() {
    /* https://www.youtube.com/shorts/WY73exaVpyw */
    const url = "https://api.heygen.com/v2/video_translate";
    const options = {
        method: "POST",
        headers: {
            accept: "application/json",
            "content-type": "application/json",
            "x-api-key": "ODQ3ODRlOWEyM2RkNDlhYThjMmFkNTM2NTY3Mjg3YjktMTc1MjcxMjAyMA==",
        },
        body: JSON.stringify({
            video_url: "https://www.youtube.com/watch?v=gt1fMvPHz3c&ab_channel=10SecondCollege",
            title: "Test Video",
            output_language: "French",
            speaker_num: 0,
        }),
    };
    fetch(url, options)
        .then((res) => res.json())
        .then((json) => console.log(json))
        .catch((err) => console.error(err));
}

async function generatePaulVideo() {
    // 1) HeyGen endpoint and authentication
    const HEYGEN_API_KEY = KEY;
    const HEYGEN_URL = "https://api.heygen.com/v2/video/generate";

    // 2) IDs and constants
    const PAUL_VOICE_ID = "a0bbe277ff3f4601a9b4c4a382db2b2f"; // Paul's voice_id
    const TALKING_PHOTO_ID = "d746902f1f934385bfbb2432da6383d0"; // Example talking_photo_id

    let HEYGEN_KEY = HEYGEN_API_KEY;
    /* HEYGEN_KEY = "Nzg4N2QzZjQ4NThlNDliOGJkMDUyMTQ2NDIwNDkzODMtMTc0OTgxNjU3NA=="; */

    // 3) Build the headers
    const headers = {
        Authorization: `Bearer ${HEYGEN_KEY}`,
        "Content-Type": "application/json",
    };

    // Helper function to generate optimized video inputs
    const baseText =
        "Lorem ipsum dolor sit amet, consectetur adipiscing elit. Sed non risus. Suspendisse lectus tortor, dignissim sit amet, adipiscing nec, ultricies sed, dolor. Cras elementum ultricies diam. Maecenas ligula massa, varius a, semper congue, euismod non, mi. ";

    function generateDummyText() {
        return baseText.repeat(Math.ceil(4500 / baseText.length)).slice(0, 4500);
    }

    const items = Array.from({ length: 50 }, () => ({
        character: {
            type: "avatar",
            avatar_id: "Annie_expressive12_public",
            avatar_style: "normal",
        },
        voice: {
            input_text: generateDummyText(),
            type: "text",
            voice_id: "73c0b6a2e29d4d38aca41454bf58c955",
        },
    }));

    const payload = {
        title: "myVideo",
        dimension: {
            width: 1280,
            height: 720,
        },
        video_inputs: [
            {
                character: {
                    type: "avatar",
                    avatar_id: "553553ed1b3a45549c6e28b461a88fa6",
                    matting: true,
                },
                voice: {
                    type: "text",
                    voice_id: "fbcbe811534448e89a175fecb8b17109",
                    input_text: "Hello there, how are you doing today?",
                },
                background: {
                    type: "color",
                    value: "#0000ff",
                },
            },
        ],
    };

    // 5) Send the request to HeyGen
    try {
        const response = await fetch(HEYGEN_URL, {
            method: "POST",
            headers,
            body: JSON.stringify(payload),
        });

        const status = response.status;
        let responseBody;

        try {
            responseBody = await response.json();
        } catch {
            // In case the response is not valid JSON
            responseBody = await response.text();
        }

        if (!response.ok) {
            // If HeyGen returns a non-2xx status, throw an error with details
            throw new Error(`HeyGen API returned status ${status}: ` + (typeof responseBody === "object" ? JSON.stringify(responseBody) : responseBody));
        }

        // 6) On success, return the JSON (e.g., { video_id, status, download_url })
        console.log(responseBody);
    } catch (err) {
        // Re-throw so the caller can handle/log it
        throw err;
    }
}

async function getVideoStatus() {
    const video_id = "af1ef07a5a4f47d2817dd8f20facb245";
    const response = await fetch(`https://api.heygen.com/v1/video_status.get?video_id=${video_id}`, {
        headers: { Authorization: `Bearer ${process.env.HEYGEN_API_KEY}` },
    });

    const data = await response.json();
    console.log("Video status fetched", data);
}

async function getDefaultAudioIDFromListOfAvatars() {
    const avatars = {
        Conrad: {
            avatar_id: "conrad_sofa_front",
            voice_id: "5403a745860347beb7d342e07eef33fb",
        },
        Gala: {
            avatar_id: "Gala_sitting_office_front",
            voice_id: "gala_voice_id_here",
        },
        Raul: {
            avatar_id: "Raul_sitting_casualsofawithipad_front",
            voice_id: "raul_voice_id_here",
        },
        Leos: {
            avatar_id: "Leos_sitting_office_front",
            voice_id: "leos_voice_id_here",
        },
        Aubrey: {
            avatar_id: "Aubrey_standing_night_scene_front",
            voice_id: "aubrey_voice_id_here",
        },
        Bojan: {
            avatar_id: "Bojan_sitting_businesstraining_front",
            voice_id: "bojan_voice_id_here",
        },
        Chloe: {
            avatar_id: "Chloe_standing_lounge_front",
            voice_id: "chloe_voice_id_here",
        },
        Emilia: {
            avatar_id: "Emilia_sitting_outdooryoga_front",
            voice_id: "emilia_voice_id_here",
        },
        Amelia: {
            avatar_id: "Amelia_sitting_yoga_front",
            voice_id: "amelia_voice_id_here",
        },
        Gerardo: {
            avatar_id: "Gerardo_standing_outdoorsport_front",
            voice_id: "gerardo_voice_id_here",
        },
        June: {
            avatar_id: "June_HR_public",
            voice_id: "june_voice_id_here",
        },
        Kavya: {
            avatar_id: "Kavya_standing_indoor_front",
            voice_id: "kavya_voice_id_here",
        },
        Milena: {
            avatar_id: "Milena_standing_sofa_front",
            voice_id: "milena_voice_id_here",
        },
        Miles: {
            avatar_id: "Miles_standing_outdoor_front",
            voice_id: "miles_voice_id_here",
        },
        Miyu: {
            avatar_id: "Miyu_sitting_sofacasual_front",
            voice_id: "miyu_voice_id_here",
        },
        Rasmus: {
            avatar_id: "Rasmus_sitting_lounge_front",
            voice_id: "rasmus_voice_id_here",
        },
        Ren: {
            avatar_id: "Ren_sitting_office_front",
            voice_id: "ren_voice_id_here",
        },
        Timothy: {
            avatar_id: "Timothy_sitting_office_front",
            voice_id: "timothy_voice_id_here",
        },
        Vernon: {
            avatar_id: "Vemon_standing_office_front",
            voice_id: "vernon_voice_id_here",
        },
        Santa: {
            avatar_id: "Santa_Fireplace_Front_public",
            voice_id: "santa_voice_id_here",
        },
        Ann: {
            avatar_id: "Ann_Doctor_Sitting_public",
            voice_id: "ann_voice_id_here",
        },
        Chiara: {
            avatar_id: "chiara",
            voice_id: "chiara_voice_id_here",
        },
    };

    /* create promise.all that gets voice id for each using https://api.heygen.com/v2/avatar/{id}/details from resulting object field data.default_voice_id */
    const avatarEntries = Object.entries(avatars);
    const updatedAvatars = { ...avatars };

    await Promise.all(
        avatarEntries.map(async ([name, avatar]) => {
            try {
                const response = await fetch(`https://api.heygen.com/v2/avatar/${avatar.avatar_id}/details`, {
                    headers: { Authorization: `Bearer ${process.env.HEYGEN_API_KEY}` },
                });
                const data = await response.json();
                const defaultVoiceId = data.data.default_voice_id;

                // Update the avatar object with the fetched voice ID
                updatedAvatars[name].voice_id = defaultVoiceId;

                console.log(`Updated ${name}: ${avatar.avatar_id} -> ${defaultVoiceId}`);
            } catch (error) {
                console.error(`Failed to fetch voice ID for ${name} (${avatar.avatar_id}):`, error.message);
            }
        })
    );

    console.log("Complete updated avatars list:", JSON.stringify(updatedAvatars, null, 2));
    /* return updatedAvatars; */
}

async function generateTest() {
    const apiKey = "<api_key>"; // Replace with your actual API key

    const url = "https://api.heygen.com/v2/template/9540af77bafc4da5821841e6b2668549/generate";

    const body = {
        caption: true,
        dimension: { width: 1280, height: 720 },
        include_gif: false,
        title: "Medicijnen bij verstopping VI-35",
        variables: {
            Tekst1: {
                name: "Tekst1",
                type: "text",
                properties: {
                    content:
                        "مرحباً بكم في هذا الفيديو حول دواء الإمساك.🕓\n\nفي هذا الفيديو، نخبرك بأهم المعلومات.🕓 تكون مصاباً بالإمساك عندما يخرج البراز بشكل أقل مما اعتدت عليه.🕓 وغالباً ما يكون البراز صلباً وجافاً ويمكن أن يكون مؤلماً.\r\n",
                },
            },
            Tekst2: {
                name: "Tekst2",
                type: "text",
                properties: {
                    content:
                        "هذا الدواء ملين.🕓 يجعل الأمعاء تتحرك بشكل أكبر ويزيد من حركة الأمعاء ويدخل المزيد من الماء إلى البراز.🕓 ونتيجة لذلك، يتحرك البراز بشكل أفضل ويخرج من الجسم بسهولة أكبر.🕓🕓\r\n\r\nيعتمد وقت بدء عمل هذا الدواء على نوع الدواء الذي تتناوله.🕓 هناك أشكال مختلفة من هذا الدواء.🕓 تعمل التحاميل والحقنة الشرجية بسرعة كبيرة، عادةً خلال ساعة واحدة.🕓 تعمل الأقراص والشراب عادةً بعد بضع ساعات.\r\n",
                },
            },
            Tekst3: {
                name: "Tekst3",
                type: "text",
                properties: {
                    content:
                        "ستشرح الصيدلية كيفية استخدامه.🕓 تحقق أيضًا من الملصق.🕓🕓\r\n\r\nاستخدمه لفترة وجيزة ولا تزيد عن 3 أيام متتالية.🕓 إذا كنت تستخدمه كثيرًا أو لفترة طويلة جدًا، فقد تبدأ أمعاؤك في العمل بشكل أقل جودة.\r\n",
                },
            },
            Tekst4: {
                name: "Tekst4",
                type: "text",
                properties: {
                    content: "قد تعاني أيضًا من آثار جانبية، مثل تقلصات البطن.🕓🕓\r\n\r\nهل لديك أي أسئلة أو تعاني من آثار جانبية أخرى؟🕓 إذا كان الأمر كذلك، ناقش ذلك مع الصيدلية أو طبيبك.\r\n",
                },
            },
            Tekst5: {
                name: "Tekst5",
                type: "text",
                properties: {
                    content: "شكراً لك على المشاهدة.🕓 هل تريد معرفة المزيد عن دوائك؟🕓 إذاً اقرأ المعلومات من الصيدلية الخاصة بك والنشرة.\r\n",
                },
            },
        },
    };

    try {
        const response = await fetch(url, {
            method: "POST",
            headers: {
                accept: "application/json",
                "x-api-key": apiKey,
                "Content-Type": "application/json",
            },
            body: JSON.stringify(body),
        });

        const data = await response.json();
        console.log(data);
    } catch (error) {
        console.error("Fetch error:", error);
    }
}

async function createAvatarIVVideo() {
    const url = "https://api.heygen.com/v2/video/av4/generate";
    const options = {
        method: "POST",
        headers: {
            accept: "application/json",
            "content-type": "application/json",
            "x-api-key": "MDY0NmNkNmQ1ZTgxNGRlMGEzZDVkMWM4MGVkYTNkYWYtMTc1NjE0NTkyMw==",
        },
        body: JSON.stringify({ video_orientation: "portrait" }),
    };

    fetch(url, options)
        .then((res) => res.json())
        .then((json) => console.log(json))
        .catch((err) => console.error(err));
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
    /* translateVideo(); */
    /* getDefaultAudioIDFromListOfAvatars(); */
    /* generatePaulVideo(); */
    /* generateVideoFromTemplate(); */
    /* getTransparentStudioAvatars(); */
    /* getPhotoAvatar("df0b58308f724e65b92a2e975e9428aa"); */
    /* getPhotoAvatar("904ad704bbab4a0196905db28670d173"); */
    /* fetchAvatarID(); */
});
