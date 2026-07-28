import { Request, Response } from "express";
import Car from "../models/car.model";

const GROQ_MODEL = "llama-3.3-70b-versatile";
const GROQ_URL = "https://api.groq.com/openai/v1/chat/completions";

const SYSTEM_PROMPT = `You are the VIBES assistant, embedded in a car marketplace web app called VIBES, serving Nepal.

What VIBES does:
- Buyers browse active vehicle listings and can reserve one by paying a deposit (10% of the vehicle's price) through eSewa. This books the car for a test drive and removes it from public listings so no one else can reserve it.
- After the test drive, the buyer either completes the full purchase, or cancels — in which case the deposit is refunded minus a small flat administrative fee.
- Sellers list vehicles by providing details (VIN, year, make, model, mileage, price, condition, photos, blue book registration) which then go through admin review (pending -> active) before appearing publicly. Listings can be rejected if information looks incomplete or inconsistent, in which case the seller can edit and resubmit.
- VIN is the Vehicle Identification Number, used to verify a car's registration and history.
- "Condition" ratings on listings are: New, Excellent, Good, Fair, Poor - roughly describing overall wear and maintenance state, not a formal inspection grade.
- VIBES does not currently offer financing/loans directly - buyers arrange their own payment for the remaining balance after the deposit, outside the platform.
- There isn't yet a built-in in-app messaging system between buyers and sellers; contact happens through the booking/test-drive process.

Your job:
1. Help users find vehicles using the search_cars function whenever they describe what they're looking for (budget, make, body type, condition, etc.) - don't guess at inventory yourself, always call the function.
2. After search_cars returns results, ALWAYS write a short natural-language reply describing what you found (e.g. how many, standout options, price range) - never leave your reply empty or generic. The car cards are shown separately in the UI, so your job is to add helpful commentary, not just repeat their names.
3. If the user asks you to compare, discuss, or pick between cars you already showed earlier in this conversation, answer directly using that information - do NOT call search_cars again just because they said "compare" or "another one." Only call search_cars again if they've described new/different criteria.
4. Answer general questions about how buying, booking, deposits, listing, and admin review work on VIBES, using the explanation above.
5. If asked about something VIBES doesn't support (financing, in-app chat, warranties, delivery), say so plainly rather than making something up.
6. Keep answers short and conversational - this is a chat widget, not a long-form document.
7. If a user asks about something unrelated to cars or VIBES, gently redirect them back to what you can help with.`;

const TOOLS = [
  {
    type: "function",
    function: {
      name: "search_cars",
      description: "Search active vehicle listings on VIBES by any combination of criteria.",
      parameters: {
        type: "object",
        properties: {
          make: { type: "string", description: "e.g. Honda, Toyota" },
          bodyType: {
            type: "string",
            enum: ["Sedan", "SUV", "Truck", "Coupe", "Convertible"],
          },
          minPrice: { type: "number" },
          maxPrice: { type: "number" },
          condition: { type: "string", enum: ["New", "Excellent", "Good", "Fair", "Poor"] },
          keyword: { type: "string", description: "free-text match against make/model" },
        },
      },
    },
  },
];

function escapeRegex(str: string) {
  return str.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
}

/** Tolerant JSON parse - repairs the most common small mistakes models make (trailing commas). */
function safeParseJson(raw: string): any {
  try {
    return JSON.parse(raw);
  } catch {
    try {
      return JSON.parse(raw.replace(/,\s*([}\]])/g, "$1"));
    } catch {
      return {};
    }
  }
}

async function executeSearchCars(input: any) {
  const query: Record<string, unknown> = {
    status: "active",
    isBooked: { $ne: true },
    soldAt: { $exists: false },
  };
  if (input.make) query.make = { $regex: escapeRegex(String(input.make)), $options: "i" };
  if (input.bodyType) query.bodyType = input.bodyType;
  if (input.condition) query.condition = input.condition;
  if (input.minPrice || input.maxPrice) {
    query.price = {} as Record<string, number>;
    if (input.minPrice) (query.price as any).$gte = Number(input.minPrice);
    if (input.maxPrice) (query.price as any).$lte = Number(input.maxPrice);
  }
  if (input.keyword) {
    const kw = escapeRegex(String(input.keyword));
    query.$or = [
      { make: { $regex: kw, $options: "i" } },
      { carModel: { $regex: kw, $options: "i" } },
    ];
  }

  const cars = await Car.find(query).limit(5).sort({ createdAt: -1 });
  return cars.map((c) => ({
    _id: c._id,
    year: c.year,
    make: c.make,
    carModel: c.carModel,
    price: c.price,
    condition: c.condition,
    location: c.location,
    image: c.images?.[0],
  }));
}

