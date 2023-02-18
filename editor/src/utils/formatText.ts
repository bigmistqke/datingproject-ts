import { TextNormal, Text } from '../managers/types'

export default (text: string) => {
  let formatted_text: Text[] = [{ type: 'normal', content: text }]

  // regex
  const regex_for_brackets = /[\["](.*?)[\]"][.!?\\-]?/g
  let matches = String(text).match(regex_for_brackets)

  if (!matches) return formatted_text

  for (let i = matches.length - 1; i >= 0; i--) {
    let split = (formatted_text.shift() as TextNormal).content.split(
      `${matches[i]}`,
    )

    let multi_choice = matches[i].replace('[', '').replace(']', '')
    let choices = multi_choice.split('/')

    formatted_text = [
      { type: 'normal', content: split![0] },
      { type: 'choice', content: choices },
      { type: 'normal', content: split![1] },
      ...formatted_text,
    ]
  }
  return formatted_text
}
