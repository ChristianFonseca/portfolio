import { NextResponse } from "next/server"
import { z } from "zod"

const contactSchema = z.object({
  name: z.string().trim().min(1).max(200),
  email: z.string().trim().email().max(320),
  subject: z.string().trim().min(1).max(200),
  message: z.string().trim().min(1).max(5000),
})

function escapeHtml(value: string): string {
  return value
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;")
    .replace(/'/g, "&#39;")
}

// In-memory rate limit: max 5 submissions per IP per 10 minutes.
// nginx should also enforce limit_req on this route in production.
const RATE_LIMIT_WINDOW_MS = 10 * 60 * 1000
const RATE_LIMIT_MAX = 5
const submissionsByIp = new Map<string, number[]>()

function isRateLimited(ip: string): boolean {
  const now = Date.now()
  const recent = (submissionsByIp.get(ip) ?? []).filter((t) => now - t < RATE_LIMIT_WINDOW_MS)
  if (recent.length >= RATE_LIMIT_MAX) {
    submissionsByIp.set(ip, recent)
    return true
  }
  recent.push(now)
  submissionsByIp.set(ip, recent)
  // Evita crecimiento sin límite si llegan muchas IPs distintas
  if (submissionsByIp.size > 10000) {
    for (const [key, times] of submissionsByIp) {
      if (times.every((t) => now - t >= RATE_LIMIT_WINDOW_MS)) submissionsByIp.delete(key)
    }
  }
  return false
}

export async function POST(request: Request) {
  try {
    const apiKey = process.env.RESEND_API_KEY
    if (!apiKey) {
      console.error("RESEND_API_KEY is not set; contact form is disabled")
      return NextResponse.json({ error: "Email service not configured" }, { status: 500 })
    }

    // X-Real-IP la setea nuestro nginx; X-Forwarded-For puede traer valores del cliente
    const ip =
      request.headers.get("x-real-ip") ||
      request.headers.get("x-forwarded-for")?.split(",")[0]?.trim() ||
      "unknown"
    if (isRateLimited(ip)) {
      return NextResponse.json({ error: "Too many messages. Please try again later." }, { status: 429 })
    }

    let body: unknown
    try {
      body = await request.json()
    } catch {
      return NextResponse.json({ error: "Invalid request body" }, { status: 400 })
    }

    const parsed = contactSchema.safeParse(body)
    if (!parsed.success) {
      return NextResponse.json({ error: "Invalid form data. Check all fields and try again." }, { status: 400 })
    }
    const { name, email, subject, message } = parsed.data

    const fromEmail = process.env.CONTACT_FROM_EMAIL || "no-reply@christianfonseca.dev"
    const toEmail = process.env.CONTACT_TO_EMAIL || "christian.fonseca.r@gmail.com"

    // Resend REST API (sin SDK): https://resend.com/docs/api-reference/emails/send-email
    const res = await fetch("https://api.resend.com/emails", {
      method: "POST",
      headers: {
        Authorization: `Bearer ${apiKey}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        from: `Christian Fonseca Portfolio <${fromEmail}>`,
        to: [toEmail],
        reply_to: email,
        subject: `Portfolio Contact: ${subject}`,
        html: `
          <h2>New Contact Form Submission</h2>
          <p><strong>From:</strong> ${escapeHtml(name)}</p>
          <p><strong>Email:</strong> ${escapeHtml(email)}</p>
          <p><strong>Subject:</strong> ${escapeHtml(subject)}</p>
          <p><strong>Message:</strong></p>
          <p>${escapeHtml(message).replace(/\n/g, "<br>")}</p>
        `,
        text: `New Contact Form Submission\n\nFrom: ${name}\nEmail: ${email}\nSubject: ${subject}\n\nMessage:\n${message}`,
      }),
    })

    if (!res.ok) {
      const detail = await res.text().catch(() => "")
      console.error("Resend error:", res.status, detail)
      return NextResponse.json({ error: "Failed to send email" }, { status: 502 })
    }

    return NextResponse.json({ success: true, message: "Email sent successfully" }, { status: 200 })
  } catch (error) {
    console.error("Error sending email:", error)
    return NextResponse.json({ error: "Failed to send email" }, { status: 500 })
  }
}
