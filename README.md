# Presentation Slide Outliner

A full-stack AI-powered web application that generates structured presentation slide outlines with speaker notes from a simple text prompt. Built entirely on AWS cloud services to demonstrate real-world cloud architecture and engineering skills.

---

## Architecture

| Layer | Technology | Purpose |
|---|---|---|
| Frontend | Next.js 16 (App Router) | Server-side rendering, API routes, responsive UI |
| Styling | Vanilla CSS | Glassmorphism design system, micro-animations, dark theme |
| AI Generation | Amazon Bedrock (Nova Lite) | Structured JSON slide generation from natural language prompts |
| File Storage | Amazon S3 | Uploaded reference documents and synthesized audio files |
| Database | Amazon DynamoDB | Persistent storage of generated presentation outlines |
| Voice Synthesis | Amazon Polly | Neural text-to-speech for speaker note rehearsal |

---

## Features

- **AI Slide Generation** -- Enter a topic, target audience, and tone to receive a fully structured 5-10 slide presentation outline with bullet points and speaker notes.
- **Reference Document Upload** -- Attach a text file to provide the AI with source material for more accurate, grounded slide content. Files are stored in S3.
- **AI Presenter Voice** -- Amazon Polly converts speaker notes into realistic neural audio, playable directly from the slide dashboard.
- **PDF Export** -- One-click export reformats the dark UI into a clean, print-friendly layout using a dedicated print stylesheet.
- **Presentation History** -- All generated outlines are saved to DynamoDB with timestamps for future retrieval.

---

## AWS Services Used

This project was designed to demonstrate practical cloud integration using a $100 AWS credit budget.

- **Amazon Bedrock** -- Invokes the Nova Lite foundation model via the `InvokeModel` API to generate structured JSON responses.
- **Amazon S3** -- Handles binary file uploads (reference documents) and hosts synthesized MP3 audio from Polly.
- **Amazon DynamoDB** -- NoSQL table storing presentation metadata (topic, audience, tone, slides JSON, timestamps).
- **Amazon Polly** -- Neural engine with the Matthew voice for high-fidelity text-to-speech synthesis of speaker notes.

---

## Getting Started

### Prerequisites

- Node.js 18+
- An AWS account with active credentials

### Installation

```bash
git clone https://github.com/your-username/presentation-slide-outliner.git
cd presentation-slide-outliner
npm install
```

### Environment Variables

Create a `.env.local` file in the project root:

```env
AWS_ACCESS_KEY_ID=your_access_key_id
AWS_SECRET_ACCESS_KEY=your_secret_access_key
AWS_REGION=us-east-1
S3_BUCKET_NAME=your_s3_bucket_name
DYNAMODB_TABLE_NAME=slide-outlines
```

### AWS Resource Setup

1. **S3** -- Create a bucket matching `S3_BUCKET_NAME`.
2. **DynamoDB** -- Create a table named `slide-outlines` with partition key `id` (String).
3. **IAM** -- Attach `AmazonS3FullAccess`, `AmazonDynamoDBFullAccess`, `AmazonBedrockFullAccess`, and `AmazonPollyFullAccess` policies to your IAM user.

### Run Locally

```bash
npm run dev
```

Open [http://localhost:3000](http://localhost:3000) in your browser.

---

## Project Structure

```
presentation-slide-outliner/
  app/
    api/generate/route.js    -- Bedrock, S3, DynamoDB, Polly integration
    page.js                  -- Main UI with form and state management
    page.module.css          -- Glassmorphism hero section styles
    layout.js                -- Root layout and metadata
    globals.css              -- Design system variables and base styles
  components/
    SlideViewer.js           -- Card-based slide grid with audio player
    SlideViewer.module.css   -- Slide card styles and print stylesheet
    LoadingState.js          -- Animated loading indicator
    LoadingState.module.css  -- Scanner animation keyframes
```

---

## Deployment

Deploy to **AWS Amplify** by connecting your GitHub repository in the Amplify Console. Add the environment variables listed above to the Amplify environment settings. Amplify natively supports Next.js App Router with server-side rendering.

---

## License

MIT
