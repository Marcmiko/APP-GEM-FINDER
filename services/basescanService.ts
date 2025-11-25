
// Service to scrape token prices directly from Basescan
// This is a fallback when APIs fail

export const getBasescanPrice = async (tokenAddress: string): Promise<number | null> => {
    try {
        // Fetch the token page HTML
        // Note: This relies on Basescan's HTML structure remaining constant
        // We use a proxy or direct fetch if CORS allows (likely won't work client-side without proxy)
        // But since we are in a web app, we might run into CORS.
        // However, the user asked for it. We can try using a CORS proxy if needed, 
        // or just try direct fetch and see if it works (sometimes simple GETs are allowed or we are in a specific env).

        // Actually, fetching HTML from client-side usually fails due to CORS.
        // But we can try to use a public CORS proxy if available, or just try.
        // For this environment, we'll try a direct fetch first.

        const response = await fetch(`https://basescan.org/token/${tokenAddress}`);

        if (!response.ok) return null;

        const html = await response.text();

        // Look for the price pattern
        // Pattern: <div id="ContentPlaceHolder1_tr_valuepertoken">... $0.0012 @ 0.000000 ETH ...</div>
        // Or class "d-block"> $0.0012 </span>

        // Regex to find price in the format "$ 1,234.56" or "$0.00123"
        // Basescan usually puts it in a specific element

        // Strategy 1: Look for "Value per Token" label and the price following it
        const priceMatch = html.match(/Value per Token[\s\S]*?\$([0-9,.]+)/);

        if (priceMatch && priceMatch[1]) {
            const priceStr = priceMatch[1].replace(/,/g, '');
            const price = parseFloat(priceStr);
            if (!isNaN(price) && price > 0) {
                return price;
            }
        }

        // Strategy 2: Look for specific price class or ID if Strategy 1 fails
        // <span class="d-block"> $2,916.97 <span class="text-muted">(@1.000000 ETH)</span></span>
        const priceMatch2 = html.match(/class="d-block">\s*\$([0-9,.]+)/);
        if (priceMatch2 && priceMatch2[1]) {
            const priceStr = priceMatch2[1].replace(/,/g, '');
            const price = parseFloat(priceStr);
            if (!isNaN(price) && price > 0) {
                return price;
            }
        }

        return null;
    } catch (error) {
        console.warn(`Basescan scrape failed for ${tokenAddress}:`, error);
        return null;
    }
};

export const getBasescanPrices = async (addresses: string[]): Promise<Record<string, number>> => {
    const prices: Record<string, number> = {};

    // Process sequentially to avoid rate limiting
    for (const addr of addresses) {
        const price = await getBasescanPrice(addr);
        if (price) {
            prices[addr.toLowerCase()] = price;
        }
        // Small delay to be nice
        await new Promise(resolve => setTimeout(resolve, 500));
    }

    return prices;
};
