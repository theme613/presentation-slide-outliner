import { S3Client, PutObjectCommand } from "@aws-sdk/client-s3";
import { DynamoDBClient, PutItemCommand } from "@aws-sdk/client-dynamodb";
import { PollyClient, SynthesizeSpeechCommand } from "@aws-sdk/client-polly";
import { BedrockRuntimeClient, InvokeModelCommand } from "@aws-sdk/client-bedrock-runtime";
import { createRequire } from "module";
const require = createRequire(import.meta.url);
const pdfParse = require("pdf-parse");

// AWS Clients initialized with standard SDK credentials provider (relies on env vars, IAM, etc.)
const awsConfig = process.env.AWS_REGION ? { region: process.env.AWS_REGION } : null;
const s3 = awsConfig ? new S3Client(awsConfig) : null;
const dynamodb = awsConfig ? new DynamoDBClient(awsConfig) : null;
const polly = awsConfig ? new PollyClient(awsConfig) : null;
const bedrock = awsConfig ? new BedrockRuntimeClient(awsConfig) : null;

export async function POST(req) {
    try {
        if (!bedrock) {
            throw new Error("AWS_REGION or AWS credentials not configured locally.");
        }

        const formData = await req.formData();
        const topic = formData.get("topic");
        const audience = formData.get("audience");
        const tone = formData.get("tone");
        const file = formData.get("file");

        let fileContext = "";

        // 1. Process File & Upload to S3
        if (file && file !== "undefined" && file.size > 0) {
            const buffer = Buffer.from(await file.arrayBuffer());
            const fileName = `${Date.now()}-${file.name.replace(/[^a-zA-Z0-9.]/g, "_")}`;

            // Upload to S3 
            if (s3 && process.env.S3_BUCKET_NAME) {
                try {
                    await s3.send(
                        new PutObjectCommand({
                            Bucket: process.env.S3_BUCKET_NAME,
                            Key: `uploads/${fileName}`,
                            Body: buffer,
                            ContentType: file.type || "application/octet-stream",
                        })
                    );
                    console.log(`Successfully uploaded ${fileName} to S3`);
                } catch (err) {
                    console.error("S3 Upload Error:", err);
                }
            }

            // Extract text for AI Context
            if (file.type === "application/pdf" || file.name.endsWith(".pdf")) {
                try {
                    const data = await pdfParse(buffer);
                    fileContext = data.text;
                } catch (err) {
                    console.error("PDF Parse Error:", err);
                    fileContext = "Error reading PDF file structure.";
                }
            } else {
                fileContext = buffer.toString("utf-8");
            }
        }

        // 2. Call Amazon Bedrock (Anthropic Claude 3 Haiku)
        const prompt = `
      You are an expert presentation designer. Create a highly structured 5-10 slide presentation outline based on the following user request.
      
      Topic: ${topic}
      Target Audience: ${audience || 'General public'}
      Tone: ${tone || 'Professional'}
      
      ${fileContext ? `Source Reference Material:\n---\n${fileContext.substring(0, 20000)}\n---\nBased on the above reference material, summarize the key points into a presentation.` : ""}

      Respond ONLY with a valid JSON array of objects. Each object must represent a single slide and MUST have exactly these 3 keys:
      - "title": (string) A concise, engaging slide title
      - "bulletPoints": (array of strings) 3-4 punchy key points for the slide
      - "speakerNotes": (string) A conversational, natural script of what the speaker should say aloud when presenting this slide.
    `;

        const bedrockPayload = {
            anthropic_version: "bedrock-2023-05-31",
            max_tokens: 4000,
            temperature: 0.7,
            messages: [
                {
                    role: "user",
                    content: [{ type: "text", text: prompt }]
                }
            ]
        };

        const command = new InvokeModelCommand({
            // Claude 3 Haiku is very fast and cheap, perfect for a portfolio project.
            modelId: "anthropic.claude-3-haiku-20240307-v1:0",
            contentType: "application/json",
            accept: "application/json",
            body: JSON.stringify(bedrockPayload),
        });

        const response = await bedrock.send(command);
        const responseBody = JSON.parse(new TextDecoder().decode(response.body));
        const aiText = responseBody.content[0].text;

        // Clean up markdown formatting if the model wraps the response in code blocks
        let jsonString = aiText.trim();
        if (jsonString.startsWith("```")) {
            jsonString = jsonString.replace(/^```(json)?\n/, "").replace(/\n```$/, "");
        }
        const slides = JSON.parse(jsonString);

        // 3. Save to DynamoDB
        const presentationId = Date.now().toString();
        if (dynamodb && process.env.DYNAMODB_TABLE_NAME) {
            try {
                await dynamodb.send(
                    new PutItemCommand({
                        TableName: process.env.DYNAMODB_TABLE_NAME,
                        Item: {
                            id: { S: presentationId },
                            topic: { S: topic },
                            audience: { S: audience || "N/A" },
                            tone: { S: tone || "N/A" },
                            slides: { S: JSON.stringify(slides) },
                            createdAt: { S: new Date().toISOString() },
                        },
                    })
                );
                console.log(`Saved outline ${presentationId} to DynamoDB`);
            } catch (err) {
                console.error("DynamoDB Save Error:", err);
            }
        }

        // 4. Synthesize Speech with Polly for Speaker Notes
        if (polly && s3 && process.env.S3_BUCKET_NAME && slides.length > 0 && slides[0].speakerNotes) {
            try {
                const pollyRes = await polly.send(
                    new SynthesizeSpeechCommand({
                        OutputFormat: "mp3",
                        Text: slides[0].speakerNotes,
                        VoiceId: "Matthew", // Premium male voice
                        Engine: "neural",
                    })
                );

                // Convert stream to buffer
                const audioChunks = [];
                for await (const chunk of pollyRes.AudioStream) {
                    audioChunks.push(chunk);
                }
                const audioBuffer = Buffer.concat(audioChunks);

                const audioKey = `audio/${presentationId}-slide-1.mp3`;
                await s3.send(
                    new PutObjectCommand({
                        Bucket: process.env.S3_BUCKET_NAME,
                        Key: audioKey,
                        Body: audioBuffer,
                        ContentType: "audio/mpeg",
                    })
                );

                // Attach the public URL to the first slide
                slides[0].audioUrl = `https://${process.env.S3_BUCKET_NAME}.s3.${process.env.AWS_REGION}.amazonaws.com/${audioKey}`;
                console.log(`Synthesized Polly audio for slide 1`);
            } catch (err) {
                console.error("Polly Error:", err);
            }
        }

        return new Response(JSON.stringify({ slides, presentationId }), {
            status: 200,
            headers: { "Content-Type": "application/json" },
        });

    } catch (error) {
        console.error("Error generating presentation:", error);
        return new Response(JSON.stringify({ error: error.message || "Failed to generate slides." }), { status: 500 });
    }
}
