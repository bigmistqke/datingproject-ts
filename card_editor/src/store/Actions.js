import isColor from '../helpers/isColor'
import urls from '../urls'
import uniqid from 'uniqid'

import { array_move, array_remove } from '../helpers/Pure'

export default function ({ state, setState, default_types }) {
  const check = bool => !(!bool && bool !== 0)

  // DEFAULTS

  const getDefaultTextState = () => ({
    position: {
      x: 10,
      y: 12,
    },
    dimensions: {
      width: 80,
      height: 80,
    },
    styles: {
      family: 'times',
      size: 10,
      lineHeight: 12,
      spacing: 0,
      color: 0,
      alignmentHorizontal: 'flex-start',
      alignmentVertical: 'flex-start',
      shadowLeft: 0,
      shadowTop: 0,
      shadowBox: 0,
    },
  })

  const getDefaultModes = () => ({
    choice: 1,
    timed: 1,
  })

  const lorem_ipsum = {
    normal: [
      'A week ago, when I returned home from doing my weekly groceries, I passed a theatre, ...',
      'For a minute, I lost myself.',
      'but as a traveler, or rather a philosopher.” Well, long story short: I had a chat with this man, ',
      'I know. This heatwave has me sweating like a pig in a butchers shop.',
    ],
    choice: [
      'That boat is taking [cocaine / vaccines / refugees / Coca cola] to [Antwerp / Rotterdam / the UK / Calais]',
      'I [ would / would not ] want to live there, because [ ... ]',
      'I think that [death / paradise / hope / suffering / redemption] is waiting for us over there.',
      'And that one is taking [4x4 cars / ayuhuasca / underpaid workers / cows and pigs] to Dubai.',
    ],
  }

  // GENERAL PURPOSE FUNCTIONS

  const getStateFromArgs = args =>
    new Promise(resolve => {
      const iterate = (nested_state, args) => {
        const arg = args.shift()
        if (args.length === 0) {
          resolve(nested_state[arg])
        } else iterate(nested_state[arg], args)
      }
      iterate(state, [...args])
    })

  // HISTORY / CTRL-Z

  let state_history = []

  const archiveStateChanges = state_changes => {
    state_history.push(state_changes)
    if (state_history.length > 1000) {
      state_history.shift()
    }
  }

  this.revertStateChange = () => {
    if (state_history.length === 0) return
    let last_state_changes = state_history.pop()
    last_state_changes.forEach(async state_change => {
      if (state_change.old_value === undefined) {
        let last_arg = state_change.args.pop()
        let parent_is_array = typeof last_arg === 'number'
        let parent_state = await getStateFromArgs(state_change.args)
        if (parent_is_array) setState(...state_change.args, array_remove(parent_state, last_arg))
        else setState(...state_change.args, last_arg, undefined)
      } else {
        setState(...state_change.args, state_change.old_value)
      }
    })
  }

  // SAVE AND PROCESS STATE

  const deswatchStyles = ({ styles, swatches, masked }) => {
    return Object.fromEntries(
      Object.entries(styles).map(([key, value]) => {
        let styles_with_color = ['color', 'background', 'border-color']
        if (styles_with_color.includes(key) && !isColor(value)) {
          value = swatches[value][masked ? 'timed' : 'normal']
        }
        return [key, value]
      }),
    )
  }

  const inlineStylesSvg = ({ svg, styles, swatches, masked }) => {
    try {
      Object.entries(styles).forEach(([name, style]) => {
        let string = ''

        Object.entries(style).forEach(([key, value]) => {
          if (key === 'fill' || key === 'stroke') {
            if (value === 'none') {
              string += `${key}:transparent; `
            } else {
              const color = isColor(value) ? value : swatches[value][masked ? 'timed' : 'normal']
              if (!color) {
                throw `color is undefined for key: ${key} with value ${value} and swatches ${swatches} `
              }
              string += `${key}:${color}; `
            }
          } else {
            string += `${key}:${value}; `
          }
        })
        svg = svg.replaceAll(`class="${name}"`, `style="${string}"`)
        svg = svg.replace(/<style[[\s\S]*style>/g, '')
      })
      return svg
    } catch (err) {
      console.error(err)
    }
  }

  const processDesign = () => {
    const card_size = this.getCardSize()
    let processed_deck = JSON.parse(JSON.stringify(state.design))
    processed_deck.types = Object.fromEntries(
      Object.entries(processed_deck.types).map(([type_name, type]) => {
        const swatches = type.swatches
        type = type.elements.map(element => {
          if (element.type === 'svg') {
            // inline styles into svg
            element.svg = {
              masked: inlineStylesSvg({
                svg: element.svg,
                styles: this.getStyles({ element, type, swatches }),
                type,
                swatches,
                masked: true,
              }),
              normal: inlineStylesSvg({
                svg: element.svg,
                styles: this.getStyles({ element, type, swatches }),
                type,
                swatches,
                masked: false,
              }),
            }
            delete element.styles
          } else {
            element.styles = {
              masked: deswatchStyles({
                styles: this.getStyles({ element, type }),
                swatches,
                masked: true,
              }),
              normal: deswatchStyles({
                styles: this.getStyles({ element, type }),
                swatches,
                masked: false,
              }),
            }
            if (element.type === 'instruction') {
              element.highlight_styles = {
                masked: deswatchStyles({
                  styles: this.getStyles({ element, type, highlight: true }),
                  swatches,
                  masked: true,
                }),
                normal: deswatchStyles({
                  styles: this.getStyles({ element, type, highlight: true }),
                  swatches,
                  masked: false,
                }),
              }
            }
          }

          if (element.global) {
            element.modes = { ...state.design.globals[element.id].modes }
            element.position = { ...state.design.globals[element.id].position }
            element.dimensions = { ...state.design.globals[element.id].dimensions }
          }

          delete element.global
          delete element.locked
          delete element.content

          return element
        })
        return [type_name, type]
      }),
    )
    delete processed_deck.globals
    delete processed_deck.elements
    return processed_deck
  }

  this.saveDesign = async () => {
    try {
      if (!state.design_id) throw 'design_id is not defined in state'

      let result = await fetch(`${urls.fetch}/api/design/save/${state.design_id}`, {
        method: 'POST',
        mode: 'cors',
        cache: 'no-cache',
        credentials: 'same-origin',
        headers: {
          'Content-Type': 'application/json',
        },
        redirect: 'follow',
        referrerPolicy: 'no-referrer',
        body: JSON.stringify({
          development: state.design,
          production: processDesign(),
        }),
      })
      // result = await result.json();
      if (result.status !== 200) {
        throw result.statusText
      }
      return true
    } catch (err) {
      console.error('error while saving deck', err)
      return false
    }
  }

  // state getters and setters

  this.setDesignId = design_id => setState('design_id', design_id)

  //    viewport

  this.toggleMaskedStyling = e => {
    e.stopPropagation()
    setState('viewport', 'masked_styling', bool => !bool)
  }

  /* this.setCardId = (percentage) => {
    setState("viewport", "timer_percentage", percentage);
  }; */
  this.setTimerPercentage = percentage => setState('viewport', 'timer_percentage', percentage)

  this.getTimerPercentage = () => state.viewport.timer_percentage

  this.getTimer = () => parseInt(30 - (state.viewport.timer_percentage * 30) / 100)

  this.openTypeManager = () => setState('viewport', 'type_manager', true)

  this.closeTypeManager = () => setState('viewport', 'type_manager', false)

  this.addNewType = () => setState('viewport', 'type_manager', false)

  this.toggleModeViewport = type => {
    setState('viewport', 'modes', type, bool => !bool)
    if (type === 'choice') this.changeInstructionText()
  }

  //   design

  //   design: general

  this.getCardSize = () => state.viewport.card_size

  const convert = (value, horizontal = false) => {
    return !horizontal
      ? (parseFloat(value) * this.getCardSize().height) / 400
      : parseFloat(value) * this.getCardSize().width
  }

  this.updateCardSize = () => setState('viewport', 'card_size', calculateCardSize())

  const calculateCardSize = () => ({
    height: window.innerHeight * 0.9,
    width:
      (window.innerHeight * 0.9 * state.design.card_dimensions.width) /
      state.design.card_dimensions.height,
  })

  this.setCardDimension = (dimension, value) => {
    archiveStateChanges([setStateArchive('design', 'card_dimensions', dimension, value)])
  }

  this.setBackground = background => setState('design', 'background', background)

  this.addElementToGlobals = (id, element) => setState('design', 'globals', id, element)

  //  design: type

  this.setType = type => setState('viewport', 'type', type)

  this.isTypeSelected = type => {
    return state.viewport.type === type
  }

  this.getType = type => state.design.types[type]

  this.getSelectedType = () => {
    let selected_type = this.getType(state.viewport.type)
    if (!selected_type) return undefined
    return selected_type
  }

  const getSelectedTypeAsArgs = () => ['design', 'types', state.viewport.type]

  //  design: type: swatches

  this.getSelectedSwatches = (timed = false) => {
    let selected_type = this.getSelectedType()
    if (!selected_type) return []

    return selected_type.swatches.map(s => (timed ? s.timed : s.normal))
  }

  this.setSwatch = (index, color) =>
    setStateArchive(
      'design',
      'types',
      state.viewport.type,
      'swatches',
      index,
      !state.viewport.masked_styling ? 'normal' : 'timed',
      color,
    )

  this.addSwatch = (index, color) => {
    setState(
      'design',
      'types',
      state.viewport.type,
      'swatches',
      this.getType(state.viewport.type).swatches.length,
      {
        normal: '#000000',
        timed: '#ffffff',
      },
    )
  }

  //      design: type: elements

  this.setSelectedElementIndex = index => {
    setState('viewport', 'selected_element_index', index)
  }

  //

  this.getLocalElement = ({ index, id, type }) => {
    if (!type) {
      type = this.getSelectedType()
    } else {
      type = this.getType(type)
    }
    if (!type) return false
    if (id) {
      return type.elements.find(e => e.id === id)
    } else {
      return type.elements[index]
    }
  }

  const getLocalElementAsArgs = ({ index, id }) => {
    if (id) index = this.getSelectedType().elements.findIndex(e => e.id === id)
    if (check(index)) return [...getSelectedTypeAsArgs(), 'elements', index]
    return []
  }

  const getGlobalElement = id => state.design.globals[id]
  const getGlobalElementAsArgs = id => ['design', 'globals', id]

  this.getLocalElements = from_where => {
    let selected_type = this.getSelectedType()
    if (!selected_type) return []
    return selected_type.elements
  }

  this.getSelectedElement = () => {
    if (!check(state.viewport.selected_element_index)) return false
    let selected_type = this.getSelectedType()
    if (!selected_type) return false
    return selected_type.elements[state.viewport.selected_element_index]
  }

  this.isSelectedElementOfType = type => {
    return (
      this.getSelectedElement() &&
      this.getSelectedElement().type &&
      this.getSelectedElement().type.indexOf(type) != -1
    )
  }

  this.isElementVisible = element => {
    let modes
    if (element.global) {
      modes = state.design.globals[element.id].modes
    } else {
      modes = element.modes
    }
    for (let [mode_type, activated] of Object.entries(state.viewport.modes)) {
      if (modes[mode_type] !== 1 && modes[mode_type] !== (activated ? 2 : 0)) {
        return false
      }
    }
    return true
  }

  /*   const changeOrderElement = (from_index, to_index) => {
    setState(
      produce((_state) => {
        let elements = _state.design.types[_state.viewport.type].elements;
        _state.design.types[_state.viewport.type].elements = array_move(
          elements,
          from_index,
          to_index
        );
     })
    );
    this.setSelectedElementIndex(to_index);
  }; */

  this.changeOrderElement = (from_index, to_index) => {
    setState(
      ...getSelectedTypeAsArgs(),
      'elements',
      array_move(this.getLocalElements(), from_index, to_index),
    )
    this.setSelectedElementIndex(to_index)
  }

  this.toggleModeElement = (index, type) => {
    setState(...getLocalElementAsArgs({ index }), 'modes', type, mode => (mode + 1) % 3)
  }

  const setStateArchive = function (v) {
    let args = Object.values(arguments)
    let new_value = args.pop()
    let old_value
    setState(...args, v => {
      if (v) old_value = JSON.parse(JSON.stringify(v))
      else old_value = undefined
      return new_value
    })
    return { args, new_value, old_value }
  }

  this.translateElement = ({ index, delta }) => {
    const element = this.getLocalElement({ index })
    let args
    let old_value, new_value
    if (element.global) {
      args = ['design', 'globals', element.id, 'position']
    } else {
      args = [...getLocalElementAsArgs({ index }), 'position']
    }

    setState(...args, position => {
      old_value = { ...position }
      new_value = {
        x: position.x + (delta.x / this.getCardSize().width) * 100,
        y: position.y + (delta.y / this.getCardSize().height) * 100,
      }
      return new_value
    })

    return [{ old_value, new_value, args }]
  }

  this.resizeElement = ({ index, dimensions, position }) => {
    const element = this.getLocalElement({ index })
    let args
    if (element.global) {
      args = [...getGlobalElementAsArgs(element.id)]
    } else {
      args = [...getLocalElementAsArgs({ index })]
    }

    const archived_position = setStateArchive(...args, 'position', position)
    const archived_dimensions = setStateArchive(...args, 'dimensions', dimensions)

    return [archived_position, archived_dimensions]
  }

  this.lockElement = (index, bool) => {
    if (state.viewport.selected_element_index === index && bool) this.setSelectedElementIndex(false)
    if (!bool) this.setSelectedElementIndex(index)
    setState(...getLocalElementAsArgs({ index }), 'locked', bool)
  }

  this.removeElement = index => {
    setState(...getSelectedTypeAsArgs(), 'elements', array_remove(this.getLocalElements(), index))
  }

  this.getDimensions = ({ element, type }) => {
    return element.global ? state.design.globals[element.id].dimensions : element.dimensions
  }

  this.getPosition = ({ element, type }) => {
    return element.global ? state.design.globals[element.id].positions : element.positions
  }

  this.getStyles = ({ id, index, type, element, highlight }) => {
    const local_element = element ? element : this.getLocalElement({ id, index, type })
    if (!local_element) return {}

    const style_type = highlight ? 'highlight_styles' : 'styles'

    if (local_element.global) {
      let global_style = getGlobalElement(local_element.id)[style_type]
      return {
        ...global_style,
        ...local_element[style_type],
      }
    }

    return {
      ...local_element[style_type],
    }
  }

  this.getTextStyles = ({ element, swatches }) => {
    let styles = this.getStyles({ element })
    return {
      width: '100%',
      height: '100%',
      display: 'flex',
      'flex-direction': 'column',
      'pointer-events': 'all',
      // zIndex: props.zIndex,
      'justify-content': styles.alignmentVertical,
      'align-items': styles.alignmentHorizontal,
      'font-size': convert(styles.size) + 'pt',
      'font-family': styles.family,
      'letter-spacing': convert(styles.spacing, true),
      'line-height': `${convert(styles.lineHeight)}pt`,
      color: swatches[styles.color],
      'text-shadow':
        styles.shadowLeft || styles.shadowLeft || styles.shadowBlur
          ? `${styles.shadowLeft ? convert(styles.shadowLeft) : 0}px ${
              styles.shadowTop ? convert(styles.shadowTop) : 0
            }px ${styles.shadowBlur ? convert(styles.shadowBlur) : 0}px ${
              styles.shadowColor ? swatches[styles.shadowColor] : 'black'
            }`
          : null,
    }
  }

  this.getHighlightStyles = ({ element, swatches }) => {
    let styles = this.getStyles({ element, highlight: true })

    return {
      'font-family': styles.family,
      color: swatches[styles.color],
      background: swatches[styles.background],
      display: 'inline-block',
      'box-sizing': 'border-box',
      'align-items': styles.alignmentHorizontal,
      'padding-left': convert(styles.paddingHorizontal) + 'px',
      'padding-right': convert(styles.paddingHorizontal) + 'px',
      'padding-top': convert(styles.paddingVertical) + 'px',
      'padding-bottom': convert(styles.paddingVertical) + 'px',
      'margin-left': convert(styles.marginHorizontal) + 'px',
      'margin-right': convert(styles.marginHorizontal) + 'px',
      'margin-top': convert(styles.marginVertical) + 'px',
      'margin-bottom': convert(styles.marginVertical) + 'px',
      'border-radius': convert(styles.borderRadius) + 'px',
      'border-width': styles.borderWidth + 'px',
      'border-color': swatches[styles.borderColor],
      'border-style': 'solid',
      'box-shadow':
        styles && (styles.boxShadowLeft || styles.boxShadowLeft || styles.boxShadowBlur)
          ? `${styles.boxShadowLeft ? convert(styles.boxShadowLeft) : 0}px ${
              styles.boxShadowTop ? convert(styles.boxShadowTop) : 0
            }px ${styles.boxShadowBlur ? convert(styles.boxShadowBlur) : 0}px ${
              styles.boxShadowColor ? swatches[styles.boxShadowColor] : 'black'
            }`
          : null,
      'text-shadow':
        styles && (styles.textShadowLeft || styles.textShadowLeft || styles.textShadowBlur)
          ? `${styles.textShadowLeft ? convert(styles.textShadowLeft) : 0}px ${
              styles.textShadowTop ? convert(styles.textShadowTop) : 0
            }px ${styles.textShadowBlur ? convert(styles.textShadowBlur) : 0}px ${
              styles.textShadowColor ? swatches[styles.textShadowColor] : 'black'
            }`
          : null,
    }
  }

  this.setStyle = ({ index, id, type, value, highlight }) => {
    const local_element = this.getLocalElement({ index, id })
    if (!local_element) return

    let args
    const style_type = highlight ? 'highlight_styles' : 'styles'

    if (check(local_element[style_type][type])) {
      args = [...getLocalElementAsArgs({ index, id }), style_type, type, value]
    } else {
      if (!local_element.global) {
        console.error({ index, id, type, value })
        return
      }
      args = [...getGlobalElementAsArgs(id), style_type, type, value]
    }

    archiveStateChanges([setStateArchive(...args)])
  }

  this.setSVGStyle = ({ key, type, value, highlight }) => {
    let element = this.getSelectedType().elements[state.viewport.selected_element_index]
    if (!element.styles[key]) {
      console.error(element, element.styles, key)
      return
    }
    archiveStateChanges([
      setStateArchive(
        ...getLocalElementAsArgs({
          index: state.viewport.selected_element_index,
        }),
        'styles',
        key,
        type,
        value,
      ),
    ])
  }

  this.changeInstructionText = async () => {
    let type = state.viewport.modes.choice ? 'choice' : 'normal'
    let current_text = this.getLocalElement({ id: 'instruction' }).content

    const getRandomLoremIpsum = () =>
      new Promise(resolve => {
        const findRandomLoremIpsum = () => {
          let random_index = Math.floor(Math.random() * lorem_ipsum[type].length)
          let random_lorem_ipsum = lorem_ipsum[type][random_index]
          if (random_lorem_ipsum !== current_text) resolve(random_lorem_ipsum)
          else findRandomLoremIpsum()
        }
        findRandomLoremIpsum()
      })

    let random_lorem_ipsum = await getRandomLoremIpsum()

    setState(
      ...getSelectedTypeAsArgs(),
      'elements',
      element => element.type === 'instruction',
      'content',
      random_lorem_ipsum,
    )
  }

  // general functions

  this.setDeck = design => setState('design', design)

  const addElement = element => {
    archiveStateChanges([
      setStateArchive(...getLocalElementAsArgs({ index: this.getLocalElements().length }), element),
    ])
  }

  this.upload = e => {
    e.preventDefault()
    e.preventDefault()

    const file = e.dataTransfer.files[0]

    if (!(file && file['type'].split('/')[0] === 'image')) return

    if (!file) return
    const reader = new FileReader()
    const splitted_name = file.name.split('.')
    const file_is_svg = splitted_name[splitted_name.length - 1].toLowerCase() === 'svg'

    reader.onload = async ({ target }) => {
      if (file_is_svg) {
        const { svg, styles } = await processSVG(target)
        const index = this.getSelectedType().elements.length
        addElement({
          type: 'svg',
          id: uniqid(),
          modes: getDefaultModes(),
          position: {
            x: 0,
            y: 0,
          },
          // TODO : replace with width / height conform to ratio svg viewbox
          dimensions: {
            width: 100,
            height: 100,
          },
          svg,
          styles,
          content: splitted_name.slice(0, splitted_name.length - 1).join('.'),
        })
        this.setSelectedElementIndex(index)
      }
    }
    if (!file_is_svg) reader.readAsDataURL(file)
    else reader.readAsText(file)
  }

  const processSVG = async file => {
    // TODO:  replace findStyle with a regex for the style-tags
    const findStyle = svg =>
      new Promise(resolve => {
        const iterate = el => {
          if (!el.children) return
          ;[...el.children].forEach(el => {
            if (el.localName === 'style') {
              resolve(el.childNodes[0].data)
            } else {
              iterate(el.children)
            }
          })
        }
        iterate(svg)
        resolve(false)
      })

    const container = document.createElement('div')
    container.innerHTML = file.result
    let svg_dom = container.children[0]

    const style_text = await findStyle(svg_dom)
    if (!style_text) {
      console.error('could not find style')
      return
    }

    let duplicate_check = []
    let styles = style_text
      .match(/\.[^{,]+/gs)
      .map(c => c.slice(1, c.length))
      .filter(c => {
        if (duplicate_check.indexOf(c) != -1) return false
        duplicate_check.push(c)
        return true
      })
      .map(c => ({ old_name: c }))

    styles = styles.map(c => {
      let regex = new RegExp(c.old_name + '(?![0-9])[^{]*[^}]*', 'g')

      let style = {}
      ;[...style_text.matchAll(regex)].forEach(string => {
        string = string[0].split('{')[1]
        let split_string = string.split(';')
        split_string.forEach(key_value => {
          const [key, value] = key_value.split(':')
          if (!key || !value) return
          style[key] = value
        })
      })
      return { ...c, new_name: uniqid(), style }
    })

    let svg = file.result

    styles.forEach(s => {
      let regex = `${s.old_name}(?![0-9])`
      svg = svg.replace(new RegExp(regex, 'g'), s.new_name)
    })

    styles = Object.fromEntries(styles.map(s => [s.new_name, s.style]))

    return { svg, styles }
  }

  this.createNewType = type_name => ({
    swatches: [
      { normal: '#000000', timed: '#ffffff' },
      { normal: '#CCCCCC', timed: '#CCCCCC' },
      { normal: '#ffffff', timed: '#000000' },
    ],
    elements:
      type_name !== 'back'
        ? [
            {
              id: 'instruction',
              type: 'instruction',
              global: true,
              styles: {
                color: 0,
              },
              highlight_styles: {
                background: 1,
                color: 2,
              },
              content:
                lorem_ipsum['normal'][Math.floor(Math.random() * lorem_ipsum['normal'].length)],
            },
            {
              id: 'countdown',
              type: 'countdown',
              global: true,
              styles: {
                color: 0,
              },
              content: 30 * (state.viewport.timer_percentage / 100),
            },
          ]
        : [],
  })

  this.createNewCard = () => {
    const instruction = {
      ...getDefaultTextState(),
      modes: getDefaultModes(),
      hide_modes: true,
      highlight_styles: {
        family: 'times',
        background: 0,
        alignmentHorizontal: 'right',
        marginHorizontal: 5,
        marginVertical: 5,
        paddingHorizontal: 5,
        paddingVertical: 5,
        alignmentVertical: 'flex-start',
        borderRadius: 0,
        borderWidth: 0,
        borderColor: 0,
        textShadowLeft: 0,
        textShadowTop: 0,
        textShadowBox: 0,
        boxShadowLeft: 0,
        boxShadowTop: 0,
        boxShadowBox: 0,
      },
    }

    this.addElementToGlobals('instruction', instruction)

    const countdown = {
      modes: {
        choice: 1,
        timed: 2,
      },
      hide_modes: true,
      position: {
        x: 25,
        y: 90,
      },
      dimensions: {
        width: 50,
        height: 10,
      },
      styles: {
        family: 'times',
        size: 10,
        lineHeight: 12,
        spacing: 0,
        color: 0,
        alignmentHorizontal: 'center',
        alignmentVertical: 'center',
        shadowLeft: 0,
        shadowTop: 0,
        shadowBox: 0,
      },
    }

    this.addElementToGlobals('countdown', countdown)

    let types = Object.fromEntries(default_types.map(type => [type, this.createNewType(type)]))
    setState('design', 'types', types)
    setState('design', 'modes', ['choice', 'timed'])

    // updateInstruction();
  }

  // gui

  this.openPrompt = ({ type, data, position }) =>
    new Promise(_resolve => {
      const resolve = data => {
        setState('viewport', 'prompt', false)
        _resolve(data)
      }

      setState('viewport', 'prompt', {
        type,
        data,
        position,
        resolve,
      })
    })
}
