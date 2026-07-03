import { NextResponse } from "next/server"
import { MailerSend, EmailParams, Sender, Recipient } from "mailersend"
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
    const apiKey = process.env.MAILERSEND_API_KEY
    if (!apiKey) {
      console.error("MAILERSEND_API_KEY is not set; contact form is disabled")
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

    const mailerSend = new MailerSend({ apiKey })

    const sentFrom = new Sender(
      process.env.CONTACT_FROM_EMAIL || "MS_mbalq3@test-p7kx4xwo18eg9yjr.mlsender.net",
      "Christian Fonseca Portfolio",
    )
    const recipients = [
      new Recipient(process.env.CONTACT_TO_EMAIL || "christian.fonseca.r@gmail.com", "Christian Fonseca"),
    ]

    const emailParams = new EmailParams()
      .setFrom(sentFrom)
      .setTo(recipients)
      .setReplyTo(new Sender(email, name))
      .setSubject(`Portfolio Contact: ${subject}`)
      .setHtml(`
        <h2>New Contact Form Submission</h2>
        <p><strong>From:</strong> ${escapeHtml(name)}</p>
        <p><strong>Email:</strong> ${escapeHtml(email)}</p>
        <p><strong>Subject:</strong> ${escapeHtml(subject)}</p>
        <p><strong>Message:</strong></p>
        <p>${escapeHtml(message).replace(/\n/g, "<br>")}</p>
      `)
      .setText(`
        New Contact Form Submission

        From: ${name}
        Email: ${email}
        Subject: ${subject}

        Message:
        ${message}
      `)

    await mailerSend.email.send(emailParams)

    return NextResponse.json({ success: true, message: "Email sent successfully" }, { status: 200 })
  } catch (error) {
    console.error("Error sending email:", error)
    return NextResponse.json({ error: "Failed to send email" }, { status: 500 })
  }
}
