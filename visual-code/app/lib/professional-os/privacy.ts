const EMAIL =
  /[A-Z0-9._%+-]+@[A-Z0-9.-]+\.[A-Z]{2,}/gi;
const PHONE =
  /(?:\+?\d{1,3}[\s.-]?)?(?:\(?\d{2,4}\)?[\s.-]?)?\d{3,4}[\s.-]?\d{3,4}/g;
const LINK = /(?:https?:\/\/|www\.)\S+/gi;
const EXTERNAL_CHAT =
  /\b(?:whatsapp|wa\.me|telegram|signal|messenger)\b/gi;

export function protectContactData(text: string) {
  let redacted = false;
  const replacement = () => {
    redacted = true;
    return "[recapito protetto]";
  };

  return {
    body: text
      .replace(EMAIL, replacement)
      .replace(PHONE, replacement)
      .replace(LINK, replacement)
      .replace(EXTERNAL_CHAT, replacement),
    redacted,
  };
}
