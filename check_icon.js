
import fs from 'fs';
import path from 'path';

const filePath = 'src/assets/logo.png';

try {
    const buffer = fs.readFileSync(filePath);
    console.log('File size:', buffer.length);
    console.log('First 8 bytes:', buffer.subarray(0, 8).toString('hex'));

    const pngSignature = '89504e470d0a1a0a';
    if (buffer.subarray(0, 8).toString('hex') === pngSignature) {
        console.log('Valid PNG signature.');
    } else {
        console.log('Invalid PNG signature.');
        // Check for JPG
        if (buffer.subarray(0, 3).toString('hex') === 'ffd8ff') {
            console.log('Detected JPG signature.');
        } else {
            console.log('Unknown format.');
        }
    }
} catch (e) {
    console.error('Error reading file:', e);
}
