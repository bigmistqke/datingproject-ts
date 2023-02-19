function decodeSingleQuotes(text: string) {
  return text.replace(/&#039;/g, "'");
}
export default decodeSingleQuotes;
