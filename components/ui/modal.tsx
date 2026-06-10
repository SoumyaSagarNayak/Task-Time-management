"use client";

import * as React from "react";
import { X } from "lucide-react";
import { cn } from "@/lib/utils";

interface ModalProps {
    isOpen: boolean;
    onClose: () => void;
    title?: string;
    description?: string;
    children: React.ReactNode;
    className?: string;
}

export function Modal({
    isOpen,
    onClose,
    title,
    description,
    children,
    className,
}: ModalProps) {
    // Handle escape key
    React.useEffect(() => {
        const handleEsc = (event: KeyboardEvent) => {
            if (event.key === "Escape") {
                onClose();
            }
        };
        if (isOpen) {
            document.addEventListener("keydown", handleEsc);
            // Prevent scrolling when modal is open
            document.body.style.overflow = "hidden";
        }
        return () => {
            document.removeEventListener("keydown", handleEsc);
            document.body.style.overflow = "unset";
        };
    }, [isOpen, onClose]);

    if (!isOpen) return null;

    return (
        <div
            className="fixed inset-0 z-50 flex items-center justify-center p-4 sm:p-6"
            role="dialog"
            aria-modal="true"
        >
            {/* Backdrop */}
            <div
                className="fixed inset-0 bg-black/60 backdrop-blur-sm transition-opacity animate-in fade-in duration-300"
                onClick={onClose}
                aria-hidden="true"
            />

            {/* Modal Content */}
            <div
                className={cn(
                    "relative w-full max-w-lg transform overflow-hidden rounded-2xl bg-white p-6 shadow-2xl transition-all dark:bg-gray-900 border border-gray-200 dark:border-gray-800 animate-in zoom-in-95 fade-in duration-300",
                    className
                )}
            >
                {/* Close Button */}
                <button
                    onClick={onClose}
                    className="absolute right-4 top-4 rounded-full p-2 text-gray-400 hover:bg-gray-100 hover:text-gray-600 dark:hover:bg-gray-800 dark:hover:text-gray-200 transition-colors"
                    aria-label="Close modal"
                >
                    <X className="h-5 w-5" />
                </button>

                {/* Header */}
                {(title || description) && (
                    <div className="mb-6">
                        {title && (
                            <h3 className="text-xl font-bold text-gray-900 dark:text-white">
                                {title}
                            </h3>
                        )}
                        {description && (
                            <p className="mt-2 text-sm text-gray-500 dark:text-gray-400">
                                {description}
                            </p>
                        )}
                    </div>
                )}

                {/* Body */}
                <div className="relative">{children}</div>
            </div>
        </div>
    );
}
