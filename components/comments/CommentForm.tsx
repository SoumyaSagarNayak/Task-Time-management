'use client';

import { useState, useRef, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { FormInput } from '@/components/ui/FormInput';
import { Loader2 } from 'lucide-react';

interface CommentFormProps {
    onSubmit: (body: string) => Promise<void>;
    submitting: boolean;
}

export function CommentForm({ onSubmit, submitting }: CommentFormProps) {
    const [body, setBody] = useState('');
    const textareaRef = useRef<HTMLTextAreaElement>(null);

    /**
     * Handles textarea input for auto-resize behaviour.
     * Adjusts the height dynamically based on content.
     */
    const handleInput = (e: React.FormEvent<HTMLTextAreaElement>) => {
        const target = e.currentTarget;
        target.style.height = 'auto';
        target.style.height = `${target.scrollHeight}px`;
        setBody(target.value);
    };

    const handleSubmit = async () => {
        if (!body.trim() || submitting) return;
        await onSubmit(body);
        setBody('');
        if (textareaRef.current) {
            textareaRef.current.style.height = 'auto';
            textareaRef.current.focus();
        }
    };

    return (
        <div className="p-4 space-y-4">
            {/* Comment textarea with built-in character counter */}
            <FormInput
                ref={textareaRef}
                inputType="textarea"
                value={body}
                onInput={handleInput}
                onChange={(e: React.ChangeEvent<HTMLTextAreaElement>) => setBody(e.target.value)}
                placeholder="What's on your mind? Discuss this task..."
                className="w-full min-h-[120px] p-4 bg-gray-50 dark:bg-gray-900/50 border border-gray-100 dark:border-gray-800 rounded-xl text-gray-900 dark:text-gray-100 placeholder:text-gray-400 dark:placeholder:text-gray-600 focus:outline-none focus:ring-2 focus:ring-indigo-500/50 dark:focus:ring-indigo-500/30 focus:border-indigo-300 dark:focus:border-indigo-500/50 transition-all resize-none overflow-hidden text-sm leading-relaxed"
                maxLength={2000}
                showCharCount
                aria-label="Comment body"
            />
            <div className="flex items-center justify-end">
                <Button
                    onClick={handleSubmit}
                    disabled={!body.trim() || submitting}
                    className="bg-indigo-600 hover:bg-indigo-700 text-white shadow-lg shadow-indigo-500/20 dark:shadow-indigo-500/10 transition-all px-8 py-5 rounded-xl font-bold text-sm tracking-wide"
                >
                    {submitting ? (
                        <>
                            <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                            Posting...
                        </>
                    ) : (
                        'Post Comment'
                    )}
                </Button>
            </div>
        </div>
    );
}
