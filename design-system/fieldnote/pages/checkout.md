# Checkout page override

Use this page's rules together with `../MASTER.md`.

- Keep the guide title, actual cover, final price, and any voucher discount visible before the customer submits.
- Collect only the details required for the currently available payment methods. Use native name/email validation and associate labels with fields.
- Render only methods that the server reports configured. The demo flow is local development only and must be blocked server-side in production, even if a client calls the action directly.
- If no method is configured, do not render a customer-details form or create an order. Say checkout is temporarily unavailable and link to Fieldnote support.
- For bank transfer, state that the PDF unlocks only after the publisher confirms payment. Do not imply the transfer is instant.
- On submission, announce what is happening, disable every payment button to prevent duplicate orders, and restore controls with a useful recovery message if the request fails.
- Keep order totals and voucher updates readable to keyboard and screen-reader users. Use a live status for asynchronous voucher and payment feedback.
