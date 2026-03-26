/**
 * Levprav Art Shop — Cloud Functions
 *
 * Endpoints:
 *   - createOrder:      POST /createOrder
 *   - yookassaWebhook:  POST /yookassaWebhook
 *   - submitFeedback:   POST /submitFeedback
 *   - triggerDeploy:    POST /triggerDeploy (auth-protected)
 */

require("dotenv").config();
const { onRequest } = require("firebase-functions/v2/https");
const admin = require("firebase-admin");
const nodemailer = require("nodemailer");
const { v4: uuidv4 } = require("uuid");

admin.initializeApp();
const db = admin.firestore();

// ─── Environment Variables ───────────────────────────────────────────────────

const TELEGRAM_BOT_TOKEN = process.env.TELEGRAM_BOT_TOKEN;
const TELEGRAM_CHAT_ID = process.env.TELEGRAM_CHAT_ID;

const SMTP_HOST = process.env.SMTP_HOST;
const SMTP_PORT = parseInt(process.env.SMTP_PORT || "587", 10);
const SMTP_USER = process.env.SMTP_USER;
const SMTP_PASS = process.env.SMTP_PASS;
const EMAIL_FROM = process.env.EMAIL_FROM;
const EMAIL_TO = process.env.EMAIL_TO;

const YOOKASSA_SHOP_ID = process.env.YOOKASSA_SHOP_ID;
const YOOKASSA_SECRET_KEY = process.env.YOOKASSA_SECRET_KEY;



// ─── CORS helper ─────────────────────────────────────────────────────────────

function handleCors(req, res) {
    res.set("Access-Control-Allow-Origin", "*");
    res.set("Access-Control-Allow-Methods", "POST, OPTIONS");
    res.set("Access-Control-Allow-Headers", "Content-Type, Authorization");
    if (req.method === "OPTIONS") {
        res.status(204).send("");
        return true;
    }
    return false;
}

// ─── Validation ──────────────────────────────────────────────────────────────

const PHONE_REGEX = /^(\+7|8)?[\s-]?\(?\d{3}\)?[\s-]?\d{3}[\s-]?\d{2}[\s-]?\d{2}$/;
const EMAIL_REGEX = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
const VALID_PAYMENT_METHODS = ["card", "bank_transfer"];
const VALID_CONTACT_METHODS = ["telegram", "max", "phone_call", "sms", "email"];

/**
 * Full server-side validation mirroring the Zod schema.
 * Fixes spec gap #1 (no max-length), #2 (contactPreferences not validated).
 */
function validateOrder(data) {
    const errors = [];

    // customerName: min 2, max 100
    if (!data.customerName || typeof data.customerName !== "string") {
        errors.push("customerName is required");
    } else {
        if (data.customerName.trim().length < 2) errors.push("customerName must be at least 2 characters");
        if (data.customerName.length > 100) errors.push("customerName must be at most 100 characters");
    }

    // email: proper regex
    if (!data.email || typeof data.email !== "string") {
        errors.push("email is required");
    } else if (!EMAIL_REGEX.test(data.email)) {
        errors.push("email format is invalid");
    }

    // phone: Russian phone regex
    if (!data.phone || typeof data.phone !== "string") {
        errors.push("phone is required");
    } else if (!PHONE_REGEX.test(data.phone)) {
        errors.push("phone format is invalid (expected +7/8 format)");
    }

    // address: min 10, max 500
    if (!data.address || typeof data.address !== "string") {
        errors.push("address is required");
    } else {
        if (data.address.trim().length < 10) errors.push("address must be at least 10 characters");
        if (data.address.length > 500) errors.push("address must be at most 500 characters");
    }

    // customerNotes: max 1000 (optional)
    if (data.customerNotes && typeof data.customerNotes === "string") {
        if (data.customerNotes.length > 1000) errors.push("customerNotes must be at most 1000 characters");
    }

    // paymentMethod: enum
    if (!data.paymentMethod || !VALID_PAYMENT_METHODS.includes(data.paymentMethod)) {
        errors.push("paymentMethod must be 'card' or 'bank_transfer'");
    }

    // contactPreferences (optional but validated if present)
    if (data.contactPreferences) {
        const cp = data.contactPreferences;
        if (!cp.methods || !Array.isArray(cp.methods) || cp.methods.length === 0) {
            errors.push("contactPreferences.methods must have at least 1 method");
        } else {
            for (const method of cp.methods) {
                if (!VALID_CONTACT_METHODS.includes(method)) {
                    errors.push(`Invalid contact method: ${method}`);
                }
            }
            if (cp.methods.includes("telegram") && (!cp.telegramHandle || !cp.telegramHandle.startsWith("@"))) {
                errors.push("telegramHandle is required and must start with @ when telegram is selected");
            }
            if (cp.methods.includes("max") && (!cp.maxId || cp.maxId.trim().length === 0)) {
                errors.push("maxId is required when max is selected");
            }
        }
    }

    // items: must have at least 1
    if (!data.items || !Array.isArray(data.items) || data.items.length === 0) {
        errors.push("At least one item is required");
    }

    return errors;
}

