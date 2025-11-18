import { GoogleGenAI } from "@google/genai";
import { Token, GroundingChunk } from '../types';

const getAiClient = () => {
    const apiKey = process.env.API_KEY;
    if (!apiKey) {
        throw new Error("AI API Key Not Found. Please add your API_KEY as an environment variable in your Vercel deployment settings to connect to the AI service.");
    }
    return new GoogleGenAI({ apiKey });
};

// Helper to robustly parse numbers from various AI string formats (e.g., "$10,000", "1.2M")
const robustParseFloat = (value: any): number => {
    if (typeof value === 'number') return value;
    if (typeof value !== 'string') return 0;
    
    let numStr = value.trim().toUpperCase();
    let multiplier = 1;

    if (numStr.endsWith('K')) {
        multiplier = 1000;
        numStr = numStr.slice(0, -1);
    } else if (numStr.endsWith('M')) {
        multiplier = 1000000;
        numStr = numStr.slice(0, -1);
    }
    
    // Remove characters that are not digits, decimal point, or a negative sign
    const cleanedStr = numStr.replace(/[^0-9.-]+/g, '');
    const num = parseFloat(cleanedStr);

    return isNaN(num) ? 0 : num * multiplier;
};

// Validates and coerces a single token object to match the Token interface
const validateAndCoerceToken = (data: any): Token | null => {
    if (!data || typeof data.address !== 'string' || !data.address.startsWith('0x')) {
        console.warn("Skipping token due to missing or invalid address:", data);
        return null;
    }

    return {
        name: String(data.name || 'Unknown Name'),
        symbol: String(data.symbol || '???'),
        address: data.address,
        creationDate: String(data.creationDate || 'N/A'),
        liquidity: robustParseFloat(data.liquidity),
        volume24h: robustParseFloat(data.volume24h),
        marketCap: robustParseFloat(data.marketCap),
        holders: Math.round(robustParseFloat(data.holders)),
        isLiquidityLocked: Boolean(data.isLiquidityLocked),
        isOwnershipRenounced: Boolean(data.isOwnershipRenounced),
        gemScore: Math.round(robustParseFloat(data.gemScore)),
        analysis: {
            summary: String(data.analysis?.summary || 'No summary available.'),
            strengths: String(data.analysis?.strengths || 'N/A'),
            risks: String(data.analysis?.risks || 'N/A'),
            verdict: String(data.analysis?.verdict || 'Not Rated'),
        },
        websiteUrl: data.websiteUrl ? String(data.websiteUrl) : null,
        xUrl: data.xUrl ? String(data.xUrl) : null,
        coinMarketCapUrl: data.coinMarketCapUrl ? String(data.coinMarketCapUrl) : null,
        iconUrl: data.iconUrl ? String(data.iconUrl) : null,
        convictionScore: data.convictionScore ? Math.round(robustParseFloat(data.convictionScore)) : undefined,
    };
};

const parseAIResponse = (response: any): { tokens: Token[]; sources: GroundingChunk[] } => {
    // 1. Check for blocked content or empty candidates first
    if (!response || !response.candidates || response.candidates.length === 0) {
        const blockReason = response?.promptFeedback?.blockReason;
        if (blockReason) {
            throw new Error(`The request was blocked by the AI for safety reasons: ${blockReason}. Please modify your request.`);
        }
        // No candidates and no explicit block reason, means an empty valid response.
        return { tokens: [], sources: [] };
    }
    
    // 2. Safely access the text content
    let jsonText: string;
    try {
        // The .text accessor can throw if there's no text part (e.g. in a blocked response)
        jsonText = response.text;
        if (typeof jsonText !== 'string') {
            console.warn("AI response's text property was not a string.", response);
            jsonText = '';
        }
    } catch (e) {
        console.error("Could not access 'text' property from AI response.", e, response);
        throw new Error("Failed to read text from AI response. It might have been blocked or empty.");
    }

    jsonText = jsonText.trim();

    // Clean up potential markdown formatting from the response
    if (jsonText.startsWith("```json")) {
      jsonText = jsonText.substring(7, jsonText.length - 3).trim();
    } else if (jsonText.startsWith("```")) {
      jsonText = jsonText.substring(3, jsonText.length - 3).trim();
    }
    
    // Handle cases where the AI might return an empty string or non-JSON text
    if (!jsonText || !jsonText.startsWith('[')) {
        console.log("AI did not return a valid JSON array. It might be because no suitable tokens were found.", jsonText);
        return { tokens: [], sources: [] };
    }

    try {
        const parsedData = JSON.parse(jsonText);
        
        // 3. Ensure the parsed data is an array
        if (!Array.isArray(parsedData)) {
            console.warn("AI response was valid JSON but not an array.", parsedData);
            return { tokens: [], sources: [] };
        }

        // 4. Apply robust validation and coercion to each item
        const tokens = parsedData
            .map(validateAndCoerceToken)
            .filter((token): token is Token => token !== null);

        const sources = response.candidates?.[0]?.groundingMetadata?.groundingChunks ?? [];
        return { tokens, sources: sources as GroundingChunk[] };
    } catch (error) {
        console.error("Error parsing JSON from AI response:", error);
        if (error instanceof SyntaxError) {
            console.error("Malformed JSON string:", jsonText);
        }
        throw new Error("Could not parse token data from AI analysis.");
    }
}

