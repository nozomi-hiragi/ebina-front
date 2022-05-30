import { useEffect, useRef } from "react";

declare let Copenhagen: any

type CopenhagenEditorProps = {
  language?: 'javascript' | 'json' | 'markdown' | 'html' | 'css' | 'text'
  readOnly?: boolean
  hidden?: boolean
  disabled?: boolean
  maximized?: boolean
  rows?: number
  maxrows?: number
  tabout?: boolean
  nolines?: boolean
  value?: string
  onFocus?: (editor: any, value: string) => void
  onBlur?: (editor: any, value: string) => void
  onContextMenu?: (editor: any, value: string,) => void
  onAutoComplete?: (editor: any, value: string) => void;
  onCancel?: (editor: any) => void
  onSave?: (editor: any, value: string) => void
  onChange?: (editor: any, value: string, cursors: any[]) => void
  onWaiting?: (editor: any, value: string, cursors: any[]) => void
  onCursor?: (editor: any, value: string, cursor: any) => void
  onSingleCursor?: (editor: any, value: string, cursor: any) => void
  onMultiCursor?: (editor: any, value: string, cursors: any[]) => void
  onMetaData?: (editor: any, key: string, value: string) => void
  onMount?: (editor: any, value: string) => void
  onUnmount?: (editor: any) => void;
  error?: { lineIndex: number, column: number }
}

const CopenhagenEditor: React.FC<CopenhagenEditorProps> = ({
  language = 'text',
  readOnly = false,
  hidden = false,
  disabled = false,
  maximized = false,
  rows = 1,
  maxrows = 30,
  tabout = false,
  nolines = false,
  value = '',
  onFocus,
  onBlur,
  onContextMenu,
  onAutoComplete,
  onCancel,
  onSave,
  onChange,
  onWaiting,
  onCursor,
  onSingleCursor,
  onMultiCursor,
  onMetaData,
  onMount,
  onUnmount,
  error,
}) => {
  const htmlDivRef = useRef<HTMLDivElement>(null);
  const editorRef = useRef<any>(null);

  useEffect(() => {
    if (!editorRef.current) return
    const editor = editorRef.current
    if (value !== editor.getValue()) editor.setValue(value)
  }, [value])

  useEffect(() => {
    const divElement = htmlDivRef.current!
    const editor = new Copenhagen.Editor({
      language,
      readOnly,
      hidden,
      disabled,
      maximized,
      rows,
      maxrows,
      tabout,
      nolines,
    })
    editor.open(divElement, false)
    editorRef.current = editor
    editor.setValue(value)

    onMount && onMount(editor, value)
    onFocus && editor.on("focus", onFocus)
    onBlur && editor.on("blur", onBlur)
    onContextMenu && editor.on("contextmenu", onContextMenu)
    onAutoComplete && editor.on("autocomplete", onAutoComplete)
    onCancel && editor.on("cancel", onCancel)
    onSave && editor.on("save", onSave)
    onChange && editor.on("change", onChange)
    onWaiting && editor.on("waiting", onWaiting)
    onCursor && editor.on("cursor", onCursor)
    onSingleCursor && editor.on("singlecursor", onSingleCursor)
    onMultiCursor && editor.on("multicursor", onMultiCursor)
    onMetaData && editor.on("metadata", onMetaData)

    return () => {
      onUnmount && onUnmount(editorRef.current)
      divElement.innerHTML = ""
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [disabled, hidden, language, maximized, maxrows, nolines, rows, tabout])

  useEffect(() => {
    const editor = editorRef.current!
    editor.setReadOnly(readOnly)
    editor.render(editor.getValue())
  }, [readOnly])

  useEffect(() => {
    const editor = editorRef.current!
    if (error) {
      editor.setError(error?.lineIndex, error?.column)
      editor.render(editor.getValue())
    } else if (editor._errorPos.enabled) {
      editor.setError(null)
    }
  }, [error])

  return (<div ref={htmlDivRef} className="editor" />)
}

export default CopenhagenEditor
