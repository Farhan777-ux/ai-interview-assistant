export const normalizeTo10Digits = (raw?: string): string => {
  const digits = (raw || '').replace(/\D/g, '');
  return digits.slice(-10);
};

export const formatPhoneIndia = (raw?: string): string => {
  const digits10 = normalizeTo10Digits(raw);
  return digits10 ? `(+91) ${digits10}` : '(+91) —';
};
