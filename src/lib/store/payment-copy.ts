type PaymentAvailability = {
  paystackConfigured: boolean;
  bankConfigured: boolean;
};

export function paymentStepCopy(payments: PaymentAvailability): string {
  if (payments.paystackConfigured && payments.bankConfigured) {
    return "Choose Paystack or bank transfer; bank orders unlock after the publisher confirms payment.";
  }
  if (payments.paystackConfigured) {
    return "Pay online with Paystack; your PDF unlocks after payment is verified.";
  }
  if (payments.bankConfigured) {
    return "Pay by bank transfer; your PDF unlocks after the publisher confirms payment.";
  }
  return "Payment setup is in progress. Contact Fieldnote before placing an order.";
}

export function contextualPaymentFaqAnswer(
  question: string,
  existingAnswer: string,
  payments: PaymentAvailability,
): string {
  const normalized = question.trim().toLowerCase();
  if (normalized === "how do i pay?") {
    if (payments.paystackConfigured && payments.bankConfigured) {
      return "Choose Paystack or bank transfer at checkout. Bank-transfer orders unlock after the publisher confirms payment.";
    }
    if (payments.paystackConfigured) {
      return "Pay online with Paystack at checkout. Your download opens after payment is verified.";
    }
    if (payments.bankConfigured) {
      return "Choose bank transfer at checkout. Your download opens after the publisher confirms payment.";
    }
    return "Payment is temporarily unavailable. Please contact Fieldnote before attempting to place an order.";
  }
  if (normalized === "can i pay by bank transfer?" && !payments.bankConfigured) {
    return "Bank transfer is currently unavailable. Any available payment methods will be shown at checkout.";
  }
  return existingAnswer;
}
