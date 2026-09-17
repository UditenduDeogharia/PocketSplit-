# PocketSplit

A professional client-side UPI split-payment QR and receipt generator.

## Run
1. Open `index.html` in a modern browser.
2. Enter the UPI ID, account holder name, total amount, split amount, and optional note.
3. Generate QR codes.
4. Download individual QR codes or print the receipt/QR sheet.

## Example
Total: ₹6000
Split: ₹1999

Generated amounts:
₹1999 + ₹1999 + ₹1999 + ₹3

## Notes
- The QR uses the standard `upi://pay` payment URI with UPI ID, name, amount, INR currency, and optional note.
- QR generation uses QRCode.js from cdnjs, so an internet connection is needed when opening the page unless you later bundle the library locally.
- This app does not verify payment receipt. It only generates payment instructions.
