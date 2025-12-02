function findAvailableSkuSets(values, skuQtyNeeded, maxSets = 5) {
    // Convert to numbers and filter out non-numeric values
    const existingSkus = values
        .map(v => parseInt(v, 10))
        .filter(n => !isNaN(n));

    if (existingSkus.length === 0) {
        return [];
    }

    // Create a Set for O(1) lookup
    const skuSet = new Set(existingSkus);
    
    const minSku = Math.min(...existingSkus);
    const maxSku = Math.max(...existingSkus);

    const validSets = [];

    // Allow searching beyond maxSku to complete sequences
    // Calculate how far we might need to go: (skuQtyNeeded - 1) * 2 additional space
    const searchLimit = maxSku + ((skuQtyNeeded - 1) * 2);

    // Check both odd and even starting points
    for (let start = minSku; start <= searchLimit; start++) {
        // Generate a sequence with gaps of 1
        const sequence = [];
        let current = start;
        
        for (let i = 0; i < skuQtyNeeded; i++) {
            // Check if this SKU is available
            if (!skuSet.has(current)) {
                sequence.push(current);
                current += 2; // Skip one number
            } else {
                // This sequence won't work, break early
                break;
            }
        }

        // If we got the full sequence, it's valid
        if (sequence.length === skuQtyNeeded) {
            validSets.push(sequence);
            
            if (validSets.length >= maxSets) {
                return validSets;
            }
        }
    }

    return validSets;
}

// Example usage with your data

const values = ["404", "406", "408", "422", "426", "412", "416", "410", "400", "402", "434", "430", "432", "418", "436", "431", "438", "435", "437", "439"];
const skuQtyNeeded = 4;
const result = findAvailableSkuSets(values, skuQtyNeeded, 20);

console.log(`Found ${result.length} valid sets:\n`);
result.forEach((set, i) => {
    console.log(`Set ${i + 1}: ${set.join(', ')}`);
});

// Show some analysis
if (result.length > 0) {
    const firstSet = result[0];
    console.log(`\nFirst set analysis:`);
    console.log(`  Range: ${firstSet[0]} to ${firstSet[firstSet.length - 1]}`);
    console.log(`  Total span: ${firstSet[firstSet.length - 1] - firstSet[0] + 1} numbers`);
}