import Konva from 'konva'

import {convertHtmlToText} from '../../../utils/html-to-text'
import {Board} from '../../../Board'
import {isBrowser, isNode} from '../../../utils/detect-environment'
import {rotateAroundCenter} from '../../../utils/rotate-around-center'
import {ShapeModel} from '../../ShapeModel'
import {DrawType, TextPathConfig} from '../../../types'

export class TextPathModel extends ShapeModel<Konva.TextPath, Konva.TextPathConfig> {
  constructor(board: Board, node: Konva.TextPath, config: TextPathConfig = {}) {
    super(board, node, config)
    node.on('dblclick', this.inlineEdit.bind(this))
  }

  /**
   * @inheritdoc
   */
  public get type(): string {
    return 'textPath'
  }

  /**
   * @inheritdoc
   * @override
   */
  public rotate(theta: number) {
    rotateAroundCenter(this.node, theta)

    this.board.events.emit('shape:rotate', {
      shapes: [this]
    })
  }

  /**
   * Enables inline editing of the label with double clicking on the node
   *
   * @param e The [[MouseEvent | Mouse Event]
   */
  private inlineEdit(e: Konva.KonvaEventObject<MouseEvent>) {
    if (isNode() || this.node.isCached()) {
      return
    }

    e.cancelBubble = true
    this.board.setActiveDrawing(DrawType.TextPath)

    const textBeforeEdit = this.node.getAttr('text')
    console.log('textBeforeEdit', textBeforeEdit)
    // hide node
    // this.node.hide()
    this.node?.draggable(false)

    // deselect all selected nodes
    this.board.selection.deselectAll()

    const input = document.createElement('span')
    this.board.container
      ?.getElementsByClassName(this.board.settings.containerClassName!)[0]
      ?.append(input)

    if (isBrowser()) {
      this.setInputFocus(input)
    }

    input.setAttribute('contenteditable', '')
    input.setAttribute('role', 'textbox')
    const box = this.node.getClientRect()
    input.innerText = this.node.getAttr('text')
    let left = box.x + (box.width - 188) / 2
    let bottom = this.board.stage.height() - (box.y - 20)
    Object.assign(input.style, {
      position: 'absolute',
      display: 'inline-block',
      left: `${left}px`,
      bottom: `${bottom}px`,
      width: `168px`,
      maxHeight: `90px`,
      fontSize: `16px`,
      border: 'none',
      padding: `10px`,
      margin: `0px`,
      overflow: 'auto',
      background: 'rgba(0,0,0,0.85)',
      borderRadius: `10px`,
      outline: 'none',
      resize: 'none',
      transformOrigin: 'left top',
      textAlign: this.node.align(),
      color: '#fff'
    })

    input.addEventListener('blur', (e: Event) => {
      input.parentNode?.removeChild(input)

      this.board.setActiveDrawing(null)

      const newText = convertHtmlToText((<HTMLSpanElement>e.target).innerHTML)

      if (newText !== textBeforeEdit) {
        this.board.history.create(this.board.layer, [], {
          undo: () => this.changeText(textBeforeEdit),
          redo: () => this.changeText(newText)
        })
      }

      // update label's text
      this.node.text(newText)

      // this.node.show()
      this.node.setAttrs({
        draggable: this.board.settings.selection?.interactive
      })

      // select node
      this.board.selection.add(this)
    })
  }

  /**
   * Changes the text value of the label
   *
   * @param value The text value
   */
  private changeText(value: string) {
    this.board.events.emit('textPath:update-text', {
      shapes: [this],
      data: {
        text: value
      }
    })
  }

  /**
   * Focuses on the input to start editing that
   *
   * @param input The [[HTMLSpanElement]]
   */
  private async setInputFocus(input: HTMLSpanElement) {
    await new Promise(resolve => setTimeout(resolve, 50))

    const range = document.createRange()
    range.selectNodeContents(input)
    range.collapse(false)

    const selection = window.getSelection()!
    selection.removeAllRanges()
    selection.addRange(range)
  }
}
