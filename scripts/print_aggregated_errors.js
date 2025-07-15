import fs from 'fs';

const errorFiles = fs
    .readdirSync('.')
    .filter(f => f.startsWith('errors_Node_') && f.endsWith('.json'));

console.log('\n\n📊 Global Error Summary:\n');

for (const file of errorFiles) {
    const nodeName = file
        .replace('errors_', '')
        .replace('.json', '')
        .replace(/_/g, ' ');

    console.log(`🔧 ${nodeName}`);
    try {
        const raw = fs.readFileSync(file, 'utf8');
        const errors = JSON.parse(raw);

        if (Object.keys(errors).length === 0) {
            console.log('  ✅ No errors');
        } else {
            // Handle new structure with blockchain_id and aggregated/detailed sections
            if (errors.blockchain_id && errors.aggregated) {
                // New structure - use aggregated section (without KA numbers)
                Object.entries(errors.aggregated).forEach(([message, count]) => {
                    console.log(`  • ${count}x ${message}`);
                });
            } else if (errors.aggregated && errors.detailed) {
                // Old structure with aggregated/detailed sections
                Object.entries(errors.aggregated).forEach(([message, count]) => {
                    console.log(`  • ${count}x ${message}`);
                });
            } else {
                // Old structure - direct error object
                Object.entries(errors).forEach(([message, count]) => {
                    console.log(`  • ${count}x ${message}`);
                });
            }
        }
    } catch (err) {
        console.log(`  ⚠️ Failed to read or parse ${file}: ${err.message}`);
    }
    console.log('');
}