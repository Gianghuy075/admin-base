import { CKEditor } from "@ckeditor/ckeditor5-react";
import {
  ClassicEditor,
  Bold,
  Italic,
  Underline,
  Essentials,
  Paragraph,
  Heading,
  List,
  Link,
  BlockQuote,
  Table,
  TableToolbar,
  Undo,
} from "ckeditor5";
import "ckeditor5/ckeditor5.css";

interface RichTextEditorProps {
  value: string;
  onChange: (value: string) => void;
}

const EDITOR_CONFIG = {
  licenseKey: "GPL",
  plugins: [
    Bold, Italic, Underline, Essentials, Paragraph, Heading,
    List, Link, BlockQuote, Table, TableToolbar, Undo,
  ],
  toolbar: {
    items: [
      "heading", "|",
      "bold", "italic", "underline", "|",
      "bulletedList", "numberedList", "|",
      "link", "blockQuote", "insertTable", "|",
      "undo", "redo",
    ],
  },
  table: {
    contentToolbar: ["tableColumn", "tableRow", "mergeTableCells"],
  },
};

export function RichTextEditor({ value, onChange }: RichTextEditorProps) {
  return (
    <div className="[&_.ck-editor__editable]:min-h-[120px] [&_.ck-editor__editable]:max-h-[300px] [&_.ck-editor__editable]:overflow-y-auto [&_.ck.ck-editor]:rounded-md [&_.ck.ck-toolbar]:rounded-t-md [&_.ck.ck-toolbar]:border-input [&_.ck.ck-editor__main>.ck-editor__editable]:border-input [&_.ck.ck-editor__main>.ck-editor__editable:not(.ck-focused)]:border-input">
      <CKEditor
        editor={ClassicEditor}
        data={value}
        config={EDITOR_CONFIG}
        onChange={(_, editor) => onChange(editor.getData())}
      />
    </div>
  );
}
