import { NextResponse } from 'next/server';
import OpenAI from 'openai';

export async function POST(req: Request) {
  try {
    const openai = new OpenAI({ apiKey: process.env.OPENAI_API_KEY });
    const body = await req.json();
    const { patient, message, history } = body;

    const systemPrompt = `You are "Spine West Clinical Assistant", an advanced, highly professional medical AI assistant.
Your task is to answer the medical assistant's or provider's questions based strictly on the patient's electronic health record (EHR) data.
Always be concise, clinically accurate, and polite. 
If the user's input is a general statement or a clinical note (e.g., "Patient is feeling dizzy"), provide a clinical synthesis and suggest action items.
If the user asks a specific question (e.g., "What are the allergies?"), answer it directly.

PATIENT EHR DATA:
Name: ${patient.name}
DOB: ${patient.dob} (${patient.gender})
Vitals: BP ${patient.vitals.bp}, HR ${patient.vitals.hr}, Temp ${patient.vitals.temp}
Active Conditions: ${patient.conditions.map((c: any) => c.name).join(', ')}
Active Medications: ${patient.medications.map((m: any) => `${m.name} (${m.dosage})`).join(', ')}
Allergies: ${patient.allergies.map((a: any) => `${a.name} (Reaction: ${a.reaction})`).join(', ')}
Recent Encounters: ${patient.encounters.map((e: any) => `${e.date}: ${e.type} - ${e.notes}`).join(' | ')}`;

    // Convert existing Gemini history format to OpenAI format if needed
    // Gemini: [{role: 'user', parts: [{text: 'hi'}]}, {role: 'model', parts: [{text: 'hello'}]}]
    // OpenAI: [{role: 'user', content: 'hi'}, {role: 'assistant', content: 'hello'}]
    const openAIHistory = (history || []).map((msg: any) => ({
      role: msg.role === 'model' ? 'assistant' : 'user',
      content: msg.parts ? msg.parts[0].text : msg.content
    }));

    const response = await openai.chat.completions.create({
      model: "gpt-4o-mini", // Blazingly fast and smart model
      messages: [
        { role: "system", content: systemPrompt },
        ...openAIHistory,
        { role: "user", content: message || "Please provide a clinical summary of this patient." }
      ],
      temperature: 0.2,
    });

    const aiReply = response.choices[0].message.content;

    return NextResponse.json({ reply: aiReply });
  } catch (error: any) {
    console.error('Fatal Server Error (OpenAI):', error.message);
    return NextResponse.json(
      { error: 'Failed to process request with OpenAI' },
      { status: 500 }
    );
  }
}