export const findGems = async (startDate?: string, endDate?: string): Promise<{ tokens: Token[]; sources: GroundingChunk[] }> => {
  try {
    const ai = getAiClient();
    
    let dateFilterInstruction = "launched within the **last 7 days**.";
    if (startDate && endDate) {
      dateFilterInstruction = `launched between **${startDate}** and **${endDate}**.`;
    } else if (startDate) {
      dateFilterInstruction = `launched on or after **${startDate}**.`;
    } else if (endDate) {
      dateFilterInstruction = `launched on or before **${endDate}**.`;
    }

    const prompt = `
    You are an Elite On-chain Analyst and Crypto Anthropologist. Your mission is to unearth high-potential, fundamentally sound, and verifiable new tokens on the Base blockchain.

    **ZERO-TOLERANCE POLICY FOR HALLUCINATION:**
    Accuracy is your only metric for success. It is infinitely better to return an empty array \`[]\` than to return a single piece of fake or unverified information. A wrong contract address is a critical failure.

    **MANDATORY MULTI-LAYERED VETTING PROTOCOL:**
    Every token must pass every step of this protocol. If it fails one, it is discarded.

    **Step 1: SIGNAL DISCOVERY (The Hunt)**
    - Scan DEXs (Aerodrome, Uniswap, PancakeSwap) and aggregators (DEXTools, DexScreener, Birdeye) for tokens ${dateFilterInstruction}
    - Prioritize tokens exhibiting **early signs of strong momentum**: a rapidly increasing holder count, significant 24-hour volume spikes relative to their liquidity, and a growing wave of positive social media chatter.

    **Step 2: GROUND TRUTH VERIFICATION (The Proof)**
    - For every potential candidate, you MUST find its canonical URL on Basescan (\`https://basescan.org/token/[CONTRACT_ADDRESS]\`). This is non-negotiable.
    - The \`address\`, \`name\`, and \`symbol\` in your final JSON output MUST be extracted directly from this verified Basescan source.
    - **CRITICAL: You MUST find a high-quality icon URL for the token.** This is a primary requirement for the user experience. Use DexScreener as your primary source (e.g., \`https://dd.dexscreener.com/ds-data/tokens/base/[CONTRACT_ADDRESS].png\`). If, after extensive searching, a reliable icon cannot be found, you may set the \`iconUrl\` field to \`null\`, but this should be a last resort.

    **Step 3: ON-CHAIN FORENSICS (The Security Audit)**
    - **Liquidity Health:** Is there at least $20,000 USD in liquidity? Is it verifiably locked? Search for proof of lock-up on platforms like Unicrypt or Team.Finance.
    - **Contract Integrity:** Is contract ownership renounced? Use your search tools to check the contract address on honeypot detectors or security analysis platforms. Note any potential red flags like proxy functions or blacklist capabilities.
    - **Wallet Distribution:** Analyze the top holders on Basescan. Are there multiple, non-exchange wallets holding >5% of the supply? A high concentration of tokens in a few private wallets is a major risk and must be noted in the analysis.

    **Step 4: COMMUNITY & NARRATIVE ANALYSIS (The Vibe Check)**
    - **Social Footprint:** Go beyond just finding an X/Twitter account. Is there a real, growing community? Search for official Telegram or Discord channels and assess the activity level and sentiment.
    - **Sentiment Analysis:** Differentiate between organic hype and bot spam. Are real users asking intelligent questions, creating their own content, and having genuine discussions? This is a powerful bullish signal.
    - **Narrative Strength:** Does the project have a compelling story, a unique meme, or a clear utility? What makes it stand out from the hundreds of other new tokens? This MUST be a key part of your analysis.

    **Step 5: FINAL SYNTHESIS & OUTPUT**
    - Before outputting, perform one final check: Does the URL \`https://basescan.org/token/{{address}}\` lead to the correct token?
    - Your final response MUST be ONLY a valid JSON array of token objects. Do not include any other text.
    - If no tokens pass your rigorous protocol, return an empty array: \`[]\`.

    **JSON Object Structure Example:**
    \`\`\`json
    [
      {
        "name": "Verified Gem Token",
        "symbol": "VGT",
        "address": "0xRealAndVerifiedContractAddress...",
        "iconUrl": "https://dd.dexscreener.com/ds-data/tokens/base/0xrealandverified....png",
        "creationDate": "2024-07-28",
        "liquidity": 75000,
        "volume24h": 150000,
        "marketCap": 400000,
        "holders": 850,
        "isLiquidityLocked": true,
        "isOwnershipRenounced": true,
        "gemScore": 92,
        "websiteUrl": "https://realproject.com",
        "xUrl": "https://twitter.com/realproject",
        "coinMarketCapUrl": null,
        "analysis": {
          "summary": "A brief, factual summary of the project's utility or meme.",
          "strengths": "Strong on-chain health with locked liquidity and renounced ownership. Community on X and Telegram shows rapid organic growth and positive sentiment. Clear narrative that is easy to understand.",
          "risks": "Top 5 wallets hold 15% of supply, which poses a risk. Project is still very new and dependent on maintaining momentum.",
          "verdict": "Strong Buy"
        }
      }
    ]
    \`\`\`
    `;

    const response = await ai.models.generateContent({
      model: "gemini-2.5-flash",
      contents: prompt,
      config: {
        tools: [{ googleSearch: {} }],
      },
    });

    return parseAIResponse(response);

  } catch (error) {
    console.error("Error fetching gems from Gemini API:", error);
    if (error instanceof Error) {
        throw error;
    }
    throw new Error("Could not retrieve and parse token data from AI analysis.");
  }
};

