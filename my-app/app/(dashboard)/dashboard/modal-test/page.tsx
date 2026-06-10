"use client";

import * as React from "react";
import { Modal } from "@/components/ui/modal";
import { Button } from "@/components/ui/button";

export default function ModalTestPage() {
    const [isOpen, setIsOpen] = React.useState(false);

    return (
        <div className="flex flex-col items-center justify-center min-h-screen p-8">
            <h1 className="text-2xl font-bold mb-8">Modal Component Test</h1>

            <Button onClick={() => setIsOpen(true)}>
                Open Test Modal
            </Button>

            <Modal
                isOpen={isOpen}
                onClose={() => setIsOpen(false)}
                title="Test Modal Title"
                description="This is a test description for the new Modal component with a backdrop and blur effect."
            >
                <div className="space-y-4">
                    <p>This is the modal content area. You can put any React components here.</p>
                    <div className="flex justify-end gap-3 pt-4 border-t">
                        <Button variant="outline" onClick={() => setIsOpen(false)}>
                            Cancel
                        </Button>
                        <Button onClick={() => setIsOpen(false)}>
                            Confirm Action
                        </Button>
                    </div>
                </div>
            </Modal>
        </div>
    );
}
