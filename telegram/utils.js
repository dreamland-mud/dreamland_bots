const cleanMessage = text => {
  return text
    .replace(/<[^>]+>/g, '')
    .replace(/\[\/?(color|b|i|u|size)=?.*?\]/g, '')
    .replace(/(\r\n|\n|\r)/gm, '');
};

const wrapInCodeBlock = text => {
  return `\`\`\`\n${text}\n\`\`\``;
};

const escapeMarkdown = text => {
  return text.replace(/([_*[\]()~`>#+\-=|{}.!])/g, '\\$1');
};

module.exports = {
  cleanMessage,
  wrapInCodeBlock,
  escapeMarkdown,
};