export const findNewProjects = async (): Promise<{ tokens: Token[]; sources: GroundingChunk[] }> => {
  try {
    const ai = getAiClient();
    const prompt = `
    You are a meticulous On-chain Data Aggregator. Your task is to provide a clean, verified list of new, credible projects on the Base blockchain that meet a minimum threshold of legitimacy, intended for users to begin their own research.

    **PRIMARY DIRECTIVE: DATA ACCURACY & STRICT FILTERING.**
    Your goal is to be an objective filter, not a subjective analyst. All data must be verified. Projects that do not meet every single criterion below must be excluded.

    **MANDATORY FILTERING CRITERIA:**
    1.  **Launch Window:** The token contract must have been created within the **last 14 days**.
    2.  **Liquidity Threshold:** The token MUST have a minimum of **$25,000 USD** in liquidity.
    3.  **Holder Threshold:** The token MUST have a minimum of **150 unique wallet addresses** holding it.
    4.  **Web Presence:** The project MUST have BOTH:
        - A functional, professional-looking official website (\`websiteUrl\`). A single "coming soon" page is not sufficient.
        - An active, official X (Twitter) account (\`xUrl\`).

    **DATA INTEGRITY PROTOCOL:**
    - For every token that passes the filters, find its canonical Basescan URL (\`https://basescan.org/token/[CONTRACT_ADDRESS]\`). This is your source of truth for on-chain data.
    - Verify that all provided URLs (\`websiteUrl\`, \`xUrl\`) are active, lead to the correct project, and are not broken links. If a valid link cannot be found for any required field, the project must be discarded.
    - Extract all on-chain data points (\`liquidity\`, \`marketCap\`, \`holders\`, etc.) from reliable sources like DexScreener or the DEX itself, cross-referencing with Basescan.
    - Find a high-quality \`iconUrl\`. If one is not available, set it to \`null\`.

    **OUTPUT FORMAT:**
    - Your final response MUST be ONLY a valid JSON array of token objects.
    - If no tokens meet all the above criteria, return an empty array: \`[]\`.
    - The analysis section should be neutral and factual.

    **JSON Object Structure Example:**
    \`\`\`json
    [
      {
        "name": "New Credible Project",
        "symbol": "NCP",
        "address": "0xAnotherVerifiedContractAddress...",
        "iconUrl": "https://dd.dexscreener.com/ds-data/tokens/base/0xanothervierified....png",
        "creationDate": "2024-07-29",
        "liquidity": 35000,
        "volume24h": 50000,
        "marketCap": 150000,
        "holders": 210,
        "isLiquidityLocked": true,
        "isOwnershipRenounced": false,
        "gemScore": 0,
        "websiteUrl": "https://newcredibleproject.io",
        "xUrl": "https://twitter.com/newcredibleproject",
        "coinMarketCapUrl": null,
        "analysis": {
          "summary": "A factual summary of this new project's stated mission based on its official website and documentation.",
          "strengths": "N/A",
          "risks": "N/A",
          "verdict": "New Listing"
        }
      }
    ]
    \`\`\`
    `;

    const response = await ai.models.generateContent({
      model: "gemini-2.5-flash",
      contents: prompt,
      config: {
        tools: [{ googleSearch: {} }],
      },
    });

    return parseAIResponse(response);

  } catch (error) {
    console.error("Error fetching new projects from Gemini API:", error);
    if (error instanceof Error) {
        throw error;
    }
    throw new Error("Could not retrieve and parse new project data from AI analysis.");
  }
};

