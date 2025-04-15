import { NextResponse } from "next/server";
import { prisma } from "@/database/src/client";
import OpenAI from "openai";

const openai = new OpenAI({ apiKey: "" });

export async function POST(req: Request) {
  const { userId, userMessage } = await req.json();

  try {
    // Step 1: Extract valid budget fields from schema
    const budgetFields = Object.keys(prisma.user.fields)
      .filter(f => f.endsWith('_expenditure'))
      .map(f => f.replace('_expenditure', ''));

    console.log("budgetFields", budgetFields)

    // Step 2: LLM Parsing with strict schema validation
    const { data, llmConfidence } = await parseWithLLM(userMessage, budgetFields);

    console.log("data, conf", data, llmConfidence)

    
    if (llmConfidence < 0.85) {
      throw new Error(`I'm only ${Math.round(llmConfidence * 100)}% confident I understood correctly. 
        Please try: "Transfer [amount] from [category] to [category]"`);
    }

    // Step 3: Direct field update
    const result = await prisma.user.update({
      where: { id: userId },
      data: {
        [`${data.fromCategory}_expenditure`]: { decrement: data.amount },
        [`${data.toCategory}_expenditure`]: { increment: data.amount }
      },
      select: {
        [`${data.fromCategory}_expenditure`]: true,
        [`${data.toCategory}_expenditure`]: true
      }
    });

    console.log("res", result);

    return NextResponse.json({
      success: true,
      message: `Transferred $${data.amount} from ${data.fromCategory} to ${data.toCategory}`,
      newBalances: {
        [data.fromCategory]: result[`${data.fromCategory}_expenditure`],
        [data.toCategory]: result[`${data.toCategory}_expenditure`]
      }
    });

  } catch (error) {
    const e = error as Error
    return NextResponse.json(
      { 
        success: false,
        error: e.message
      },
      { status: 400 }
    );
  }
}

// Pure LLM Parsing with Schema Awareness
async function parseWithLLM(text: string, validCategories: string[]) {
    const response = await openai.chat.completions.create({
      model: "gpt-4o-mini",
      messages: [{
        role: "system",
        content: `You are a budget assistant. Extract transfer details from this request.
        Valid categories: ${validCategories.join(', ')}.
        
        Respond in EXACTLY this format:
        """
        fromCategory: [valid_category_name]
        toCategory: [valid_category_name]
        amount: [number]
        confidence: [0-1]
        error: [null|"insufficient_funds"|"invalid_category"]
        """`
      }, {
        role: "user",
        content: text
      }],
      temperature: 0.1,
      max_tokens: 100
    });
  
    const rawText = response.choices[0].message.content;
    const result = parseTextResponse(rawText || "", validCategories);
    
    return {
      data: {
        fromCategory: result.fromCategory.toLowerCase(),
        toCategory: result.toCategory.toLowerCase(),
        amount: parseFloat(result.amount)
      },
      llmConfidence: result.confidence
    };
  }
  
  // Helper to parse the structured text format
  function parseTextResponse(text: string, validCategories: string[]) {
    const lines = text.split('\n');
    const result: any = {};
  
    lines.forEach(line => {
      const [key, value] = line.split(':').map(s => s.trim());
      if (key && value) result[key] = value;
    });
  
    // Validation
    if (!validCategories.includes(result.fromCategory)) {
      throw new Error(`Invalid source category: ${result.fromCategory}`);
    }
    if (!validCategories.includes(result.toCategory)) {
      throw new Error(`Invalid target category: ${result.toCategory}`);
    }
    if (isNaN(result.amount)) {
      throw new Error(`Invalid amount: ${result.amount}`);
    }
  
    return result;
  }