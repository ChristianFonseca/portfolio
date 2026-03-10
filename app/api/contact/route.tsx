import { NextResponse } from "next/server"
import { MailerSend, EmailParams, Sender, Recipient } from "mailersend"

export async function POST(request: Request) {
  try {
    const body = await request.json()
    const { name, email, subject, message } = body

    // Validate required fields
    if (!name || !email || !subject || !message) {
      return NextResponse.json({ error: "All fields are required" }, { status: 400 })
    }

    // Initialize MailerSend
    const mailerSend = new MailerSend({
      apiKey: process.env.MAILERSEND_API_KEY || "",
    })

    // Configure sender (your email)
    const sentFrom = new Sender("MS_mbalq3@test-p7kx4xwo18eg9yjr.mlsender.net", "Christian Fonseca Portfolio")

    // Configure recipient (your email to receive messages)
    const recipients = [new Recipient("christian.fonseca.r@gmail.com", "Christian Fonseca")]

    // Configure email parameters
    const emailParams = new EmailParams()
      .setFrom(sentFrom)
      .setTo(recipients)
      .setReplyTo(new Sender(email, name))
      .setSubject(`Portfolio Contact: ${subject}`)
      .setHtml(`
        <h2>New Contact Form Submission</h2>
        <p><strong>From:</strong> ${name}</p>
        <p><strong>Email:</strong> ${email}</p>
        <p><strong>Subject:</strong> ${subject}</p>
        <p><strong>Message:</strong></p>
        <p>${message.replace(/\n/g, "<br>")}</p>
      `)
      .setText(`
        New Contact Form Submission
        
        From: ${name}
        Email: ${email}
        Subject: ${subject}
        
        Message:
        ${message}
      `)

    // Send email
    await mailerSend.email.send(emailParams)

    return NextResponse.json({ success: true, message: "Email sent successfully" }, { status: 200 })
  } catch (error) {
    console.error("[v0] Error sending email:", error)
    return NextResponse.json({ error: "Failed to send email" }, { status: 500 })
  }
}
