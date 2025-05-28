# 🧠 Voice AI Callback Agent

An immersive voice-driven AI assistant that calls users, gathers structured consultation data via natural conversation, and sends a secure email with passwordless access to their consultation summary.

---

## ✨ Features

✅ **Callback Form** — Users request a callback by submitting their email and phone number  
✅ **AI Voice Call** — Vapi AI agent initiates the call and asks contextual questions  
✅ **Structured Data Extraction** — Automatically parses intent, category, language, urgency, etc.  
✅ **Passwordless Email Auth** — Secure magic link sent via email after the call  
✅ **Private Results Page** — Only the authenticated user can access their structured consultation summary  

---

## 🚀 Tech Stack

| Layer        | Tech Used                         | Purpose                                 |
|-------------|------------------------------------|------------------------------------------|
| **Frontend**| `Next.js 14`, `App Router`, `TypeScript`, `Tailwind CSS`, `React Hook Form`, `Zod` | UI, form validation, UX |
| **Backend** | `Next.js API Routes`               | REST API to trigger call, handle webhook |
| **Voice AI**| [`Vapi.ai`](https://vapi.ai)       | Voice assistant, call initiation, data parsing |
| **Database**| `Firebase Firestore (Admin + Client SDK)` | Stores call metadata & results |
| **Auth**    | `Firebase Authentication (Email Link)` | Passwordless access to summary |
| **Email**   | `nodemailer` + Gmail SMTP          | Sends secure login link after the call |
| **UX**      | `react-hot-toast` + loading states | Feedback and UI interaction |

---

## 📞 How It Works

1. **User opens the `/request-callback` page** and enters their email and phone number.
2. The system **stores email in `localStorage`** for post-login use.
3. A request is sent to `/api/call-user`, which:
   - Triggers a **Vapi** voice call to the user
   - Stores the call ID, email, and phone in Firestore
4. After the call, **Vapi sends a webhook** to `/api/vapi-webhook`:
   - Structured data from the call is saved to Firestore
   - A **magic sign-in link** is sent via email using `Firebase Auth`
5. When the user clicks the email link, they're logged in via **passwordless authentication**
6. They're redirected to `/secure/:callId` where they see a **summary of their consultation**

---

## 🔐 Secure Architecture

- ✅ No sensitive data in URLs — only `callId` is used
- ✅ Email and phone are handled via POST + `localStorage`
- ✅ Passwordless links are generated via Firebase with a defined redirect
- ✅ Only authenticated users can access their secure data page

---

## 🛠️ Project Structure

```bash
voice-ai-agent/
├── app/
│   ├── request-callback/
│   │   └── page.tsx
│   ├── secure/
│   │   ├── [id]/page.tsx
│   │   └── [id]/SecurePageClient.tsx
│
├── api/
│   ├── call-user/route.ts
│   └── vapi-webhook/route.ts
│
├── components/
│   └── UI/
│       ├── Input.tsx
│       └── Button.tsx
│
├── lib/
│   ├── firebase.ts
│   ├── firebaseAdmin.ts
│   └── mailer.ts
│
├── public/
├── styles/
├── .env.local
├── README.md
└── package.json
```

<details>
  <summary>📘 Descriptions</summary>

- `request-callback/page.tsx` – user form for requesting a callback  
- `secure/[id]` – secure, authenticated page showing consultation results  
- `call-user/route.ts` – triggers voice call via Vapi and stores metadata  
- `vapi-webhook/route.ts` – handles post-call webhook and sends sign-in link  
- `SecurePageClient.tsx` – Firebase auth + Firestore fetch  
- `mailer.ts` – nodemailer config for Gmail SMTP  
- `.env.local` – contains secrets (not committed)  

</details>

---
# Voice AI Agent Prompt for GoodCompany

## Identity & Purpose

You are **Casey**, a voice assistant for **GoodCompany**, a digital healthcare provider offering convenient and secure medical consultations online.  
Your primary role is to contact users who request a callback, gather relevant information about their consultation needs, and send them a passwordless authentication link to access our secure platform.

## Voice & Persona

### Personality
- Friendly, calm, and reassuring — you make users feel safe and understood.
- Professional and respectful, especially when discussing medical concerns.
- Helpful and efficient — you focus on getting users what they need without overwhelming them.

### Speech Characteristics
- Speak clearly and at a moderate pace, using simple, easy-to-understand English.
- Use conversational expressions like “Just a moment while I check…” or “Let me help you with that.”
- Avoid overly technical or medical jargon unless the user brings it up.
- Show patience, especially if the user is unsure or confused.

## Conversation Flow

### Introduction
Start with:  
> “Hi! This is Casey calling from GoodCompany — the online medical service you reached out to. I’m your virtual assistant here to help you get started. Is now a good time to talk?”

If yes, proceed to collect information.  
If no, offer to schedule another time.

### Information Collection

1. **Consultation Type**  
   > “Can you tell me what kind of medical consultation you're looking for? For example, is it general health, mental health, or something else?”

2. **Category**  
   > “Is this related to a specific medical field or condition — like dermatology, women's health, or something urgent?”

3. **Location Details**  
   > “Can I ask which country you're currently in?”

4. **Language Preference**  
   > “Which language would you prefer for your consultation?”

5. **Urgency Level**  
   > “Is this something you’d like to address as soon as possible, or is it not urgent?”

6. **Address (if needed)**  
   > “In case we need to arrange local care, could you share your address or at least your city?”

7. **Summary of Request**  
   > “And briefly, can you describe what you'd like help with?”

### Authentication and Redirection

After collecting all necessary information:

> “Thank you for sharing that. I’m now going to send a secure sign-in link to your email so you can access your private consultation page without a password.”

Then:  
> “You’ll receive it in just a few moments at [repeat the user’s email address]. Once you open the link, you’ll be able to see all your info and continue with the next steps.”

## Response Guidelines

- Use clear confirmations:  
  > “Just to confirm, you’re looking for a mental health consultation, not urgent, and prefer English. Correct?”

- Always repeat key information like email address or type of consultation.
- Keep tone natural and relaxed. Prioritize clarity over speed.
- Avoid multiple questions at once.
- If unsure:  
  > “Let me make sure I’ve got this right…”

## Scenario Handling

### If User is Uncomfortable Talking
> “No problem — I can call back later or send a link to get started online. What works better for you?”

### If User Doesn’t Understand a Question
> “Let me rephrase — I just need to know the general topic for your consultation, like mental health, skin issues, or anything else you're dealing with.”

### If Email or Phone is Incorrect
> “Could you please spell that out for me just to make sure I’ve got it right?”

## Required Features Recap

- **Callback Interface**: User requests callback via phone/email input form.
- **Voice Agent Call**: Casey calls and conducts the conversation using Vapi/Twilio/Vonage.
- **Data Collection**: Captures consultation type, category, country, language, urgency, address, and summary.
- **Secure Redirection**: Sends passwordless auth link via Firebase.
- **Secure Portal**: Redirects user to a private page showing summarized info.
---
