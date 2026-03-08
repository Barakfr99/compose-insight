import { useRef, useCallback } from "react";
import { Button } from "@/components/ui/button";
import { Bold, Italic, Underline, Heading2, List, Quote } from "lucide-react";

interface RichTextEditorProps {
  value: string;
  onChange: (html: string) => void;
  placeholder?: string;
}

const RichTextEditor = ({ value, onChange, placeholder = "הקלידו או הדביקו תוכן כאן..." }: RichTextEditorProps) => {
  const editorRef = useRef<HTMLDivElement>(null);

  const execCommand = useCallback((command: string, value?: string) => {
    document.execCommand(command, false, value);
    if (editorRef.current) {
      onChange(editorRef.current.innerHTML);
    }
    editorRef.current?.focus();
  }, [onChange]);

  const handleInput = useCallback(() => {
    if (editorRef.current) {
      onChange(editorRef.current.innerHTML);
    }
  }, [onChange]);

  const toolbarButtons = [
    { icon: Bold, command: "bold", label: "מודגש" },
    { icon: Italic, command: "italic", label: "נטוי" },
    { icon: Underline, command: "underline", label: "קו תחתון" },
    { icon: Heading2, command: "formatBlock", value: "h2", label: "כותרת" },
    { icon: List, command: "insertUnorderedList", label: "רשימה" },
    { icon: Quote, command: "formatBlock", value: "blockquote", label: "ציטוט" },
  ];

  return (
    <div className="border border-input rounded-md overflow-hidden bg-background">
      {/* Toolbar */}
      <div className="flex flex-wrap gap-1 p-2 border-b border-border bg-muted/30">
        {toolbarButtons.map((btn) => (
          <Button
            key={btn.command + (btn.value || "")}
            type="button"
            variant="ghost"
            size="icon"
            className="h-8 w-8"
            onClick={() => execCommand(btn.command, btn.value)}
            title={btn.label}
          >
            <btn.icon className="h-4 w-4" />
          </Button>
        ))}
      </div>

      {/* Editor */}
      <div
        ref={editorRef}
        contentEditable
        dir="rtl"
        className="min-h-[400px] p-4 text-base leading-relaxed text-foreground focus:outline-none prose prose-sm max-w-none [&_h2]:text-xl [&_h2]:font-bold [&_h2]:text-foreground [&_h2]:mb-2 [&_blockquote]:border-r-4 [&_blockquote]:border-primary [&_blockquote]:pr-4 [&_blockquote]:text-muted-foreground [&_blockquote]:italic [&_ul]:list-disc [&_ul]:pr-6 [&_p]:mb-2"
        onInput={handleInput}
        dangerouslySetInnerHTML={{ __html: value }}
        data-placeholder={placeholder}
        suppressContentEditableWarning
      />
    </div>
  );
};

export default RichTextEditor;
