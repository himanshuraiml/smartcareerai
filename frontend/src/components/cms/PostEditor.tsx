'use client';

import { useEditor, EditorContent } from '@tiptap/react';
import StarterKit from '@tiptap/starter-kit';
import ImageExt from '@tiptap/extension-image';
import LinkExt from '@tiptap/extension-link';
import Placeholder from '@tiptap/extension-placeholder';
import CharacterCount from '@tiptap/extension-character-count';
import CodeBlockLowlight from '@tiptap/extension-code-block-lowlight';
import { common, createLowlight } from 'lowlight';
import EditorToolbar from './EditorToolbar';

interface Props {
    initialContent?: string;
    onChange: (html: string) => void;
    placeholder?: string;
}

const lowlight = createLowlight(common);

export default function PostEditor({ initialContent = '', onChange, placeholder }: Props) {
    const editor = useEditor({
        extensions: [
            StarterKit.configure({ codeBlock: false }),
            ImageExt.configure({ allowBase64: false }),
            LinkExt.configure({ openOnClick: false, HTMLAttributes: { target: '_blank', rel: 'noopener noreferrer' } }),
            Placeholder.configure({ placeholder: placeholder || 'Start writing your article...' }),
            CharacterCount,
            CodeBlockLowlight.configure({ lowlight }),
        ],
        content: initialContent,
        immediatelyRender: false,
        onUpdate: ({ editor }) => {
            onChange(editor.getHTML());
        },
        editorProps: {
            attributes: {
                class: 'prose dark:prose-invert prose-blue prose-lg max-w-none min-h-[500px] focus:outline-none p-6',
            },
        },
    });

    const wordCount = editor?.storage.characterCount.words() ?? 0;

    return (
        <div className="border border-gray-200 dark:border-white/10 rounded-xl overflow-hidden bg-white dark:bg-gray-900">
            <EditorToolbar editor={editor} />
            <EditorContent editor={editor} />
            <div className="px-4 py-2 border-t border-gray-100 dark:border-white/5 flex items-center justify-between text-xs text-gray-400">
                <span>{wordCount} word{wordCount !== 1 ? 's' : ''}</span>
                <span className="text-gray-300 dark:text-gray-600">TipTap Editor</span>
            </div>
        </div>
    );
}
