
export function redactCustomerText(value:string):string{return value.replace(/[A-Z0-9._%+-]+@[A-Z0-9.-]+\.[A-Z]{2,}/gi,"[email protetta]").replace(/(?:\+?39)?[ .-]?(?:\d[ .-]?){9,11}/g,"[telefono protetto]").replace(/\b[A-Z]{6}[0-9]{2}[A-Z][0-9]{2}[A-Z][0-9]{3}[A-Z]\b/gi,"[codice fiscale protetto]")}
export function customerSafeReasonCodes(codes:string[]):string[]{return codes.filter(code=>!/(EMAIL|PHONE|FISCAL|TAX_ID|BANK|IBAN|SECRET|TOKEN)/i.test(code)).slice(0,12)}
