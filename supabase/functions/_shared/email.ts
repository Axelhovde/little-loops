// @deno-types="npm:@types/nodemailer@6"
import nodemailer from "npm:nodemailer@6";

export interface OrderItem {
  name: string;
  quantity: number;
  pricePerItem: number;
  selectedSize?: string;
}

export interface OrderEmailData {
  customerEmail: string;
  customerName: string;
  customerPhone?: string;
  orderId: number;
  orderDate: string;
  items: OrderItem[];
  subtotal: number;
  shippingCost: number;
  total: number;
  shippingAddress: {
    name: string;
    addressLine: string;
    postalCode: string;
    city: string;
  };
  receiptUrl?: string;
}

function titleCase(str: string): string {
  return str.split(" ").map((w) => w.charAt(0).toUpperCase() + w.slice(1).toLowerCase()).join(" ");
}

export async function sendOrderConfirmation(data: OrderEmailData): Promise<void> {
  const gmailUser = Deno.env.get("GMAIL_USER") ?? "";
  const gmailPass = Deno.env.get("GMAIL_APP_PASSWORD") ?? "";
  const supportEmail = Deno.env.get("SUPPORT_EMAIL") ?? "nataliewingersupport@gmail.com";

  if (!gmailUser || !gmailPass) {
    throw new Error("GMAIL_USER og GMAIL_APP_PASSWORD er ikke konfigurert");
  }

  const transporter = nodemailer.createTransport({
    host: "smtp.gmail.com",
    port: 465,
    secure: true,
    auth: { user: gmailUser, pass: gmailPass },
  });

  const orderNumber = String(data.orderId).padStart(5, "0");
  const formattedDate = new Date(data.orderDate).toLocaleDateString("nb-NO", {
    day: "numeric",
    month: "long",
    year: "numeric",
  });

  const itemRowsHtml = data.items
    .map(
      (item) => `
    <tr>
      <td style="padding:10px 0;border-bottom:1px solid #ede8e3;font-family:sans-serif;font-size:14px;color:#3d2b1f;">
        ${item.name}${item.selectedSize ? ` <span style="color:#8a7060;">(${item.selectedSize})</span>` : ""}
      </td>
      <td style="padding:10px 0;border-bottom:1px solid #ede8e3;font-family:sans-serif;font-size:14px;color:#3d2b1f;text-align:center;">
        ${item.quantity}
      </td>
      <td style="padding:10px 0;border-bottom:1px solid #ede8e3;font-family:sans-serif;font-size:14px;color:#3d2b1f;text-align:right;">
        ${item.quantity * item.pricePerItem}&nbsp;NOK
      </td>
    </tr>`
    )
    .join("");

  const itemRowsText = data.items
    .map(
      (item) =>
        `  ${item.name}${item.selectedSize ? ` (${item.selectedSize})` : ""} × ${item.quantity}  —  ${item.quantity * item.pricePerItem} NOK`
    )
    .join("\n");

  const shippingLine =
    data.shippingCost === 0
      ? `<span style="color:#16a34a;">Gratis</span>`
      : `${data.shippingCost}&nbsp;NOK`;

  const html = `<!DOCTYPE html>
<html lang="no">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width,initial-scale=1">
  <title>Ordrebekreftelse #${orderNumber} – Natalie Winger</title>
</head>
<body style="margin:0;padding:0;background-color:#faf6f2;font-family:Georgia,serif;color:#3d2b1f;">

<table width="100%" cellpadding="0" cellspacing="0" style="background:#faf6f2;">
<tr><td align="center" style="padding:40px 16px;">

  <table width="600" cellpadding="0" cellspacing="0" style="max-width:600px;width:100%;background:#fff;border-radius:14px;overflow:hidden;box-shadow:0 4px 16px rgba(0,0,0,0.07);">

    <!-- ── Header ── -->
    <tr>
      <td style="background:#7c5c45;padding:36px 40px;text-align:center;">
        <p style="margin:0;font-family:Georgia,serif;font-size:26px;font-weight:bold;color:#fff;letter-spacing:1px;">Natalie Winger</p>
        <p style="margin:6px 0 0;font-family:sans-serif;font-size:11px;color:rgba(255,255,255,0.7);letter-spacing:3px;text-transform:uppercase;">Håndlaget med kjærlighet i Norge</p>
      </td>
    </tr>

    <!-- ── Confirmation badge ── -->
    <tr>
      <td style="background:#f3ede8;padding:20px 40px;text-align:center;border-bottom:1px solid #ede8e3;">
        <p style="margin:0;font-family:sans-serif;font-size:13px;color:#7c5c45;font-weight:600;letter-spacing:0.5px;">✓&nbsp;&nbsp;ORDREBEKREFTELSE&nbsp;&nbsp;#${orderNumber}</p>
      </td>
    </tr>

    <!-- ── Body ── -->
    <tr>
      <td style="padding:36px 40px;">

        <p style="font-family:sans-serif;font-size:15px;line-height:1.65;color:#3d2b1f;margin:0 0 12px;">Hei ${data.customerName},</p>
        <p style="font-family:sans-serif;font-size:15px;line-height:1.65;color:#3d2b1f;margin:0 0 28px;">
          Tusen takk for din bestilling hos Natalie Winger! Vi bekrefter at betalingen er mottatt og at ordren din er under behandling.
        </p>

        <!-- Order meta -->
        <table width="100%" cellpadding="0" cellspacing="0" style="margin-bottom:28px;">
          <tr>
            <td style="font-family:sans-serif;font-size:12px;color:#8a7060;text-transform:uppercase;letter-spacing:2px;padding-bottom:4px;">Ordrenummer</td>
            <td style="font-family:sans-serif;font-size:14px;color:#3d2b1f;text-align:right;font-weight:600;">#${orderNumber}</td>
          </tr>
          <tr>
            <td style="font-family:sans-serif;font-size:12px;color:#8a7060;text-transform:uppercase;letter-spacing:2px;">Dato</td>
            <td style="font-family:sans-serif;font-size:14px;color:#3d2b1f;text-align:right;">${formattedDate}</td>
          </tr>
        </table>

        <!-- Items table -->
        <p style="font-family:sans-serif;font-size:11px;text-transform:uppercase;letter-spacing:2px;color:#8a7060;margin:0 0 8px;">Bestilte varer</p>
        <table width="100%" cellpadding="0" cellspacing="0" style="margin-bottom:20px;">
          <tr>
            <th style="font-family:sans-serif;font-size:11px;color:#8a7060;text-align:left;padding-bottom:8px;font-weight:normal;text-transform:uppercase;letter-spacing:1px;">Vare</th>
            <th style="font-family:sans-serif;font-size:11px;color:#8a7060;text-align:center;padding-bottom:8px;font-weight:normal;text-transform:uppercase;letter-spacing:1px;">Ant.</th>
            <th style="font-family:sans-serif;font-size:11px;color:#8a7060;text-align:right;padding-bottom:8px;font-weight:normal;text-transform:uppercase;letter-spacing:1px;">Pris</th>
          </tr>
          ${itemRowsHtml}
        </table>

        <!-- Totals -->
        <table width="100%" cellpadding="0" cellspacing="0" style="border-top:1px solid #ede8e3;padding-top:14px;margin-bottom:28px;">
          <tr>
            <td style="font-family:sans-serif;font-size:13px;color:#8a7060;padding-bottom:6px;">Delsum</td>
            <td style="font-family:sans-serif;font-size:13px;color:#3d2b1f;text-align:right;padding-bottom:6px;">${data.subtotal}&nbsp;NOK</td>
          </tr>
          <tr>
            <td style="font-family:sans-serif;font-size:13px;color:#8a7060;padding-bottom:12px;">Frakt</td>
            <td style="font-family:sans-serif;font-size:13px;text-align:right;padding-bottom:12px;">${shippingLine}</td>
          </tr>
          <tr>
            <td style="font-family:sans-serif;font-size:16px;font-weight:700;color:#3d2b1f;border-top:2px solid #ede8e3;padding-top:10px;">Totalt</td>
            <td style="font-family:sans-serif;font-size:16px;font-weight:700;color:#7c5c45;text-align:right;border-top:2px solid #ede8e3;padding-top:10px;">${data.total}&nbsp;NOK</td>
          </tr>
        </table>

        <!-- Shipping address -->
        <p style="font-family:sans-serif;font-size:11px;text-transform:uppercase;letter-spacing:2px;color:#8a7060;margin:0 0 8px;">Leveringsadresse</p>
        <p style="font-family:sans-serif;font-size:14px;line-height:1.8;color:#3d2b1f;margin:0 0 28px;">
          ${data.shippingAddress.name}<br>
          ${data.shippingAddress.addressLine}<br>
          ${data.shippingAddress.postalCode} ${titleCase(data.shippingAddress.city)}
        </p>

        <!-- Shipping notice box -->
        <table width="100%" cellpadding="0" cellspacing="0" style="background:#f3ede8;border-radius:10px;margin-bottom:28px;">
          <tr>
            <td style="padding:18px 22px;">
              <p style="font-family:sans-serif;font-size:14px;line-height:1.6;color:#5c3d2b;margin:0;">
                📦 <strong>Neste steg:</strong> Vi pakker og sender ordren din så fort som mulig. Du vil motta en e-post med sporings&shy;informasjon når pakken er underveis!
              </p>
            </td>
          </tr>
        </table>

        ${data.receiptUrl ? `
        <!-- Stripe receipt button -->
        <table width="100%" cellpadding="0" cellspacing="0" style="margin-bottom:24px;">
          <tr>
            <td align="center">
              <a href="${data.receiptUrl}"
                 style="display:inline-block;background:#7c5c45;color:#fff;font-family:sans-serif;font-size:14px;font-weight:600;text-decoration:none;padding:12px 28px;border-radius:8px;">
                Se betalingskvittering fra Stripe →
              </a>
            </td>
          </tr>
        </table>` : ""}

        <p style="font-family:sans-serif;font-size:13px;color:#8a7060;margin:0;">
          Spørsmål? Svar på denne e-posten eller kontakt oss på
          <a href="mailto:${supportEmail}" style="color:#7c5c45;text-decoration:none;">${supportEmail}</a>
        </p>

      </td>
    </tr>

    <!-- ── Footer ── -->
    <tr>
      <td style="background:#f9f5f1;padding:22px 40px;text-align:center;border-top:1px solid #ede8e3;">
        <p style="font-family:sans-serif;font-size:12px;color:#8a7060;margin:0 0 4px;">Natalie Winger — Håndlagde smykker fra Norge</p>
        <p style="font-family:sans-serif;font-size:12px;margin:0;">
          <a href="https://www.nataliewinger.com" style="color:#7c5c45;text-decoration:none;">www.nataliewinger.com</a>
        </p>
      </td>
    </tr>

  </table>
</td></tr>
</table>
</body>
</html>`;

  const text = `
ORDREBEKREFTELSE #${orderNumber} – Natalie Winger
${"─".repeat(44)}

Hei ${data.customerName},

Tusen takk for din bestilling! Vi bekrefter at betalingen er mottatt og at ordren din er under behandling.

ORDRENUMMER:  #${orderNumber}
DATO:         ${formattedDate}

BESTILTE VARER
${"─".repeat(44)}
${itemRowsText}
${"─".repeat(44)}
Delsum:   ${data.subtotal} NOK
Frakt:    ${data.shippingCost === 0 ? "Gratis" : `${data.shippingCost} NOK`}
TOTALT:   ${data.total} NOK

LEVERINGSADRESSE
${data.shippingAddress.name}
${data.shippingAddress.addressLine}
${data.shippingAddress.postalCode} ${titleCase(data.shippingAddress.city)}

📦 Vi sender deg en e-post med sporingsinformasjon når pakken er underveis!
${data.receiptUrl ? `\nBetalingskvittering: ${data.receiptUrl}\n` : ""}
Spørsmål? Svar på denne e-posten eller kontakt oss på ${supportEmail}.

Med vennlig hilsen,
Natalie Winger
www.nataliewinger.com
`.trim();

  await transporter.sendMail({
    from: `"Natalie Winger" <${gmailUser}>`,
    to: data.customerEmail,
    replyTo: supportEmail,
    subject: `Ordrebekreftelse #${orderNumber} – Natalie Winger`,
    text,
    html,
    headers: {
      "X-Mailer": "Natalie Winger Ordresystem",
      "Precedence": "transactional",
    },
  });
}

