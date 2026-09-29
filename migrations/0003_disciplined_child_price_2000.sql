-- Set the live parenting guide to ₦2,000 (200,000 kobo).
-- This is applied once by the deploy-time migration runner.
UPDATE products
SET price_kobo = 200000,
    updated_at = now()
WHERE id = 'prod_disciplined_child'
  AND currency = 'NGN';