export const getAnalystPicks = async (): Promise<{ tokens: Token[]; sources: GroundingChunk[] }> => {
  try {
    const ai = getAiClient();
    const prompt = `
    You are an Elite Crypto Narrative Spotter and High-Risk Speculator. You are a "degen's degen," but with a sharp, intuitive eye for what separates a potential 100x memecoin from a worthless rug pull. Your task is to find a few of these subjective, high-risk "Analyst's Picks" on the Base blockchain.

    **PRIMARY DIRECTIVE: ART, NOT SCIENCE. NARRATIVE IS EVERYTHING.**
    Your goal is to identify tokens based on their story, meme potential, community vibe, and overall concept. On-chain metrics are secondary to your qualitative "gut feeling" about a project's potential to go viral.

    **WHERE TO HUNT FOR ALPHA:**
    - **Farcaster:** Scour channels like /base, /memecoins, and other alpha groups for nascent projects generating organic buzz. What are people genuinely laughing at or excited about?
    - **X (Twitter):** Follow known Base alpha hunters and look at what *they're* looking at. What new projects are getting subtle engagement from influential accounts?
    - **Dexscreener/DEXTools:** Look for brand new pairs with a flurry of activity, creative names/tickers, and unusually high social engagement (comments, reactions) for their age.

    **WHAT TO LOOK FOR (THE "IT" FACTOR):**
    - **A+ Narrative:** Is the meme clever, timely, and viral? Is the utility concept unique and exciting? Does it have a "story" that's easy to tell and share on social media?
    - **Effort & Aesthetics:** Does the website, art, and branding show high effort? In the memecoin world, aesthetics are a powerful signal of a dedicated team.
    - **Authentic Community Vibe:** This is your most important signal. Is there a small but passionate group of early believers? Are they creating their own memes and content? Look for genuine, funny engagement, not just "LFG" or bot spam. An active, humorous dev in a public chat is a huge plus.

    **ANALYSIS & OUTPUT MANDATE:**
    - **Verification is still mandatory:** You must find a real, working contract address on Basescan. Do not invent projects.
    - **Justify Your Conviction (\`analysis.strengths\`):** Be specific. Don't just say "good community." Say "The community on Farcaster is already creating high-quality memes, and the main dev is actively and humorously engaging with every reply, building a cult-like following."
    - **Brutal Honesty (\`analysis.risks\`):** Be explicit. "This is a pure degen play with a 99% chance of going to zero. Liquidity is unlocked, ownership is not renounced, and the project's survival depends entirely on social momentum and hype."
    - **\`convictionScore\`:** This is not a technical score. It's a measure of your personal gut feeling (1-100) in the narrative's power to overcome the obvious technical risks.
    - Your goal is to find 1-3 *exceptional* opportunities. It is better to return an empty array \`[]\` than to recommend a mediocre project.
    - Your final response MUST be ONLY a valid JSON array of token objects.

    **JSON Object Structure Example:**
    \`\`\`json
    [
      {
        "name": "Viral Meme Concept",
        "symbol": "VMC",
        "address": "0xSubjectiveButRealContractAddress...",
        "iconUrl": "https://dd.dexscreener.com/ds-data/tokens/base/0xsubjective....png",
        "creationDate": "2024-07-30",
        "liquidity": 5000,
        "volume24h": 25000,
        "marketCap": 20000,
        "holders": 65,
        "isLiquidityLocked": false,
        "isOwnershipRenounced": false,
        "gemScore": 0,
        "convictionScore": 88,
        "websiteUrl": "https://viralmeme.xyz",
        "xUrl": "https://twitter.com/viralmeme",
        "coinMarketCapUrl": null,
        "analysis": {
          "summary": "A memecoin based on the [explain the timely and clever concept].",
          "strengths": "The meme is highly relevant to current crypto culture and the art style is unique and instantly shareable. The dev is very active on X, building a strong, humorous brand personality. Early engagement is 100% organic.",
          "risks": "Pure gamble. Extremely new with almost no liquidity and an anonymous team. The contract has not been renounced. The token's value is based entirely on its ability to go viral.",
          "verdict": "High-Risk Narrative Play"
        }
      }
    ]
    \`\`\`
    `;

    const response = await ai.models.generateContent({
      model: "gemini-2.5-flash",
      contents: prompt,
      config: {
        tools: [{ googleSearch: {} }],
      },
    });

    return parseAIResponse(response);

  } catch (error) {
    console.error("Error fetching analyst picks from Gemini API:", error);
    if (error instanceof Error) {
        throw error;
    }
    throw new Error("Could not retrieve and parse analyst picks from AI analysis.");
  }
};