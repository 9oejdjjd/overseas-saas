"use client";

import { useEditor, EditorContent } from "@tiptap/react";
import StarterKit from "@tiptap/starter-kit";
import Image from "@tiptap/extension-image";
import Link from "@tiptap/extension-link";
import { useEffect, useState } from "react";
import { 
    Bold, Italic, Heading2, Heading3, List, ListOrdered, 
    Quote, Image as ImageIcon, Link as LinkIcon, Underline as UnderlineIcon,
    Undo, Redo, AlignLeft, AlignCenter, AlignRight, Code
} from "lucide-react";
import { Button } from "@/components/ui/button";

interface TiptapEditorProps {
    value: string;
    onChange: (html: string) => void;
}

export default function TiptapEditor({ value, onChange }: TiptapEditorProps) {
    const [isUploading, setIsUploading] = useState(false);

    const editor = useEditor({
        extensions: [
            StarterKit.configure({
                codeBlock: {
                    HTMLAttributes: {
                        class: "rounded-xl bg-slate-900 text-slate-100 p-4 font-mono text-sm my-4 overflow-x-auto border border-slate-800",
                    },
                },
                paragraph: {
                    HTMLAttributes: {
                        class: "leading-relaxed text-slate-700 my-3 text-sm",
                    },
                },
                heading: {
                    HTMLAttributes: {
                        class: "text-slate-850 font-black my-4 leading-tight",
                    },
                },
            }),
            Image.configure({
                HTMLAttributes: {
                    class: "rounded-2xl max-w-full my-6 border border-slate-100 shadow-md mx-auto block",
                },
            }),
            Link.configure({
                openOnClick: false,
                HTMLAttributes: {
                    class: "text-[#16539a] hover:underline font-bold transition-all",
                },
            }),
        ],
        content: value,
        onUpdate: ({ editor }) => {
            onChange(editor.getHTML());
        },
    });

    // Keep editor content in sync with external value resets (e.g., after save/load)
    useEffect(() => {
        if (editor && value !== editor.getHTML()) {
            editor.commands.setContent(value);
        }
    }, [value, editor]);

    if (!editor) {
        return (
            <div className="border border-slate-200 rounded-2xl min-h-[300px] flex items-center justify-center bg-slate-50/50">
                <span className="text-slate-400 text-xs font-bold animate-pulse">جاري تحميل محرر النصوص...</span>
            </div>
        );
    }

    // Handle inserting Link
    const addLink = () => {
        const url = window.prompt("أدخل رابط الويب (URL):", "https://");
        if (url === null) return;
        
        if (url === "") {
            editor.chain().focus().extendMarkRange("link").unsetLink().run();
            return;
        }

        editor.chain().focus().extendMarkRange("link").setLink({ href: url }).run();
    };

    // Handle Image Upload for Editor Content
    const handleImageUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
        const file = e.target.files?.[0];
        if (!file) return;

        setIsUploading(true);
        const formData = new FormData();
        formData.append("file", file);

        try {
            const res = await fetch("/api/dashboard/blog/upload", {
                method: "POST",
                body: formData,
            });
            const data = await res.json();
            if (data.success && data.url) {
                editor.chain().focus().setImage({ src: data.url }).run();
            } else {
                alert(data.error || "فشل رفع الصورة");
            }
        } catch (err) {
            console.error("Editor Image Upload Error:", err);
            alert("حدث خطأ أثناء رفع الصورة");
        } finally {
            setIsUploading(false);
        }
    };

    return (
        <div className="border border-slate-200 rounded-2xl bg-white overflow-hidden shadow-sm flex flex-col min-h-[400px]">
            {/* Toolbar */}
            <div className="bg-slate-50 border-b border-slate-200 p-2 flex flex-wrap gap-1 items-center" dir="rtl">
                {/* Formatting */}
                <Button
                    type="button"
                    variant={editor.isActive("bold") ? "secondary" : "ghost"}
                    size="icon"
                    onClick={() => editor.chain().focus().toggleBold().run()}
                    className="h-8 w-8 rounded-lg"
                    title="عريض"
                >
                    <Bold className="h-4 w-4 text-slate-650" />
                </Button>
                <Button
                    type="button"
                    variant={editor.isActive("italic") ? "secondary" : "ghost"}
                    size="icon"
                    onClick={() => editor.chain().focus().toggleItalic().run()}
                    className="h-8 w-8 rounded-lg"
                    title="مائل"
                >
                    <Italic className="h-4 w-4 text-slate-650" />
                </Button>

                <div className="w-px h-6 bg-slate-200 mx-1" />

                {/* Headings */}
                <Button
                    type="button"
                    variant={editor.isActive("heading", { level: 2 }) ? "secondary" : "ghost"}
                    size="icon"
                    onClick={() => editor.chain().focus().toggleHeading({ level: 2 }).run()}
                    className="h-8 w-8 rounded-lg"
                    title="عنوان رئيسي 2"
                >
                    <Heading2 className="h-4 w-4 text-slate-650" />
                </Button>
                <Button
                    type="button"
                    variant={editor.isActive("heading", { level: 3 }) ? "secondary" : "ghost"}
                    size="icon"
                    onClick={() => editor.chain().focus().toggleHeading({ level: 3 }).run()}
                    className="h-8 w-8 rounded-lg"
                    title="عنوان رئيسي 3"
                >
                    <Heading3 className="h-4 w-4 text-slate-650" />
                </Button>

                <div className="w-px h-6 bg-slate-200 mx-1" />

                {/* Lists */}
                <Button
                    type="button"
                    variant={editor.isActive("bulletList") ? "secondary" : "ghost"}
                    size="icon"
                    onClick={() => editor.chain().focus().toggleBulletList().run()}
                    className="h-8 w-8 rounded-lg"
                    title="قائمة نقطية"
                >
                    <List className="h-4 w-4 text-slate-650" />
                </Button>
                <Button
                    type="button"
                    variant={editor.isActive("orderedList") ? "secondary" : "ghost"}
                    size="icon"
                    onClick={() => editor.chain().focus().toggleOrderedList().run()}
                    className="h-8 w-8 rounded-lg"
                    title="قائمة رقمية"
                >
                    <ListOrdered className="h-4 w-4 text-slate-650" />
                </Button>

                <div className="w-px h-6 bg-slate-200 mx-1" />

                {/* Blockquote & Code */}
                <Button
                    type="button"
                    variant={editor.isActive("blockquote") ? "secondary" : "ghost"}
                    size="icon"
                    onClick={() => editor.chain().focus().toggleBlockquote().run()}
                    className="h-8 w-8 rounded-lg"
                    title="اقتباس"
                >
                    <Quote className="h-4 w-4 text-slate-650" />
                </Button>
                <Button
                    type="button"
                    variant={editor.isActive("codeBlock") ? "secondary" : "ghost"}
                    size="icon"
                    onClick={() => editor.chain().focus().toggleCodeBlock().run()}
                    className="h-8 w-8 rounded-lg"
                    title="شفرة برمجية"
                >
                    <Code className="h-4 w-4 text-slate-650" />
                </Button>

                <div className="w-px h-6 bg-slate-200 mx-1" />

                {/* Link */}
                <Button
                    type="button"
                    variant={editor.isActive("link") ? "secondary" : "ghost"}
                    size="icon"
                    onClick={addLink}
                    className="h-8 w-8 rounded-lg"
                    title="إضافة رابط"
                >
                    <LinkIcon className="h-4 w-4 text-slate-650" />
                </Button>

                {/* Embedded Image Uploader */}
                <div className="relative">
                    <input
                        type="file"
                        accept="image/*"
                        id="editor-img-upload"
                        onChange={handleImageUpload}
                        className="hidden"
                        disabled={isUploading}
                    />
                    <Button
                        type="button"
                        variant="ghost"
                        size="icon"
                        onClick={() => document.getElementById("editor-img-upload")?.click()}
                        className="h-8 w-8 rounded-lg"
                        disabled={isUploading}
                        title="إدراج صورة داخل المقال"
                    >
                        <ImageIcon className={`h-4 w-4 ${isUploading ? 'animate-pulse text-amber-500' : 'text-slate-650'}`} />
                    </Button>
                </div>

                <div className="w-px h-6 bg-slate-200 mx-1" />

                {/* Undo / Redo */}
                <Button
                    type="button"
                    variant="ghost"
                    size="icon"
                    onClick={() => editor.chain().focus().undo().run()}
                    className="h-8 w-8 rounded-lg"
                    title="تراجع"
                >
                    <Undo className="h-4 w-4 text-slate-650" />
                </Button>
                <Button
                    type="button"
                    variant="ghost"
                    size="icon"
                    onClick={() => editor.chain().focus().redo().run()}
                    className="h-8 w-8 rounded-lg"
                    title="إعادة"
                >
                    <Redo className="h-4 w-4 text-slate-650" />
                </Button>
            </div>

            {/* Editor Area */}
            <div className="p-4 flex-1 outline-none text-right font-sans focus:outline-none min-h-[350px]">
                <EditorContent editor={editor} className="min-h-[350px] outline-none text-slate-800" />
            </div>
        </div>
    );
}
