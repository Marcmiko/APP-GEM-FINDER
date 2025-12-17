import type { VercelRequest, VercelResponse } from '@vercel/node';

// Simple Frame handler for Farcaster
export default async function handler(
    req: VercelRequest,
    res: VercelResponse
) {
    if (req.method === 'POST') {
        // Handle button clicks
        const { untrustedData } = req.body;
        const buttonIndex = untrustedData?.buttonIndex || 1;

        if (buttonIndex === 1) {
            // "Find Gems" button - redirect to main app
            return res.status(302).setHeader('Location', 'https://base-gem-finder.vercel.app').send('');
        }

        if (buttonIndex === 2) {
            // "Learn More" button
            return res.status(200).send(getFrameHtml(
                'GemFinder uses AI to analyze Base blockchain tokens and identify potential 100x gems. Connect your wallet to start!',
                'https://base-gem-finder.vercel.app/frames/info.png',
                [
                    { label: '🚀 Start Now', action: 'post' },
                    { label: '🏠 Home', action: 'post' }
                ]
            ));
        }
    }

    // GET request - show initial frame
    return res.status(200).send(getFrameHtml(
        'Discover the Next 100x Gem on Base',
        'https://base-gem-finder.vercel.app/frames/hero.png',
        [
            { label: '🔍 Find Gems', action: 'post' },
            { label: 'ℹ️ Learn More', action: 'post' }
        ]
    ));
}

function getFrameHtml(
    title: string,
    imageUrl: string,
    buttons: Array<{ label: string; action: string }>
): string {
    const buttonTags = buttons
        .map((btn, i) => `<meta property="fc:frame:button:${i + 1}" content="${btn.label}" />
    <meta property="fc:frame:button:${i + 1}:action" content="${btn.action}" />`)
        .join('\n    ');

    return `
<!DOCTYPE html>
<html>
  <head>
    <meta property="fc:frame" content="vNext" />
    <meta property="fc:frame:image" content="${imageUrl}" />
    <meta property="fc:frame:image:aspect_ratio" content="1.91:1" />
    <meta property="fc:frame:post_url" content="https://base-gem-finder.vercel.app/api/frame" />
    ${buttonTags}
    <meta property="og:title" content="${title}" />
    <meta property="og:image" content="${imageUrl}" />
    <title>${title}</title>
  </head>
  <body>
    <h1>${title}</h1>
    <p>View this in a Farcaster client to interact with the frame.</p>
  </body>
</html>
  `.trim();
}
