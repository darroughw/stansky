// The display face is set in uppercase by CSS, which turns "ADUs" into "ADUS".
// Wrap the plural "s" so it keeps its lowercase. Returns escaped HTML for set:html.
const escape = (s: string) => s.replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;');

export const capsHtml = (text: string) => escape(text).replace(/\bADUs\b/g, 'ADU<span class="keep-case">s</span>');
