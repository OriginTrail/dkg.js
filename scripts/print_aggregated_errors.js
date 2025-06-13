import fs from 'fs';

const errorFiles = fs.readdirSync('.').filter(f => f.startsWith('errors_Node_') && f.endsWith('.json'));

console.log('\n\n📊 Global Error Summary:\n');

for (const file of errorFiles) {
    const nodeName = file.replace('errors_', '').replace('.json', '').replace('_', ' ');
    console.log(`🔧 ${nodeName}`);
    try {
        const raw = fs.readFileSync(file, 'utf8');
        const errors = JSON.parse(raw);
        Object.entries(errors).forEach(([message, count]) => {
            console.log(`  • ${count}x ${message}`);
        });
    } catch (err) {
        console.log(`  ⚠️ Failed to read or parse ${file}: ${err.message}`);
    }
    console.log('');
}