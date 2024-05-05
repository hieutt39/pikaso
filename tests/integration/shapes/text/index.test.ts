import { createEditor } from '../../../../jest/utils/create-editor'

describe('Shape -> Text', () => {
  const baseConfig = {
      fontSize: 50,
      fill: 'red',
      text: 'Test Text'
  }

  it('should create a text', () => {
    const editor = createEditor()

    editor.shapes.text.insert(baseConfig)

    expect(editor.board.activeShapes.length).toBe(1)
  })

  it('should transition to inline editing stage', () => {
    const editor = createEditor()

    const text = editor.shapes.text.insert(baseConfig)

    text.node.fire('dblclick')
  })

  it('should change text', () => {
    const editor = createEditor()

    const text = editor.shapes.text.insert(baseConfig)

    text.update({
      text: 'Foo Bar'
    })

    expect(text.node.text()).toBe('Foo Bar')
  })

  it('should change text background', () => {
    const editor = createEditor()

    const text = editor.shapes.text.insert(baseConfig)

    text.update({
      fill: 'red'
    })

    expect(text.node.attrs.fill).toBe('red')
  })
})
