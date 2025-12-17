
import { getMultiSourcePrice } from '../services/multiPriceService';

// BRETT on Base
const TEST_TOKEN = '0x532f27101965dd16442e59d40670faf5ebb142e4';

async function test() {
    console.log(`Fetching price for ${TEST_TOKEN}...`);
    try {
        const price = await getMultiSourcePrice(TEST_TOKEN);
        console.log('Price:', price);
    } catch (error) {
        console.error('Error:', error);
    }
}

test();
