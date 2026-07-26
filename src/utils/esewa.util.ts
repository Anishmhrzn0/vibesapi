import crypto from "crypto";

const SECRET_KEY = process.env.ESEWA_SECRET_KEY!;

export function generateEsewaSignature(totalAmount: number | string, transactionUuid: string, productCode: string) {
  const message = `total_amount=${totalAmount},transaction_uuid=${transactionUuid},product_code=${productCode}`;
  return crypto.createHmac("sha256", SECRET_KEY).update(message).digest("base64");
}

export function verifyEsewaSignature(totalAmount: number | string, transactionUuid: string, productCode: string, signature: string) {
  const expected = generateEsewaSignature(totalAmount, transactionUuid, productCode);
  return expected === signature;
}