// ─── Product Title Serialization Fix ─────────────────────────────────────────
// Fixes spec gap: prevents [object Object] by safely extracting string title.

function safeProductTitle(title) {
    if (typeof title === "string") return title;
    if (title && typeof title === "object") {
        return title.ru || title.en || String(title);
    }
    return String(title || "");
}

// ─── Gift Discount Calculation (Server-Side) ─────────────────────────────────
// Fixes spec gap #3: discount was not recalculated server-side.
// Logic: every 11th item free — cheapest item discounted.

function calculateGiftDiscount(items) {
    // Flatten all items to individual units
    const units = [];
    for (const item of items) {
        for (let i = 0; i < item.quantity; i++) {
            units.push(item.price);
        }
    }

    // Sort by price ascending
    units.sort((a, b) => a - b);

    const totalItems = units.length;
    const freeCount = Math.floor(totalItems / 11);

    // Discount the N cheapest items
    let discount = 0;
    for (let i = 0; i < freeCount; i++) {
        discount += units[i];
    }

    return discount;
}

// ─── Order ID Display Format ─────────────────────────────────────────────────

function formatOrderId(id) {
    return id.slice(-8).toUpperCase();
}

// ─── Markdown Escaping for Telegram ──────────────────────────────────────────

function escapeMarkdown(text) {
    return String(text).replace(/([_*\[\]()~`>#+=|{}.!\-\\])/g, "\\$1");
}

// ─── Telegram Notification ───────────────────────────────────────────────────

async function sendTelegramNotification(order, isPaid = false) {
    if (!TELEGRAM_BOT_TOKEN || !TELEGRAM_CHAT_ID) {
        console.warn("Telegram credentials not configured, skipping notification");
        return;
    }

    const displayId = formatOrderId(order.id);

    const itemsList = order.items
        .map(
            (item) =>
                `  • ${escapeMarkdown(safeProductTitle(item.productTitle))} x${item.quantity} — ${item.price * item.quantity}₽`
        )
        .join("\n");

    // Contact preferences section
    let contactSection = "";
    if (order.contactPreferences && order.contactPreferences.methods) {
        const methods = order.contactPreferences.methods;
        const parts = [];
        if (methods.includes("telegram") && order.contactPreferences.telegramHandle) {
            parts.push(`  • 💬 Telegram: ${escapeMarkdown(order.contactPreferences.telegramHandle)}`);
        }
        if (methods.includes("max") && order.contactPreferences.maxId) {
            parts.push(`  • 📲 MAX: ${escapeMarkdown(order.contactPreferences.maxId)}`);
        }
        if (methods.includes("phone_call")) parts.push("  • 📞 Звонок");
        if (methods.includes("sms")) parts.push("  • 💬 SMS");
        if (methods.includes("email")) parts.push("  • 📧 Email");
        if (parts.length > 0) {
            contactSection = `\n📞 *Способы связи:*\n${parts.join("\n")}`;
        }
    } else if (order.telegram) {
        // Legacy fallback
        contactSection = `\n💬 *Telegram:* ${escapeMarkdown(order.telegram)}`;
    }

    const paymentLine = order.paymentMethod === "card"
        ? "💳 Банковская карта"
        : "🏦 Перевод по реквизитам";
    const statusLine = isPaid ? "✅ Оплачен" : "⏳ Ожидает подтверждения менеджером";

    const notesSection = order.customerNotes
        ? `\n📝 *Комментарий:* ${escapeMarkdown(order.customerNotes)}`
        : "";

    const message = `
🛒 *Новый заказ\\!*

📋 *Заказ \\#${escapeMarkdown(displayId)}*

👤 *Клиент:* ${escapeMarkdown(order.customerName)}
📧 *Email:* ${escapeMarkdown(order.email)}
📱 *Телефон:* ${escapeMarkdown(order.phone)}
📍 *Адрес:* ${escapeMarkdown(order.address)}${notesSection}${contactSection}

📦 *Товары:*
${itemsList}

💰 *Итого:* ${order.total}₽
${paymentLine}
${statusLine}
    `.trim();

    const response = await fetch(
        `https://api.telegram.org/bot${TELEGRAM_BOT_TOKEN}/sendMessage`,
        {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({
                chat_id: TELEGRAM_CHAT_ID,
                text: message,
                parse_mode: "MarkdownV2",
            }),
        }
    );

    if (!response.ok) {
        const errorBody = await response.text();
        throw new Error(`Telegram API error ${response.status}: ${errorBody}`);
    }
}

// ─── Email Notification ──────────────────────────────────────────────────────

async function sendEmailNotification(order, isPaid = false) {
    if (!SMTP_HOST || !SMTP_USER || !SMTP_PASS || !EMAIL_FROM || !EMAIL_TO) {
        console.warn("SMTP credentials not configured, skipping email notification");
        return;
    }

    const transporter = nodemailer.createTransport({
        host: SMTP_HOST,
        port: SMTP_PORT,
        secure: SMTP_PORT === 465,
        auth: { user: SMTP_USER, pass: SMTP_PASS },
    });

    const displayId = formatOrderId(order.id);

    const itemsHtml = order.items
        .map(
            (item) =>
                `<tr>
                    <td style="padding:8px;border-bottom:1px solid #eee">${safeProductTitle(item.productTitle)}</td>
                    <td style="padding:8px;border-bottom:1px solid #eee;text-align:center">${item.quantity}</td>
                    <td style="padding:8px;border-bottom:1px solid #eee;text-align:right">${item.price * item.quantity} ₽</td>
                </tr>`
        )
        .join("");

    const paymentText = order.paymentMethod === "card" ? "Банковская карта" : "Перевод по реквизитам";
    const statusText = isPaid ? "✅ Оплачен" : "⏳ Ожидает подтверждения";

    let contactHtml = "";
    if (order.contactPreferences && order.contactPreferences.methods) {
        const parts = order.contactPreferences.methods.map((m) => {
            switch (m) {
                case "telegram": return `Telegram: ${order.contactPreferences.telegramHandle || "—"}`;
                case "max": return `MAX: ${order.contactPreferences.maxId || "—"}`;
                case "phone_call": return "Звонок";
                case "sms": return "SMS";
                case "email": return "Email";
                default: return m;
            }
        });
        contactHtml = `<p><strong>Способы связи:</strong> ${parts.join(", ")}</p>`;
    } else if (order.telegram) {
        contactHtml = `<p><strong>Telegram:</strong> ${order.telegram}</p>`;
    }

    const html = `
    <div style="font-family:Arial,sans-serif;max-width:600px;margin:0 auto;padding:20px">
        <h2 style="color:#333;border-bottom:2px solid #E67E22;padding-bottom:10px">
            🛒 Новый заказ #${displayId}
        </h2>
        <div style="background:#f9f9f9;border-radius:8px;padding:16px;margin:16px 0">
            <p><strong>Клиент:</strong> ${order.customerName}</p>
            <p><strong>Email:</strong> ${order.email}</p>
            <p><strong>Телефон:</strong> ${order.phone}</p>
            <p><strong>Адрес:</strong> ${order.address}</p>
            ${order.customerNotes ? `<p><strong>Комментарий:</strong> ${order.customerNotes}</p>` : ""}
            ${contactHtml}
        </div>
        <h3 style="color:#555">Товары</h3>
        <table style="width:100%;border-collapse:collapse;margin-bottom:16px">
            <thead>
                <tr style="background:#f0f0f0">
                    <th style="padding:8px;text-align:left">Товар</th>
                    <th style="padding:8px;text-align:center">Кол-во</th>
                    <th style="padding:8px;text-align:right">Сумма</th>
                </tr>
            </thead>
            <tbody>${itemsHtml}</tbody>
        </table>
        <div style="background:#E67E22;color:white;border-radius:8px;padding:16px;text-align:center;margin:16px 0">
            <p style="font-size:24px;margin:0;font-weight:bold">${order.total} ₽</p>
            <p style="margin:4px 0 0;font-size:14px;opacity:0.9">${paymentText} · ${statusText}</p>
        </div>
    </div>`;

    await transporter.sendMail({
        from: EMAIL_FROM,
        to: EMAIL_TO,
        subject: `Новый заказ #${displayId} — ${order.customerName}`,
        html,
    });
}

// ─── Send Notifications with Error Logging ───────────────────────────────────
// Fixes spec gap #4: always log notification errors to Firestore.

async function sendNotificationsWithLogging(orderRef, order, isPaid) {
    const results = await Promise.allSettled([
        sendTelegramNotification(order, isPaid),
        sendEmailNotification(order, isPaid),
    ]);

    const notificationStatus = {};
    if (results[0].status === "rejected") {
        notificationStatus.telegramError = results[0].reason?.message || String(results[0].reason);
        console.error("Telegram notification failed:", results[0].reason);
    }
    if (results[1].status === "rejected") {
        notificationStatus.emailError = results[1].reason?.message || String(results[1].reason);
        console.error("Email notification failed:", results[1].reason);
    }

    if (Object.keys(notificationStatus).length > 0) {
        await orderRef.update({ notificationStatus });
    }
}

// ─── YooKassa Payment Creation ───────────────────────────────────────────────

async function createYookassaPayment(amount, orderId, email, description) {
    const idempotenceKey = uuidv4();
    const auth = Buffer.from(`${YOOKASSA_SHOP_ID}:${YOOKASSA_SECRET_KEY}`).toString("base64");

    const response = await fetch("https://api.yookassa.ru/v3/payments", {
        method: "POST",
        headers: {
            "Content-Type": "application/json",
            "Authorization": `Basic ${auth}`,
            "Idempotence-Key": idempotenceKey,
        },
        body: JSON.stringify({
            amount: {
                value: amount.toFixed(2),
                currency: "RUB",
            },
            confirmation: {
                type: "redirect",
                return_url: `https://somanatha.ru/checkout/success?orderId=${orderId}`,
            },
            capture: true,
            description: description.slice(0, 128),
            metadata: {
                order_id: orderId,
            },
            receipt: {
                customer: { email },
                items: [
                    {
                        description: description.slice(0, 128),
                        quantity: "1",
                        amount: {
                            value: amount.toFixed(2),
                            currency: "RUB",
                        },
                        vat_code: 1,
                    },
                ],
            },
        }),
    });

    if (!response.ok) {
        const errorBody = await response.text();
        throw new Error(`YooKassa error ${response.status}: ${errorBody}`);
    }

    return await response.json();
}

// ═══════════════════════════════════════════════════════════════════════════════
// ENDPOINT: createOrder
// ═══════════════════════════════════════════════════════════════════════════════

exports.createOrder = onRequest({ region: "europe-west1", cors: true }, async (req, res) => {
    if (handleCors(req, res)) return;
    if (req.method !== "POST") return res.status(405).json({ error: "Method not allowed" });

    try {
        const data = req.body;
        const { items, locale, ...customerInfo } = data;

        // 1. Validate
        const validationErrors = validateOrder({ ...customerInfo, items });
        if (validationErrors.length > 0) {
            return res.status(400).json({ error: "Validation failed", details: validationErrors });
        }

        // 2. Build order items with safe productTitle serialization
        const orderItems = items.map((item) => ({
            productId: item.productId || item.packId,
            productTitle: safeProductTitle(item.productTitle || item.packTitle),
            quantity: item.quantity,
            price: item.price,
            configuration: item.configuration || null,
            selectedVariations: item.selectedVariations || null,
        }));

        // 3. Server-side total calculation + gift discount recalculation
        const subtotal = orderItems.reduce((sum, item) => sum + item.price * item.quantity, 0);
        const giftDiscount = calculateGiftDiscount(orderItems);
        const total = Math.max(0, subtotal - giftDiscount);

        // 4. Build order document
        const orderData = {
            customerName: customerInfo.customerName.trim(),
            email: customerInfo.email.trim().toLowerCase(),
            phone: customerInfo.phone.trim(),
            address: customerInfo.address.trim(),
            telegram: customerInfo.telegram || null,
            contactPreferences: customerInfo.contactPreferences || null,
            customerNotes: customerInfo.customerNotes || null,
            items: orderItems,
            total,
            giftDiscount: giftDiscount > 0 ? giftDiscount : null,
            status: "pending",
            paymentMethod: customerInfo.paymentMethod,
            paymentStatus: customerInfo.paymentMethod === "card" ? "pending" : "awaiting_transfer",
            createdAt: Date.now(),
        };

        // 5. Write to Firestore
        const orderRef = await db.collection("orders").add(orderData);
        const orderId = orderRef.id;

        // 6. Payment handling
        if (customerInfo.paymentMethod === "card") {
            // Create YooKassa payment
            const displayId = formatOrderId(orderId);
            const itemDescriptions = orderItems
                .map((item) => `${safeProductTitle(item.productTitle)} x${item.quantity}`)
                .join(", ");
            const description = `Заказ #${displayId}: ${itemDescriptions}`;

            try {
                const payment = await createYookassaPayment(total, orderId, customerInfo.email, description);
                await orderRef.update({
                    paymentId: payment.id,
                    paymentUrl: payment.confirmation.confirmation_url,
                });

                return res.status(200).json({
                    success: true,
                    orderId,
                    paymentUrl: payment.confirmation.confirmation_url,
                });
            } catch (paymentError) {
                console.error("YooKassa payment creation failed:", paymentError);
                await orderRef.update({
                    paymentStatus: "failed",
                    notificationStatus: { paymentError: paymentError.message },
                });
                return res.status(500).json({
                    error: "Payment creation failed",
                    orderId,
                });
            }
        } else {
            // Bank transfer — send notifications immediately
            const order = { id: orderId, ...orderData };
            await sendNotificationsWithLogging(orderRef, order, false);

            return res.status(200).json({
                success: true,
                orderId,
            });
        }
    } catch (error) {
        console.error("createOrder error:", error);
        return res.status(500).json({ error: "Internal server error" });
    }
});

// ═══════════════════════════════════════════════════════════════════════════════
// ENDPOINT: yookassaWebhook
// ═══════════════════════════════════════════════════════════════════════════════

exports.yookassaWebhook = onRequest({ region: "europe-west1" }, async (req, res) => {
    if (req.method !== "POST") return res.status(405).send("Method not allowed");

    try {
        const { event, object } = req.body;

        if (!object || !object.metadata || !object.metadata.order_id) {
            console.error("Webhook missing order_id in metadata");
            return res.status(200).send("OK");
        }

        const orderId = object.metadata.order_id;
        const orderRef = db.collection("orders").doc(orderId);
        const orderSnap = await orderRef.get();

        if (!orderSnap.exists) {
            console.error(`Order ${orderId} not found for webhook`);
            return res.status(200).send("OK");
        }

        if (event === "payment.succeeded") {
            // Update payment status
            await orderRef.update({
                paymentStatus: "paid",
                paidAt: Date.now(),
            });

            // Send notifications with error logging (fixes spec gap #4)
            const order = { id: orderId, ...orderSnap.data(), paymentStatus: "paid" };
            await sendNotificationsWithLogging(orderRef, order, true);
        } else if (event === "payment.canceled") {
            await orderRef.update({
                paymentStatus: "cancelled",
            });
        }

        return res.status(200).send("OK");
    } catch (error) {
        console.error("yookassaWebhook error:", error);
        return res.status(200).send("OK"); // Always return 200 to YooKassa
    }
});

// ═══════════════════════════════════════════════════════════════════════════════
// ENDPOINT: submitFeedback
// ═══════════════════════════════════════════════════════════════════════════════

exports.submitFeedback = onRequest({ region: "europe-west1", cors: true }, async (req, res) => {
    if (handleCors(req, res)) return;
    if (req.method !== "POST") return res.status(405).json({ error: "Method not allowed" });

    try {
        const { message, phone, telegram } = req.body;

        // Validate
        if (!message || typeof message !== "string" || message.trim().length < 2) {
            return res.status(400).json({ error: "Message must be at least 2 characters" });
        }
        if (!phone || typeof phone !== "string" || phone.trim().length < 5) {
            return res.status(400).json({ error: "Phone must be at least 5 characters" });
        }

        // Send via Telegram
        const telegramPromise = (TELEGRAM_BOT_TOKEN && TELEGRAM_CHAT_ID)
            ? fetch(`https://api.telegram.org/bot${TELEGRAM_BOT_TOKEN}/sendMessage`, {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({
                    chat_id: TELEGRAM_CHAT_ID,
                    text: `📨 *Обратная связь*\n\n📱 *Телефон:* ${escapeMarkdown(phone)}${telegram ? `\n💬 *Telegram:* ${escapeMarkdown(telegram)}` : ""}\n\n📝 ${escapeMarkdown(message)}`,
                    parse_mode: "MarkdownV2",
                }),
            })
            : Promise.resolve();

        // Send via Email
        const emailPromise = (SMTP_HOST && SMTP_USER && SMTP_PASS && EMAIL_FROM && EMAIL_TO)
            ? nodemailer.createTransport({
                host: SMTP_HOST,
                port: SMTP_PORT,
                secure: SMTP_PORT === 465,
                auth: { user: SMTP_USER, pass: SMTP_PASS },
            }).sendMail({
                from: EMAIL_FROM,
                to: EMAIL_TO,
                subject: `Обратная связь от ${phone}`,
                html: `<h3>Обратная связь</h3><p><strong>Телефон:</strong> ${phone}</p>${telegram ? `<p><strong>Telegram:</strong> ${telegram}</p>` : ""}<p>${message}</p>`,
            })
            : Promise.resolve();

        await Promise.all([telegramPromise, emailPromise]);

        return res.status(200).json({ success: true });
    } catch (error) {
        console.error("submitFeedback error:", error);
        return res.status(500).json({ error: "Internal server error" });
    }
});

// ═══════════════════════════════════════════════════════════════════════════════
// ENDPOINT: triggerDeploy (Auth-protected)
// ═══════════════════════════════════════════════════════════════════════════════

exports.triggerDeploy = onRequest({ region: "europe-west1", cors: true, secrets: ["GITHUB_PAT"] }, async (req, res) => {
    if (handleCors(req, res)) return;
    if (req.method !== "POST") return res.status(405).json({ error: "Method not allowed" });

    try {
        // Verify Firebase Auth token
        const authHeader = req.headers.authorization;
        if (!authHeader || !authHeader.startsWith("Bearer ")) {
            return res.status(401).json({ error: "Unauthorized" });
        }

        const idToken = authHeader.split("Bearer ")[1];
        await admin.auth().verifyIdToken(idToken);

        const githubPat = process.env.GITHUB_PAT;
        if (!githubPat) {
            return res.status(500).json({ error: "GITHUB_PAT not configured" });
        }

        // Trigger GitHub Actions repository_dispatch
        const response = await fetch(
            "https://api.github.com/repos/MAStif55/LevPrav/dispatches",
            {
                method: "POST",
                headers: {
                    "Authorization": `token ${githubPat}`,
                    "Accept": "application/vnd.github.v3+json",
                    "Content-Type": "application/json",
                },
                body: JSON.stringify({
                    event_type: "trigger-deploy",
                }),
            }
        );

        if (!response.ok) {
            const errorBody = await response.text();
            throw new Error(`GitHub API error ${response.status}: ${errorBody}`);
        }

        return res.status(200).json({ success: true, message: "Deploy triggered" });
    } catch (error) {
        console.error("triggerDeploy error:", error);
        return res.status(500).json({ error: error.message || "Internal server error" });
    }
});
