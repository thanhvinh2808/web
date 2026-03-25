import { VNPay, HashAlgorithm } from 'vnpay';

let instance = null;
let initialized = false;

export function getVnpay() {
  if (initialized) return instance;
  initialized = true;

  const tmnCode = process.env.VNPAY_TMN_CODE;
  const secureSecret = process.env.VNPAY_SECURE_SECRET;

  if (!tmnCode || !secureSecret) {
    console.warn('⚠️ VNPay NOT configured. Missing VNPAY_TMN_CODE or VNPAY_SECURE_SECRET.');
    return null;
  }

  instance = new VNPay({
    tmnCode,
    secureSecret,
    vnpayHost: 'https://sandbox.vnpayment.vn',
    testMode: true,
    hashAlgorithm: HashAlgorithm.SHA512,
  });

  console.log('✅ VNPay configured (sandbox mode)');
  return instance;
}
