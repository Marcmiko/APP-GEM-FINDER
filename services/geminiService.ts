import { GoogleGenAI } from "@google/genai";
import { Token, GroundingChunk } from '../types';

const getAiClient = () => {
    // Robustly try to get the API key from standard process.env or Vite's import.meta.env
    // Vercel/Vite requires variables to start with VITE_ to be exposed to the client bundle.
    const apiKey = process.env.API_KEY || (import.meta as any).env?.VITE_API_KEY || (import.meta as any).env?.API_KEY;
    
    if (!apiKey) {
        throw new Error("AI API Key Not Found.\n\nTROUBLESHOOTING:\n1. In Vercel Settings > Environment Variables, ensure you have added your key.\n2. Rename the variable to 'VITE_API_KEY' (Vite requires this prefix).\n3. CRITICAL: Go to Deployments and click 'Redeploy' for the changes to take effect.");
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
    You are an Elite On-chain Analyst and Crypto Anthropologist specializing in the Base blockchain. Your mission is to unearth high-potential, fundamentally sound, and verifiable **NEW** tokens.

    **ZERO-TOLERANCE POLICY FOR HALLUCINATION:**
    Accuracy is your only metric for success. It is infinitely better to return an empty array \`[]\` than to return a single piece of fake or unverified information. A wrong contract address is a critical failure.

    **MANDATORY MULTI-LAYERED VETTING PROTOCOL:**
    Every token must pass every step of this protocol. If it fails one, it is discarded.

    **Step 1: SIGNAL DISCOVERY (The Hunt for Newness)**
    - Focus your search on **newly listed pairs** on Base ${dateFilterInstruction}
    - Use Google Search to simulate scanning "New Pairs" sections of DexScreener and DEXTools.
    - Search queries to simulate: "Newest Base tokens DexScreener", "Top trending new Base tokens last 24 hours", "Base blockchain new listings Aerodrome".
    - Prioritize tokens exhibiting **early signs of strong momentum**: a rapidly increasing holder count, significant 24-hour volume spikes relative to their liquidity, and a growing wave of positive social media chatter on X (Twitter) and Farcaster.

    **Step 2: GROUND TRUTH VERIFICATION (The Proof)**
    - For every potential candidate, you MUST find its canonical URL on Basescan (\`https://basescan.org/token/[CONTRACT_ADDRESS]\`). This is non-negotiable.
    - The \`address\`, \`name\`, and \`symbol\` in your final JSON output MUST be extracted directly from this verified Basescan source.
    - **CRITICAL: You MUST find a high-quality icon URL for the token.** This is a primary requirement for the user experience. Use DexScreener as your primary source (e.g., \`https://dd.dexscreener.com/ds-data/tokens/base/[CONTRACT_ADDRESS].png\`). If, after extensive searching, a reliable icon cannot be found, you may set the \`iconUrl\` field to \`null\`.

    **Step 3: ON-CHAIN FORENSICS (The Security Audit)**
    - **Liquidity Health:** Is there at least $20,000 USD in liquidity? Is it verifiably locked? Search for proof of lock-up on platforms like Unicrypt or Team.Finance.
    - **Contract Integrity:** Is contract ownership renounced? Use your search tools to check the contract address on honeypot detectors or security analysis platforms.
    - **Wallet Distribution:** Analyze the top holders. Are there multiple, non-exchange wallets holding >5% of the supply?

    **Step 4: COMMUNITY & NARRATIVE ANALYSIS (The Vibe Check)**
    - **Social Footprint:** Go beyond just finding an X/Twitter account. Is there a real, growing community?
    - **Narrative Strength:** Does the project have a compelling story, a unique meme, or a clear utility? What makes it stand out from the hundreds of other new tokens?

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
          "strengths": "Strong on-chain health with locked liquidity. Community on X shows rapid organic growth. Clear narrative.",
          "risks": "Top 5 wallets hold 15% of supply. Project is still very new.",
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
    You are a meticulous On-chain Data Aggregator specializing in "New Pairs" on the Base blockchain. Your task is to provide a clean, verified list of **FRESHLY LISTED** tokens.

    **PRIMARY DIRECTIVE: MAXIMIZE DISCOVERY & VERIFY EXISTENCE.**
    The user is reporting that no projects are being found, which is statistically impossible on an active chain like Base.
    **You MUST dig deeper and relax strict financial thresholds to find *new* projects.**

    **ADJUSTED FILTERING CRITERIA (RELAXED):**
    1.  **Freshness:** Launched within the last **0 to 7 days**. Focus on "Just Listed" or "New Pairs".
    2.  **Liquidity Threshold:** Minimum **$4,000 USD**. (Lowered to capture very early stage projects).
    3.  **Holder Threshold:** Minimum **30 unique wallet addresses**. (Lowered).
    4.  **Verification:** The contract address MUST be real and verified on Basescan. This is the only non-negotiable.
    5.  **Socials:** Highly preferred, but if a token has >$5,000 volume and no website, it can still be listed as a "Degen Play" / "New Listing".

    **SEARCH STRATEGY:**
    - Use Google Search to find "New Pairs" lists on DexScreener Base and DEXTools Base.
    - Search for "Base blockchain new listings last 24 hours", "Top trending new Base tokens today".
    - Look for tokens that have actual trading volume.

    **DATA INTEGRITY PROTOCOL:**
    - Find the canonical Basescan URL (\`https://basescan.org/token/[CONTRACT_ADDRESS]\`).
    - **MANDATORY:** Find a high-quality \`iconUrl\`. Use DexScreener logic: \`https://dd.dexscreener.com/ds-data/tokens/base/[CONTRACT_ADDRESS].png\`.

    **OUTPUT FORMAT:**
    - Your final response MUST be ONLY a valid JSON array of token objects.
    - Return \`[]\` ONLY if there are absolutely no tokens found after a broad search.

    **JSON Object Structure Example:**
    \`\`\`json
    [
      {
        "name": "New Credible Project",
        "symbol": "NCP",
        "address": "0xAnotherVerifiedContractAddress...",
        "iconUrl": "https://dd.dexscreener.com/ds-data/tokens/base/0xanothervierified....png",
        "creationDate": "2024-07-29",
        "liquidity": 5000,
        "volume24h": 12000,
        "marketCap": 50000,
        "holders": 45,
        "isLiquidityLocked": false,
        "isOwnershipRenounced": false,
        "gemScore": 0,
        "websiteUrl": "https://newcredibleproject.io",
        "xUrl": "https://twitter.com/newcredibleproject",
        "coinMarketCapUrl": null,
        "analysis": {
          "summary": "A factual summary of this new project.",
          "strengths": "Fresh listing, active volume.",
          "risks": "Low liquidity, very new.",
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
    You are an Elite Crypto Narrative Spotter and High-Risk Speculator for the Base blockchain. You are a "degen's degen," searching for the next viral runner.

    **PRIMARY DIRECTIVE: ART, NOT SCIENCE. NARRATIVE IS EVERYTHING.**
    Your goal is to identify tokens based on their story, meme potential, community vibe, and overall concept. 
    
    **SEARCH STRATEGY (THE ALPHA HUNT):**
    - Search for "trending memes on Base", "Base God narratives", "Brett derivatives", or unique new art projects.
    - Scour search results for "Farcaster Base gems" or "Twitter Base alpha callers".
    - Look for projects that are **new** (under 30 days old) but have explosive social engagement.

    **WHAT TO LOOK FOR (THE "IT" FACTOR):**
    - **A+ Narrative:** Is the meme clever, timely, and viral? 
    - **Effort & Aesthetics:** Does the website and branding show high effort?
    - **Authentic Community Vibe:** Is there a passionate group of early believers?

    **ANALYSIS & OUTPUT MANDATE:**
    - **Verification is mandatory:** You must find a real, working contract address on Basescan.
    - **MANDATORY:** Find a high-quality \`iconUrl\`. Use DexScreener logic.
    - **Justify Your Conviction:** Be specific about why this meme works.
    - **Brutal Honesty:** Explicitly state the risks.
    - Your goal is to find 1-3 *exceptional* opportunities.
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
          "strengths": "The meme is highly relevant to current crypto culture. Early engagement is 100% organic.",
          "risks": "Pure gamble. Extremely new with almost no liquidity.",
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