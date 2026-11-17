/**
 * In mock mode no email is sent. Instead, the message is printed to the
 * terminal running the Next.js dev server so you can read it (and click any
 * verification / password reset links in it).
 */
const htmlToText = (html = '') =>
  html
    .replace(/<br\s*\/?>/gi, '\n')
    .replace(/<\/(p|li|ul|h\d)>/gi, '\n')
    .replace(/<li>/gi, '  - ')
    .replace(/<[^>]+>/g, '')
    .replace(/&nbsp;/g, ' ')
    .split('\n')
    .map((line) => line.trim())
    .filter(Boolean)
    .join('\n');

export const logMockEmail = ({ from, to, subject, html, text }) => {
  const divider = '─'.repeat(72);
  const body = text || htmlToText(html);
  console.log(
    [
      '',
      divider,
      '[mock email] Not sent. Mock mode is on.',
      from ? `From:    ${from}` : null,
      `To:      ${to}`,
      `Subject: ${subject}`,
      divider,
      body,
      divider,
      '',
    ]
      .filter((line) => line !== null)
      .join('\n')
  );
};