/**
 * Groq/Llama occasionally emits a malformed pseudo-XML function call instead of
 * proper structured tool_calls, in a few different shapes:
 *   <function=search_cars {"bodyType": "SUV"}></function>
 *   <function=search_cars={"bodyType": "SUV"}></function>
 *   <function=search_cars {"bodyType": "SUV"}</function>
 * This parses any of those out and turns it into a normal tool call rather
 * than failing the whole request.
 */
function parseFallbackToolCall(failedGeneration: string) {
  const match = failedGeneration.match(/<function=(\w+)[^{]*(\{[\s\S]*?\})/);
  if (!match) return null;
  const [, name, argsJson] = match;
  return {
    choices: [
      {
        message: {
          role: "assistant",
          content: null,
          tool_calls: [
            {
              id: `fallback_${Date.now()}`,
              type: "function",
              function: { name, arguments: argsJson },
            },
          ],
        },
      },
    ],
  };
}

async function callGroq(messages: any[]): Promise<any> {
  const res = await fetch(GROQ_URL, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      Authorization: `Bearer ${process.env.GROQ_API_KEY}`,
    },
    body: JSON.stringify({
      model: GROQ_MODEL,
      messages,
      tools: TOOLS,
      tool_choice: "auto",
    }),
  });

  if (!res.ok) {
    const text = await res.text();

    try {
      const errBody = JSON.parse(text);
      const failedGen = errBody?.error?.failed_generation as string | undefined;
      if (errBody?.error?.code === "tool_use_failed" && failedGen) {
        const fallback = parseFallbackToolCall(failedGen);
        if (fallback) return fallback;
      }
    } catch {
      // fall through to throwing below
    }

    throw new Error(`Groq API error (${res.status}): ${text}`);
  }

  return res.json();
}

// POST /api/v1/assistant/chat
export async function chatWithAssistant(req: Request, res: Response) {
  try {
    const { history } = req.body as {
      history: { role: "user" | "assistant"; content: string }[];
    };

    if (!Array.isArray(history) || history.length === 0) {
      return res.status(400).json({ message: "history is required" });
    }

    const messages: any[] = [
      { role: "system", content: SYSTEM_PROMPT },
      ...history.map((m) => ({ role: m.role, content: m.content })),
    ];

    let carResults: any[] = [];

    for (let i = 0; i < 4; i++) {
      const data = await callGroq(messages);
      const message = data.choices[0].message;

      if (!message.tool_calls || message.tool_calls.length === 0) {
        res.json({ reply: message.content ?? "", cars: carResults });
        return;
      }

      messages.push(message);

      for (const toolCall of message.tool_calls) {
        let result: any = [];
        try {
          if (toolCall.function.name === "search_cars") {
            const args = safeParseJson(toolCall.function.arguments || "{}");
            result = await executeSearchCars(args);
            carResults = result;
          }
        } catch (toolErr) {
          console.error("Tool execution error:", toolErr);
          result = { error: "Search failed, try different criteria." };
        }
        messages.push({
          role: "tool",
          tool_call_id: toolCall.id,
          content: JSON.stringify(result),
        });
      }
    }

    // Loop cap reached without a plain-text answer - force one final
    // text-only response (no tools) so the model must actually answer
    // using whatever's already in the conversation, instead of a canned message.
    messages.push({
      role: "user",
      content: "Please give me your answer now in plain text, based on what you've already found.",
    });
    const finalRes = await fetch(GROQ_URL, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${process.env.GROQ_API_KEY}`,
      },
      body: JSON.stringify({ model: GROQ_MODEL, messages }),
    });
    const finalData: any = await finalRes.json();
    const finalReply = finalData?.choices?.[0]?.message?.content;

    res.json({
      reply: finalReply || (carResults.length > 0 ? "Here's what I found." : "I couldn't find a match for that."),
      cars: carResults,
    });
  } catch (err) {
    console.error("chatWithAssistant error:", err);
    res.status(500).json({ message: "Assistant is unavailable right now" });
  }
}