// Internal notification sent to the shop's own inbox whenever a new order is placed.
export async function sendInternalOrderNotification(data: OrderEmailData): Promise<void> {
  const gmailUser = Deno.env.get("GMAIL_USER") ?? "";
  const gmailPass = Deno.env.get("GMAIL_APP_PASSWORD") ?? "";
  if (!gmailUser || !gmailPass) return;

  const transporter = nodemailer.createTransport({
    host: "smtp.gmail.com",
    port: 465,
    secure: true,
    auth: { user: gmailUser, pass: gmailPass },
  });

  const orderNumber = String(data.orderId).padStart(5, "0");
  const formattedDate = new Date(data.orderDate).toLocaleDateString("nb-NO", {
    day: "numeric",
    month: "long",
    year: "numeric",
    hour: "2-digit",
    minute: "2-digit",
  });

  const itemLines = data.items
    .map(
      (i) =>
        `  • ${i.name}${i.selectedSize ? ` (${i.selectedSize})` : ""} × ${i.quantity}  —  ${i.quantity * i.pricePerItem} NOK`
    )
    .join("\n");

  const itemRowsHtml = data.items
    .map(
      (i) => `
    <tr>
      <td style="padding:8px 0;border-bottom:1px solid #f0f0f0;font-family:sans-serif;font-size:14px;">
        ${i.name}${i.selectedSize ? ` <span style="color:#888;">(${i.selectedSize})</span>` : ""}
      </td>
      <td style="padding:8px 0;border-bottom:1px solid #f0f0f0;font-family:sans-serif;font-size:14px;text-align:center;">${i.quantity}</td>
      <td style="padding:8px 0;border-bottom:1px solid #f0f0f0;font-family:sans-serif;font-size:14px;text-align:right;">${i.quantity * i.pricePerItem} NOK</td>
    </tr>`
    )
    .join("");

  const html = `<!DOCTYPE html>
<html lang="no">
<head><meta charset="UTF-8"><title>Ny bestilling #${orderNumber}</title></head>
<body style="margin:0;padding:0;background:#f5f5f5;font-family:sans-serif;">
<table width="100%" cellpadding="0" cellspacing="0" style="background:#f5f5f5;">
<tr><td align="center" style="padding:32px 16px;">
<table width="580" cellpadding="0" cellspacing="0" style="max-width:580px;width:100%;background:#fff;border-radius:10px;overflow:hidden;box-shadow:0 2px 8px rgba(0,0,0,0.08);">

  <!-- Alert header -->
  <tr>
    <td style="background:#7c5c45;padding:24px 32px;">
      <p style="margin:0;font-size:11px;color:rgba(255,255,255,0.7);text-transform:uppercase;letter-spacing:3px;">Natalie Winger — Intern varsling</p>
      <h1 style="margin:8px 0 0;font-size:22px;color:#fff;font-weight:700;">🛍️ Ny bestilling #${orderNumber}</h1>
      <p style="margin:6px 0 0;font-size:13px;color:rgba(255,255,255,0.75);">${formattedDate}</p>
    </td>
  </tr>

  <!-- Action banner -->
  <tr>
    <td style="background:#fef3c7;padding:14px 32px;border-bottom:2px solid #fbbf24;">
      <p style="margin:0;font-size:14px;color:#92400e;font-weight:600;">
        📦 Husk å pakke og sende denne bestillingen!
      </p>
    </td>
  </tr>

  <tr><td style="padding:28px 32px;">

    <!-- Customer info -->
    <p style="font-size:11px;text-transform:uppercase;letter-spacing:2px;color:#888;margin:0 0 8px;">Kunde</p>
    <table width="100%" cellpadding="0" cellspacing="0" style="margin-bottom:24px;">
      <tr>
        <td style="font-size:13px;color:#555;padding-bottom:4px;width:100px;">Navn</td>
        <td style="font-size:13px;color:#111;padding-bottom:4px;font-weight:600;">${data.customerName}</td>
      </tr>
      <tr>
        <td style="font-size:13px;color:#555;padding-bottom:4px;">E-post</td>
        <td style="font-size:13px;color:#111;padding-bottom:4px;">
          <a href="mailto:${data.customerEmail}" style="color:#7c5c45;">${data.customerEmail}</a>
        </td>
      </tr>
      ${data.customerPhone ? `
      <tr>
        <td style="font-size:13px;color:#555;">Telefon</td>
        <td style="font-size:13px;color:#111;">${data.customerPhone}</td>
      </tr>` : ""}
    </table>

    <!-- Items -->
    <p style="font-size:11px;text-transform:uppercase;letter-spacing:2px;color:#888;margin:0 0 8px;">Bestilte varer</p>
    <table width="100%" cellpadding="0" cellspacing="0" style="margin-bottom:20px;">
      <tr>
        <th style="font-size:11px;color:#888;text-align:left;padding-bottom:6px;font-weight:normal;">Vare</th>
        <th style="font-size:11px;color:#888;text-align:center;padding-bottom:6px;font-weight:normal;">Ant.</th>
        <th style="font-size:11px;color:#888;text-align:right;padding-bottom:6px;font-weight:normal;">Pris</th>
      </tr>
      ${itemRowsHtml}
    </table>

    <!-- Totals -->
    <table width="100%" cellpadding="0" cellspacing="0" style="border-top:1px solid #eee;padding-top:12px;margin-bottom:24px;">
      <tr>
        <td style="font-size:13px;color:#555;padding-bottom:4px;">Delsum</td>
        <td style="font-size:13px;color:#111;text-align:right;padding-bottom:4px;">${data.subtotal} NOK</td>
      </tr>
      <tr>
        <td style="font-size:13px;color:#555;padding-bottom:10px;">Frakt</td>
        <td style="font-size:13px;color:${data.shippingCost === 0 ? "#16a34a" : "#111"};text-align:right;padding-bottom:10px;">
          ${data.shippingCost === 0 ? "Gratis" : `${data.shippingCost} NOK`}
        </td>
      </tr>
      <tr>
        <td style="font-size:15px;font-weight:700;color:#111;border-top:2px solid #eee;padding-top:8px;">TOTALT</td>
        <td style="font-size:15px;font-weight:700;color:#7c5c45;text-align:right;border-top:2px solid #eee;padding-top:8px;">${data.total} NOK</td>
      </tr>
    </table>

    <!-- Shipping address -->
    <p style="font-size:11px;text-transform:uppercase;letter-spacing:2px;color:#888;margin:0 0 8px;">Send til</p>
    <div style="background:#f9f9f9;border-radius:8px;padding:16px 20px;font-size:14px;line-height:1.8;color:#111;">
      <strong>${data.shippingAddress.name}</strong><br>
      ${data.shippingAddress.addressLine}<br>
      ${data.shippingAddress.postalCode} ${titleCase(data.shippingAddress.city)}
    </div>

  </td></tr>
</table>
</td></tr>
</table>
</body>
</html>`;

  const text = `
🛍️  NY BESTILLING #${orderNumber} – ${formattedDate}
${"═".repeat(48)}

KUNDE
  Navn:    ${data.customerName}
  E-post:  ${data.customerEmail}${data.customerPhone ? `\n  Telefon: ${data.customerPhone}` : ""}

VARER
${itemLines}

  Delsum:  ${data.subtotal} NOK
  Frakt:   ${data.shippingCost === 0 ? "Gratis" : `${data.shippingCost} NOK`}
  TOTALT:  ${data.total} NOK

SEND TIL
  ${data.shippingAddress.name}
  ${data.shippingAddress.addressLine}
  ${data.shippingAddress.postalCode} ${titleCase(data.shippingAddress.city)}

📦 Husk å pakke og sende!
`.trim();

  await transporter.sendMail({
    from: `"Natalie Winger" <${gmailUser}>`,
    to: gmailUser,
    replyTo: data.customerEmail,
    subject: `🛍️ Ny bestilling #${orderNumber} – ${data.customerName} (${data.total} NOK)`,
    text,
    html,
    headers: {
      "X-Mailer": "Natalie Winger Ordresystem",
      "Precedence": "transactional",
    },
  });
}
